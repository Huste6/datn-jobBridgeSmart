package auth

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func (h *Handler) GetAdminStats(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userCount, err := h.repo.CountAll(ctx, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not count users"})
		return
	}

	companyCount, err := h.companyRepo.CountAllApproved(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not count companies"})
		return
	}

	// Directly query jobs collection to avoid import cycle
	jobCount, err := h.repo.col.Database().Collection("jobs").CountDocuments(ctx, bson.M{"status": "open"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not count jobs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_users":     userCount,
		"total_companies": companyCount,
		"total_jobs":      jobCount,
	})
}

func (h *Handler) GetAdminUsers(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "10"), 10, 64)
	search := c.Query("q")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	total, err := h.repo.CountAll(ctx, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not count users"})
		return
	}

	users, err := h.repo.FindAll(ctx, page, limit, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch users"})
		return
	}

	publicUsers := make([]PublicUser, len(users))
	for i, u := range users {
		publicUsers[i] = u.ToPublic()
	}

	c.JSON(http.StatusOK, gin.H{
		"users": publicUsers,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *Handler) ToggleUserLock(c *gin.Context) {
	idHex := c.Param("id")
	id, err := bson.ObjectIDFromHex(idHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var req struct {
		IsLocked bool `json:"is_locked"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	if err := h.repo.UpdateLockStatus(ctx, id, req.IsLocked); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update user lock status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user lock status updated"})
}

func (h *Handler) GetAdminCompanies(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "10"), 10, 64)
	search := c.Query("q")
	status := c.Query("status")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	total, err := h.companyRepo.CountAll(ctx, search, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not count companies"})
		return
	}

	companies, err := h.companyRepo.FindAll(ctx, page, limit, search, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch companies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"companies": companies,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

func (h *Handler) ApproveCompany(c *gin.Context) {
	idHex := c.Param("id")
	id, err := bson.ObjectIDFromHex(idHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company id"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required,oneof=approved rejected"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	if err := h.companyRepo.UpdateStatus(ctx, id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update company status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "company status updated"})
}

func (h *Handler) ToggleCompanyLock(c *gin.Context) {
	idHex := c.Param("id")
	id, err := bson.ObjectIDFromHex(idHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company id"})
		return
	}

	var req struct {
		IsLocked bool `json:"is_locked"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	if err := h.companyRepo.UpdateLockStatus(ctx, id, req.IsLocked); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update company lock status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "company lock status updated"})
}
