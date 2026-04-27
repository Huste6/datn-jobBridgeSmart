package db

import (
	"context"
	"testing"
	"time"
)

func TestNewMongoClient_InvalidURI(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	_, err := NewMongoClient(ctx, "mongodb://invalid host")
	if err == nil {
		t.Fatal("expected NewMongoClient to fail for invalid URI")
	}
}
