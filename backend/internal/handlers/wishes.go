package handlers

import (
	"strconv"
	"strings"
	"unicode/utf8"

	"wedding-backend/internal/middleware"
	"wedding-backend/internal/models"
	"wedding-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WishHandler struct {
	db     *gorm.DB
	misses *middleware.Limiter
}

// misses is the guest handler's wrong-code counter, so an RSVP can't be used
// to guess guest codes either.
func NewWishHandler(db *gorm.DB, misses *middleware.Limiter) *WishHandler {
	return &WishHandler{db: db, misses: misses}
}

type createWishRequest struct {
	Name       string                  `json:"name" binding:"required"`
	Attendance models.AttendanceStatus `json:"attendance" binding:"required"`
	GuestCount int                     `json:"guest_count"`
	Message    string                  `json:"message"`
	// personal-link code, so the RSVP shows up against the guest in the admin list
	GuestCode string `json:"guest_code"`
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
		Guests     int64
	}
	h.db.Model(&models.Wish{}).Where("attendance = ?", models.AttendanceHadir).Count(&summary.Hadir)
	h.db.Model(&models.Wish{}).Where("attendance = ?", models.AttendanceTidakHadir).Count(&summary.TidakHadir)
	h.db.Model(&models.Wish{}).Where("attendance = ?", models.AttendanceRagu).Count(&summary.Ragu)
	// headcount of confirmed guests, so the dashboard doesn't have to page every RSVP
	h.db.Model(&models.Wish{}).Where("attendance = ?", models.AttendanceHadir).
		Select("COALESCE(SUM(guest_count), 0)").Scan(&summary.Guests)

	utils.Success(c, 200, gin.H{
		"items": wishes,
		"total": total,
		"page":  page,
		"limit": limit,
		"summary": gin.H{
			"hadir":       summary.Hadir,
			"tidak_hadir": summary.TidakHadir,
			"masih_ragu":  summary.Ragu,
			"guests":      summary.Guests,
		},
	})
}

func (h *WishHandler) CreateWish(c *gin.Context) {
	var req createWishRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, 400, "name and attendance are required")
		return
	}

	req.Name = strings.Join(strings.Fields(req.Name), " ")
	if n := utf8.RuneCountInString(req.Name); n < 2 || n > 100 || utf8.RuneCountInString(req.Message) > 500 {
		utils.Error(c, 400, "name must be 2-100 characters and message at most 500")
		return
	}
	if req.GuestCount < 0 || req.GuestCount > 10 {
		utils.Error(c, 400, "invalid guest count")
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
	if req.GuestCode != "" {
		// a wrong code still saves the RSVP, just not against any guest
		if guest, ok := lookupByCode(h.db, h.misses, c.ClientIP(), req.GuestCode); ok {
			wish.GuestID = &guest.ID
			// the name on the guest list, not whatever the request claims
			wish.Name = guest.Name
		}
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
