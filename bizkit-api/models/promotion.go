package models

import (
	"time"

	"gorm.io/gorm"
)

type Promotion struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	Name            string         `gorm:"type:varchar(255);not null" json:"name"`
	Type            string         `gorm:"type:varchar(50)" json:"type"`
	PromoTarget     string         `gorm:"type:varchar(100)" json:"promo_target"`
	ConditionType   string         `gorm:"type:varchar(100)" json:"condition_type"`
	MinQty          int            `gorm:"default:0" json:"min_qty"`
	Days            string         `gorm:"type:text" json:"days"`
	StartDate       time.Time      `json:"start_date"`
	EndDate         time.Time      `json:"end_date"`
	VoucherType     string         `gorm:"type:varchar(100)" json:"voucher_type"`
	MaxUsage        int            `gorm:"default:0" json:"max_usage"`
	Used            int            `gorm:"default:0" json:"used"`
	DetailCondition string         `gorm:"type:text" json:"detail_condition"`
	DetailPromo     string         `gorm:"type:text" json:"detail_promo"`
	Status          string         `gorm:"type:varchar(20);default:'Active'" json:"status"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	Audit
}
