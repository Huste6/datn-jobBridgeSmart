package auth_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	auth "jobbridge-ai/backend/internal/auth"
)

func TestAuthMiddleware_MissingAuthorizationHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/me", auth.AuthMiddleware("secret"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	res := httptest.NewRecorder()

	r.ServeHTTP(res, req)

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status code: got %d, want %d", res.Code, http.StatusUnauthorized)
	}
}

func TestAuthMiddleware_InvalidAuthorizationHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/me", auth.AuthMiddleware("secret"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	req.Header.Set("Authorization", "Token abc")
	res := httptest.NewRecorder()

	r.ServeHTTP(res, req)

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status code: got %d, want %d", res.Code, http.StatusUnauthorized)
	}
}

func TestAuthMiddleware_ValidTokenSetsContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	secret := "secret"
	userID := bson.NewObjectID()
	token := newBearerToken(t, secret, userID, "recruiter")

	r := gin.New()
	r.GET("/me", auth.AuthMiddleware(secret), func(c *gin.Context) {
		uid, _ := c.Get(auth.ContextUserIDKey)
		role, _ := c.Get(auth.ContextUserRoleKey)
		c.JSON(http.StatusOK, gin.H{"uid": uid, "role": role})
	})

	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	res := httptest.NewRecorder()

	r.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("unexpected status code: got %d, want %d", res.Code, http.StatusOK)
	}

	var payload map[string]string
	if err := json.Unmarshal(res.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if payload["uid"] != userID.Hex() {
		t.Fatalf("unexpected user id in context: got %q, want %q", payload["uid"], userID.Hex())
	}
	if payload["role"] != "recruiter" {
		t.Fatalf("unexpected role in context: got %q, want %q", payload["role"], "recruiter")
	}
}

func TestRoleMiddleware_RejectsInsufficientRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	secret := "secret"
	token := newBearerToken(t, secret, bson.NewObjectID(), "recruiter")

	r := gin.New()
	r.GET("/admin", auth.AuthMiddleware(secret), auth.RoleMiddleware("admin"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	res := httptest.NewRecorder()

	r.ServeHTTP(res, req)

	if res.Code != http.StatusForbidden {
		t.Fatalf("unexpected status code: got %d, want %d", res.Code, http.StatusForbidden)
	}
}

func TestRoleMiddleware_AllowsConfiguredRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	secret := "secret"
	token := newBearerToken(t, secret, bson.NewObjectID(), "admin")

	r := gin.New()
	r.GET("/admin", auth.AuthMiddleware(secret), auth.RoleMiddleware("admin"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	res := httptest.NewRecorder()

	r.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("unexpected status code: got %d, want %d", res.Code, http.StatusOK)
	}
}

func newBearerToken(t *testing.T, secret string, userID bson.ObjectID, role string) string {
	t.Helper()

	token, err := auth.GenerateAccessToken(secret, "issuer", 10*time.Minute, auth.User{
		ID:    userID,
		Email: "user@example.com",
		Role:  role,
	})
	if err != nil {
		t.Fatalf("GenerateAccessToken returned error: %v", err)
	}

	return token
}
