package server

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/mongo"

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

	authHandler := auth.NewHandler(
		userRepo,
		companyRepo,
		cfg.JWTSecret,
		cfg.JWTIssuer,
		time.Duration(cfg.AccessTokenTTLMinutes)*time.Minute,
		mustAvatarUploader(cfg.CloudinaryURL, cfg.CloudinaryFolder),
	)

	jobHandler := job.NewHandler(jobRepo)

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
