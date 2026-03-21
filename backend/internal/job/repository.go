package job

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type Repository interface {
	FindAll(ctx context.Context) ([]Job, error)
	FindByID(ctx context.Context, id string) (*Job, error)
}

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) Repository {
	return &repository{
		collection: db.Collection("jobs"),
	}
}

func (r *repository) FindAll(ctx context.Context) ([]Job, error) {
	var jobs []Job
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &jobs); err != nil {
		return nil, err
	}

	if jobs == nil {
		jobs = []Job{}
	}

	return jobs, nil
}

func (r *repository) FindByID(ctx context.Context, id string) (*Job, error) {
	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var job Job
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&job)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &job, nil
}
