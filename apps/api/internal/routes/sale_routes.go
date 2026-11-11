package routes

import (
	"gritpos/apps/api/internal/handlers"
	"gritpos/apps/api/internal/middleware"
)

// Sales routes.
//
// This is the whole surface for sales: the handler, and every path that
// reaches it. Add a route by adding a line here. Remove the resource by
// deleting this file; nothing else refers to it.
//
// m.Public is outside the auth middleware and behind an API key, m.Protected
// takes a JWT or an API key, and m.Staff also requires the permission its
// route names (an ADMIN holds every one).
func init() {
	RegisterRoutes(func(m *Mount) {
		h := &handlers.SaleHandler{
			DB:      m.DB,
			AppName: m.Cfg.AppName,
		}

		m.Staff.GET("/sales", middleware.RequireRole("ADMIN", "perm:sales.view"), h.List)
		m.Staff.GET("/sales/export", middleware.RequireRole("ADMIN", "perm:sales.view"), h.Export)
		m.Staff.POST("/sales/import", middleware.RequireRole("ADMIN", "perm:sales.create"), h.Import)
		m.Staff.GET("/sales/import/template", middleware.RequireRole("ADMIN", "perm:sales.view"), h.Template)
		m.Staff.GET("/sales/:id", middleware.RequireRole("ADMIN", "perm:sales.view"), h.GetByID)
		m.Staff.GET("/sales/:id/pdf", middleware.RequireRole("ADMIN", "perm:sales.view"), h.PDF)
		m.Staff.POST("/sales", middleware.RequireRole("ADMIN", "perm:sales.create"), h.Create)
		m.Staff.POST("/sales/bulk-create", middleware.RequireRole("ADMIN", "perm:sales.create"), h.BulkCreate)
		m.Staff.PUT("/sales/:id", middleware.RequireRole("ADMIN", "perm:sales.edit"), h.Update)
		m.Staff.PATCH("/sales/:id", middleware.RequireRole("ADMIN", "perm:sales.edit"), h.Patch)
		m.Staff.POST("/sales/bulk-edit", middleware.RequireRole("ADMIN", "perm:sales.edit"), h.BulkEdit)

		m.Staff.DELETE("/sales/:id", middleware.RequireRole("ADMIN", "perm:sales.delete"), h.Delete)
		m.Staff.POST("/sales/bulk", middleware.RequireRole("ADMIN", "perm:sales.delete"), h.Bulk)
	})
}
