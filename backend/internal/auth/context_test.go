package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func newAuthTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	return c, w
}

func TestCurrentAuthContext_Success(t *testing.T) {
	c, _ := newAuthTestContext()
	id := bson.NewObjectID()
	c.Set(ContextUserIDKey, id.Hex())
	c.Set(ContextUserRoleKey, "recruiter")

	gotID, gotRole, ok := currentAuthContext(c)
	if !ok {
		t.Fatal("expected currentAuthContext success")
	}
	if gotID != id {
		t.Fatalf("unexpected user id: got %s, want %s", gotID.Hex(), id.Hex())
	}
	if gotRole != "recruiter" {
		t.Fatalf("unexpected role: got %q", gotRole)
	}
}

func TestCurrentAuthContext_InvalidHex(t *testing.T) {
	c, _ := newAuthTestContext()
	c.Set(ContextUserIDKey, "not-hex")
	if _, _, ok := currentAuthContext(c); ok {
		t.Fatal("expected currentAuthContext to fail for invalid user id")
	}
}

func TestEnsureRecruiter_RejectsWrongRole(t *testing.T) {
	h := &Handler{}
	c, w := newAuthTestContext()
	c.Set(ContextUserIDKey, bson.NewObjectID().Hex())
	c.Set(ContextUserRoleKey, "seeker")

	_, ok := h.ensureRecruiter(c)
	if ok {
		t.Fatal("expected ensureRecruiter to reject seeker role")
	}
	if w.Code != http.StatusForbidden {
		t.Fatalf("unexpected status code: got %d, want %d", w.Code, http.StatusForbidden)
	}
}

func TestEnsureRecruiter_Success(t *testing.T) {
	h := &Handler{}
	c, _ := newAuthTestContext()
	id := bson.NewObjectID()
	c.Set(ContextUserIDKey, id.Hex())
	c.Set(ContextUserRoleKey, "recruiter")

	gotID, ok := h.ensureRecruiter(c)
	if !ok {
		t.Fatal("expected ensureRecruiter success")
	}
	if gotID != id {
		t.Fatalf("unexpected user id: got %s, want %s", gotID.Hex(), id.Hex())
	}
}
