package config

import (
	"os"
	"strconv"
)

// Config holds application runtime configuration.
type Config struct {
	Port                  string
	Mode                  string
	MongoURI              string
	MongoDB               string
	JWTSecret             string
	JWTIssuer             string
	AccessTokenTTLMinutes int
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

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://127.0.0.1:27018/jobbridge"
	}

	mongoDB := os.Getenv("MONGODB_DB")
	if mongoDB == "" {
		mongoDB = "jobbridge"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-me-in-production"
	}

	jwtIssuer := os.Getenv("JWT_ISSUER")
	if jwtIssuer == "" {
		jwtIssuer = "jobbridge-api"
	}

	accessTokenTTLMinutes := 60
	if raw := os.Getenv("ACCESS_TOKEN_TTL_MINUTES"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			accessTokenTTLMinutes = parsed
		}
	}

	return Config{
		Port:                  port,
		Mode:                  mode,
		MongoURI:              mongoURI,
		MongoDB:               mongoDB,
		JWTSecret:             jwtSecret,
		JWTIssuer:             jwtIssuer,
		AccessTokenTTLMinutes: accessTokenTTLMinutes,
	}
}
