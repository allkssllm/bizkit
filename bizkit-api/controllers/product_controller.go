package controllers

import (
	"net/http"

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
	var input struct {
		Name        string  `json:"name" binding:"required"`
		SKU         string  `json:"sku"`
		Description string  `json:"description"`
		Image       string  `json:"image"`
		CategoryID  uint    `json:"category_id" binding:"required"`
		BrandID     uint    `json:"brand_id" binding:"required"`
		UnitID      uint    `json:"unit_id" binding:"required"`
		Price       float64 `json:"price" binding:"required"`
		Status      string  `json:"status"`
		HasVariant  bool    `json:"has_variant"`
		IsFavorite  bool    `json:"is_favorite"`
		VariantIDs  []uint  `json:"variant_ids"`
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
	product := models.Product{
		Name:        input.Name,
		SKU:         input.SKU,
		Description: input.Description,
		Image:       input.Image,
		CategoryID:  input.CategoryID,
		BrandID:     input.BrandID,
		UnitID:      input.UnitID,
		Price:       input.Price,
		Status:      status,
		HasVariant:  input.HasVariant,
		IsFavorite:  input.IsFavorite,
		Audit: models.Audit{
			CreatedBy: userID.(uint),
		},
	}

	tx := config.DB.Begin()

	if err := tx.Create(&product).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	// Attach Variants if HasVariant is true
	if input.HasVariant && len(input.VariantIDs) > 0 {
		for _, vID := range input.VariantIDs {
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

	var input struct {
		Name        string  `json:"name"`
		SKU         string  `json:"sku"`
		Description string  `json:"description"`
		Image       string  `json:"image"`
		CategoryID  uint    `json:"category_id"`
		BrandID     uint    `json:"brand_id"`
		UnitID      uint    `json:"unit_id"`
		Price       float64 `json:"price"`
		Status      string  `json:"status"`
		HasVariant  bool    `json:"has_variant"`
		IsFavorite  bool    `json:"is_favorite"`
		VariantIDs  []uint  `json:"variant_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	tx := config.DB.Begin()

	updates := map[string]interface{}{
		"name":        input.Name,
		"sku":         input.SKU,
		"description": input.Description,
		"image":       input.Image,
		"category_id": input.CategoryID,
		"brand_id":    input.BrandID,
		"unit_id":     input.UnitID,
		"price":       input.Price,
		"has_variant": input.HasVariant,
		"is_favorite": input.IsFavorite,
		"updated_by":  userID.(uint),
	}
	if input.Status != "" {
		updates["status"] = input.Status
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

	if input.HasVariant && len(input.VariantIDs) > 0 {
		for _, vID := range input.VariantIDs {
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
