package controllers

import (
	"net/http"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// Get all payment methods
func GetPaymentMethods(c *gin.Context) {
	var methods []models.PaymentMethod
	config.DB.Find(&methods)
	c.JSON(http.StatusOK, gin.H{"data": methods})
}

// Create a new payment method
func CreatePaymentMethod(c *gin.Context) {
	var input struct {
		Name           string `json:"name" binding:"required"`
		Status         string `json:"status"`
		ShowInPurchase bool   `json:"show_in_purchase"`
		ShowInSales    bool   `json:"show_in_sales"`
		OutletID       uint   `json:"outlet_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := "Active"
	if input.Status != "" {
		status = input.Status
	}

	method := models.PaymentMethod{
		Name:           input.Name,
		Status:         status,
		ShowInPurchase: input.ShowInPurchase,
		ShowInSales:    input.ShowInSales,
		OutletID:       input.OutletID,
		Audit: models.Audit{
			CreatedBy: c.MustGet("userID").(uint),
		},
	}
	if err := config.DB.Create(&method).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment method"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": method})
}

// Update a payment method
func UpdatePaymentMethod(c *gin.Context) {
	var method models.PaymentMethod
	if err := config.DB.Where("id = ?", c.Param("id")).First(&method).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	var input struct {
		Name           string `json:"name"`
		Status         string `json:"status"`
		ShowInPurchase *bool  `json:"show_in_purchase"`
		ShowInSales    *bool  `json:"show_in_sales"`
		OutletID       uint   `json:"outlet_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Use map for updates to handle boolean false values and 0 IDs correctly
	updates := make(map[string]interface{})
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Status != "" {
		updates["status"] = input.Status
	}
	if input.ShowInPurchase != nil {
		updates["show_in_purchase"] = *input.ShowInPurchase
	}
	if input.ShowInSales != nil {
		updates["show_in_sales"] = *input.ShowInSales
	}
	if input.OutletID != 0 {
		updates["outlet_id"] = input.OutletID
	}

	userID, _ := c.Get("userID")
	updates["updated_by"] = userID.(uint)

	if err := config.DB.Model(&method).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment method"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": method})
}

// Delete a payment method
func DeletePaymentMethod(c *gin.Context) {
	var method models.PaymentMethod
	if err := config.DB.Where("id = ?", c.Param("id")).First(&method).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	userID, _ := c.Get("userID")
	config.DB.Model(&method).Update("deleted_by", userID)
	config.DB.Delete(&method)
	c.JSON(http.StatusOK, gin.H{"data": true})
}
