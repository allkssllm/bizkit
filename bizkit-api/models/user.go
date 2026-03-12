package models

import (
	"time"

	"gorm.io/gorm"
)

type Role struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"type:varchar(50);uniqueIndex" json:"name"`
	Permissions string         `gorm:"type:text" json:"permissions"` // JSON string representation
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Audit
}

type Outlet struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"type:varchar(100)" json:"name"`
	Logo      string         `gorm:"type:text" json:"logo"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Audit
}

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"type:varchar(100)" json:"name"`
	Email     string         `gorm:"type:varchar(100)" json:"email"`
	Username  string         `gorm:"type:varchar(50);uniqueIndex" json:"username"`
	Password  string         `gorm:"type:varchar(255)" json:"-"` // Don't expose password in JSON
	OutletID  uint           `json:"outlet_id"`
	RoleID    uint           `json:"role_id"`
	Outlet    Outlet         `gorm:"foreignKey:OutletID" json:"outlet"`
	Role      Role           `gorm:"foreignKey:RoleID" json:"role"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Audit
}
