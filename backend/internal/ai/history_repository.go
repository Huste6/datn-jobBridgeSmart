package ai

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type ChatHistoryMessage struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"-"`
	JobID     bson.ObjectID `bson:"job_id" json:"-"`
	Role      string        `bson:"role" json:"role"`
	Content   string        `bson:"content" json:"content"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}

type HistoryRepository struct {
	col *mongo.Collection
}

func NewHistoryRepository(db *mongo.Database) *HistoryRepository {
	return &HistoryRepository{col: db.Collection("ai_chat_history")}
}

func (r *HistoryRepository) Create(ctx context.Context, item *ChatHistoryMessage) error {
	if item.CreatedAt.IsZero() {
		item.CreatedAt = time.Now().UTC()
	}

	res, err := r.col.InsertOne(ctx, item)
	if err != nil {
		return err
	}

	if id, ok := res.InsertedID.(bson.ObjectID); ok {
		item.ID = id
	}

	return nil
}

func (r *HistoryRepository) ListByUserAndJob(ctx context.Context, userID, jobID bson.ObjectID, limit int64) ([]ChatHistoryMessage, error) {
	if limit <= 0 {
		limit = 200
	}

	cursor, err := r.col.Find(
		ctx,
		bson.M{
			"user_id": userID,
			"job_id":  jobID,
		},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: 1}, {Key: "_id", Value: 1}}).SetLimit(limit),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []ChatHistoryMessage
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	if items == nil {
		items = []ChatHistoryMessage{}
	}

	return items, nil
}
