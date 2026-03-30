package application

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var (
	ErrAlreadyApplied      = errors.New("already applied to this job")
	ErrApplicationNotFound = errors.New("application not found")
)

type Repository struct {
	col *mongo.Collection
}

func NewRepository(db *mongo.Database) *Repository {
	return &Repository{col: db.Collection("applications")}
}

// Create inserts a new application. Returns ErrAlreadyApplied if user already applied.
func (r *Repository) Create(ctx context.Context, app *Application) error {
	now := time.Now().UTC()
	app.AppliedAt = now
	app.UpdatedAt = now
	if app.Status == "" {
		app.Status = "submitted"
	}

	// Check for existing application
	count, err := r.col.CountDocuments(ctx, bson.M{
		"job_id":  app.JobID,
		"user_id": app.UserID,
	})
	if err != nil {
		return err
	}
	if count > 0 {
		return ErrAlreadyApplied
	}

	res, err := r.col.InsertOne(ctx, app)
	if err != nil {
		return err
	}

	if id, ok := res.InsertedID.(bson.ObjectID); ok {
		app.ID = id
	}

	return nil
}

// FindByUserID returns all applications for a given user, sorted by applied_at desc.
func (r *Repository) FindByUserID(ctx context.Context, userID bson.ObjectID) ([]Application, error) {
	cursor, err := r.col.Find(ctx, bson.M{"user_id": userID},
		options.Find().SetSort(bson.D{{Key: "applied_at", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var apps []Application
	if err := cursor.All(ctx, &apps); err != nil {
		return nil, err
	}

	if apps == nil {
		apps = []Application{}
	}

	return apps, nil
}

// FindByJobID returns all applications for a given job, sorted by applied_at desc.
func (r *Repository) FindByJobID(ctx context.Context, jobID bson.ObjectID) ([]Application, error) {
	cursor, err := r.col.Find(ctx, bson.M{"job_id": jobID},
		options.Find().SetSort(bson.D{{Key: "applied_at", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var apps []Application
	if err := cursor.All(ctx, &apps); err != nil {
		return nil, err
	}

	if apps == nil {
		apps = []Application{}
	}

	return apps, nil
}

// FindByID returns one application by _id, or ErrApplicationNotFound.
func (r *Repository) FindByID(ctx context.Context, appID bson.ObjectID) (*Application, error) {
	var app Application
	if err := r.col.FindOne(ctx, bson.M{"_id": appID}).Decode(&app); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrApplicationNotFound
		}
		return nil, err
	}

	return &app, nil
}

// UpdateStatus updates review fields of an application.
func (r *Repository) UpdateStatus(ctx context.Context, appID bson.ObjectID, newStatus string, manualScore int, notes string) (*Application, error) {
	res, err := r.col.UpdateOne(ctx, bson.M{"_id": appID}, bson.M{
		"$set": bson.M{
			"status":       newStatus,
			"manual_score": manualScore,
			"notes":        notes,
			"updated_at":   time.Now().UTC(),
		},
	})
	if err != nil {
		return nil, err
	}
	if res.MatchedCount == 0 {
		return nil, ErrApplicationNotFound
	}

	var app Application
	if err := r.col.FindOne(ctx, bson.M{"_id": appID}).Decode(&app); err != nil {
		return nil, err
	}

	return &app, nil
}
