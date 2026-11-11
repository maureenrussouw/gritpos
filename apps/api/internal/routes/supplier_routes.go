package routes

import (
	"gritpos/apps/api/internal/handlers"
	"gritpos/apps/api/internal/middleware"
)

// Suppliers routes.
//
// This is the whole surface for suppliers: the handler, and every path that
// reaches it. Add a route by adding a line here. Remove the resource by
// deleting this file; nothing else refers to it.
//
// m.Public is outside the auth middleware and behind an API key, m.Protected
// takes a JWT or an API key, and m.Staff also requires the permission its
// route names (an ADMIN holds every one).
func init() {
	RegisterRoutes(func(m *Mount) {
		h := &handlers.SupplierHandler{
			DB:      m.DB,
			AppName: m.Cfg.AppName,
		}

		m.Staff.GET("/suppliers", middleware.RequireRole("ADMIN", "perm:suppliers.view"), h.List)
		m.Staff.GET("/suppliers/export", middleware.RequireRole("ADMIN", "perm:suppliers.view"), h.Export)
		m.Staff.POST("/suppliers/import", middleware.RequireRole("ADMIN", "perm:suppliers.create"), h.Import)
		m.Staff.GET("/suppliers/import/template", middleware.RequireRole("ADMIN", "perm:suppliers.view"), h.Template)
		m.Staff.GET("/suppliers/:id", middleware.RequireRole("ADMIN", "perm:suppliers.view"), h.GetByID)
		m.Staff.GET("/suppliers/:id/pdf", middleware.RequireRole("ADMIN", "perm:suppliers.view"), h.PDF)
		m.Staff.POST("/suppliers", middleware.RequireRole("ADMIN", "perm:suppliers.create"), h.Create)
		m.Staff.POST("/suppliers/bulk-create", middleware.RequireRole("ADMIN", "perm:suppliers.create"), h.BulkCreate)
		m.Staff.PUT("/suppliers/:id", middleware.RequireRole("ADMIN", "perm:suppliers.edit"), h.Update)
		m.Staff.PATCH("/suppliers/:id", middleware.RequireRole("ADMIN", "perm:suppliers.edit"), h.Patch)
		m.Staff.POST("/suppliers/bulk-edit", middleware.RequireRole("ADMIN", "perm:suppliers.edit"), h.BulkEdit)

		m.Staff.DELETE("/suppliers/:id", middleware.RequireRole("ADMIN", "perm:suppliers.delete"), h.Delete)
		m.Staff.POST("/suppliers/bulk", middleware.RequireRole("ADMIN", "perm:suppliers.delete"), h.Bulk)
	})
}
