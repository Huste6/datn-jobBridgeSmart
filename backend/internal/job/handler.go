package job

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"jobbridge-ai/backend/internal/auth"
)

type Handler struct {
	repo      Repository
	jwtSecret string
}

func NewHandler(repo Repository, jwtSecret string) *Handler {
	return &Handler{repo: repo, jwtSecret: jwtSecret}
}

type jobUpsertRequest struct {
	Title            string   `json:"title" binding:"required,min=2"`
	Company          string   `json:"company" binding:"required,min=2"`
	Location         string   `json:"location" binding:"required,min=2"`
	Salary           string   `json:"salary" binding:"required,min=1"`
	EmploymentType   string   `json:"employment_type" binding:"required,min=1"`
	ExperienceLevel  string   `json:"experience_level" binding:"required,min=2"`
	Description      string   `json:"description" binding:"required,min=8"`
	Responsibilities []string `json:"responsibilities"`
	Requirements     []string `json:"requirements"`
	Benefits         []string `json:"benefits"`
	Tags             []string `json:"tags"`
	Status           string   `json:"status" binding:"omitempty,oneof=open closed"`
}

func currentRecruiterID(c *gin.Context) (bson.ObjectID, bool) {
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

	rawRole, _ := c.Get(auth.ContextUserRoleKey)
	role, _ := rawRole.(string)
	if strings.TrimSpace(role) != "recruiter" {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter role required"})
		return bson.ObjectID{}, false
	}

	userID, err := bson.ObjectIDFromHex(userIDHex)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return bson.ObjectID{}, false
	}

	return userID, true
}

func (h *Handler) GetJobs(c *gin.Context) {
	query := JobQuery{
		Keyword:          strings.TrimSpace(c.Query("q")),
		Location:         strings.TrimSpace(c.Query("location")),
		SalaryBand:       strings.TrimSpace(c.Query("salary_band")),
		EmploymentTypes:  c.QueryArray("employment_type"),
		ExperienceLevels: c.QueryArray("experience_level"),
		Sort:             strings.TrimSpace(c.Query("sort")),
	}

	jobs, err := h.repo.FindByQuery(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch jobs"})
		return
	}

	c.JSON(http.StatusOK, jobs)
}

func (h *Handler) GetJob(c *gin.Context) {
	id := c.Param("id")
	job, err := h.repo.FindByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch job"})
		return
	}
	if job == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	c.JSON(http.StatusOK, job)
}

func (h *Handler) ListMyJobs(c *gin.Context) {
	recruiterID, ok := currentRecruiterID(c)
	if !ok {
		return
	}

	jobs, err := h.repo.FindByOwnerID(c.Request.Context(), recruiterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recruiter jobs"})
		return
	}

	c.JSON(http.StatusOK, jobs)
}

func (h *Handler) CreateMyJob(c *gin.Context) {
	recruiterID, ok := currentRecruiterID(c)
	if !ok {
		return
	}

	var req jobUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	job, err := h.repo.CreateByOwnerID(c.Request.Context(), recruiterID, JobUpsertInput{
		Title:            req.Title,
		Company:          req.Company,
		Location:         req.Location,
		Salary:           req.Salary,
		EmploymentType:   req.EmploymentType,
		ExperienceLevel:  req.ExperienceLevel,
		Description:      req.Description,
		Responsibilities: req.Responsibilities,
		Requirements:     req.Requirements,
		Benefits:         req.Benefits,
		Tags:             req.Tags,
		Status:           req.Status,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create recruiter job"})
		return
	}

	c.JSON(http.StatusCreated, job)
}

func (h *Handler) UpdateMyJob(c *gin.Context) {
	recruiterID, ok := currentRecruiterID(c)
	if !ok {
		return
	}

	var req jobUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	job, err := h.repo.UpdateByOwnerID(c.Request.Context(), recruiterID, c.Param("id"), JobUpsertInput{
		Title:            req.Title,
		Company:          req.Company,
		Location:         req.Location,
		Salary:           req.Salary,
		EmploymentType:   req.EmploymentType,
		ExperienceLevel:  req.ExperienceLevel,
		Description:      req.Description,
		Responsibilities: req.Responsibilities,
		Requirements:     req.Requirements,
		Benefits:         req.Benefits,
		Tags:             req.Tags,
		Status:           req.Status,
	})
	if err != nil {
		if err == ErrJobNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recruiter job"})
		return
	}

	c.JSON(http.StatusOK, job)
}

func (h *Handler) DeleteMyJob(c *gin.Context) {
	recruiterID, ok := currentRecruiterID(c)
	if !ok {
		return
	}

	err := h.repo.DeleteByOwnerID(c.Request.Context(), recruiterID, c.Param("id"))
	if err != nil {
		if err == ErrJobNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete recruiter job"})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	jobsGroup := router.Group("/jobs")
	{
		jobsGroup.GET("", h.GetJobs)
		jobsGroup.GET("/:id", h.GetJob)

		recruiterJobs := jobsGroup.Group("/my")
		recruiterJobs.Use(auth.AuthMiddleware(h.jwtSecret))
		{
			recruiterJobs.GET("", h.ListMyJobs)
			recruiterJobs.POST("", h.CreateMyJob)
			recruiterJobs.PUT("/:id", h.UpdateMyJob)
			recruiterJobs.DELETE("/:id", h.DeleteMyJob)
		}
	}
}
