package main

import (
	"log"
	"os"
	"time"

	"bizkit-api/config"
	"bizkit-api/controllers"
	"bizkit-api/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	// Connect to Database
	config.ConnectDatabase()

	// Initialize Gin app
	r := gin.Default()

	// Configure CORS (SUDAH DIPERBAIKI UNTUK VERCEL)
	r.Use(cors.New(cors.Config{
		// AllowOriginFunc digunakan agar mengizinkan request dari domain manapun (Vercel/Localhost)
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Auth routes (Phase 1)
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", controllers.Login)
	}

	// Protected routes group
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/ping", func(c *gin.Context) {
			userID, _ := c.Get("userID")
			role, _ := c.Get("role")
			c.JSON(200, gin.H{
				"message": "pong",
				"user_id": userID,
				"role":    role,
			})
		})

		api.HEAD("/ping", func(c *gin.Context) {
			c.Status(200)
		})

		// Master Data Routes
		master := api.Group("/master")
		{
			// Categories
			master.GET("/categories", controllers.GetCategories)
			master.POST("/categories", controllers.CreateCategory)
			master.PUT("/categories/:id", controllers.UpdateCategory)
			master.DELETE("/categories/:id", controllers.DeleteCategory)

			// Brands
			master.GET("/brands", controllers.GetBrands)
			master.POST("/brands", controllers.CreateBrand)
			master.PUT("/brands/:id", controllers.UpdateBrand)
			master.DELETE("/brands/:id", controllers.DeleteBrand)

			// Units
			master.GET("/units", controllers.GetUnits)
			master.POST("/units", controllers.CreateUnit)
			master.PUT("/units/:id", controllers.UpdateUnit)
			master.DELETE("/units/:id", controllers.DeleteUnit)

			// Products
			master.GET("/products", controllers.GetProducts)
			master.POST("/products", controllers.CreateProduct)
			master.PUT("/products/:id", controllers.UpdateProduct)
			master.DELETE("/products/:id", controllers.DeleteProduct)

			// Price Categories
			master.GET("/price-categories", controllers.GetPriceCategories)
			master.POST("/price-categories", controllers.CreatePriceCategory)
			master.PUT("/price-categories/:id", controllers.UpdatePriceCategory)
			master.DELETE("/price-categories/:id", controllers.DeletePriceCategory)

			// Variants
			master.GET("/variants", controllers.GetVariants)
			master.POST("/variants", controllers.CreateVariant)
			master.PUT("/variants/:id", controllers.UpdateVariant)
			master.DELETE("/variants/:id", controllers.DeleteVariant)

			// Payment Methods
			master.GET("/payment-methods", controllers.GetPaymentMethods)
			master.POST("/payment-methods", controllers.CreatePaymentMethod)
			master.PUT("/payment-methods/:id", controllers.UpdatePaymentMethod)
			master.DELETE("/payment-methods/:id", controllers.DeletePaymentMethod)
		}

		// Users
		users := api.Group("/users")
		{
			users.GET("", controllers.GetUsers)
			users.POST("", controllers.CreateUser)
			users.PUT("/:id", controllers.UpdateUser)
			users.DELETE("/:id", controllers.DeleteUser)
			users.PUT("/:id/reset-password", controllers.ResetPassword)
		}

		// Promotions
		promotions := api.Group("/promotions")
		{
			promotions.GET("", controllers.GetPromotions)
			promotions.POST("", controllers.CreatePromotion)
			promotions.PUT("/:id", controllers.UpdatePromotion)
			promotions.DELETE("/:id", controllers.DeletePromotion)
		}

		// Shifts
		shifts := api.Group("/shifts")
		{
			shifts.GET("", controllers.GetShifts)
			shifts.POST("", controllers.CreateShift)
		}

		// Attendances
		attendances := api.Group("/attendances")
		{
			attendances.GET("", controllers.GetAttendances)
			attendances.POST("", controllers.CreateAttendance)
			attendances.PUT("/:id", controllers.UpdateAttendance)
		}

		// Reports
		reports := api.Group("/reports")
		{
			reports.GET("/sales", controllers.GetSalesReport)
			reports.GET("/trend", controllers.GetTrendReport)
			reports.GET("/history", controllers.GetSalesHistory)
		}

		// Roles
		roles := api.Group("/roles")
		{
			roles.GET("", controllers.GetRoles)
			roles.GET("/", controllers.GetRoles)
			roles.POST("", controllers.CreateRole)
			roles.POST("/", controllers.CreateRole)
			roles.PUT("/:id", controllers.UpdateRole)
			roles.DELETE("/:id", controllers.DeleteRole)
		}

		// Outlets
		api.GET("/outlets", controllers.GetOutlets)

		// Settings
		api.GET("/settings", controllers.GetSettings)
		api.POST("/settings", controllers.UpdateSettings)
	}

	// Serve uploaded files
	r.Static("/uploads", "./uploads")

	// Run server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // Default port if not specified
	}
	r.Run(":" + port)
}
