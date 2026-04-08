package auth_test

import (
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	auth "jobbridge-ai/backend/internal/auth"
)

func TestGenerateAndParseAccessToken_RoundTrip(t *testing.T) {
	secret := "test-secret"
	issuer := "jobbridge-test"
	user := auth.User{
		ID:    bson.NewObjectID(),
		Email: "recruiter@example.com",
		Role:  "recruiter",
	}

	rawToken, err := auth.GenerateAccessToken(secret, issuer, 15*time.Minute, user)
	if err != nil {
		t.Fatalf("GenerateAccessToken returned error: %v", err)
	}

	claims, err := auth.ParseAccessToken(secret, rawToken)
	if err != nil {
		t.Fatalf("ParseAccessToken returned error: %v", err)
	}

	if claims.UserID != user.ID.Hex() {
		t.Fatalf("unexpected user id: got %q, want %q", claims.UserID, user.ID.Hex())
	}
	if claims.Email != user.Email {
		t.Fatalf("unexpected email: got %q, want %q", claims.Email, user.Email)
	}
	if claims.Role != user.Role {
		t.Fatalf("unexpected role: got %q, want %q", claims.Role, user.Role)
	}
	if claims.Issuer != issuer {
		t.Fatalf("unexpected issuer: got %q, want %q", claims.Issuer, issuer)
	}
	if claims.Subject != user.ID.Hex() {
		t.Fatalf("unexpected subject: got %q, want %q", claims.Subject, user.ID.Hex())
	}
	if claims.ExpiresAt == nil || claims.IssuedAt == nil || !claims.ExpiresAt.After(claims.IssuedAt.Time) {
		t.Fatalf("invalid token timestamps: iat=%v exp=%v", claims.IssuedAt, claims.ExpiresAt)
	}
}

func TestParseAccessToken_WrongSecret(t *testing.T) {
	user := auth.User{
		ID:    bson.NewObjectID(),
		Email: "candidate@example.com",
		Role:  "seeker",
	}

	rawToken, err := auth.GenerateAccessToken("good-secret", "issuer", 5*time.Minute, user)
	if err != nil {
		t.Fatalf("GenerateAccessToken returned error: %v", err)
	}

	if _, err := auth.ParseAccessToken("bad-secret", rawToken); err == nil {
		t.Fatal("expected ParseAccessToken to fail with wrong secret")
	}
}

func TestParseAccessToken_MalformedToken(t *testing.T) {
	if _, err := auth.ParseAccessToken("secret", "not-a-jwt"); err == nil {
		t.Fatal("expected ParseAccessToken to fail for malformed token")
	}
}
