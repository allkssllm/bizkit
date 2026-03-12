package models

import (
	"time"

	"gorm.io/gorm"
)

type Attendance struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	UserID       uint           `json:"user_id"`
	User         User           `gorm:"foreignKey:UserID" json:"user"`
	Photo        string         `gorm:"type:text" json:"photo"` // Path/URL foto absensi
	CheckInTime  *time.Time     `json:"check_in_time"`          // Waktu check-in
	CheckOutTime *time.Time     `json:"check_out_time"`         // Waktu check-out
	Date         time.Time      `gorm:"type:date" json:"date"`  // Tanggal absensi
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	Audit
}
