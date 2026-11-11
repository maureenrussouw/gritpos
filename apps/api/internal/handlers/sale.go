package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"gritpos/apps/api/internal/authz"
	"gritpos/apps/api/internal/concurrency"
	"gritpos/apps/api/internal/events"
	"gritpos/apps/api/internal/export"
	"gritpos/apps/api/internal/models"
	"gritpos/apps/api/internal/paginate"
	"gritpos/apps/api/internal/pdf"
	"gritpos/apps/api/internal/respond"
	"gritpos/apps/api/internal/services"
)

// SaleHandler serves the sale endpoints. It reads the request, asks
// services.SaleService, and writes the answer; it runs no query of its
// own, so everything a route does is also available to a job or a test.
type SaleHandler struct {
	DB *gorm.DB
	// AppName brands the PDF export. The route file sets it from config.
	AppName string
}

// service is the sale service over this handler's database.
func (h *SaleHandler) service() *services.SaleService {
	return &services.SaleService{DB: h.DB}
}

// ctx is the request's context with the caller on it, which the service
// scopes owned rows by. The organization the multitenant plugin resolved and
// the cancellation when the client goes away travel with it.
func (h *SaleHandler) ctx(c *gin.Context) context.Context {
	return authz.WithActor(c.Request.Context(), authz.ActorOf(c))
}

// fail answers an error from the service: a version conflict with the version
// the record is at, a missing row with 404, a broken rule with 422 and its
// message, and anything else as an opaque 500 that is logged.
func (h *SaleHandler) fail(c *gin.Context, err error, fallback string) {
	var conflict *concurrency.ErrConflict
	var denied *authz.DeniedError
	switch {
	case errors.As(err, &conflict):
		concurrency.WriteConflict(c, conflict.Current)
	case errors.As(err, &denied):
		// A policy refused, and said why. 403 rather than the 404 that
		// ownership uses: the caller is already allowed to see this row,
		// so hiding it says nothing and withholds the reason, which is the
		// thing the rule exists to give.
		respond.Fail(c, respond.CodeForbidden, denied.Reason)
	case errors.Is(err, gorm.ErrRecordNotFound):
		respond.Fail(c, respond.CodeNotFound, "Sale not found")
	default:
		respond.WriteError(c, err, fallback)
	}
}

// List returns a paginated list of sales.
//
//	?archived=true   only archived rows
//	?archived=all    both
//	(default)        only live rows
func (h *SaleHandler) List(c *gin.Context) {
	res, err := h.service().List(h.ctx(c), paginate.Bind(c).With("client_id", c.Query("client_id")), c.Query("archived"))
	if err != nil {
		h.fail(c, err, "Failed to fetch sales")
		return
	}

	c.JSON(http.StatusOK, res)
}

// Export streams the full filtered list as CSV (default) or XLSX: the same
// search as List, without pages.
//
//	GET /api/sales/export?format=csv
//	GET /api/sales/export?format=xlsx&search=foo
func (h *SaleHandler) Export(c *gin.Context) {
	format := c.DefaultQuery("format", "csv")
	search := c.Query("search")

	opts := export.Options{
		Sheet: "Sales",
		Columns: []export.Column{
			{Header: "ID", Field: "ID"},
			{Header: "Total", Field: "Total"},
			{Header: "Discount", Field: "Discount"},
			{Header: "PaymentMethod", Field: "PaymentMethod"},
			{Header: "AmountReceived", Field: "AmountReceived"},
			{Header: "Items", Field: "Items"},
			{Header: "Created At", Field: "CreatedAt", Format: "date:2006-01-02"},
		},
	}

	if format == "xlsx" {
		// Rows go into the workbook batch by batch, through a writer that moves
		// them to a temporary file, so memory stays flat however many match.
		sheet, err := export.NewXLSXStream(opts)
		if err != nil {
			h.fail(c, err, "Failed to export sales")
			return
		}
		defer func() {
			if err := sheet.Close(); err != nil {
				log.Printf("export sales as xlsx: removing temporary files: %v", err)
			}
		}()
		if err := h.service().Export(h.ctx(c), search, func(rows []models.Sale) error {
			return sheet.Rows(rows)
		}); err != nil {
			h.fail(c, err, "Failed to export sales")
			return
		}
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", `attachment; filename="sales.xlsx"`)
		if err := sheet.Finish(c.Writer); err != nil {
			log.Printf("export sales as xlsx: %v", err)
		}
		return
	}

	// CSV streams: the header with the first batch, then each batch as it is
	// read.
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", `attachment; filename="sales.csv"`)

	headerWritten := false
	err := h.service().Export(h.ctx(c), search, func(rows []models.Sale) error {
		if !headerWritten {
			headerWritten = true
			return export.CSV(c.Writer, rows, opts)
		}
		return export.CSVRows(c.Writer, rows, opts)
	})
	if err == nil && !headerWritten {
		// Nothing matched: still a CSV, with its header row.
		err = export.CSV(c.Writer, []models.Sale{}, opts)
	}
	if err != nil {
		if !c.Writer.Written() {
			c.Writer.Header().Del("Content-Type")
			c.Writer.Header().Del("Content-Disposition")
			h.fail(c, err, "Failed to export sales")
			return
		}
		// Rows are already on the wire, so the status cannot change. Logged,
		// so a truncated file has an explanation somewhere.
		log.Printf("export sales: %v", err)
	}
}

// GetByID returns a single sale by ID.
func (h *SaleHandler) GetByID(c *gin.Context) {
	item, err := h.service().GetByID(h.ctx(c), c.Param("id"))
	if err != nil {
		h.fail(c, err, "Failed to load sale")
		return
	}

	// The version to send back as If-Match when saving.
	c.Header("ETag", concurrency.Tag(item.Version))
	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// PDF streams this sale as a print-ready PDF: a repeating header and
// footer with page numbers, the record's fields as a detail grid, and any
// line items as a table. Edit the pdf.Record below to restyle it; the
// renderer itself lives in internal/pdf/record.go.
func (h *SaleHandler) PDF(c *gin.Context) {
	id := c.Param("id")

	item, err := h.service().GetByID(h.ctx(c), id)
	if err != nil {
		h.fail(c, err, "Failed to load sale")
		return
	}

	appName := h.AppName
	if appName == "" {
		appName = "Sale"
	}

	rec := pdf.Record{
		Title:      "SALE",
		Subtitle:   pdf.Value(item.ID),
		Brand:      appName,
		FooterNote: appName + " · generated " + time.Now().Format("2 Jan 2006 15:04"),
		Fields: []pdf.Field{
			{Label: "Client", Value: pdf.Display(item.Client)},
			{Label: "Total", Value: pdf.Value(item.Total)},
			{Label: "Discount", Value: pdf.Value(item.Discount)},
			{Label: "Payment Method", Value: pdf.Value(item.PaymentMethod)},
			{Label: "Amount Received", Value: pdf.Value(item.AmountReceived)},
			{Label: "Items", Value: pdf.Value(item.Items)},
			{Label: "Created", Value: pdf.Value(item.CreatedAt)},
		},
	}

	out, err := pdf.RenderRecord(rec)
	if err != nil {
		respond.Fail(c, respond.CodePDFError, "could not render the PDF")
		return
	}

	filename := "sale-" + id + ".pdf"
	c.Header("Content-Disposition", "inline; filename=\""+filename+"\"")
	c.Data(http.StatusOK, "application/pdf", out)
}

// CreateSaleRequest is the JSON body accepted by POST /sales.
//
// Named rather than anonymous so the API reference can document it: gindocs
// builds a request schema by reflecting over a real type. routes.go passes
// this type to docs.Route(...).RequestBody().
type CreateSaleRequest struct {
	ClientID       string  `json:"client_id" binding:"required"`
	Total          float64 `json:"total"`
	Discount       float64 `json:"discount"`
	PaymentMethod  string  `json:"payment_method" binding:"required"`
	AmountReceived float64 `json:"amount_received"`
	Items          string  `json:"items"`
}

// UpdateSaleRequest is the JSON body accepted by PUT /sales/:id.
// Every field is optional: only what the client sends is applied.
type UpdateSaleRequest struct {
	ClientID       *string  `json:"client_id"`
	Total          *float64 `json:"total"`
	Discount       *float64 `json:"discount"`
	PaymentMethod  string   `json:"payment_method"`
	AmountReceived *float64 `json:"amount_received"`
	Items          string   `json:"items"`
}

// Create adds a new sale.
func (h *SaleHandler) Create(c *gin.Context) {
	var req CreateSaleRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	item := models.Sale{
		ClientID:       req.ClientID,
		Total:          req.Total,
		Discount:       req.Discount,
		PaymentMethod:  req.PaymentMethod,
		AmountReceived: req.AmountReceived,
		Items:          req.Items,
	}

	if err := h.service().Create(h.ctx(c), &item); err != nil {
		h.fail(c, err, "Failed to create sale")
		return
	}

	events.Emitted(c, "sales", "Sale", "created", item.ID, item.ID, "", nil, item)

	c.JSON(http.StatusCreated, gin.H{
		"data":    item,
		"message": "Sale created successfully",
	})
}

// Update modifies an existing sale. A client that sends the version it
// read as If-Match gets 409 instead of overwriting a newer save.
func (h *SaleHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req UpdateSaleRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	updates := map[string]interface{}{}
	if req.ClientID != nil {
		updates["client_id"] = *req.ClientID
	}
	if req.Total != nil {
		updates["total"] = *req.Total
	}
	if req.Discount != nil {
		updates["discount"] = *req.Discount
	}
	if req.PaymentMethod != "" {
		updates["payment_method"] = req.PaymentMethod
	}
	if req.AmountReceived != nil {
		updates["amount_received"] = *req.AmountReceived
	}
	if req.Items != "" {
		updates["items"] = req.Items
	}

	item, err := h.service().Update(h.ctx(c), id, updates, concurrency.FromRequest(c))
	if err != nil {
		h.fail(c, err, "Failed to update sale")
		return
	}

	events.Emitted(c, "sales", "Sale", "updated", item.ID, item.ID, services.DiffSummary(updates), nil, item)

	c.Header("ETag", concurrency.Tag(item.Version))
	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "Sale updated successfully",
	})
}

// Patch applies a partial update to a sale. Used by the admin's grouped
// update view: each form group's Save button sends only the fields it owns, so
// editing "Address" does not rewrite "Pricing".
func (h *SaleHandler) Patch(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	item, updates, err := h.service().Patch(h.ctx(c), c.Param("id"), body, concurrency.FromRequest(c))
	if err != nil {
		h.fail(c, err, "Failed to patch sale")
		return
	}

	events.Emitted(c, "sales", "Sale", "updated", item.ID, item.ID, services.DiffSummary(updates), nil, item)

	c.Header("ETag", concurrency.Tag(item.Version))
	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "Sale updated successfully",
	})
}

// Delete soft-deletes a sale.
func (h *SaleHandler) Delete(c *gin.Context) {
	item, err := h.service().Delete(h.ctx(c), c.Param("id"))
	if err != nil {
		h.fail(c, err, "Failed to delete sale")
		return
	}

	events.Emitted(c, "sales", "Sale", "deleted", item.ID, item.ID, "", item, nil)

	c.JSON(http.StatusOK, gin.H{
		"message": "Sale deleted successfully",
	})
}

// BulkSaleRequest is one operation applied to a set of rows.
//
// One request rather than one per row. The admin used to fire N parallel
// DELETEs, which means N transactions, N audit entries, and a half-applied
// result when the eleventh fails.
type BulkSaleRequest struct {
	// delete removes, archive puts away, restore brings back, patch writes the
	// same field values to every selected row.
	Action string `json:"action" binding:"required,oneof=delete archive restore patch"`
	// Capped: an unbounded IN clause is a way to lock a table by accident.
	IDs []string `json:"ids" binding:"required,min=1,max=500"`
	// Only read when action is "patch". Whitelisted the same way Patch is.
	Patch map[string]interface{} `json:"patch"`
}

// Bulk applies one action to many sales in a single transaction.
func (h *SaleHandler) Bulk(c *gin.Context) {
	var req BulkSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	result, err := h.service().Bulk(h.ctx(c), req.Action, req.IDs, req.Patch)
	if err != nil {
		h.fail(c, err, "Failed to "+req.Action+" sales")
		return
	}
	if len(result.IDs) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"data":    gin.H{"affected": 0, "requested": len(req.IDs)},
			"message": "Nothing to do",
		})
		return
	}
	ids := result.IDs

	// One audit entry naming the action and the count, not N entries that bury
	// everything else somebody did today. A local map, not a package-level
	// helper: every resource has its own handler file in package handlers.
	past := map[string]string{
		"delete":  "deleted",
		"archive": "archived",
		"restore": "restored",
		"patch":   "updated",
	}[req.Action]

	noun := "sales"
	if len(ids) == 1 {
		noun = "sale"
	}

	summary := req.Action + " " + strconv.Itoa(len(ids)) + " " + noun
	if req.Action == "patch" {
		summary += ": " + services.DiffSummary(result.Updates)
	}
	// resourceID holds ONE id, not all of them: it is a lookup key, and the
	// count lives in the summary, where it can be read.
	events.Emitted(c, "sales", "Sale", "bulk", ids[0], summary, summary, nil, nil)

	c.JSON(http.StatusOK, gin.H{
		"data":    gin.H{"affected": len(ids), "requested": len(req.IDs)},
		"message": strconv.Itoa(len(ids)) + " " + noun + " " + past,
	})
}

// The two grid endpoints, for the admin's spreadsheet editors.
//
// Separate from Bulk rather than actions on it, because the request shapes are
// genuinely different: Bulk takes ids and ONE patch for all of them, and these
// take a row each. Folding them in would mean a required ids field that two of
// the five actions ignore.

// BulkEditSaleRequest is the grid's save: one patch per row.
type BulkEditSaleRequest struct {
	// Capped for the same reason Bulk's ids are: a transaction holding five
	// hundred row locks is a transaction other writers wait behind.
	Items []services.SaleGridEdit `json:"items" binding:"required,min=1,max=500"`
}

// BulkEdit saves a grid of edits, one patch per row, in one transaction.
func (h *SaleHandler) BulkEdit(c *gin.Context) {
	var req BulkEditSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	saved, rowErrors, err := h.service().BulkEdit(h.ctx(c), req.Items)
	if err != nil {
		h.fail(c, err, "Failed to save the sales")
		return
	}
	// Row errors are a 422 with the rows in it, so the grid can put each
	// message back on the line it belongs to rather than showing one banner.
	if len(rowErrors) > 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": gin.H{
			"code":    "VALIDATION_ERROR",
			"message": "Some rows could not be saved",
			"details": gin.H{"rows": rowErrors},
		}})
		return
	}
	if len(saved) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"data":    gin.H{"affected": 0, "requested": len(req.Items)},
			"message": "Nothing to do",
		})
		return
	}

	noun := "sales"
	if len(saved) == 1 {
		noun = "sale"
	}
	summary := "edited " + strconv.Itoa(len(saved)) + " " + noun + " in the grid"
	events.Emitted(c, "sales", "Sale", "bulk", saved[0], summary, summary, nil, nil)

	c.JSON(http.StatusOK, gin.H{
		"data":    gin.H{"affected": len(saved), "requested": len(req.Items)},
		"message": strconv.Itoa(len(saved)) + " " + noun + " updated",
	})
}

// BulkCreateSaleRequest is the grid's insert: whole rows, no ids.
type BulkCreateSaleRequest struct {
	Items []map[string]interface{} `json:"items" binding:"required,min=1,max=500"`
}

// BulkCreate inserts a grid of new sales in one transaction.
func (h *SaleHandler) BulkCreate(c *gin.Context) {
	var req BulkCreateSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	created, rowErrors, err := h.service().BulkCreate(h.ctx(c), req.Items)
	if err != nil {
		h.fail(c, err, "Failed to create the sales")
		return
	}
	if len(rowErrors) > 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": gin.H{
			"code":    "VALIDATION_ERROR",
			"message": "Some rows could not be created",
			"details": gin.H{"rows": rowErrors},
		}})
		return
	}
	if len(created) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"data":    gin.H{"affected": 0, "requested": len(req.Items)},
			"message": "Nothing to do",
		})
		return
	}

	noun := "sales"
	if len(created) == 1 {
		noun = "sale"
	}
	summary := "created " + strconv.Itoa(len(created)) + " " + noun + " in the grid"
	events.Emitted(c, "sales", "Sale", "bulk", created[0].ID, summary, summary, nil, nil)

	// The rows as stored, so the grid can show the ids, the generated slugs and
	// anything else a hook filled in rather than guessing at them.
	c.JSON(http.StatusCreated, gin.H{
		"data":    created,
		"message": strconv.Itoa(len(created)) + " " + noun + " created",
	})
}
