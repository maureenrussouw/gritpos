package models

import (
	"time"

	"gorm.io/gorm"

	"gritpos/apps/api/internal/ids"
)

// Purchase represents a purchase in the system.
type Purchase struct {
	ID         string         `gorm:"primarykey;size:36" json:"id"`
	SupplierID string         `gorm:"size:36;index" json:"supplier_id" binding:"required"`
	Supplier   *Supplier      `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	Reference  string         `gorm:"size:255" json:"reference" binding:"required" search:"trigram"`
	Total      float64        `gorm:"type:decimal(12,2)" json:"total"`
	Status     string         `gorm:"size:255" json:"status" binding:"required" search:"trigram"`
	Items      string         `gorm:"type:text" json:"items" search:"trigram"`
	Version    int            `gorm:"not null;default:1" json:"version"`
	CreatedAt  time.Time      `gorm:"index" json:"created_at"`
	UpdatedAt  time.Time      `gorm:"index" json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	// ArchivedAt is the "put this away without destroying it" state, and it is
	// deliberately not DeletedAt. A soft delete is invisible to every query and
	// means the row is gone as far as the app is concerned; an archived row is
	// still listable, still exportable and still restorable in one click. The
	// list endpoint hides archived rows unless ?archived=true asks for them.
	ArchivedAt *time.Time `gorm:"index" json:"archived_at,omitempty"`
}

// BeforeCreate generates a UUID before inserting.
func (m *Purchase) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = ids.New()
	}
	return nil
}

// BeforeUpdate increments Version so offline clients can detect server-side updates.
func (m *Purchase) BeforeUpdate(tx *gorm.DB) error {
	tx.Statement.SetColumn("version", gorm.Expr("version + 1"))
	return nil
}
