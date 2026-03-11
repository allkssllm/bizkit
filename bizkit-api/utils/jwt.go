package utils

import (
	"errors"
	"os"
	"time"

	"bizkit-api/models"

	"github.com/golang-jwt/jwt/v5"
)

func getJwtKey() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "super_secret_bizkit_key"
	}
	return []byte(secret)
}

type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(user models.User) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJwtKey())
}

func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return getJwtKey(), nil
	})
	if err != nil {
		if err == jwt.ErrSignatureInvalid {
			return nil, errors.New("invalid signature")
		}
		return nil, errors.New("invalid token")
	}
	if !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
