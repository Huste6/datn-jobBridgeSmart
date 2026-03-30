package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository struct {
	// col is the MongoDB collection for users.
	col *mongo.Collection
}

type UserProfileUpdate struct {
	Role            string
	FullName        string
	Phone           string
	City            string
	Headline        string
	ProfileComplete bool
}

type UserSelfUpdate struct {
	FullName  *string
	Phone     *string
	City      *string
	Headline  *string
	AvatarURL *string
	CvURL     *string
	CvText    *string
}

func NewUserRepository(db *mongo.Database) *UserRepository {
	return &UserRepository{col: db.Collection("users")}
}

func (r *UserRepository) Create(ctx context.Context, u *User) error {
	now := time.Now().UTC()
	u.Email = strings.TrimSpace(strings.ToLower(u.Email))
	u.FullName = strings.TrimSpace(u.FullName)
	u.Role = strings.TrimSpace(u.Role)
	if u.Role == "" {
		u.Role = ""
	}
	u.ProfileDone = false
	u.CreatedAt = now
	u.UpdatedAt = now

	res, err := r.col.InsertOne(ctx, u)
	if err != nil {
		return err
	}

	if id, ok := res.InsertedID.(bson.ObjectID); ok {
		u.ID = id
	}

	return nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*User, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	var u User
	err := r.col.FindOne(ctx, bson.M{"email": email}).Decode(&u)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return &u, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id bson.ObjectID) (*User, error) {
	var u User
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&u)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return &u, nil
}

func (r *UserRepository) UpdateProfile(ctx context.Context, id bson.ObjectID, in UserProfileUpdate) (*User, error) {
	set := bson.M{
		"updated_at":        time.Now().UTC(),
		"role":              strings.TrimSpace(in.Role),
		"full_name":         strings.TrimSpace(in.FullName),
		"phone":             strings.TrimSpace(in.Phone),
		"city":              strings.TrimSpace(in.City),
		"headline":          strings.TrimSpace(in.Headline),
		"profile_completed": in.ProfileComplete,
	}

	res, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": set})
	if err != nil {
		return nil, err
	}
	if res.MatchedCount == 0 {
		return nil, ErrUserNotFound
	}

	return r.FindByID(ctx, id)
}

func (r *UserRepository) UpdateSelf(ctx context.Context, id bson.ObjectID, in UserSelfUpdate) (*User, error) {
	set := bson.M{
		"updated_at": time.Now().UTC(),
	}

	if in.FullName != nil {
		set["full_name"] = strings.TrimSpace(*in.FullName)
	}
	if in.Phone != nil {
		set["phone"] = strings.TrimSpace(*in.Phone)
	}
	if in.City != nil {
		set["city"] = strings.TrimSpace(*in.City)
	}
	if in.Headline != nil {
		set["headline"] = strings.TrimSpace(*in.Headline)
	}
	if in.AvatarURL != nil {
		set["avatar_url"] = strings.TrimSpace(*in.AvatarURL)
	}
	if in.CvURL != nil {
		set["cv_url"] = strings.TrimSpace(*in.CvURL)
	}
	if in.CvText != nil {
		set["cv_text"] = strings.TrimSpace(*in.CvText)
	}

	res, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": set})
	if err != nil {
		return nil, err
	}
	if res.MatchedCount == 0 {
		return nil, ErrUserNotFound
	}

	return r.FindByID(ctx, id)
}

func (r *UserRepository) CountAll(ctx context.Context, search string) (int64, error) {
	filter := bson.M{}
	if search != "" {
		filter["$or"] = []bson.M{
			{"full_name": bson.M{"$regex": search, "$options": "i"}},
			{"email": bson.M{"$regex": search, "$options": "i"}},
		}
	}
	return r.col.CountDocuments(ctx, filter)
}

func (r *UserRepository) FindAll(ctx context.Context, page, limit int64, search string) ([]User, error) {
	filter := bson.M{}
	if search != "" {
		filter["$or"] = []bson.M{
			{"full_name": bson.M{"$regex": search, "$options": "i"}},
			{"email": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	opts := options.Find().
		SetSkip((page - 1) * limit).
		SetLimit(limit).
		SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []User
	if err := cursor.All(ctx, &users); err != nil {
		return nil, err
	}

	return users, nil
}

func (r *UserRepository) UpdateLockStatus(ctx context.Context, id bson.ObjectID, isLocked bool) error {
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": bson.M{"is_locked": isLocked, "updated_at": time.Now().UTC()}})
	return err
}
