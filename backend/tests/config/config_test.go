package config_test

import (
	"testing"

	config "jobbridge-ai/backend/internal/config"
)

func TestLoad_UsesDefaultsWhenEnvMissing(t *testing.T) {
	setRequiredEnvForDefaults(t)

	cfg := config.Load()

	if cfg.Port != "8080" {
		t.Fatalf("unexpected default port: got %q, want %q", cfg.Port, "8080")
	}
	if cfg.Mode != "debug" {
		t.Fatalf("unexpected default mode: got %q, want %q", cfg.Mode, "debug")
	}
	if cfg.MongoURI != "mongodb://127.0.0.1:27018/jobbridge" {
		t.Fatalf("unexpected default mongo uri: got %q", cfg.MongoURI)
	}
	if cfg.MongoDB != "jobbridge" {
		t.Fatalf("unexpected default mongo db: got %q", cfg.MongoDB)
	}
	if cfg.JWTSecret != "change-me-in-production" {
		t.Fatalf("unexpected default jwt secret: got %q", cfg.JWTSecret)
	}
	if cfg.JWTIssuer != "jobbridge-api" {
		t.Fatalf("unexpected default jwt issuer: got %q", cfg.JWTIssuer)
	}
	if cfg.AccessTokenTTLMinutes != 60 {
		t.Fatalf("unexpected default access token ttl: got %d, want %d", cfg.AccessTokenTTLMinutes, 60)
	}
	if cfg.CloudinaryFolder != "jobbridge/user" {
		t.Fatalf("unexpected default cloudinary folder: got %q", cfg.CloudinaryFolder)
	}
	if cfg.Model != "gpt-4o-mini" {
		t.Fatalf("unexpected default model: got %q", cfg.Model)
	}
	if cfg.URLBase != "https://api.openai.com/v1" {
		t.Fatalf("unexpected default url base: got %q", cfg.URLBase)
	}
	if cfg.CloudinaryURL != "" {
		t.Fatalf("expected empty cloudinary url when no cloudinary env is set, got %q", cfg.CloudinaryURL)
	}
}

func TestLoad_BuildsCloudinaryURLFromParts(t *testing.T) {
	setRequiredEnvForDefaults(t)
	t.Setenv("CLOUDINARY_CLOUD_NAME", "demo")
	t.Setenv("CLOUDINARY_API_KEY", "abc123")
	t.Setenv("CLOUDINARY_API_SECRET", "xyz789")

	cfg := config.Load()

	if cfg.CloudinaryURL != "cloudinary://abc123:xyz789@demo" {
		t.Fatalf("unexpected cloudinary url: got %q", cfg.CloudinaryURL)
	}
}

func TestLoad_AccessTokenTTLParsing(t *testing.T) {
	setRequiredEnvForDefaults(t)
	t.Setenv("ACCESS_TOKEN_TTL_MINUTES", "120")

	cfg := config.Load()
	if cfg.AccessTokenTTLMinutes != 120 {
		t.Fatalf("unexpected parsed ttl: got %d, want %d", cfg.AccessTokenTTLMinutes, 120)
	}

	t.Setenv("ACCESS_TOKEN_TTL_MINUTES", "-5")
	cfg = config.Load()
	if cfg.AccessTokenTTLMinutes != 60 {
		t.Fatalf("negative ttl should fallback to default: got %d, want %d", cfg.AccessTokenTTLMinutes, 60)
	}

	t.Setenv("ACCESS_TOKEN_TTL_MINUTES", "not-a-number")
	cfg = config.Load()
	if cfg.AccessTokenTTLMinutes != 60 {
		t.Fatalf("non-number ttl should fallback to default: got %d, want %d", cfg.AccessTokenTTLMinutes, 60)
	}
}

func setRequiredEnvForDefaults(t *testing.T) {
	t.Helper()

	t.Setenv("PORT", "")
	t.Setenv("GIN_MODE", "")
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DB", "")
	t.Setenv("JWT_SECRET", "")
	t.Setenv("JWT_ISSUER", "")
	t.Setenv("ACCESS_TOKEN_TTL_MINUTES", "")
	t.Setenv("CLOUDINARY_URL", "")
	t.Setenv("CLOUDINARY_FOLDER", "")
	t.Setenv("CLOUDINARY_CLOUD_NAME", "")
	t.Setenv("CLOUDINARY_API_KEY", "")
	t.Setenv("CLOUDINARY_API_SECRET", "")
	t.Setenv("OPENAI_API_KEY", "")
	t.Setenv("MODEL", "")
	t.Setenv("URL_BASE", "")
}
