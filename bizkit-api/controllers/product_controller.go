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

// Get all products
func GetProducts(c *gin.Context) {
	var products []models.Product
	// Preload relationships to include Category, Brand, Unit
	config.DB.Preload("Category").Preload("Brand").Preload("Unit").Preload("Variants.Variant.Options").Find(&products)
	c.JSON(http.StatusOK, gin.H{"data": products})
}

// Create a new product
func CreateProduct(c *gin.Context) {
	// Parse Multipart Form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	name := c.PostForm("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	sku := c.PostForm("sku")
	description := c.PostForm("description")
	categoryID, _ := strconv.ParseUint(c.PostForm("category_id"), 10, 32)
	brandID, _ := strconv.ParseUint(c.PostForm("brand_id"), 10, 32)
	unitID, _ := strconv.ParseUint(c.PostForm("unit_id"), 10, 32)
	price, _ := strconv.ParseFloat(c.PostForm("price"), 64)
	status := c.PostForm("status")
	hasVariant := c.PostForm("has_variant") == "true"
	isFavorite := c.PostForm("is_favorite") == "true"

	var variantIDs []uint
	vIDs := c.PostFormArray("variant_ids")
	for _, vStr := range vIDs {
		vID, _ := strconv.ParseUint(vStr, 10, 32)
		variantIDs = append(variantIDs, uint(vID))
	}

	// Handle Image Upload
	imagePath := ""
	file, err := c.FormFile("image")
	if err == nil {
		os.MkdirAll("uploads", os.ModePerm)
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("prod_%d%s", time.Now().UnixMilli(), ext)
		imagePath = "/uploads/" + filename
		if err := c.SaveUploadedFile(file, "uploads/"+filename); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
	}

	if status == "" {
		status = "Active"
	}

	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := val.(uint)

	product := models.Product{
		Name:        name,
		SKU:         sku,
		Description: description,
		Image:       imagePath,
		CategoryID:  uint(categoryID),
		BrandID:     uint(brandID),
		UnitID:      uint(unitID),
		Price:       price,
		Status:      status,
		HasVariant:  hasVariant,
		IsFavorite:  isFavorite,
		Audit: models.Audit{
			CreatedBy: userID,
		},
	}

	tx := config.DB.Begin()

	if err := tx.Create(&product).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	// Attach Variants if HasVariant is true
	if hasVariant && len(variantIDs) > 0 {
		for _, vID := range variantIDs {
			pv := models.ProductVariant{
				ProductID: product.ID,
				VariantID: vID,
			}
			if err := tx.Create(&pv).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to attach variants: " + err.Error()})
				return
			}
		}
	}

	tx.Commit()

	// Preload the created object to return full data
	config.DB.Preload("Category").Preload("Brand").Preload("Unit").Preload("Variants.Variant").First(&product, product.ID)

	c.JSON(http.StatusCreated, gin.H{"data": product})
}

// Update a product
func UpdateProduct(c *gin.Context) {
	var product models.Product
	if err := config.DB.Where("id = ?", c.Param("id")).First(&product).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	// Parse Multipart Form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	name := c.PostForm("name")
	sku := c.PostForm("sku")
	description := c.PostForm("description")
	categoryID, _ := strconv.ParseUint(c.PostForm("category_id"), 10, 32)
	brandID, _ := strconv.ParseUint(c.PostForm("brand_id"), 10, 32)
	unitID, _ := strconv.ParseUint(c.PostForm("unit_id"), 10, 32)
	price, _ := strconv.ParseFloat(c.PostForm("price"), 64)
	status := c.PostForm("status")
	hasVariantStr := c.PostForm("has_variant")
	isFavoriteStr := c.PostForm("is_favorite")

	var variantIDs []uint
	vIDs := c.PostFormArray("variant_ids")
	for _, vStr := range vIDs {
		vID, _ := strconv.ParseUint(vStr, 10, 32)
		variantIDs = append(variantIDs, uint(vID))
	}

	// Handle Image Upload
	imagePath := product.Image
	file, err := c.FormFile("image")
	if err == nil {
		os.MkdirAll("uploads", os.ModePerm)
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("prod_%d%s", time.Now().UnixMilli(), ext)
		imagePath = "/uploads/" + filename
		if err := c.SaveUploadedFile(file, "uploads/"+filename); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
	}

	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := val.(uint)

	tx := config.DB.Begin()

	updates := map[string]interface{}{
		"name":        name,
		"sku":         sku,
		"description": description,
		"image":       imagePath,
		"category_id": uint(categoryID),
		"brand_id":    uint(brandID),
		"unit_id":     uint(unitID),
		"price":       price,
		"updated_by":  userID,
	}

	if hasVariantStr != "" {
		updates["has_variant"] = (hasVariantStr == "true")
	}
	if isFavoriteStr != "" {
		updates["is_favorite"] = (isFavoriteStr == "true")
	}
	if status != "" {
		updates["status"] = status
	}

	if err := tx.Model(&product).Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// Recreate Variants
	if err := tx.Unscoped().Where("product_id = ?", product.ID).Delete(&models.ProductVariant{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old variants: " + err.Error()})
		return
	}

	if (hasVariantStr == "true") && len(variantIDs) > 0 {
		for _, vID := range variantIDs {
			pv := models.ProductVariant{
				ProductID: product.ID,
				VariantID: vID,
			}
			if err := tx.Create(&pv).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to attach new variants: " + err.Error()})
				return
			}
		}
	}

	tx.Commit()

	// Preload the updated object to return full data
	config.DB.Preload("Category").Preload("Brand").Preload("Unit").Preload("Variants.Variant").First(&product, product.ID)

	c.JSON(http.StatusOK, gin.H{"data": product})
}

// Delete a product
func DeleteProduct(c *gin.Context) {
	var product models.Product
	if err := config.DB.Where("id = ?", c.Param("id")).First(&product).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Record not found!"})
		return
	}

	userID, _ := c.Get("userID")
	config.DB.Model(&product).Update("deleted_by", userID)
	config.DB.Delete(&product)

	c.JSON(http.StatusOK, gin.H{"data": true})
}
