package factory

import (
	"fmt"
	"testing"

	"gorm.io/gorm"

	"gritpos/apps/api/internal/models"
)

// NewClient builds a valid Client without saving it.
//
// Every call produces different values for the unique fields, so two rows made
// in the same test do not collide.
func NewClient(overrides ...func(*models.Client)) *models.Client {
	n := next()

	record := &models.Client{
		Name:  fmt.Sprintf("Client %d", n),
		Phone: fmt.Sprintf("Phone %d", n),
		Email: fmt.Sprintf("Email %d", n),
	}

	for _, apply := range overrides {
		apply(record)
	}
	return record
}

// CreateClient builds one and writes it, failing the test if it will not save.
//
// Failing here rather than returning an error is deliberate: a fixture that
// cannot be created is not a test failure to be asserted on, it is a broken
// test, and the stack should point at the line that asked for it.
func CreateClient(tb testing.TB, db *gorm.DB, overrides ...func(*models.Client)) *models.Client {
	tb.Helper()
	record := NewClient(overrides...)
	if err := db.Create(record).Error; err != nil {
		tb.Fatalf("creating a client fixture: %v", err)
	}
	return record
}

// CreateClients writes n of them, for a test about paging or sorting.
func CreateClients(tb testing.TB, db *gorm.DB, n int, overrides ...func(*models.Client)) []*models.Client {
	tb.Helper()
	out := make([]*models.Client, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, CreateClient(tb, db, overrides...))
	}
	return out
}
