package factory

import (
	"fmt"
	"testing"

	"gorm.io/gorm"

	"gritpos/apps/api/internal/models"
)

// NewSupplier builds a valid Supplier without saving it.
//
// Every call produces different values for the unique fields, so two rows made
// in the same test do not collide.
func NewSupplier(overrides ...func(*models.Supplier)) *models.Supplier {
	n := next()

	record := &models.Supplier{
		Name:  fmt.Sprintf("Supplier %d", n),
		Phone: fmt.Sprintf("Phone %d", n),
	}

	for _, apply := range overrides {
		apply(record)
	}
	return record
}

// CreateSupplier builds one and writes it, failing the test if it will not save.
//
// Failing here rather than returning an error is deliberate: a fixture that
// cannot be created is not a test failure to be asserted on, it is a broken
// test, and the stack should point at the line that asked for it.
func CreateSupplier(tb testing.TB, db *gorm.DB, overrides ...func(*models.Supplier)) *models.Supplier {
	tb.Helper()
	record := NewSupplier(overrides...)
	if err := db.Create(record).Error; err != nil {
		tb.Fatalf("creating a supplier fixture: %v", err)
	}
	return record
}

// CreateSuppliers writes n of them, for a test about paging or sorting.
func CreateSuppliers(tb testing.TB, db *gorm.DB, n int, overrides ...func(*models.Supplier)) []*models.Supplier {
	tb.Helper()
	out := make([]*models.Supplier, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, CreateSupplier(tb, db, overrides...))
	}
	return out
}
