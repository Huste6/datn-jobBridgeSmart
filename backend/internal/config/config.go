package config

import "os"

// Config holds application runtime configuration.
type Config struct {
	Port string
	Mode string
}

// Load reads configuration from environment variables with sane defaults.
func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = "debug"
	}

	return Config{
		Port: port,
		Mode: mode,
	}
}
