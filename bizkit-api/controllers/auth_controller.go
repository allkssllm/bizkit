package controllers

import (
	"net/http"

	"bizkit-api/config"
	"bizkit-api/dtos"
	"bizkit-api/models"
	"bizkit-api/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Login(c *gin.Context) {
	var req dtos.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	// Using Preload to get Role data for the token payload
	if err := config.DB.Preload("Role").Preload("Outlet").Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	token, err := utils.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	var res dtos.LoginResponse
	res.Token = token
	res.User.ID = user.ID
	res.User.Username = user.Username
	res.User.Role.Name = user.Role.Name
	res.User.Role.Permissions = user.Role.Permissions
	res.User.OutletName = user.Outlet.Name

	c.JSON(http.StatusOK, res)
}
