package factory

import (
	"fmt"
	"testing"

	"gorm.io/gorm"

	"gritpos/apps/api/internal/models"
)

// NewSale builds a valid Sale without saving it.
//
// Every call produces different values for the unique fields, so two rows made
// in the same test do not collide.
//
// ClientID is left empty here. CreateSale fills it with a fresh parent when
// nothing else has, because the column is a string rather than a pointer: its
// zero value is the empty string, not NULL, and no parent row has that id.
// To attach it to one you already have, pass it in and the override wins:
//
//	sale := factory.CreateSale(t, db, func(m *models.Sale) {
//		m.ClientID = parent.ID
//	})
func NewSale(overrides ...func(*models.Sale)) *models.Sale {
	n := next()

	record := &models.Sale{
		Total:          float64(n) + 0.5,
		Discount:       float64(n) + 0.5,
		PaymentMethod:  fmt.Sprintf("PaymentMethod %d", n),
		AmountReceived: float64(n) + 0.5,
		Items:          fmt.Sprintf("Items %d", n),
	}

	for _, apply := range overrides {
		apply(record)
	}
	return record
}

// CreateSale builds one and writes it, failing the test if it will not save.
//
// Failing here rather than returning an error is deliberate: a fixture that
// cannot be created is not a test failure to be asserted on, it is a broken
// test, and the stack should point at the line that asked for it.
func CreateSale(tb testing.TB, db *gorm.DB, overrides ...func(*models.Sale)) *models.Sale {
	tb.Helper()
	record := NewSale(overrides...)
	if record.ClientID == "" {
		record.ClientID = CreateClient(tb, db).ID
	}
	if err := db.Create(record).Error; err != nil {
		tb.Fatalf("creating a sale fixture: %v", err)
	}
	return record
}

// CreateSales writes n of them, for a test about paging or sorting.
func CreateSales(tb testing.TB, db *gorm.DB, n int, overrides ...func(*models.Sale)) []*models.Sale {
	tb.Helper()
	out := make([]*models.Sale, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, CreateSale(tb, db, overrides...))
	}
	return out
}
