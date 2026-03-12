package controllers

import (
	"net/http"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// Get all units
func GetUnits(c *gin.Context) {
	var units []models.Unit
	config.DB.Find(&units)
	c.JSON(http.StatusOK, gin.H{"data": units})
}

// Create a new unit
func CreateUnit(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	unit := models.Unit{
		Name: input.Name,
		Audit: models.Audit{
			CreatedBy: userID.(uint),
		},
	}
	if err := config.DB.Create(&unit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create unit"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": unit})
}

// Update a unit
func UpdateUnit(c *gin.Context) {
	var unit models.Unit
	if err := config.DB.Where("id = ?", c.Param("id")).First(&unit).Error; err != nil {
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

	userID, _ := c.Get("userID")
	if err := config.DB.Model(&unit).Updates(models.Unit{
		Name: input.Name,
		Audit: models.Audit{
			UpdatedBy: userID.(uint),
		},
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update unit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": unit})
}

// Delete a unit
func DeleteUnit(c *gin.Context) {
	var unit models.Unit
	if err := config.DB.Where("id = ?", c.Param("id")).First(&unit).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	// Cek apakah satuan masih dipakai oleh produk
	var count int64
	config.DB.Model(&models.Product{}).Where("unit_id = ?", unit.ID).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Satuan tidak dapat dihapus karena sedang digunakan oleh produk!"})
		return
	}

	userID, _ := c.Get("userID")
	config.DB.Model(&unit).Update("deleted_by", userID)
	if err := config.DB.Delete(&unit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus satuan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": true})
}
