package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestBuildProxy_InvalidTarget(t *testing.T) {
	if _, err := buildProxy("test", "://bad-url"); err == nil {
		t.Fatal("expected buildProxy to fail for invalid target")
	}
}

func TestBuildProxy_RewritesHeadersAndTrimsTrailingSlash(t *testing.T) {
	var gotPath string
	var gotForwardedHost string
	var gotForwardedProto string

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotForwardedHost = r.Header.Get("X-Forwarded-Host")
		gotForwardedProto = r.Header.Get("X-Forwarded-Proto")
		w.WriteHeader(http.StatusNoContent)
	}))
	defer upstream.Close()

	proxy, err := buildProxy("test", upstream.URL)
	if err != nil {
		t.Fatalf("buildProxy returned error: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "http://gateway.local/api/ai/interview-quiz/", nil)
	req.Host = "gateway.local:8080"
	res := httptest.NewRecorder()

	proxy.ServeHTTP(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("unexpected status code: got %d, want %d", res.Code, http.StatusNoContent)
	}
	if gotPath != "/api/ai/interview-quiz" {
		t.Fatalf("unexpected proxied path: got %q", gotPath)
	}
	if gotForwardedHost != "gateway.local:8080" {
		t.Fatalf("unexpected X-Forwarded-Host: got %q", gotForwardedHost)
	}
	if gotForwardedProto != "http" {
		t.Fatalf("unexpected X-Forwarded-Proto: got %q", gotForwardedProto)
	}
}
