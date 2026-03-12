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

	userID, _ := c.Get("userID")
	variant := models.Variant{
		Name:        input.Name,
		Description: input.Description,
		MinChoice:   input.MinChoice,
		MaxChoice:   input.MaxChoice,
		Status:      status,
		Options:     input.Options,
		Audit: models.Audit{
			CreatedBy: userID.(uint),
		},
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
	userID, _ := c.Get("userID")
	tx := config.DB.Begin()

	if err := tx.Model(&variant).Updates(map[string]interface{}{
		"name":        input.Name,
		"description": input.Description,
		"min_choice":  input.MinChoice,
		"max_choice":  input.MaxChoice,
		"status":      input.Status,
		"updated_by":  userID.(uint),
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update variant details"})
		return
	}

	if err := tx.Where("variant_id = ?", variant.ID).Delete(&models.VariantOption{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clean old options"})
		return
	}
	// (Note: DeletedBy for nested options skipped as they are hard deleted here or we can just delete)

	// Insert new options
	for _, opt := range input.Options {
		newOpt := models.VariantOption{
			VariantID: variant.ID,
			Name:      opt.Name,
			PriceAdd:  opt.PriceAdd,
			Audit: models.Audit{
				UpdatedBy: userID.(uint), // Or CreatedBy since it's a new record
			},
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
	userID, _ := c.Get("userID")
	config.DB.Model(&variant).Update("deleted_by", userID)
	config.DB.Delete(&variant)

	c.JSON(http.StatusOK, gin.H{"data": true})
}
