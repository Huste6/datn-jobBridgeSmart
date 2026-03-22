package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"jobbridge-ai/backend/internal/auth"
	"jobbridge-ai/backend/internal/config"
	"jobbridge-ai/backend/internal/db"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	if port := os.Getenv("AUTH_SERVICE_PORT"); port != "" {
		cfg.Port = port
	} else {
		cfg.Port = "8081"
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
	authHandler := auth.NewHandler(
		userRepo,
		cfg.JWTSecret,
		cfg.JWTIssuer,
		time.Duration(cfg.AccessTokenTTLMinutes)*time.Minute,
		mustAvatarUploader(cfg.CloudinaryURL, cfg.CloudinaryFolder),
	)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "auth"})
	})

	api := r.Group("/api")
	{
		authRoutes := api.Group("/auth")
		{
			authRoutes.POST("/register", authHandler.Register)
			authRoutes.POST("/login", authHandler.Login)
		}

		userRoutes := api.Group("/users")
		userRoutes.Use(auth.AuthMiddleware(cfg.JWTSecret))
		{
			userRoutes.GET("/me", authHandler.Me)
			userRoutes.PATCH("/me", authHandler.UpdateMe)
			userRoutes.POST("/me/avatar", authHandler.UploadAvatar)
			userRoutes.POST("/me/onboarding", authHandler.CompleteOnboarding)
		}
	}

	addr := ":" + cfg.Port
	log.Printf("Auth service is running on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}

func mustAvatarUploader(cloudinaryURL, folder string) *auth.AvatarUploader {
	uploader, err := auth.NewAvatarUploader(cloudinaryURL, folder)
	if err != nil {
		log.Printf("avatar uploader disabled: %v", err)
		return nil
	}
	if uploader == nil {
		log.Printf("avatar uploader disabled: missing cloudinary configuration")
	}
	return uploader
}
