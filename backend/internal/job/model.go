package job

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Job struct {
	ID               bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Title            string        `bson:"title" json:"title"`
	Company          string        `bson:"company" json:"company"`
	Location         string        `bson:"location" json:"location"`
	Salary           string        `bson:"salary" json:"salary"`
	EmploymentType   string        `bson:"employment_type" json:"employment_type"`
	ExperienceLevel  string        `bson:"experience_level" json:"experience_level"`
	Description      string        `bson:"description" json:"description"`
	Responsibilities []string      `bson:"responsibilities" json:"responsibilities"`
	Requirements     []string      `bson:"requirements" json:"requirements"`
	Benefits         []string      `bson:"benefits" json:"benefits"`
	Tags             []string      `bson:"tags" json:"tags"`
	PostedAt         time.Time     `bson:"posted_at" json:"posted_at"`
	CreatedAt        time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt        time.Time     `bson:"updated_at" json:"updated_at"`
}
