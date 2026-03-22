package job

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	repo Repository
}

func NewHandler(repo Repository) *Handler {
	return &Handler{repo: repo}
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

func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	jobsGroup := router.Group("/jobs")
	{
		jobsGroup.GET("", h.GetJobs)
		jobsGroup.GET("/:id", h.GetJob)
	}
}
