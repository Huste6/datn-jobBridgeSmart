package main

import (
	"context"
	"log"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"

	"jobbridge-ai/backend/internal/auth"
	"jobbridge-ai/backend/internal/config"
	"jobbridge-ai/backend/internal/db"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
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

	email := "admin@jobbridge.com"
	password := "admin123"

	u, err := userRepo.FindByEmail(ctx, email)
	if err == nil {
		log.Printf("admin user already exists: %s", u.Email)
		
		// Update role to admin if it's not
		if u.Role != "admin" {
			_, err := database.Collection("users").UpdateOne(ctx, bson.M{"_id": u.ID}, bson.M{"$set": bson.M{"role": "admin"}})
			if err != nil {
				log.Fatalf("failed to update admin role: %v", err)
			}
			log.Println("admin role updated!")
		}
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("failed to hash password: %v", err)
	}

	adminUser := &auth.User{
		Email:        email,
		FullName:     "System Admin",
		Role:         "admin",
		PasswordHash: string(hash),
		ProfileDone:  true,
		IsLocked:     false,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	err = userRepo.Create(ctx, adminUser)
	if err != nil {
		log.Fatalf("failed to create admin user: %v", err)
	}

	// Double check role is set (UserRepository.Create might force role to blank string)
	_, err = database.Collection("users").UpdateOne(ctx, bson.M{"_id": adminUser.ID}, bson.M{"$set": bson.M{"role": "admin", "profile_completed": true}})
	if err != nil {
		log.Fatalf("failed to set admin role: %v", err)
	}

	log.Printf("Admin user created successfully: %s / %s", email, password)
}
