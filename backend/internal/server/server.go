package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// NewRouter creates and configures the HTTP routes.
func NewRouter() *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	return r
}
