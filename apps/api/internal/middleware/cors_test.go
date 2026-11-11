package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCORSAllowsWailsDevPreflight(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(CORSDynamic(func() []string { return []string{"http://localhost:5174"} }))

	for _, tt := range []struct {
		origin string
		want   string
	}{
		{origin: "http://localhost:5174", want: "http://localhost:5174"},
		{origin: "wails://wails.localhost:34115", want: "wails://wails.localhost:34115"},
		{origin: "http://localhost:34115", want: "http://localhost:34115"},
		{origin: "http://wails.localhost:34115", want: "http://wails.localhost:34115"},
		{origin: "wails://other.localhost:34115", want: ""},
		{origin: "http://localhost:34116", want: ""},
	} {
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/auth/login", nil)
		req.Header.Set("Origin", tt.origin)
		req.Header.Set("Access-Control-Request-Method", http.MethodPost)
		req.Header.Set("Access-Control-Request-Headers", "content-type,x-grit-client,idempotency-key")
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Errorf("OPTIONS from %q returned %d, want %d", tt.origin, rec.Code, http.StatusNoContent)
		}
		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != tt.want {
			t.Errorf("OPTIONS from %q allowed origin %q, want %q", tt.origin, got, tt.want)
		}
		if got := rec.Header().Get("Access-Control-Allow-Methods"); got == "" {
			t.Errorf("OPTIONS from %q did not include allowed methods", tt.origin)
		}
		gotHeaders := strings.ToLower(rec.Header().Get("Access-Control-Allow-Headers"))
		for _, required := range []string{"content-type", "x-grit-client", "idempotency-key"} {
			if !strings.Contains(gotHeaders, required) {
				t.Errorf("OPTIONS from %q did not allow request header %q: %q", tt.origin, required, gotHeaders)
			}
		}
	}
}
