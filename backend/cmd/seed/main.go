package main

import (
"context"
"log"
"time"

"github.com/joho/godotenv"
"go.mongodb.org/mongo-driver/v2/bson"

"jobbridge-ai/backend/internal/config"
"jobbridge-ai/backend/internal/db"
"jobbridge-ai/backend/internal/job"
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
col := database.Collection("jobs")

_, err = col.DeleteMany(ctx, bson.M{})
if err != nil {
log.Fatalf("failed to clear jobs: %v", err)
}

jobs := []job.Job{
{
Title:     "Senior React Developer",
Company:   "TechCorp VN",
Location:  "Hồ Chí Minh",
Salary:    "30 - 45 triệu",
Tags:      []string{"React", "TypeScript", "Frontend"},
PostedAt:  time.Now().Add(-2 * 24 * time.Hour),
CreatedAt: time.Now().Add(-2 * 24 * time.Hour),
UpdatedAt: time.Now().Add(-2 * 24 * time.Hour),
},
{
Title:     "Golang Backend Engineer",
Company:   "VinaPlatform",
Location:  "Hà Nội",
Salary:    "25 - 40 triệu",
Tags:      []string{"Golang", "Microservices", "MongoDB", "Docker"},
PostedAt:  time.Now().Add(-3 * 24 * time.Hour),
CreatedAt: time.Now().Add(-3 * 24 * time.Hour),
UpdatedAt: time.Now().Add(-3 * 24 * time.Hour),
},
{
Title:     "AI/ML Engineer",
Company:   "DataBrain",
Location:  "Đà Nẵng",
Salary:    "40 - 60 triệu",
Tags:      []string{"Python", "TensorFlow", "PyTorch", "AI"},
PostedAt:  time.Now().Add(-1 * 24 * time.Hour),
CreatedAt: time.Now().Add(-1 * 24 * time.Hour),
UpdatedAt: time.Now().Add(-1 * 24 * time.Hour),
},
{
Title:     "DevOps Specialist",
Company:   "CloudSys",
Location:  "Hồ Chí Minh",
Salary:    "35 - 50 triệu",
Tags:      []string{"Kubernetes", "AWS", "CI/CD", "Terraform"},
PostedAt:  time.Now().Add(-5 * 24 * time.Hour),
CreatedAt: time.Now().Add(-5 * 24 * time.Hour),
UpdatedAt: time.Now().Add(-5 * 24 * time.Hour),
},
{
Title:     "Product Manager",
Company:   "FinTech Solutions",
Location:  "Hà Nội",
Salary:    "Thỏa thuận",
Tags:      []string{"Agile", "Scrum", "Product"},
PostedAt:  time.Now().Add(-10 * time.Hour),
CreatedAt: time.Now().Add(-10 * time.Hour),
UpdatedAt: time.Now().Add(-10 * time.Hour),
},
{
Title:     "Fullstack Node.js/Vue",
Company:   "Startup Hub",
Location:  "Remote",
Salary:    "20 - 30 triệu",
Tags:      []string{"Node.js", "Vue.js", "PostgreSQL"},
PostedAt:  time.Now().Add(-12 * 24 * time.Hour),
CreatedAt: time.Now().Add(-12 * 24 * time.Hour),
UpdatedAt: time.Now().Add(-12 * 24 * time.Hour),
},
}

for _, j := range jobs {
j.ID = bson.NewObjectID()
_, err := col.InsertOne(ctx, j)
if err != nil {
log.Printf("failed to insert %s: %v", j.Title, err)
}
}

log.Println("Seeded job dataset successfully!")
}

