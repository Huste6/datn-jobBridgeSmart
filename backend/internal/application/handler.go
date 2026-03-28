package application

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"

	"jobbridge-ai/backend/internal/auth"
	authpkg "jobbridge-ai/backend/internal/auth"
	"jobbridge-ai/backend/internal/job"
)

type Handler struct {
	repo      *Repository
	userRepo  *authpkg.UserRepository
	jobRepo   job.Repository
	jwtSecret string
}

func NewHandler(repo *Repository, userRepo *authpkg.UserRepository, jobRepo job.Repository, jwtSecret string) *Handler {
	return &Handler{
		repo:      repo,
		userRepo:  userRepo,
		jobRepo:   jobRepo,
		jwtSecret: jwtSecret,
	}
}

type applyRequest struct {
	JobID string `json:"job_id" binding:"required"`
}

type updateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=submitted reviewing interview offered rejected"`
}

func currentUserID(c *gin.Context) (bson.ObjectID, bool) {
	rawID, exists := c.Get(auth.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return bson.ObjectID{}, false
	}

	userIDHex, ok := rawID.(string)
	if !ok || userIDHex == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return bson.ObjectID{}, false
	}

	userID, err := bson.ObjectIDFromHex(userIDHex)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return bson.ObjectID{}, false
	}

	return userID, true
}

// ApplyToJob handles POST /api/applications — seeker applies to a job.
func (h *Handler) ApplyToJob(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	var req applyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	jobOID, err := bson.ObjectIDFromHex(req.JobID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job_id"})
		return
	}

	// Get user's CV URL
	user, userErr := h.userRepo.FindByID(c.Request.Context(), userID)
	cvURL := ""
	if userErr == nil && user != nil {
		cvURL = user.CvURL
	}

	app := &Application{
		JobID:  jobOID,
		UserID: userID,
		CvURL:  cvURL,
		Status: "submitted",
	}

	if err := h.repo.Create(c.Request.Context(), app); err != nil {
		if errors.Is(err, ErrAlreadyApplied) {
			c.JSON(http.StatusConflict, gin.H{"error": "already applied to this job"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create application"})
		return
	}

	c.JSON(http.StatusCreated, app)
}

// ListMyApplications handles GET /api/applications/me — seeker views their applications.
func (h *Handler) ListMyApplications(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	apps, err := h.repo.FindByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch applications"})
		return
	}

	c.JSON(http.StatusOK, apps)
}

type RecruiterApplicationResponse struct {
	ID                string    `json:"id"`
	JobID             string    `json:"jobId"`
	FullName          string    `json:"fullName"`
	Email             string    `json:"email"`
	Phone             string    `json:"phone"`
	Summary           string    `json:"summary"`
	Skills            []string  `json:"skills"`
	YearsOfExperience int       `json:"yearsOfExperience"`
	Stage             string    `json:"stage"`
	ManualScore       int       `json:"manualScore"`
	Notes             string    `json:"notes"`
	UpdatedAt         time.Time `json:"updatedAt"`
	CvURL             string    `json:"cvUrl"`
}

// ListJobApplications handles GET /api/applications/job/:jobId — recruiter views applications for their job.
func (h *Handler) ListJobApplications(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	// Verify the role is recruiter
	rawRole, _ := c.Get(auth.ContextUserRoleKey)
	role, _ := rawRole.(string)
	if strings.TrimSpace(role) != "recruiter" {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter role required"})
		return
	}

	jobIDHex := c.Param("jobId")
	jobOID, err := bson.ObjectIDFromHex(jobIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job id"})
		return
	}

	// Verify the job belongs to this recruiter
	jobs, err := h.jobRepo.FindByOwnerID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not verify job ownership"})
		return
	}

	owns := false
	for _, j := range jobs {
		if j.ID == jobOID {
			owns = true
			break
		}
	}
	if !owns {
		c.JSON(http.StatusForbidden, gin.H{"error": "you do not own this job"})
		return
	}

	apps, err := h.repo.FindByJobID(c.Request.Context(), jobOID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch applications"})
		return
	}

	var results []RecruiterApplicationResponse
	for _, app := range apps {
		user, _ := h.userRepo.FindByID(c.Request.Context(), app.UserID)
		fullName := "Unknown"
		email := ""
		phone := ""
		headline := ""
		if user != nil {
			fullName = user.FullName
			email = user.Email
			phone = user.Phone
			headline = user.Headline
		}

		stage := "new"
		switch app.Status {
		case "reviewing":
			stage = "screening"
		case "interview":
			stage = "interview"
		case "offered":
			stage = "offer"
		case "rejected":
			stage = "rejected"
		}

		results = append(results, RecruiterApplicationResponse{
			ID:                app.ID.Hex(),
			JobID:             app.JobID.Hex(),
			FullName:          fullName,
			Email:             email,
			Phone:             phone,
			Summary:           headline,
			Skills:            []string{},
			YearsOfExperience: 0,
			Stage:             stage,
			ManualScore:       0,
			Notes:             "",
			UpdatedAt:         app.UpdatedAt,
			CvURL:             app.CvURL,
		})
	}

	c.JSON(http.StatusOK, results)
}

// UpdateApplicationStatus handles PATCH /api/applications/:id/status — recruiter updates status.
func (h *Handler) UpdateApplicationStatus(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	rawRole, _ := c.Get(auth.ContextUserRoleKey)
	role, _ := rawRole.(string)
	if strings.TrimSpace(role) != "recruiter" {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter role required"})
		return
	}

	appIDHex := c.Param("id")
	appOID, err := bson.ObjectIDFromHex(appIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid application id"})
		return
	}

	var req updateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	app, err := h.repo.FindByID(c.Request.Context(), appOID)
	if err != nil {
		if errors.Is(err, ErrApplicationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch application"})
		return
	}

	jobDoc, err := h.jobRepo.FindByID(c.Request.Context(), app.JobID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not verify job ownership"})
		return
	}
	if jobDoc == nil || jobDoc.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you do not own this job"})
		return
	}

	app, err = h.repo.UpdateStatus(c.Request.Context(), appOID, req.Status)
	if err != nil {
		if errors.Is(err, ErrApplicationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update application"})
		return
	}

	c.JSON(http.StatusOK, app)
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	appGroup := router.Group("/applications")
	appGroup.Use(auth.AuthMiddleware(h.jwtSecret))
	{
		appGroup.POST("", h.ApplyToJob)
		appGroup.GET("/me", h.ListMyApplications)
		appGroup.GET("/job/:jobId", h.ListJobApplications)
		appGroup.PATCH("/:id/status", h.UpdateApplicationStatus)
	}
}
