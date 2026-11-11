package routes

import (
	"gritpos/apps/api/internal/handlers"
	"gritpos/apps/api/internal/middleware"
)

// Purchases routes.
//
// This is the whole surface for purchases: the handler, and every path that
// reaches it. Add a route by adding a line here. Remove the resource by
// deleting this file; nothing else refers to it.
//
// m.Public is outside the auth middleware and behind an API key, m.Protected
// takes a JWT or an API key, and m.Staff also requires the permission its
// route names (an ADMIN holds every one).
func init() {
	RegisterRoutes(func(m *Mount) {
		h := &handlers.PurchaseHandler{
			DB:      m.DB,
			AppName: m.Cfg.AppName,
		}

		m.Staff.GET("/purchases", middleware.RequireRole("ADMIN", "perm:purchases.view"), h.List)
		m.Staff.GET("/purchases/export", middleware.RequireRole("ADMIN", "perm:purchases.view"), h.Export)
		m.Staff.POST("/purchases/import", middleware.RequireRole("ADMIN", "perm:purchases.create"), h.Import)
		m.Staff.GET("/purchases/import/template", middleware.RequireRole("ADMIN", "perm:purchases.view"), h.Template)
		m.Staff.GET("/purchases/:id", middleware.RequireRole("ADMIN", "perm:purchases.view"), h.GetByID)
		m.Staff.GET("/purchases/:id/pdf", middleware.RequireRole("ADMIN", "perm:purchases.view"), h.PDF)
		m.Staff.POST("/purchases", middleware.RequireRole("ADMIN", "perm:purchases.create"), h.Create)
		m.Staff.POST("/purchases/bulk-create", middleware.RequireRole("ADMIN", "perm:purchases.create"), h.BulkCreate)
		m.Staff.PUT("/purchases/:id", middleware.RequireRole("ADMIN", "perm:purchases.edit"), h.Update)
		m.Staff.PATCH("/purchases/:id", middleware.RequireRole("ADMIN", "perm:purchases.edit"), h.Patch)
		m.Staff.POST("/purchases/bulk-edit", middleware.RequireRole("ADMIN", "perm:purchases.edit"), h.BulkEdit)

		m.Staff.DELETE("/purchases/:id", middleware.RequireRole("ADMIN", "perm:purchases.delete"), h.Delete)
		m.Staff.POST("/purchases/bulk", middleware.RequireRole("ADMIN", "perm:purchases.delete"), h.Bulk)
	})
}
