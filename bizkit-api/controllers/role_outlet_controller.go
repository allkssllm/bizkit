package controllers

import (
	"net/http"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// Get all roles
func GetRoles(c *gin.Context) {
	var roles []models.Role
	config.DB.Find(&roles)
	c.JSON(http.StatusOK, gin.H{"data": roles})
}

// Create a new role
func CreateRole(c *gin.Context) {
	var input struct {
		Name        string `json:"name" binding:"required"`
		Permissions string `json:"permissions"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := models.Role{
		Name:        input.Name,
		Permissions: input.Permissions,
	}

	if err := config.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create role"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": role})
}

// Update a role
func UpdateRole(c *gin.Context) {
	var role models.Role
	if err := config.DB.Where("id = ?", c.Param("id")).First(&role).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	var input struct {
		Name        string `json:"name"`
		Permissions string `json:"permissions"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Permissions != "" {
		updates["permissions"] = input.Permissions
	}

	if err := config.DB.Model(&role).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": role})
}

// Delete a role
func DeleteRole(c *gin.Context) {
	var role models.Role
	if err := config.DB.Where("id = ?", c.Param("id")).First(&role).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	config.DB.Delete(&role)

	c.JSON(http.StatusOK, gin.H{"data": true})
}

// Get all outlets
func GetOutlets(c *gin.Context) {
	var outlets []models.Outlet
	config.DB.Find(&outlets)
	c.JSON(http.StatusOK, gin.H{"data": outlets})
}
