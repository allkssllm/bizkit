package models

import (
	"time"

	"gorm.io/gorm"
)

type PaymentMethod struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Name           string         `gorm:"type:varchar(100);not null" json:"name"`
	Status         string         `gorm:"type:varchar(20);default:'Active'" json:"status"`
	ShowInPurchase bool           `gorm:"default:true" json:"show_in_purchase"`
	ShowInSales    bool           `gorm:"default:true" json:"show_in_sales"`
	OutletID       uint           `json:"outlet_id"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
	Audit
}

type Order struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	OrderNumber     string         `gorm:"type:varchar(50);uniqueIndex" json:"order_number"`
	UserID          uint           `json:"user_id"`
	User            User           `gorm:"foreignKey:UserID" json:"user"`
	OutletID        uint           `json:"outlet_id"`
	Outlet          Outlet         `gorm:"foreignKey:OutletID" json:"outlet"`
	CustomerName    string         `gorm:"type:varchar(100)" json:"customer_name"`
	PaymentMethodID uint           `json:"payment_method_id"`
	PaymentMethod   PaymentMethod  `gorm:"foreignKey:PaymentMethodID" json:"payment_method"`
	TotalQty        int            `json:"total_qty"`
	TotalAmount     float64        `gorm:"type:decimal(12,2)" json:"total_amount"`
	Discount        float64        `gorm:"type:decimal(12,2);default:0" json:"discount"`
	Status          string         `gorm:"type:varchar(20);default:'Completed'" json:"status"` // Completed, Cancelled
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	Audit
	Items           []OrderItem    `gorm:"foreignKey:OrderID" json:"items"`
}

type OrderItem struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	OrderID   uint           `json:"order_id"`
	ProductID uint           `json:"product_id"`
	Product   Product        `gorm:"foreignKey:ProductID" json:"product"`
	Qty       int            `json:"qty"`
	Price     float64        `gorm:"type:decimal(10,2)" json:"price"`
	Subtotal  float64        `gorm:"type:decimal(12,2)" json:"subtotal"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Audit
}
