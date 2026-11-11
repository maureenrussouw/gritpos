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

// PurchaseHandler serves the purchase endpoints. It reads the request, asks
// services.PurchaseService, and writes the answer; it runs no query of its
// own, so everything a route does is also available to a job or a test.
type PurchaseHandler struct {
	DB *gorm.DB
	// AppName brands the PDF export. The route file sets it from config.
	AppName string
}

// service is the purchase service over this handler's database.
func (h *PurchaseHandler) service() *services.PurchaseService {
	return &services.PurchaseService{DB: h.DB}
}

// ctx is the request's context with the caller on it, which the service
// scopes owned rows by. The organization the multitenant plugin resolved and
// the cancellation when the client goes away travel with it.
func (h *PurchaseHandler) ctx(c *gin.Context) context.Context {
	return authz.WithActor(c.Request.Context(), authz.ActorOf(c))
}

// fail answers an error from the service: a version conflict with the version
// the record is at, a missing row with 404, a broken rule with 422 and its
// message, and anything else as an opaque 500 that is logged.
func (h *PurchaseHandler) fail(c *gin.Context, err error, fallback string) {
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
		respond.Fail(c, respond.CodeNotFound, "Purchase not found")
	default:
		respond.WriteError(c, err, fallback)
	}
}

// List returns a paginated list of purchases.
//
//	?archived=true   only archived rows
//	?archived=all    both
//	(default)        only live rows
func (h *PurchaseHandler) List(c *gin.Context) {
	res, err := h.service().List(h.ctx(c), paginate.Bind(c).With("supplier_id", c.Query("supplier_id")), c.Query("archived"))
	if err != nil {
		h.fail(c, err, "Failed to fetch purchases")
		return
	}

	c.JSON(http.StatusOK, res)
}

// Export streams the full filtered list as CSV (default) or XLSX: the same
// search as List, without pages.
//
//	GET /api/purchases/export?format=csv
//	GET /api/purchases/export?format=xlsx&search=foo
func (h *PurchaseHandler) Export(c *gin.Context) {
	format := c.DefaultQuery("format", "csv")
	search := c.Query("search")

	opts := export.Options{
		Sheet: "Purchases",
		Columns: []export.Column{
			{Header: "ID", Field: "ID"},
			{Header: "Reference", Field: "Reference"},
			{Header: "Total", Field: "Total"},
			{Header: "Status", Field: "Status"},
			{Header: "Items", Field: "Items"},
			{Header: "Created At", Field: "CreatedAt", Format: "date:2006-01-02"},
		},
	}

	if format == "xlsx" {
		// Rows go into the workbook batch by batch, through a writer that moves
		// them to a temporary file, so memory stays flat however many match.
		sheet, err := export.NewXLSXStream(opts)
		if err != nil {
			h.fail(c, err, "Failed to export purchases")
			return
		}
		defer func() {
			if err := sheet.Close(); err != nil {
				log.Printf("export purchases as xlsx: removing temporary files: %v", err)
			}
		}()
		if err := h.service().Export(h.ctx(c), search, func(rows []models.Purchase) error {
			return sheet.Rows(rows)
		}); err != nil {
			h.fail(c, err, "Failed to export purchases")
			return
		}
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", `attachment; filename="purchases.xlsx"`)
		if err := sheet.Finish(c.Writer); err != nil {
			log.Printf("export purchases as xlsx: %v", err)
		}
		return
	}

	// CSV streams: the header with the first batch, then each batch as it is
	// read.
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", `attachment; filename="purchases.csv"`)

	headerWritten := false
	err := h.service().Export(h.ctx(c), search, func(rows []models.Purchase) error {
		if !headerWritten {
			headerWritten = true
			return export.CSV(c.Writer, rows, opts)
		}
		return export.CSVRows(c.Writer, rows, opts)
	})
	if err == nil && !headerWritten {
		// Nothing matched: still a CSV, with its header row.
		err = export.CSV(c.Writer, []models.Purchase{}, opts)
	}
	if err != nil {
		if !c.Writer.Written() {
			c.Writer.Header().Del("Content-Type")
			c.Writer.Header().Del("Content-Disposition")
			h.fail(c, err, "Failed to export purchases")
			return
		}
		// Rows are already on the wire, so the status cannot change. Logged,
		// so a truncated file has an explanation somewhere.
		log.Printf("export purchases: %v", err)
	}
}

// GetByID returns a single purchase by ID.
func (h *PurchaseHandler) GetByID(c *gin.Context) {
	item, err := h.service().GetByID(h.ctx(c), c.Param("id"))
	if err != nil {
		h.fail(c, err, "Failed to load purchase")
		return
	}

	// The version to send back as If-Match when saving.
	c.Header("ETag", concurrency.Tag(item.Version))
	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// PDF streams this purchase as a print-ready PDF: a repeating header and
// footer with page numbers, the record's fields as a detail grid, and any
// line items as a table. Edit the pdf.Record below to restyle it; the
// renderer itself lives in internal/pdf/record.go.
func (h *PurchaseHandler) PDF(c *gin.Context) {
	id := c.Param("id")

	item, err := h.service().GetByID(h.ctx(c), id)
	if err != nil {
		h.fail(c, err, "Failed to load purchase")
		return
	}

	appName := h.AppName
	if appName == "" {
		appName = "Purchase"
	}

	rec := pdf.Record{
		Title:      "PURCHASE",
		Subtitle:   pdf.Value(item.Reference),
		Brand:      appName,
		FooterNote: appName + " · generated " + time.Now().Format("2 Jan 2006 15:04"),
		Fields: []pdf.Field{
			{Label: "Supplier", Value: pdf.Display(item.Supplier)},
			{Label: "Reference", Value: pdf.Value(item.Reference)},
			{Label: "Total", Value: pdf.Value(item.Total)},
			{Label: "Status", Value: pdf.Value(item.Status)},
			{Label: "Items", Value: pdf.Value(item.Items)},
			{Label: "Created", Value: pdf.Value(item.CreatedAt)},
		},
	}

	out, err := pdf.RenderRecord(rec)
	if err != nil {
		respond.Fail(c, respond.CodePDFError, "could not render the PDF")
		return
	}

	filename := "purchase-" + id + ".pdf"
	c.Header("Content-Disposition", "inline; filename=\""+filename+"\"")
	c.Data(http.StatusOK, "application/pdf", out)
}

// CreatePurchaseRequest is the JSON body accepted by POST /purchases.
//
// Named rather than anonymous so the API reference can document it: gindocs
// builds a request schema by reflecting over a real type. routes.go passes
// this type to docs.Route(...).RequestBody().
type CreatePurchaseRequest struct {
	SupplierID string  `json:"supplier_id" binding:"required"`
	Reference  string  `json:"reference" binding:"required"`
	Total      float64 `json:"total"`
	Status     string  `json:"status" binding:"required"`
	Items      string  `json:"items"`
}

// UpdatePurchaseRequest is the JSON body accepted by PUT /purchases/:id.
// Every field is optional: only what the client sends is applied.
type UpdatePurchaseRequest struct {
	SupplierID *string  `json:"supplier_id"`
	Reference  string   `json:"reference"`
	Total      *float64 `json:"total"`
	Status     string   `json:"status"`
	Items      string   `json:"items"`
}

// Create adds a new purchase.
func (h *PurchaseHandler) Create(c *gin.Context) {
	var req CreatePurchaseRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	item := models.Purchase{
		SupplierID: req.SupplierID,
		Reference:  req.Reference,
		Total:      req.Total,
		Status:     req.Status,
		Items:      req.Items,
	}

	if err := h.service().Create(h.ctx(c), &item); err != nil {
		h.fail(c, err, "Failed to create purchase")
		return
	}

	events.Emitted(c, "purchases", "Purchase", "created", item.ID, item.Reference, "", nil, item)

	c.JSON(http.StatusCreated, gin.H{
		"data":    item,
		"message": "Purchase created successfully",
	})
}

// Update modifies an existing purchase. A client that sends the version it
// read as If-Match gets 409 instead of overwriting a newer save.
func (h *PurchaseHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req UpdatePurchaseRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	updates := map[string]interface{}{}
	if req.SupplierID != nil {
		updates["supplier_id"] = *req.SupplierID
	}
	if req.Reference != "" {
		updates["reference"] = req.Reference
	}
	if req.Total != nil {
		updates["total"] = *req.Total
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Items != "" {
		updates["items"] = req.Items
	}

	item, err := h.service().Update(h.ctx(c), id, updates, concurrency.FromRequest(c))
	if err != nil {
		h.fail(c, err, "Failed to update purchase")
		return
	}

	events.Emitted(c, "purchases", "Purchase", "updated", item.ID, item.Reference, services.DiffSummary(updates), nil, item)

	c.Header("ETag", concurrency.Tag(item.Version))
	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "Purchase updated successfully",
	})
}

// Patch applies a partial update to a purchase. Used by the admin's grouped
// update view: each form group's Save button sends only the fields it owns, so
// editing "Address" does not rewrite "Pricing".
func (h *PurchaseHandler) Patch(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	item, updates, err := h.service().Patch(h.ctx(c), c.Param("id"), body, concurrency.FromRequest(c))
	if err != nil {
		h.fail(c, err, "Failed to patch purchase")
		return
	}

	events.Emitted(c, "purchases", "Purchase", "updated", item.ID, item.Reference, services.DiffSummary(updates), nil, item)

	c.Header("ETag", concurrency.Tag(item.Version))
	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "Purchase updated successfully",
	})
}

// Delete soft-deletes a purchase.
func (h *PurchaseHandler) Delete(c *gin.Context) {
	item, err := h.service().Delete(h.ctx(c), c.Param("id"))
	if err != nil {
		h.fail(c, err, "Failed to delete purchase")
		return
	}

	events.Emitted(c, "purchases", "Purchase", "deleted", item.ID, item.Reference, "", item, nil)

	c.JSON(http.StatusOK, gin.H{
		"message": "Purchase deleted successfully",
	})
}

// BulkPurchaseRequest is one operation applied to a set of rows.
//
// One request rather than one per row. The admin used to fire N parallel
// DELETEs, which means N transactions, N audit entries, and a half-applied
// result when the eleventh fails.
type BulkPurchaseRequest struct {
	// delete removes, archive puts away, restore brings back, patch writes the
	// same field values to every selected row.
	Action string `json:"action" binding:"required,oneof=delete archive restore patch"`
	// Capped: an unbounded IN clause is a way to lock a table by accident.
	IDs []string `json:"ids" binding:"required,min=1,max=500"`
	// Only read when action is "patch". Whitelisted the same way Patch is.
	Patch map[string]interface{} `json:"patch"`
}

// Bulk applies one action to many purchases in a single transaction.
func (h *PurchaseHandler) Bulk(c *gin.Context) {
	var req BulkPurchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	result, err := h.service().Bulk(h.ctx(c), req.Action, req.IDs, req.Patch)
	if err != nil {
		h.fail(c, err, "Failed to "+req.Action+" purchases")
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

	noun := "purchases"
	if len(ids) == 1 {
		noun = "purchase"
	}

	summary := req.Action + " " + strconv.Itoa(len(ids)) + " " + noun
	if req.Action == "patch" {
		summary += ": " + services.DiffSummary(result.Updates)
	}
	// resourceID holds ONE id, not all of them: it is a lookup key, and the
	// count lives in the summary, where it can be read.
	events.Emitted(c, "purchases", "Purchase", "bulk", ids[0], summary, summary, nil, nil)

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

// BulkEditPurchaseRequest is the grid's save: one patch per row.
type BulkEditPurchaseRequest struct {
	// Capped for the same reason Bulk's ids are: a transaction holding five
	// hundred row locks is a transaction other writers wait behind.
	Items []services.PurchaseGridEdit `json:"items" binding:"required,min=1,max=500"`
}

// BulkEdit saves a grid of edits, one patch per row, in one transaction.
func (h *PurchaseHandler) BulkEdit(c *gin.Context) {
	var req BulkEditPurchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	saved, rowErrors, err := h.service().BulkEdit(h.ctx(c), req.Items)
	if err != nil {
		h.fail(c, err, "Failed to save the purchases")
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

	noun := "purchases"
	if len(saved) == 1 {
		noun = "purchase"
	}
	summary := "edited " + strconv.Itoa(len(saved)) + " " + noun + " in the grid"
	events.Emitted(c, "purchases", "Purchase", "bulk", saved[0], summary, summary, nil, nil)

	c.JSON(http.StatusOK, gin.H{
		"data":    gin.H{"affected": len(saved), "requested": len(req.Items)},
		"message": strconv.Itoa(len(saved)) + " " + noun + " updated",
	})
}

// BulkCreatePurchaseRequest is the grid's insert: whole rows, no ids.
type BulkCreatePurchaseRequest struct {
	Items []map[string]interface{} `json:"items" binding:"required,min=1,max=500"`
}

// BulkCreate inserts a grid of new purchases in one transaction.
func (h *PurchaseHandler) BulkCreate(c *gin.Context) {
	var req BulkCreatePurchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respond.Fail(c, respond.CodeValidationError, err.Error())
		return
	}

	created, rowErrors, err := h.service().BulkCreate(h.ctx(c), req.Items)
	if err != nil {
		h.fail(c, err, "Failed to create the purchases")
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

	noun := "purchases"
	if len(created) == 1 {
		noun = "purchase"
	}
	summary := "created " + strconv.Itoa(len(created)) + " " + noun + " in the grid"
	events.Emitted(c, "purchases", "Purchase", "bulk", created[0].ID, summary, summary, nil, nil)

	// The rows as stored, so the grid can show the ids, the generated slugs and
	// anything else a hook filled in rather than guessing at them.
	c.JSON(http.StatusCreated, gin.H{
		"data":    created,
		"message": strconv.Itoa(len(created)) + " " + noun + " created",
	})
}
