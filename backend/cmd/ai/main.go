package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"jobbridge-ai/backend/internal/ai"
	"jobbridge-ai/backend/internal/application"
	"jobbridge-ai/backend/internal/auth"
	"jobbridge-ai/backend/internal/config"
	"jobbridge-ai/backend/internal/db"
	"jobbridge-ai/backend/internal/job"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	if port := os.Getenv("AI_SERVICE_PORT"); port != "" {
		cfg.Port = port
	} else {
		cfg.Port = "8085"
	}
	gin.SetMode(cfg.Mode)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoClient, err := db.NewMongoClient(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatalf("failed to connect mongodb: %v", err)
	}
	defer func() {
		_ = mongoClient.Disconnect(context.Background())
	}()

	database := mongoClient.Database(cfg.MongoDB)
	userRepo := auth.NewUserRepository(database)
	jobRepo := job.NewRepository(database)
	appRepo := application.NewRepository(database)

	aiClient := ai.NewOpenAIClient(cfg.OpenAIAPIKey, cfg.URLBase, cfg.Model)
	aiHandler := ai.NewHandler(appRepo, userRepo, jobRepo, aiClient, cfg.JWTSecret, cfg.Model)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "ai"})
	})

	api := r.Group("/api")
	aiHandler.RegisterRoutes(api)

	addr := ":" + cfg.Port
	log.Printf("AI service is running on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
