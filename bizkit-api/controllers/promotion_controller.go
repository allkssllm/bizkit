package controllers

import (
	"net/http"
	"time"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// Get all promotions
func GetPromotions(c *gin.Context) {
	var promotions []models.Promotion
	config.DB.Find(&promotions)
	c.JSON(http.StatusOK, gin.H{"data": promotions})
}

// Create a new promotion
func CreatePromotion(c *gin.Context) {
	var input struct {
		Name            string `json:"name" binding:"required"`
		Type            string `json:"type"`
		PromoTarget     string `json:"promo_target"`
		ConditionType   string `json:"condition_type"`
		MinQty          int    `json:"min_qty"`
		Days            string `json:"days"`                          // JSON string
		StartDate       string `json:"start_date" binding:"required"` // YYYY-MM-DD HH:mm
		EndDate         string `json:"end_date" binding:"required"`   // YYYY-MM-DD HH:mm
		VoucherType     string `json:"voucher_type"`
		MaxUsage        int    `json:"max_usage"`
		DetailCondition string `json:"detail_condition"`
		DetailPromo     string `json:"detail_promo"`
		Status          string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	startDate, err := time.Parse("2006-01-02 15:04", input.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format. Use YYYY-MM-DD HH:mm"})
		return
	}

	endDate, err := time.Parse("2006-01-02 15:04", input.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format. Use YYYY-MM-DD HH:mm"})
		return
	}

	status := "Active"
	if input.Status != "" {
		status = input.Status
	}

	promotion := models.Promotion{
		Name:            input.Name,
		Type:            input.Type,
		PromoTarget:     input.PromoTarget,
		ConditionType:   input.ConditionType,
		MinQty:          input.MinQty,
		Days:            input.Days,
		StartDate:       startDate,
		EndDate:         endDate,
		VoucherType:     input.VoucherType,
		MaxUsage:        input.MaxUsage,
		DetailCondition: input.DetailCondition,
		DetailPromo:     input.DetailPromo,
		Status:          status,
		Audit: models.Audit{
			CreatedBy: c.MustGet("userID").(uint),
		},
	}

	if err := config.DB.Create(&promotion).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create promotion"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": promotion})
}

// Update a promotion
func UpdatePromotion(c *gin.Context) {
	var promotion models.Promotion
	if err := config.DB.Where("id = ?", c.Param("id")).First(&promotion).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	var input struct {
		Name            string `json:"name"`
		Type            string `json:"type"`
		PromoTarget     string `json:"promo_target"`
		ConditionType   string `json:"condition_type"`
		MinQty          int    `json:"min_qty"`
		Days            string `json:"days"`
		StartDate       string `json:"start_date"`
		EndDate         string `json:"end_date"`
		VoucherType     string `json:"voucher_type"`
		MaxUsage        int    `json:"max_usage"`
		DetailCondition string `json:"detail_condition"`
		DetailPromo     string `json:"detail_promo"`
		Status          string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Type != "" {
		updates["type"] = input.Type
	}
	if input.PromoTarget != "" {
		updates["promo_target"] = input.PromoTarget
	}
	if input.ConditionType != "" {
		updates["condition_type"] = input.ConditionType
	}
	if input.MinQty > 0 || c.Request.Body != nil {
		// Note: Might need a better way to check if zero value was intentionally sent.
		// For now we map unconditionally if received, or skip if 0 in some designs,
		// but since it's updates we map it directly:
		updates["min_qty"] = input.MinQty
	}
	if input.VoucherType != "" {
		updates["voucher_type"] = input.VoucherType
	}
	if input.StartDate != "" {
		startDate, err := time.Parse("2006-01-02 15:04", input.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format. Use YYYY-MM-DD HH:mm"})
			return
		}
		updates["start_date"] = startDate
	}
	if input.EndDate != "" {
		endDate, err := time.Parse("2006-01-02 15:04", input.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format. Use YYYY-MM-DD HH:mm"})
			return
		}
		updates["end_date"] = endDate
	}
	if input.MaxUsage > 0 {
		updates["max_usage"] = input.MaxUsage
	}
	if input.DetailCondition != "" {
		updates["detail_condition"] = input.DetailCondition
	}
	if input.DetailPromo != "" {
		updates["detail_promo"] = input.DetailPromo
	}
	if input.Days != "" {
		updates["days"] = input.Days
	}
	if input.Status != "" {
		updates["status"] = input.Status
	}

	userID, _ := c.Get("userID")
	updates["updated_by"] = userID.(uint)

	if err := config.DB.Model(&promotion).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update promotion"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": promotion})
}

// Delete a promotion
func DeletePromotion(c *gin.Context) {
	var promotion models.Promotion
	if err := config.DB.Where("id = ?", c.Param("id")).First(&promotion).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	userID, _ := c.Get("userID")
	config.DB.Model(&promotion).Update("deleted_by", userID)
	config.DB.Delete(&promotion)
	c.JSON(http.StatusOK, gin.H{"data": true})
}
