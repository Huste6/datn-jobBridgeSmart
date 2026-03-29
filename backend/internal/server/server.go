package server

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"jobbridge-ai/backend/internal/ai"
	"jobbridge-ai/backend/internal/application"
	"jobbridge-ai/backend/internal/auth"
	"jobbridge-ai/backend/internal/config"
	"jobbridge-ai/backend/internal/job"
)

// NewRouter creates and configures the HTTP routes.
func NewRouter(cfg config.Config, db *mongo.Database) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	userRepo := auth.NewUserRepository(db)
	companyRepo := auth.NewCompanyRepository(db)
	jobRepo := job.NewRepository(db)
	appRepo := application.NewRepository(db)

	authHandler := auth.NewHandler(
		userRepo,
		companyRepo,
		cfg.JWTSecret,
		cfg.JWTIssuer,
		time.Duration(cfg.AccessTokenTTLMinutes)*time.Minute,
		mustAvatarUploader(cfg.CloudinaryURL, cfg.CloudinaryFolder),
		mustCvUploader(cfg.CloudinaryURL),
	)

	jobHandler := job.NewHandler(jobRepo, cfg.JWTSecret)
	appHandler := application.NewHandler(appRepo, userRepo, jobRepo, cfg.JWTSecret)
	aiClient := ai.NewOpenAIClient(cfg.OpenAIAPIKey, cfg.URLBase, cfg.Model)
	aiHandler := ai.NewHandler(appRepo, userRepo, jobRepo, aiClient, cfg.JWTSecret, cfg.Model)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
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

		jobHandler.RegisterRoutes(api)
		appHandler.RegisterRoutes(api)
		aiHandler.RegisterRoutes(api)
	}

	return r
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
