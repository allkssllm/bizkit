package controllers

import (
	"net/http"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// Get all price categories
func GetPriceCategories(c *gin.Context) {
	var priceCats []models.PriceCategory
	config.DB.Find(&priceCats)
	c.JSON(http.StatusOK, gin.H{"data": priceCats})
}

// Create a new price category
func CreatePriceCategory(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	priceCat := models.PriceCategory{Name: input.Name}
	if err := config.DB.Create(&priceCat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create price category"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": priceCat})
}

// Update a price category
func UpdatePriceCategory(c *gin.Context) {
	var priceCat models.PriceCategory
	if err := config.DB.Where("id = ?", c.Param("id")).First(&priceCat).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Model(&priceCat).Updates(models.PriceCategory{Name: input.Name}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update price category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": priceCat})
}

// Delete a price category
func DeletePriceCategory(c *gin.Context) {
	var priceCat models.PriceCategory
	if err := config.DB.Where("id = ?", c.Param("id")).First(&priceCat).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	config.DB.Delete(&priceCat)

	c.JSON(http.StatusOK, gin.H{"data": true})
}
