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
	companyRepo := auth.NewCompanyRepository(database)
	authHandler := auth.NewHandler(
		userRepo,
		companyRepo,
		cfg.JWTSecret,
		cfg.JWTIssuer,
		time.Duration(cfg.AccessTokenTTLMinutes)*time.Minute,
		mustAvatarUploader(cfg.CloudinaryURL, cfg.CloudinaryFolder),
		mustCvUploader(cfg.CloudinaryURL),
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
			userRoutes.POST("/me/cv", authHandler.UploadCV)
			userRoutes.POST("/me/onboarding", authHandler.CompleteOnboarding)
		}

		hrRoutes := api.Group("/hr")
		hrRoutes.Use(auth.AuthMiddleware(cfg.JWTSecret))
		{
			hrRoutes.GET("/company", authHandler.GetMyCompany)
			hrRoutes.POST("/company", authHandler.CreateMyCompany)
			hrRoutes.PUT("/company", authHandler.UpdateMyCompany)
		}

		adminRoutes := api.Group("/admin")
		adminRoutes.Use(auth.AuthMiddleware(cfg.JWTSecret), auth.RoleMiddleware("admin"))
		{
			adminRoutes.GET("/stats", authHandler.GetAdminStats)
			adminRoutes.GET("/users", authHandler.GetAdminUsers)
			adminRoutes.POST("/users/:id/lock", authHandler.ToggleUserLock)
			adminRoutes.GET("/companies", authHandler.GetAdminCompanies)
			adminRoutes.POST("/companies/:id/approve", authHandler.ApproveCompany)
			adminRoutes.POST("/companies/:id/lock", authHandler.ToggleCompanyLock)
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

func mustCvUploader(cloudinaryURL string) *auth.CvUploader {
	uploader, err := auth.NewCvUploader(cloudinaryURL, "jobbridge/cv")
	if err != nil {
		log.Printf("cv uploader disabled: %v", err)
		return nil
	}
	if uploader == nil {
		log.Printf("cv uploader disabled: missing cloudinary configuration")
	}
	return uploader
}
