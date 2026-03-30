package application

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Application represents a job application submitted by a seeker.
type Application struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	JobID       bson.ObjectID `bson:"job_id" json:"job_id"`
	UserID      bson.ObjectID `bson:"user_id" json:"user_id"`
	CvURL       string        `bson:"cv_url,omitempty" json:"cv_url,omitempty"`
	Status      string        `bson:"status" json:"status"`
	ManualScore int           `bson:"manual_score,omitempty" json:"manual_score,omitempty"`
	Notes       string        `bson:"notes,omitempty" json:"notes,omitempty"`
	AppliedAt   time.Time     `bson:"applied_at" json:"applied_at"`
	UpdatedAt   time.Time     `bson:"updated_at" json:"updated_at"`
}
