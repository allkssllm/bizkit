package controllers

import (
	"net/http"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// Get all brands
func GetBrands(c *gin.Context) {
	var brands []models.Brand
	config.DB.Find(&brands)
	c.JSON(http.StatusOK, gin.H{"data": brands})
}

// Create a new brand
func CreateBrand(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	brand := models.Brand{Name: input.Name}
	if err := config.DB.Create(&brand).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create brand"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": brand})
}

// Update a brand
func UpdateBrand(c *gin.Context) {
	var brand models.Brand
	if err := config.DB.Where("id = ?", c.Param("id")).First(&brand).Error; err != nil {
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

	if err := config.DB.Model(&brand).Updates(models.Brand{Name: input.Name}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update brand"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": brand})
}

// Delete a brand
func DeleteBrand(c *gin.Context) {
	var brand models.Brand
	if err := config.DB.Where("id = ?", c.Param("id")).First(&brand).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	// Cek apakah merek masih dipakai oleh produk
	var count int64
	config.DB.Model(&models.Product{}).Where("brand_id = ?", brand.ID).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Merek tidak dapat dihapus karena sedang digunakan oleh produk!"})
		return
	}

	if err := config.DB.Delete(&brand).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus merek"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": true})
}
