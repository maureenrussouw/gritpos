package services

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"gritpos/apps/api/internal/authz"
	"gritpos/apps/api/internal/imports"
	"gritpos/apps/api/internal/models"
)

// StartImport records a CSV import of purchases about to run: the job a client
// polls for progress.
func (s *PurchaseService) StartImport(ctx context.Context, total int) (*models.ImportJob, error) {
	// CreatedBy is who may follow the job: GET /imports/:id answers only them,
	// or an admin.
	job := models.ImportJob{Resource: "purchases", Status: "processing", Total: total, CreatedBy: authz.UserIDFrom(ctx)}
	if err := s.db(ctx).Create(&job).Error; err != nil {
		return nil, fmt.Errorf("starting the purchases import: %w", err)
	}
	return &job, nil
}

// ImportCSV streams the CSV at path, creating purchases in batches and
// updating the ImportJob jobID as it goes. belongs_to columns are resolved by
// their natural key (or id); unique-conflict rows are skipped; per-row failures
// are recorded. The file is removed when done.
//
// It outlives the request that started it, so give it a context that is not
// cancelled with the response. context.WithoutCancel of the request's keeps the
// caller, whom an owned resource's rows belong to, and the organization the
// multitenant plugin stamps them with.
func (s *PurchaseService) ImportCSV(ctx context.Context, jobID, path string) {
	db := s.db(ctx)
	// record writes the job's state for the client polling it. A failure is
	// logged rather than dropped: the import carries on, and a job stuck on
	// its last state is at least explained.
	record := func(fields map[string]interface{}) {
		if err := db.Model(&models.ImportJob{}).Where("id = ?", jobID).Updates(fields).Error; err != nil {
			log.Printf("import job %s: recording progress: %v", jobID, err)
		}
	}
	defer os.Remove(path)
	// This runs in a bare goroutine, so gin.Recovery() does NOT cover it: an
	// unrecovered panic here would crash the whole server. Recover, and mark
	// the job failed so the client's poll terminates instead of hanging.
	defer func() {
		if r := recover(); r != nil {
			record(map[string]interface{}{
				"status":  "failed",
				"message": fmt.Sprintf("import crashed: %v", r),
			})
		}
	}()

	// Imports take turns: each holds a database connection and writes in
	// batches for its whole run, and a burst of them drained the pool every
	// request shares. See internal/imports.
	release := imports.Wait(func() {
		record(map[string]interface{}{"message": "Waiting for another import to finish"})
	})
	defer release()

	f, err := os.Open(path)
	if err != nil {
		record(map[string]interface{}{
			"status": "failed", "message": "could not reopen upload",
		})
		return
	}
	defer f.Close()

	reader := csv.NewReader(f)
	reader.FieldsPerRecord = -1

	headers, err := reader.Read()
	if err != nil {
		record(map[string]interface{}{
			"status": "failed", "message": "empty or invalid CSV",
		})
		return
	}
	idx := map[string]int{}
	for i, name := range headers {
		idx[strings.TrimSpace(strings.ToLower(name))] = i
	}
	get := func(rec []string, key string) (string, bool) {
		if i, ok := idx[key]; ok && i < len(rec) {
			return strings.TrimSpace(rec[i]), true
		}
		return "", false
	}

	// supplierIDs remembers the Supplier each name in the CSV resolved to, so a
	// distinct name costs one lookup rather than one per row.
	//
	// A missing Supplier is NOT created here, because Supplier requires phone
	// and a supplier column holds only the name. Creating it from the name
	// alone fails on the constraint, once per row, which is what grit#129 was.
	// The row is refused instead, with something a person can act on.
	supplierIDs := map[string]string{}
	resolveSupplier := func(v string) (string, error) {
		if id, ok := supplierIDs[v]; ok {
			return id, nil
		}
		var rel models.Supplier
		if err := db.Where("name = ?", v).First(&rel).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return "", fmt.Errorf("supplier %q does not exist. An import cannot create one, because Supplier requires phone, which this file has no column for. Add the Supplier first, or import supplier records before this one", v)
			}
			return "", fmt.Errorf("supplier %q: %w", v, err)
		}
		supplierIDs[v] = rel.ID
		return rel.ID, nil
	}

	created, skipped, failed := 0, 0, 0
	rowErrors := []map[string]interface{}{}

	// checkpoint writes current progress so the client's poll sees movement.
	checkpoint := func(status, message string) {
		errsJSON, _ := json.Marshal(rowErrors)
		record(map[string]interface{}{
			"status":    status,
			"processed": created + skipped + failed,
			"created":   created,
			"skipped":   skipped,
			"failed":    failed,
			"errors":    string(errsJSON),
			"message":   message,
		})
	}

	const batchSize = 200
	type pendingRow struct {
		item   models.Purchase
		rowNum int
	}
	batch := make([]pendingRow, 0, batchSize)

	// flush inserts the accumulated batch. CreateInBatches (with OnConflict
	// DoNothing) amortises the per-row fsync that makes large SQLite imports
	// crawl. If the whole batch errors (a bad row can poison it), we fall back
	// to per-row inserts so created/skipped/failed stay accurate and only the
	// offending row is dropped.
	flush := func() {
		if len(batch) == 0 {
			return
		}
		items := make([]models.Purchase, len(batch))
		for i := range batch {
			items[i] = batch[i].item
		}
		res := db.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(items, len(items))
		if res.Error == nil {
			created += int(res.RowsAffected)
			skipped += len(items) - int(res.RowsAffected)
		} else {
			for i := range batch {
				one := batch[i].item
				r := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&one)
				switch {
				case r.Error != nil:
					failed++
					if len(rowErrors) < 50 {
						rowErrors = append(rowErrors, map[string]interface{}{"row": batch[i].rowNum, "message": r.Error.Error()})
					}
				case r.RowsAffected == 0:
					skipped++
				default:
					created++
				}
			}
		}
		batch = batch[:0]
	}

	rowNum := 1 // header was row 1
	for {
		rec, err := reader.Read()
		if err == io.EOF {
			break
		}
		rowNum++
		if err != nil {
			failed++
			if len(rowErrors) < 50 {
				rowErrors = append(rowErrors, map[string]interface{}{"row": rowNum, "message": err.Error()})
			}
			continue
		}

		item := models.Purchase{}
		if v, ok := get(rec, "supplier"); ok && v != "" {
			id, err := resolveSupplier(v)
			if err != nil {
				failed++
				if len(rowErrors) < 50 {
					rowErrors = append(rowErrors, map[string]interface{}{"row": rowNum, "message": err.Error()})
				}
				continue
			}
			item.SupplierID = id
		}
		if v, ok := get(rec, "reference"); ok {
			item.Reference = v
		}
		if v, ok := get(rec, "total"); ok {
			n, _ := strconv.ParseFloat(v, 64)
			item.Total = n
		}
		if v, ok := get(rec, "status"); ok {
			item.Status = v
		}
		if v, ok := get(rec, "items"); ok {
			item.Items = v
		}
		batch = append(batch, pendingRow{item: item, rowNum: rowNum})

		if len(batch) >= batchSize {
			flush()
			checkpoint("processing", "")
		}
	}
	flush()

	checkpoint("completed", fmt.Sprintf("Imported %d, skipped %d, failed %d", created, skipped, failed))
}
