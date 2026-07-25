package handlers

import (
	"strconv"

	"wedding-backend/internal/models"
	"wedding-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WishHandler struct {
	db *gorm.DB
}

func NewWishHandler(db *gorm.DB) *WishHandler {
	return &WishHandler{db: db}
}

type createWishRequest struct {
	Name       string                  `json:"name" binding:"required"`
	Attendance models.AttendanceStatus `json:"attendance" binding:"required"`
	GuestCount int                     `json:"guest_count"`
	Message    string                  `json:"message"`
}

func (h *WishHandler) ListWishes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var wishes []models.Wish
	var total int64
	h.db.Model(&models.Wish{}).Count(&total)
	h.db.Order("created_at desc").Offset((page - 1) * limit).Limit(limit).Find(&wishes)

	var summary struct {
		Hadir      int64
		TidakHadir int64
		Ragu       int64
	}
	h.db.Model(&models.Wish{}).Where("attendance = ?", models.AttendanceHadir).Count(&summary.Hadir)
	h.db.Model(&models.Wish{}).Where("attendance = ?", models.AttendanceTidakHadir).Count(&summary.TidakHadir)
	h.db.Model(&models.Wish{}).Where("attendance = ?", models.AttendanceRagu).Count(&summary.Ragu)

	utils.Success(c, 200, gin.H{
		"items": wishes,
		"total": total,
		"page":  page,
		"limit": limit,
		"summary": gin.H{
			"hadir":       summary.Hadir,
			"tidak_hadir": summary.TidakHadir,
			"masih_ragu":  summary.Ragu,
		},
	})
}

func (h *WishHandler) CreateWish(c *gin.Context) {
	var req createWishRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, 400, "name and attendance are required")
		return
	}

	if req.Attendance != models.AttendanceHadir &&
		req.Attendance != models.AttendanceTidakHadir &&
		req.Attendance != models.AttendanceRagu {
		utils.Error(c, 400, "invalid attendance value")
		return
	}

	wish := models.Wish{
		Name:       req.Name,
		Attendance: req.Attendance,
		GuestCount: req.GuestCount,
		Message:    req.Message,
	}
	if err := h.db.Create(&wish).Error; err != nil {
		utils.Error(c, 500, "failed to submit rsvp")
		return
	}

	utils.Success(c, 201, wish)
}

func (h *WishHandler) DeleteWish(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	if err := h.db.Delete(&models.Wish{}, id).Error; err != nil {
		utils.Error(c, 500, "failed to delete wish")
		return
	}
	utils.Success(c, 200, gin.H{"deleted": id})
}
