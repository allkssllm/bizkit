package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// Get current outlet settings
func GetSettings(c *gin.Context) {
	var outlet models.Outlet
	// Get the first outlet as the main one
	if err := config.DB.First(&outlet).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No outlet found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": outlet})
}

// Update outlet settings (logo upload)
func UpdateSettings(c *gin.Context) {
	var outlet models.Outlet
	if err := config.DB.First(&outlet).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No outlet found"})
		return
	}

	// Handle file upload
	file, err := c.FormFile("logo")
	if err != nil {
		fmt.Println("FormFile error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No logo file provided: " + err.Error()})
		return
	}

	// Ensure uploads directory exists
	if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads directory"})
		return
	}

	// Save the file
	ext := filepath.Ext(file.Filename)
	filename := "logo_" + strconv.FormatInt(time.Now().UnixMilli(), 10) + ext
	savePath := "uploads/" + filename

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		fmt.Println("SaveUploadedFile error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save logo file: " + err.Error()})
		return
	}

	outlet.Logo = "/uploads/" + filename

	if err := config.DB.Save(&outlet).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": outlet, "message": "Pengaturan berhasil disimpan"})
}
