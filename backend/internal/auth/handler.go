package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	repo      *UserRepository
	jwtSecret string
	jwtIssuer string
	tokenTTL  time.Duration
}

func NewHandler(repo *UserRepository, jwtSecret, jwtIssuer string, tokenTTL time.Duration) *Handler {
	return &Handler{
		repo:      repo,
		jwtSecret: jwtSecret,
		jwtIssuer: jwtIssuer,
		tokenTTL:  tokenTTL,
	}
}

type registerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required,min=2"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type completeOnboardingRequest struct {
	Role     string `json:"role" binding:"required,oneof=seeker recruiter"`
	FullName string `json:"full_name" binding:"omitempty,min=2"`
	Phone    string `json:"phone" binding:"required,min=8"`
	City     string `json:"city" binding:"required,min=2"`
	Headline string `json:"headline" binding:"required,min=6"`
}

func (h *Handler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	email := strings.TrimSpace(strings.ToLower(req.Email))
	if _, err := h.repo.FindByEmail(ctx, email); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already exists"})
		return
	} else if !errors.Is(err, ErrUserNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process request"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process request"})
		return
	}

	u := &User{
		Email:        email,
		FullName:     strings.TrimSpace(req.FullName),
		Role:         "",
		PasswordHash: string(hash),
	}
	if err := h.repo.Create(ctx, u); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create user"})
		return
	}

	token, err := GenerateAccessToken(h.jwtSecret, h.jwtIssuer, h.tokenTTL, *u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not issue token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"access_token": token,
		"user":         u.ToPublic(),
	})
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	u, err := h.repo.FindByEmail(ctx, req.Email)
	if errors.Is(err, ErrUserNotFound) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process request"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	token, err := GenerateAccessToken(h.jwtSecret, h.jwtIssuer, h.tokenTTL, *u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not issue token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": token,
		"user":         u.ToPublic(),
	})
}

func (h *Handler) Me(c *gin.Context) {
	rawID, exists := c.Get(ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDHex, ok := rawID.(string)
	if !ok || userIDHex == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := bson.ObjectIDFromHex(userIDHex)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	u, err := h.repo.FindByID(ctx, userID)
	if errors.Is(err, ErrUserNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": u.ToPublic()})
}

func (h *Handler) CompleteOnboarding(c *gin.Context) {
	rawID, exists := c.Get(ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDHex, ok := rawID.(string)
	if !ok || userIDHex == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := bson.ObjectIDFromHex(userIDHex)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req completeOnboardingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	fullName := strings.TrimSpace(req.FullName)
	if fullName == "" {
		currentUser, findErr := h.repo.FindByID(ctx, userID)
		if errors.Is(findErr, ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		if findErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch user"})
			return
		}
		fullName = currentUser.FullName
	}

	u, err := h.repo.UpdateProfile(ctx, userID, UserProfileUpdate{
		Role:            req.Role,
		FullName:        fullName,
		Phone:           req.Phone,
		City:            req.City,
		Headline:        req.Headline,
		ProfileComplete: true,
	})
	if errors.Is(err, ErrUserNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": u.ToPublic()})
}
