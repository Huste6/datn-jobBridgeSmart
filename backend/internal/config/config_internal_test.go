package config

import "testing"

func TestLoad_RespectsModelAndURLBase(t *testing.T) {
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
	t.Setenv("OPENAI_API_KEY", "test-key")
	t.Setenv("MODEL", "gpt-test")
	t.Setenv("URL_BASE", "https://example.com/v1")

	cfg := Load()
	if cfg.Model != "gpt-test" {
		t.Fatalf("unexpected model: got %q", cfg.Model)
	}
	if cfg.URLBase != "https://example.com/v1" {
		t.Fatalf("unexpected url base: got %q", cfg.URLBase)
	}
	if cfg.OpenAIAPIKey != "test-key" {
		t.Fatalf("unexpected api key: got %q", cfg.OpenAIAPIKey)
	}
}
