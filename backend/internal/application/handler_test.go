package application

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"

	"jobbridge-ai/backend/internal/auth"
)

func newTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	return c, w
}

func TestNormalizeApplicationStatus(t *testing.T) {
	tests := []struct {
		in   string
		want string
		ok   bool
	}{
		{in: "submitted", want: "submitted", ok: true},
		{in: "new", want: "submitted", ok: true},
		{in: "screening", want: "reviewing", ok: true},
		{in: "offer", want: "offered", ok: true},
		{in: "unknown", want: "", ok: false},
	}

	for _, tc := range tests {
		got, ok := normalizeApplicationStatus(tc.in)
		if got != tc.want || ok != tc.ok {
			t.Fatalf("normalizeApplicationStatus(%q) = (%q, %v), want (%q, %v)", tc.in, got, ok, tc.want, tc.ok)
		}
	}
}

func TestCurrentUserID_MissingContext(t *testing.T) {
	c, w := newTestContext()
	_, ok := currentUserID(c)
	if ok {
		t.Fatal("expected currentUserID to fail when auth context is missing")
	}
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status code: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestCurrentUserID_Success(t *testing.T) {
	c, _ := newTestContext()
	id := bson.NewObjectID()
	c.Set(auth.ContextUserIDKey, id.Hex())

	got, ok := currentUserID(c)
	if !ok {
		t.Fatal("expected currentUserID success")
	}
	if got != id {
		t.Fatalf("unexpected user id: got %s, want %s", got.Hex(), id.Hex())
	}
}
