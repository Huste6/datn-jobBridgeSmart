package auth

import (
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Company struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	OwnerID     bson.ObjectID `bson:"owner_id" json:"-"`
	Name        string        `bson:"name" json:"name"`
	TaxCode     string        `bson:"tax_code" json:"tax_code"`
	Website     string        `bson:"website" json:"website"`
	Industry    string        `bson:"industry" json:"industry"`
	Size        string        `bson:"size" json:"size"`
	Location    string        `bson:"location" json:"location"`
	Description string        `bson:"description" json:"description"`
	Status      string        `bson:"status" json:"status"` // pending, approved, rejected
	IsLocked    bool          `bson:"is_locked" json:"is_locked"`
	CreatedAt   time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time     `bson:"updated_at" json:"updated_at"`
}

type CompanyUpsertInput struct {
	Name        string
	TaxCode     string
	Website     string
	Industry    string
	Size        string
	Location    string
	Description string
}

func normalizeCompanyInput(in CompanyUpsertInput) CompanyUpsertInput {
	return CompanyUpsertInput{
		Name:        strings.TrimSpace(in.Name),
		TaxCode:     strings.TrimSpace(in.TaxCode),
		Website:     strings.TrimSpace(in.Website),
		Industry:    strings.TrimSpace(in.Industry),
		Size:        strings.TrimSpace(in.Size),
		Location:    strings.TrimSpace(in.Location),
		Description: strings.TrimSpace(in.Description),
	}
}
