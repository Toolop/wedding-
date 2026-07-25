package handlers

import (
	"time"

	"wedding-backend/internal/config"
	"wedding-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, 400, "username and password are required")
		return
	}

	if req.Username != h.cfg.AdminUsername || req.Password != h.cfg.AdminPassword {
		utils.Error(c, 401, "invalid username or password")
		return
	}

	claims := jwt.MapClaims{
		"sub": req.Username,
		"exp": time.Now().Add(24 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(h.cfg.JWTSecret))
	if err != nil {
		utils.Error(c, 500, "failed to generate token")
		return
	}

	utils.Success(c, 200, gin.H{"token": signed})
}
