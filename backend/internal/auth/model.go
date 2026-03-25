package auth

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// User represents an authenticated account in the system.
type User struct {
	ID           bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Email        string        `bson:"email" json:"email"`
	FullName     string        `bson:"full_name" json:"full_name"`
	Role         string        `bson:"role" json:"role"`
	AvatarURL    string        `bson:"avatar_url,omitempty" json:"avatar_url,omitempty"`
	CvURL        string        `bson:"cv_url,omitempty" json:"cv_url,omitempty"`
	Phone        string        `bson:"phone,omitempty" json:"phone,omitempty"`
	City         string        `bson:"city,omitempty" json:"city,omitempty"`
	Headline     string        `bson:"headline,omitempty" json:"headline,omitempty"`
	ProfileDone  bool          `bson:"profile_completed" json:"profile_completed"`
	PasswordHash string        `bson:"password_hash" json:"-"`
	CreatedAt    time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time     `bson:"updated_at" json:"updated_at"`
}

type PublicUser struct {
	ID               string    `json:"id"`
	Email            string    `json:"email"`
	FullName         string    `json:"full_name"`
	Role             string    `json:"role"`
	AvatarURL        string    `json:"avatar_url,omitempty"`
	CvURL            string    `json:"cv_url,omitempty"`
	Phone            string    `json:"phone,omitempty"`
	City             string    `json:"city,omitempty"`
	Headline         string    `json:"headline,omitempty"`
	ProfileCompleted bool      `json:"profile_completed"`
	CreatedAt        time.Time `json:"created_at"`
}

func (u User) ToPublic() PublicUser {
	return PublicUser{
		ID:               u.ID.Hex(),
		Email:            u.Email,
		FullName:         u.FullName,
		Role:             u.Role,
		AvatarURL:        u.AvatarURL,
		CvURL:            u.CvURL,
		Phone:            u.Phone,
		City:             u.City,
		Headline:         u.Headline,
		ProfileCompleted: u.ProfileDone,
		CreatedAt:        u.CreatedAt,
	}
}
