package server

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"jobbridge-ai/backend/internal/auth"
	"jobbridge-ai/backend/internal/config"
)

// NewRouter creates and configures the HTTP routes.
func NewRouter(cfg config.Config, userRepo *auth.UserRepository) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	authHandler := auth.NewHandler(
		userRepo,
		cfg.JWTSecret,
		cfg.JWTIssuer,
		time.Duration(cfg.AccessTokenTTLMinutes)*time.Minute,
	)

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
			userRoutes.POST("/me/onboarding", authHandler.CompleteOnboarding)
		}
	}

	return r
}
