package models

import (
	"time"

	"gorm.io/gorm"
)

type Shift struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `json:"user_id"`
	User        User           `gorm:"foreignKey:UserID" json:"user"`
	Description string         `gorm:"type:text" json:"description"`                   // Uraian transaksi kas
	Type        string         `gorm:"type:varchar(20)" json:"type"`                   // masuk / keluar
	AmountIn    float64        `gorm:"type:decimal(12,2);default:0" json:"amount_in"`  // Nominal uang masuk
	AmountOut   float64        `gorm:"type:decimal(12,2);default:0" json:"amount_out"` // Nominal uang keluar
	Balance     float64        `gorm:"type:decimal(12,2);default:0" json:"balance"`    // Saldo akhir kas
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
