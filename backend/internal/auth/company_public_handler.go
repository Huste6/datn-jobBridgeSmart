package auth

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func (h *Handler) GetPublicCompanies(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "10"), 10, 64)
	search := c.Query("q")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	total, err := h.companyRepo.CountAll(ctx, search, "approved")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not count companies"})
		return
	}

	companies, err := h.companyRepo.FindAll(ctx, page, limit, search, "approved")
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

func (h *Handler) GetPublicCompany(c *gin.Context) {
	idHex := c.Param("id")
	id, err := bson.ObjectIDFromHex(idHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company id"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	company, err := h.companyRepo.FindByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	if company.Status != "approved" {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found or not approved"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"company": company,
	})
}
