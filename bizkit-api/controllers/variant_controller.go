package controllers

import (
	"net/http"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// Get all variants
func GetVariants(c *gin.Context) {
	var variants []models.Variant
	config.DB.Preload("Options").Find(&variants)
	c.JSON(http.StatusOK, gin.H{"data": variants})
}

// Create a new variant
func CreateVariant(c *gin.Context) {
	var input struct {
		Name        string                 `json:"name" binding:"required"`
		Description string                 `json:"description"`
		MinChoice   int                    `json:"min_choice"`
		MaxChoice   int                    `json:"max_choice"`
		Status      string                 `json:"status"`
		Options     []models.VariantOption `json:"options"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := "Active"
	if input.Status != "" {
		status = input.Status
	}

	variant := models.Variant{
		Name:        input.Name,
		Description: input.Description,
		MinChoice:   input.MinChoice,
		MaxChoice:   input.MaxChoice,
		Status:      status,
		Options:     input.Options,
	}
	if err := config.DB.Create(&variant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create variant"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": variant})
}

// Update a variant
func UpdateVariant(c *gin.Context) {
	var variant models.Variant
	if err := config.DB.Where("id = ?", c.Param("id")).First(&variant).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	var input struct {
		Name        string                 `json:"name"`
		Description string                 `json:"description"`
		MinChoice   int                    `json:"min_choice"`
		MaxChoice   int                    `json:"max_choice"`
		Status      string                 `json:"status"`
		Options     []models.VariantOption `json:"options"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Begin transaction to safely update variant and replace options
	tx := config.DB.Begin()

	if err := tx.Model(&variant).Updates(map[string]interface{}{
		"name":        input.Name,
		"description": input.Description,
		"min_choice":  input.MinChoice,
		"max_choice":  input.MaxChoice,
		"status":      input.Status,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update variant details"})
		return
	}

	// Delete old options permanently or soft delete
	if err := tx.Where("variant_id = ?", variant.ID).Delete(&models.VariantOption{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clean old options"})
		return
	}

	// Insert new options
	for _, opt := range input.Options {
		newOpt := models.VariantOption{
			VariantID: variant.ID,
			Name:      opt.Name,
			PriceAdd:  opt.PriceAdd,
		}
		if err := tx.Create(&newOpt).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save nested option"})
			return
		}
	}

	tx.Commit()

	// Reload with options
	config.DB.Preload("Options").Where("id = ?", variant.ID).First(&variant)

	c.JSON(http.StatusOK, gin.H{"data": variant})
}

// Delete a variant
func DeleteVariant(c *gin.Context) {
	var variant models.Variant
	if err := config.DB.Where("id = ?", c.Param("id")).First(&variant).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	// Also delete variant options
	config.DB.Where("variant_id = ?", variant.ID).Delete(&models.VariantOption{})
	config.DB.Delete(&variant)

	c.JSON(http.StatusOK, gin.H{"data": true})
}
