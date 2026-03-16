package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"jobbridge-ai/backend/internal/config"
	"jobbridge-ai/backend/internal/server"
)

func main() {
	cfg := config.Load()
	gin.SetMode(cfg.Mode)

	r := server.NewRouter()
	addr := ":" + cfg.Port

	log.Printf("API server is running on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
