package handlers

import (
	"fmt"
	"log"
	"mime"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"wedding-backend/internal/middleware"
	"wedding-backend/internal/models"
	"wedding-backend/internal/storage"
	"wedding-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WishHandler struct {
	db     *gorm.DB
	store  storage.Store
	misses *middleware.Limiter
}

// misses is the guest handler's wrong-code counter, so an RSVP can't be used
// to guess guest codes either.
func NewWishHandler(db *gorm.DB, store storage.Store, misses *middleware.Limiter) *WishHandler {
	return &WishHandler{db: db, store: store, misses: misses}
}

// JSON, or multipart when the guest attaches a photo
type createWishRequest struct {
	Name       string                  `json:"name" form:"name" binding:"required"`
	Attendance models.AttendanceStatus `json:"attendance" form:"attendance" binding:"required"`
	GuestCount int                     `json:"guest_count" form:"guest_count"`
	Message    string                  `json:"message" form:"message"`
	// personal-link code, so the RSVP shows up against the guest in the admin list
	GuestCode string `json:"guest_code" form:"guest_code"`
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
	if err := c.ShouldBind(&req); err != nil {
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
	// the photo is optional; a missing file just means a text-only wish
	if file, err := c.FormFile("photo"); err == nil {
		url, status, msg := h.savePhoto(c, file)
		if msg != "" {
			utils.Error(c, status, msg)
			return
		}
		wish.PhotoURL = url
	}
	if err := h.db.Create(&wish).Error; err != nil {
		utils.Error(c, 500, "failed to submit rsvp")
		return
	}

	utils.Success(c, 201, wish)
}

// same budget as gift receipts; the client shrinks photos under Vercel's ~4.5MB body cap
func (h *WishHandler) savePhoto(c *gin.Context, file *multipart.FileHeader) (string, int, string) {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !proofExt[ext] {
		return "", http.StatusBadRequest, "unsupported file type"
	}
	if file.Size > maxProofSize {
		return "", http.StatusBadRequest, "file too large (max 5MB)"
	}
	src, err := file.Open()
	if err != nil {
		return "", http.StatusBadRequest, "failed to read file"
	}
	defer src.Close()

	filename := fmt.Sprintf("wish_%s_%d%s", uuid.NewString(), time.Now().Unix(), ext)
	url, err := h.store.Save(c.Request.Context(), filename, mime.TypeByExtension(ext), src)
	if err != nil {
		log.Printf("wish photo upload failed: %v", err)
		return "", http.StatusInternalServerError, "failed to save photo"
	}
	return url, 0, ""
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
