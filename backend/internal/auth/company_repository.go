package auth

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var ErrCompanyNotFound = errors.New("company not found")
var ErrCompanyAlreadyExists = errors.New("company already exists")

type CompanyRepository struct {
	col *mongo.Collection
}

func NewCompanyRepository(db *mongo.Database) *CompanyRepository {
	return &CompanyRepository{col: db.Collection("companies")}
}

func (r *CompanyRepository) FindByOwnerID(ctx context.Context, ownerID bson.ObjectID) (*Company, error) {
	var company Company
	err := r.col.FindOne(ctx, bson.M{"owner_id": ownerID}).Decode(&company)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrCompanyNotFound
	}
	if err != nil {
		return nil, err
	}

	return &company, nil
}

func (r *CompanyRepository) CreateByOwnerID(ctx context.Context, ownerID bson.ObjectID, input CompanyUpsertInput) (*Company, error) {
	if _, err := r.FindByOwnerID(ctx, ownerID); err == nil {
		return nil, ErrCompanyAlreadyExists
	} else if !errors.Is(err, ErrCompanyNotFound) {
		return nil, err
	}

	normalized := normalizeCompanyInput(input)
	now := time.Now().UTC()
	company := &Company{
		OwnerID:     ownerID,
		Name:        normalized.Name,
		TaxCode:     normalized.TaxCode,
		Website:     normalized.Website,
		Industry:    normalized.Industry,
		Size:        normalized.Size,
		Location:    normalized.Location,
		Description: normalized.Description,
		Status:      "pending",
		IsLocked:    false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	res, err := r.col.InsertOne(ctx, company)
	if err != nil {
		return nil, err
	}

	if id, ok := res.InsertedID.(bson.ObjectID); ok {
		company.ID = id
	}

	return company, nil
}

func (r *CompanyRepository) UpdateByOwnerID(ctx context.Context, ownerID bson.ObjectID, input CompanyUpsertInput) (*Company, error) {
	normalized := normalizeCompanyInput(input)
	set := bson.M{
		"name":        normalized.Name,
		"tax_code":    normalized.TaxCode,
		"website":     normalized.Website,
		"industry":    normalized.Industry,
		"size":        normalized.Size,
		"location":    normalized.Location,
		"description": normalized.Description,
		"updated_at":  time.Now().UTC(),
	}

	res, err := r.col.UpdateOne(ctx, bson.M{"owner_id": ownerID}, bson.M{"$set": set})
	if err != nil {
		return nil, err
	}
	if res.MatchedCount == 0 {
		return nil, ErrCompanyNotFound
	}

	return r.FindByOwnerID(ctx, ownerID)
}

func (r *CompanyRepository) FindByID(ctx context.Context, id bson.ObjectID) (*Company, error) {
	var company Company
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&company)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrCompanyNotFound
	}
	if err != nil {
		return nil, err
	}

	return &company, nil
}

func (r *CompanyRepository) CountAllApproved(ctx context.Context) (int64, error) {
	return r.col.CountDocuments(ctx, bson.M{"status": "approved", "is_locked": false})
}

func (r *CompanyRepository) CountAll(ctx context.Context, search, status string) (int64, error) {
	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	if search != "" {
		filter["name"] = bson.M{"$regex": search, "$options": "i"}
	}
	return r.col.CountDocuments(ctx, filter)
}

func (r *CompanyRepository) FindAll(ctx context.Context, page, limit int64, search, status string) ([]Company, error) {
	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	if search != "" {
		filter["name"] = bson.M{"$regex": search, "$options": "i"}
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

	var companies []Company
	if err := cursor.All(ctx, &companies); err != nil {
		return nil, err
	}

	return companies, nil
}

func (r *CompanyRepository) UpdateStatus(ctx context.Context, id bson.ObjectID, status string) error {
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": bson.M{"status": status, "updated_at": time.Now().UTC()}})
	return err
}

func (r *CompanyRepository) UpdateLockStatus(ctx context.Context, id bson.ObjectID, isLocked bool) error {
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": bson.M{"is_locked": isLocked, "updated_at": time.Now().UTC()}})
	return err
}
