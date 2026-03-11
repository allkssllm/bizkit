package controllers

import (
	"net/http"
	"time"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// Get attendances with optional date filtering
func GetAttendances(c *gin.Context) {
	var attendances []models.Attendance
	query := config.DB.Preload("User")

	// Optional date filter
	date := c.Query("date")
	if date != "" {
		query = query.Where("date = ?", date)
	}

	query.Order("date DESC, check_in_time DESC").Find(&attendances)
	c.JSON(http.StatusOK, gin.H{"data": attendances})
}

// Create a new attendance (check-in)
func CreateAttendance(c *gin.Context) {
	var input struct {
		UserID uint   `json:"user_id" binding:"required"`
		Photo  string `json:"photo"`
		Date   string `json:"date" binding:"required"` // YYYY-MM-DD
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	date, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	now := time.Now()
	attendance := models.Attendance{
		UserID:      input.UserID,
		Photo:       input.Photo,
		CheckInTime: &now,
		Date:        date,
	}

	if err := config.DB.Create(&attendance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create attendance"})
		return
	}

	config.DB.Preload("User").First(&attendance, attendance.ID)
	c.JSON(http.StatusCreated, gin.H{"data": attendance})
}

// Update attendance (check-out)
func UpdateAttendance(c *gin.Context) {
	var attendance models.Attendance
	if err := config.DB.Where("id = ?", c.Param("id")).First(&attendance).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	now := time.Now()
	if err := config.DB.Model(&attendance).Update("check_out_time", now).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update attendance"})
		return
	}

	config.DB.Preload("User").First(&attendance, attendance.ID)
	c.JSON(http.StatusOK, gin.H{"data": attendance})
}
