package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	port := os.Getenv("GATEWAY_PORT")
	if port == "" {
		port = "8080"
	}

	authTarget := os.Getenv("AUTH_SERVICE_URL")
	if authTarget == "" {
		authTarget = "http://localhost:8081"
	}

	jobsTarget := os.Getenv("JOBS_SERVICE_URL")
	if jobsTarget == "" {
		jobsTarget = "http://localhost:8082"
	}

	authProxy, err := buildProxy("auth", authTarget)
	if err != nil {
		log.Fatalf("invalid AUTH_SERVICE_URL: %v", err)
	}

	jobsProxy, err := buildProxy("jobs", jobsTarget)
	if err != nil {
		log.Fatalf("invalid JOBS_SERVICE_URL: %v", err)
	}

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "gateway",
		})
	})

	r.Any("/api/auth", gin.WrapH(authProxy))
	r.Any("/api/auth/*path", gin.WrapH(authProxy))
	r.Any("/api/users", gin.WrapH(authProxy))
	r.Any("/api/users/*path", gin.WrapH(authProxy))
	r.Any("/api/hr", gin.WrapH(authProxy))
	r.Any("/api/hr/*path", gin.WrapH(authProxy))
	r.Any("/api/admin", gin.WrapH(authProxy))
	r.Any("/api/admin/*path", gin.WrapH(authProxy))
	r.Any("/api/jobs", gin.WrapH(jobsProxy))
	r.Any("/api/jobs/*path", gin.WrapH(jobsProxy))
	r.Any("/api/applications", gin.WrapH(jobsProxy))
	r.Any("/api/applications/*path", gin.WrapH(jobsProxy))

	addr := ":" + port
	log.Printf("Gateway service is running on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}

func buildProxy(name, target string) (*httputil.ReverseProxy, error) {
	target = strings.TrimSpace(target)
	u, err := url.Parse(target)
	if err != nil {
		return nil, err
	}

	proxy := httputil.NewSingleHostReverseProxy(u)
	originalDirector := proxy.Director

	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		if req.URL.Path != "/" && strings.HasSuffix(req.URL.Path, "/") {
			req.URL.Path = strings.TrimSuffix(req.URL.Path, "/")
			req.URL.RawPath = strings.TrimSuffix(req.URL.RawPath, "/")
		}
		req.Header.Set("X-Forwarded-Host", req.Host)
		req.Header.Set("X-Forwarded-Proto", "http")
	}

	proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, e error) {
		log.Printf("gateway upstream error [%s] %s %s -> %s: %v", name, req.Method, req.URL.Path, target, e)
		rw.Header().Set("Content-Type", "application/json")
		rw.WriteHeader(http.StatusBadGateway)
		_, _ = rw.Write([]byte(`{"error":"upstream service unavailable"}`))
	}

	return proxy, nil
}
