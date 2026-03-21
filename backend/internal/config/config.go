package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
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
	CloudinaryURL         string
	CloudinaryFolder      string
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

	cloudinaryURL := os.Getenv("CLOUDINARY_URL")
	if strings.TrimSpace(cloudinaryURL) == "" {
		cloudName := strings.TrimSpace(os.Getenv("CLOUDINARY_CLOUD_NAME"))
		apiKey := strings.TrimSpace(os.Getenv("CLOUDINARY_API_KEY"))
		apiSecret := strings.TrimSpace(os.Getenv("CLOUDINARY_API_SECRET"))
		if cloudName != "" && apiKey != "" && apiSecret != "" {
			cred := url.UserPassword(apiKey, apiSecret)
			cloudinaryURL = fmt.Sprintf("cloudinary://%s@%s", cred.String(), cloudName)
		}
	}

	cloudinaryFolder := os.Getenv("CLOUDINARY_FOLDER")
	if cloudinaryFolder == "" {
		cloudinaryFolder = "jobbridge/user"
	}

	return Config{
		Port:                  port,
		Mode:                  mode,
		MongoURI:              mongoURI,
		MongoDB:               mongoDB,
		JWTSecret:             jwtSecret,
		JWTIssuer:             jwtIssuer,
		AccessTokenTTLMinutes: accessTokenTTLMinutes,
		CloudinaryURL:         cloudinaryURL,
		CloudinaryFolder:      cloudinaryFolder,
	}
}
