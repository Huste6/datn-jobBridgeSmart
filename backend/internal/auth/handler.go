package auth

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	repo        *UserRepository
	companyRepo *CompanyRepository
	jwtSecret   string
	jwtIssuer   string
	tokenTTL    time.Duration
	uploader    *AvatarUploader
	cvUploader  *CvUploader
}

func NewHandler(repo *UserRepository, companyRepo *CompanyRepository, jwtSecret, jwtIssuer string, tokenTTL time.Duration, uploader *AvatarUploader, cvUploader *CvUploader) *Handler {
	return &Handler{
		repo:        repo,
		companyRepo: companyRepo,
		jwtSecret:   jwtSecret,
		jwtIssuer:   jwtIssuer,
		tokenTTL:    tokenTTL,
		uploader:    uploader,
		cvUploader:  cvUploader,
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

type updateSelfRequest struct {
	FullName  *string `json:"full_name" binding:"omitempty,min=2"`
	Phone     *string `json:"phone" binding:"omitempty,min=8"`
	City      *string `json:"city" binding:"omitempty,min=2"`
	Headline  *string `json:"headline" binding:"omitempty,min=6"`
	AvatarURL *string `json:"avatar_url"`
}

type companyUpsertRequest struct {
	Name        string `json:"name" binding:"required,min=2"`
	TaxCode     string `json:"tax_code" binding:"required,min=5"`
	Website     string `json:"website" binding:"omitempty"`
	Industry    string `json:"industry" binding:"required,min=2"`
	Size        string `json:"size" binding:"required,min=1"`
	Location    string `json:"location" binding:"required,min=2"`
	Description string `json:"description" binding:"required,min=8"`
}

func currentAuthContext(c *gin.Context) (bson.ObjectID, string, bool) {
	rawID, exists := c.Get(ContextUserIDKey)
	if !exists {
		return bson.ObjectID{}, "", false
	}

	userIDHex, ok := rawID.(string)
	if !ok || userIDHex == "" {
		return bson.ObjectID{}, "", false
	}

	userID, err := bson.ObjectIDFromHex(userIDHex)
	if err != nil {
		return bson.ObjectID{}, "", false
	}

	rawRole, _ := c.Get(ContextUserRoleKey)
	role, _ := rawRole.(string)

	return userID, role, true
}

func (h *Handler) ensureRecruiter(c *gin.Context) (bson.ObjectID, bool) {
	userID, role, ok := currentAuthContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return bson.ObjectID{}, false
	}

	if strings.TrimSpace(role) != "recruiter" {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter role required"})
		return bson.ObjectID{}, false
	}

	return userID, true
}

func (h *Handler) GetMyCompany(c *gin.Context) {
	userID, ok := h.ensureRecruiter(c)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	company, err := h.companyRepo.FindByOwnerID(ctx, userID)
	if errors.Is(err, ErrCompanyNotFound) {
		c.JSON(http.StatusOK, gin.H{"company": nil})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch company"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"company": company})
}

func (h *Handler) CreateMyCompany(c *gin.Context) {
	userID, ok := h.ensureRecruiter(c)
	if !ok {
		return
	}

	var req companyUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	company, err := h.companyRepo.CreateByOwnerID(ctx, userID, CompanyUpsertInput{
		Name:        req.Name,
		TaxCode:     req.TaxCode,
		Website:     req.Website,
		Industry:    req.Industry,
		Size:        req.Size,
		Location:    req.Location,
		Description: req.Description,
	})
	if errors.Is(err, ErrCompanyAlreadyExists) {
		c.JSON(http.StatusConflict, gin.H{"error": "company already exists"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create company"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"company": company})
}

func (h *Handler) UpdateMyCompany(c *gin.Context) {
	userID, ok := h.ensureRecruiter(c)
	if !ok {
		return
	}

	var req companyUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	company, err := h.companyRepo.UpdateByOwnerID(ctx, userID, CompanyUpsertInput{
		Name:        req.Name,
		TaxCode:     req.TaxCode,
		Website:     req.Website,
		Industry:    req.Industry,
		Size:        req.Size,
		Location:    req.Location,
		Description: req.Description,
	})
	if errors.Is(err, ErrCompanyNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update company"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"company": company})
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

	if u.IsLocked {
		c.JSON(http.StatusForbidden, gin.H{"error": "This account has been restricted. Please contact support."})
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

func (h *Handler) UpdateMe(c *gin.Context) {
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

	var req updateSelfRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	if req.FullName == nil && req.Phone == nil && req.City == nil && req.Headline == nil && req.AvatarURL == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	u, err := h.repo.UpdateSelf(ctx, userID, UserSelfUpdate{
		FullName:  req.FullName,
		Phone:     req.Phone,
		City:      req.City,
		Headline:  req.Headline,
		AvatarURL: req.AvatarURL,
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

func (h *Handler) UploadAvatar(c *gin.Context) {
	if h.uploader == nil || !h.uploader.Enabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "avatar upload is not configured"})
		return
	}

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

	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing avatar file"})
		return
	}
	defer file.Close()

	const maxAvatarBytes = 2 * 1024 * 1024
	data, readErr := io.ReadAll(io.LimitReader(file, maxAvatarBytes+1))
	if readErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not read avatar file"})
		return
	}
	if len(data) > maxAvatarBytes {
		c.JSON(http.StatusBadRequest, gin.H{"error": "avatar must be <= 2MB"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	avatarURL, err := h.uploader.UploadImage(ctx, userIDHex, header.Filename, data)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "could not upload avatar"})
		return
	}

	u, err := h.repo.UpdateSelf(ctx, userID, UserSelfUpdate{AvatarURL: &avatarURL})
	if errors.Is(err, ErrUserNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update user avatar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": u.ToPublic()})
}

func (h *Handler) UploadCV(c *gin.Context) {
	if h.cvUploader == nil || !h.cvUploader.Enabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "cv upload is not configured"})
		return
	}

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

	file, header, err := c.Request.FormFile("cv")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing cv file"})
		return
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only PDF files are allowed"})
		return
	}

	const maxCvBytes = 5 * 1024 * 1024
	data, readErr := io.ReadAll(io.LimitReader(file, maxCvBytes+1))
	if readErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not read cv file"})
		return
	}
	if len(data) > maxCvBytes {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cv must be <= 5MB"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	cvURL, err := h.cvUploader.UploadRaw(ctx, userIDHex, header.Filename, data)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "could not upload cv"})
		return
	}

	cvText := ""
	if extracted, extractErr := ExtractCVText(header.Filename, header.Header.Get("Content-Type"), data); extractErr == nil {
		cvText = extracted
	}

	u, err := h.repo.UpdateSelf(ctx, userID, UserSelfUpdate{CvURL: &cvURL, CvText: &cvText})
	if errors.Is(err, ErrUserNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update user cv"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": u.ToPublic()})
}
