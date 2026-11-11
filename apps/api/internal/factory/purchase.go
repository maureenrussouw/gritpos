package factory

import (
	"fmt"
	"testing"

	"gorm.io/gorm"

	"gritpos/apps/api/internal/models"
)

// NewPurchase builds a valid Purchase without saving it.
//
// Every call produces different values for the unique fields, so two rows made
// in the same test do not collide.
//
// SupplierID is left empty here. CreatePurchase fills it with a fresh parent when
// nothing else has, because the column is a string rather than a pointer: its
// zero value is the empty string, not NULL, and no parent row has that id.
// To attach it to one you already have, pass it in and the override wins:
//
//	purchase := factory.CreatePurchase(t, db, func(m *models.Purchase) {
//		m.SupplierID = parent.ID
//	})
func NewPurchase(overrides ...func(*models.Purchase)) *models.Purchase {
	n := next()

	record := &models.Purchase{
		Reference: fmt.Sprintf("Reference %d", n),
		Total:     float64(n) + 0.5,
		Status:    fmt.Sprintf("Status %d", n),
		Items:     fmt.Sprintf("Items %d", n),
	}

	for _, apply := range overrides {
		apply(record)
	}
	return record
}

// CreatePurchase builds one and writes it, failing the test if it will not save.
//
// Failing here rather than returning an error is deliberate: a fixture that
// cannot be created is not a test failure to be asserted on, it is a broken
// test, and the stack should point at the line that asked for it.
func CreatePurchase(tb testing.TB, db *gorm.DB, overrides ...func(*models.Purchase)) *models.Purchase {
	tb.Helper()
	record := NewPurchase(overrides...)
	if record.SupplierID == "" {
		record.SupplierID = CreateSupplier(tb, db).ID
	}
	if err := db.Create(record).Error; err != nil {
		tb.Fatalf("creating a purchase fixture: %v", err)
	}
	return record
}

// CreatePurchases writes n of them, for a test about paging or sorting.
func CreatePurchases(tb testing.TB, db *gorm.DB, n int, overrides ...func(*models.Purchase)) []*models.Purchase {
	tb.Helper()
	out := make([]*models.Purchase, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, CreatePurchase(tb, db, overrides...))
	}
	return out
}
