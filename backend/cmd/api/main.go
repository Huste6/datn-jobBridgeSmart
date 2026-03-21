package main

import (
	"context"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"jobbridge-ai/backend/internal/config"
	"jobbridge-ai/backend/internal/db"
	"jobbridge-ai/backend/internal/server"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
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
	r := server.NewRouter(cfg, database)
	addr := ":" + cfg.Port

	log.Printf("API server is running on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
