package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCORSAllowsWailsDevPreflight(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(CORSDynamic(func() []string { return nil }))

	for _, tt := range []struct {
		origin string
		want   string
	}{
		{origin: "http://localhost:34115", want: "http://localhost:34115"},
		{origin: "http://localhost:34116", want: ""},
	} {
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/auth/login", nil)
		req.Header.Set("Origin", tt.origin)
		req.Header.Set("Access-Control-Request-Method", http.MethodPost)
		req.Header.Set("Access-Control-Request-Headers", "content-type")
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Errorf("OPTIONS from %q returned %d, want %d", tt.origin, rec.Code, http.StatusNoContent)
		}
		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != tt.want {
			t.Errorf("OPTIONS from %q allowed origin %q, want %q", tt.origin, got, tt.want)
		}
	}
}
