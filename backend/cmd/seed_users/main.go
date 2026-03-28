package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	"jobbridge-ai/backend/internal/auth"
	"jobbridge-ai/backend/internal/config"
	"jobbridge-ai/backend/internal/db"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
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

	password := "secret123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("failed to hash password: %v", err)
	}

	for i := 1; i <= 10; i++ {
		email := fmt.Sprintf("user%d@example.com", i)

		// 2 recruiters, 8 seekers
		role := "seeker"
		fullName := fmt.Sprintf("Candidate User %d", i)
		if i <= 2 {
			role = "recruiter"
			fullName = fmt.Sprintf("HR User %d", i)
		}

		// Check if user already exists
		_, err := userRepo.FindByEmail(ctx, email)
		if err == nil {
			log.Printf("User %s already exists, skipping...", email)
			continue
		}

		user := &auth.User{
			Email:        email,
			FullName:     fullName,
			Role:         role,
			PasswordHash: string(hashedPassword),
			ProfileDone:  true,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		err = userRepo.Create(ctx, user)
		if err != nil {
			log.Printf("failed to create user %s: %v", email, err)
		} else {
			log.Printf("Created %s user: %s (Password: %s)", role, email, password)
		}
	}

	log.Println("Seeding complete!")
}
