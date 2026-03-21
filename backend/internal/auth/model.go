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
	PasswordHash string        `bson:"password_hash" json:"-"`
	CreatedAt    time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time     `bson:"updated_at" json:"updated_at"`
}

type PublicUser struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func (u User) ToPublic() PublicUser {
	return PublicUser{
		ID:        u.ID.Hex(),
		Email:     u.Email,
		FullName:  u.FullName,
		Role:      u.Role,
		CreatedAt: u.CreatedAt,
	}
}
