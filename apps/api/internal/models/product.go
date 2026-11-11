package models

import (
	"time"

	"gorm.io/gorm"

	"gritpos/apps/api/internal/files"
	"gritpos/apps/api/internal/ids"
)

// Product represents a product in the system.
type Product struct {
	ID         string         `gorm:"primarykey;size:36" json:"id"`
	Name       string         `gorm:"size:255" json:"name" binding:"required" search:"trigram"`
	Sku        string         `gorm:"size:255" json:"sku" binding:"required" search:"trigram"`
	Price      float64        `gorm:"type:decimal(12,2)" json:"price"`
	Stock      int            `json:"stock"`
	CategoryID string         `gorm:"size:36;index" json:"category_id" binding:"required"`
	Category   *Category      `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Thumbnail  *files.FileRef `gorm:"type:json" json:"thumbnail"`
	Images     files.FileRefs `gorm:"type:json" json:"images"`
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
func (m *Product) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = ids.New()
	}
	return nil
}

// BeforeUpdate increments Version so offline clients can detect server-side updates.
func (m *Product) BeforeUpdate(tx *gorm.DB) error {
	tx.Statement.SetColumn("version", gorm.Expr("version + 1"))
	return nil
}
