package config

import (
	"log"
	"os"

	"bizkit-api/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	// e.g. root:password@tcp(127.0.0.1:3306)/bizkit?charset=utf8mb4&parseTime=True&loc=Local
	dsn := os.Getenv("DB_URL")
	if dsn == "" {
		dsn = "root:@tcp(127.0.0.1:3306)/bizkit?charset=utf8mb4&parseTime=True&loc=Local" // Default Laragon MySQL
	}

	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to database!", err)
	}

	err = database.AutoMigrate(
		&models.Role{},
		&models.Outlet{},
		&models.User{},
		&models.Category{},
		&models.Brand{},
		&models.Unit{},
		&models.Product{},
		&models.Variant{},
		&models.VariantOption{},
		&models.ProductVariant{},
		&models.PriceCategory{},
		&models.PaymentMethod{},
		&models.Order{},
		&models.OrderItem{},
		&models.Promotion{},
		&models.Shift{},
		&models.Attendance{},
	)
	if err != nil {
		log.Println("Migration error:", err)
	}

	DB = database
	SeedData()
}

func SeedData() {
	// Seed Roles
	var role models.Role
	if DB.Where("name = ?", "Owner").First(&role).Error != nil {
		role = models.Role{Name: "Owner", Permissions: `{"all": true}`}
		DB.Create(&role)
	}
	var superuserRole models.Role
	if DB.Where("name = ?", "Superuser").First(&superuserRole).Error != nil {
		superuserRole = models.Role{Name: "Superuser", Permissions: `{"all": true}`}
		DB.Create(&superuserRole)
	}
	var kasirRole models.Role
	if DB.Where("name = ?", "Kasir").First(&kasirRole).Error != nil {
		kasirRole = models.Role{Name: "Kasir", Permissions: `{"pos": true, "reports": true}`}
		DB.Create(&kasirRole)
	}

	// Seed Outlet
	var outlet models.Outlet
	if DB.Where("name = ?", "Dagashi").First(&outlet).Error != nil {
		outlet = models.Outlet{Name: "Dagashi"}
		DB.Create(&outlet)
	}

	// Seed User
	var user models.User
	if DB.Where("username = ?", "ownerdemo").First(&user).Error != nil {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("ownerdemo"), bcrypt.DefaultCost)
		user = models.User{
			Username: "ownerdemo",
			Password: string(hashedPassword),
			RoleID:   role.ID,
			OutletID: outlet.ID,
		}
		DB.Create(&user)
	}

	// Seed Payment Methods
	paymentMethods := []string{"Tunai", "QRIS"}
	for _, pm := range paymentMethods {
		var method models.PaymentMethod
		if DB.Where("name = ?", pm).First(&method).Error != nil {
			DB.Create(&models.PaymentMethod{Name: pm})
		}
	}
}
