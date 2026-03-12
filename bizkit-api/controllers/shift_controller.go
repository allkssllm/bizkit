package controllers

import (
	"net/http"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// Get shifts with optional date filtering
func GetShifts(c *gin.Context) {
	var shifts []models.Shift
	query := config.DB.Preload("User")

	// Optional date range filter
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	if startDate != "" && endDate != "" {
		query = query.Where("created_at BETWEEN ? AND ?", startDate+" 00:00:00", endDate+" 23:59:59")
	}

	query.Order("created_at DESC").Find(&shifts)
	c.JSON(http.StatusOK, gin.H{"data": shifts})
}

// Create a new shift entry
func CreateShift(c *gin.Context) {
	var input struct {
		UserID      uint    `json:"user_id" binding:"required"`
		Description string  `json:"description"`
		Type        string  `json:"type" binding:"required"` // masuk / keluar
		AmountIn    float64 `json:"amount_in"`
		AmountOut   float64 `json:"amount_out"`
		Balance     float64 `json:"balance"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	shift := models.Shift{
		UserID:      input.UserID,
		Description: input.Description,
		Type:        input.Type,
		AmountIn:    input.AmountIn,
		AmountOut:   input.AmountOut,
		Balance:     input.Balance,
		Audit: models.Audit{
			CreatedBy: c.MustGet("userID").(uint),
		},
	}

	if err := config.DB.Create(&shift).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create shift entry"})
		return
	}

	config.DB.Preload("User").First(&shift, shift.ID)
	c.JSON(http.StatusCreated, gin.H{"data": shift})
}
