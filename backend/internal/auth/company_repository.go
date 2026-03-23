package auth

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
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
