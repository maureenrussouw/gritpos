package routes

import (
	"gritpos/apps/api/internal/handlers"
	"gritpos/apps/api/internal/middleware"
)

// Clients routes.
//
// This is the whole surface for clients: the handler, and every path that
// reaches it. Add a route by adding a line here. Remove the resource by
// deleting this file; nothing else refers to it.
//
// m.Public is outside the auth middleware and behind an API key, m.Protected
// takes a JWT or an API key, and m.Staff also requires the permission its
// route names (an ADMIN holds every one).
func init() {
	RegisterRoutes(func(m *Mount) {
		h := &handlers.ClientHandler{
			DB:      m.DB,
			AppName: m.Cfg.AppName,
		}

		m.Staff.GET("/clients", middleware.RequireRole("ADMIN", "perm:clients.view"), h.List)
		m.Staff.GET("/clients/export", middleware.RequireRole("ADMIN", "perm:clients.view"), h.Export)
		m.Staff.POST("/clients/import", middleware.RequireRole("ADMIN", "perm:clients.create"), h.Import)
		m.Staff.GET("/clients/import/template", middleware.RequireRole("ADMIN", "perm:clients.view"), h.Template)
		m.Staff.GET("/clients/:id", middleware.RequireRole("ADMIN", "perm:clients.view"), h.GetByID)
		m.Staff.GET("/clients/:id/pdf", middleware.RequireRole("ADMIN", "perm:clients.view"), h.PDF)
		m.Staff.POST("/clients", middleware.RequireRole("ADMIN", "perm:clients.create"), h.Create)
		m.Staff.POST("/clients/bulk-create", middleware.RequireRole("ADMIN", "perm:clients.create"), h.BulkCreate)
		m.Staff.PUT("/clients/:id", middleware.RequireRole("ADMIN", "perm:clients.edit"), h.Update)
		m.Staff.PATCH("/clients/:id", middleware.RequireRole("ADMIN", "perm:clients.edit"), h.Patch)
		m.Staff.POST("/clients/bulk-edit", middleware.RequireRole("ADMIN", "perm:clients.edit"), h.BulkEdit)

		m.Staff.DELETE("/clients/:id", middleware.RequireRole("ADMIN", "perm:clients.delete"), h.Delete)
		m.Staff.POST("/clients/bulk", middleware.RequireRole("ADMIN", "perm:clients.delete"), h.Bulk)
	})
}
