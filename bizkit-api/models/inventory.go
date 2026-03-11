package models

import (
	"time"

	"gorm.io/gorm"
)

type Category struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"type:varchar(100);not null" json:"name"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Brand struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"type:varchar(100);not null" json:"name"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Unit struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"type:varchar(50);not null" json:"name"` // Pcs, Kg, Liter, etc.
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Product struct {
	ID          uint             `gorm:"primaryKey" json:"id"`
	Name        string           `gorm:"type:varchar(255);not null" json:"name"`
	SKU         string           `gorm:"type:varchar(100)" json:"sku"` // Kode Produk
	Description string           `gorm:"type:text" json:"description"` // Deskripsi
	Image       string           `gorm:"type:text" json:"image"`       // Upload Gambar Produk
	CategoryID  uint             `json:"category_id"`
	BrandID     uint             `json:"brand_id"`
	UnitID      uint             `json:"unit_id"`
	Price       float64          `gorm:"type:decimal(10,2);not null" json:"price"`
	Status      string           `gorm:"type:enum('Active', 'Inactive');default:'Active'" json:"status"`
	HasVariant  bool             `gorm:"default:false" json:"has_variant"` // Checkbox Varian
	IsFavorite  bool             `gorm:"default:false" json:"is_favorite"` // Tampil Penjualan di Bagus'in
	Category    Category         `gorm:"foreignKey:CategoryID" json:"category"`
	Brand       Brand            `gorm:"foreignKey:BrandID" json:"brand"`
	Unit        Unit             `gorm:"foreignKey:UnitID" json:"unit"`
	Variants    []ProductVariant `gorm:"foreignKey:ProductID" json:"variants"`
	Prices      []ProductPrice   `gorm:"foreignKey:ProductID" json:"product_prices"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	DeletedAt   gorm.DeletedAt   `gorm:"index" json:"-"`
}

type Variant struct {
	ID          uint            `gorm:"primaryKey" json:"id"`
	Name        string          `gorm:"type:varchar(100);not null" json:"name"` // e.g., Level Pedas
	Description string          `gorm:"type:text" json:"description"`
	MinChoice   int             `gorm:"default:0" json:"min_choice"`
	MaxChoice   int             `gorm:"default:1" json:"max_choice"`
	Status      string          `gorm:"type:enum('Active', 'Inactive');default:'Active'" json:"status"`
	Options     []VariantOption `gorm:"foreignKey:VariantID" json:"options"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	DeletedAt   gorm.DeletedAt  `gorm:"index" json:"-"`
}

// ProductVariant maps a Product to its chosen Variants (and potentially specific options if needed, but KasirKuliner usually binds the root Variant to the Product)
type ProductVariant struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	ProductID uint           `json:"product_id"`
	VariantID uint           `json:"variant_id"`
	Variant   Variant        `gorm:"foreignKey:VariantID" json:"variant"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type VariantOption struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	VariantID uint           `json:"variant_id"`
	Name      string         `gorm:"type:varchar(100);not null" json:"name"`
	PriceAdd  float64        `gorm:"type:decimal(10,2);default:0" json:"price_add"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type PriceCategory struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"type:varchar(100);not null" json:"name"` // e.g., Harga Gojek, Shopee
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type ProductPrice struct {
	ID              uint          `gorm:"primaryKey" json:"id"`
	ProductID       uint          `json:"product_id"`
	PriceCategoryID uint          `json:"price_category_id"`
	Price           float64       `gorm:"type:decimal(10,2);not null" json:"price"`
	PriceCategory   PriceCategory `gorm:"foreignKey:PriceCategoryID" json:"price_category"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
}
