package controllers

import (
	"net/http"
	"strings"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Get all users
func GetUsers(c *gin.Context) {
	var users []models.User
	config.DB.Preload("Role").Preload("Outlet").Find(&users)
	c.JSON(http.StatusOK, gin.H{"data": users})
}

// Create a new user
func CreateUser(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email"`
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		RoleID   uint   `json:"role_id"`
		OutletID uint   `json:"outlet_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.RoleID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role is required"})
		return
	}
	if input.OutletID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Outlet is required"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Username: input.Username,
		Password: string(hashedPassword),
		RoleID:   input.RoleID,
		OutletID: input.OutletID,
		Audit: models.Audit{
			CreatedBy: c.MustGet("userID").(uint),
		},
	}

	if err := config.DB.Create(&user).Error; err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") && strings.Contains(err.Error(), "users.idx_users_username") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username sudah digunakan, silakan pilih username lain."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
		return
	}

	config.DB.Preload("Role").Preload("Outlet").First(&user, user.ID)
	c.JSON(http.StatusCreated, gin.H{"data": user})
}

// Update a user
func UpdateUser(c *gin.Context) {
	var user models.User
	if err := config.DB.Where("id = ?", c.Param("id")).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Username string `json:"username"`
		Password string `json:"password"`
		RoleID   uint   `json:"role_id"`
		OutletID uint   `json:"outlet_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Email != "" {
		updates["email"] = input.Email
	}
	if input.Username != "" {
		updates["username"] = input.Username
	}
	if input.RoleID != 0 {
		updates["role_id"] = input.RoleID
	}
	if input.OutletID != 0 {
		updates["outlet_id"] = input.OutletID
	}
	if input.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		updates["password"] = string(hashedPassword)
	}

	userID, _ := c.Get("userID")
	updates["updated_by"] = userID.(uint)

	if err := config.DB.Model(&user).Updates(updates).Error; err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") && strings.Contains(err.Error(), "users.idx_users_username") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username sudah digunakan, silakan pilih username lain."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	config.DB.Preload("Role").Preload("Outlet").First(&user, user.ID)
	c.JSON(http.StatusOK, gin.H{"data": user})
}

// Delete a user
func DeleteUser(c *gin.Context) {
	var user models.User
	if err := config.DB.Where("id = ?", c.Param("id")).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	userID, _ := c.Get("userID")
	config.DB.Model(&user).Update("deleted_by", userID)
	config.DB.Delete(&user)
	c.JSON(http.StatusOK, gin.H{"data": true})
}

// Reset user password
func ResetPassword(c *gin.Context) {
	var user models.User
	if err := config.DB.Where("id = ?", c.Param("id")).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	var input struct {
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	userID, _ := c.Get("userID")
	if err := config.DB.Model(&user).Updates(map[string]interface{}{
		"password":   string(hashedPassword),
		"updated_by": userID.(uint),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil direset"})
}
