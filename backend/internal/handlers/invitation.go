package handlers

import (
	"strconv"

	"wedding-backend/internal/models"
	"wedding-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type InvitationHandler struct {
	db *gorm.DB
}

func NewInvitationHandler(db *gorm.DB) *InvitationHandler {
	return &InvitationHandler{db: db}
}

type invitationResponse struct {
	Settings models.Settings      `json:"settings"`
	Story    []models.StoryEvent  `json:"story"`
	Gallery  []models.GalleryImage `json:"gallery"`
}

func (h *InvitationHandler) GetInvitation(c *gin.Context) {
	var settings models.Settings
	if err := h.db.First(&settings).Error; err != nil {
		utils.Error(c, 404, "settings not found")
		return
	}

	var story []models.StoryEvent
	h.db.Order("sort_order asc").Find(&story)

	var gallery []models.GalleryImage
	h.db.Order("sort_order asc").Find(&gallery)

	utils.Success(c, 200, invitationResponse{
		Settings: settings,
		Story:    story,
		Gallery:  gallery,
	})
}

func (h *InvitationHandler) UpdateSettings(c *gin.Context) {
	var settings models.Settings
	if err := h.db.First(&settings).Error; err != nil {
		utils.Error(c, 404, "settings not found")
		return
	}

	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.Error(c, 400, "invalid request body")
		return
	}
	// id must never be overwritten from client payload
	delete(payload, "id")
	delete(payload, "ID")
	delete(payload, "created_at")
	delete(payload, "CreatedAt")

	if err := h.db.Model(&settings).Updates(payload).Error; err != nil {
		utils.Error(c, 500, "failed to update settings")
		return
	}

	h.db.First(&settings)
	utils.Success(c, 200, settings)
}

// ---- Story events ----

func (h *InvitationHandler) ListStory(c *gin.Context) {
	var story []models.StoryEvent
	h.db.Order("sort_order asc").Find(&story)
	utils.Success(c, 200, story)
}

func (h *InvitationHandler) CreateStory(c *gin.Context) {
	var item models.StoryEvent
	if err := c.ShouldBindJSON(&item); err != nil {
		utils.Error(c, 400, "invalid request body")
		return
	}
	if err := h.db.Create(&item).Error; err != nil {
		utils.Error(c, 500, "failed to create story event")
		return
	}
	utils.Success(c, 201, item)
}

func (h *InvitationHandler) UpdateStory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	var item models.StoryEvent
	if err := h.db.First(&item, id).Error; err != nil {
		utils.Error(c, 404, "story event not found")
		return
	}
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.Error(c, 400, "invalid request body")
		return
	}
	delete(payload, "id")
	delete(payload, "ID")
	h.db.Model(&item).Updates(payload)
	utils.Success(c, 200, item)
}

func (h *InvitationHandler) DeleteStory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	if err := h.db.Delete(&models.StoryEvent{}, id).Error; err != nil {
		utils.Error(c, 500, "failed to delete story event")
		return
	}
	utils.Success(c, 200, gin.H{"deleted": id})
}

// ---- Gallery ----

func (h *InvitationHandler) ListGallery(c *gin.Context) {
	var gallery []models.GalleryImage
	h.db.Order("sort_order asc").Find(&gallery)
	utils.Success(c, 200, gallery)
}

func (h *InvitationHandler) DeleteGalleryImage(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	if err := h.db.Delete(&models.GalleryImage{}, id).Error; err != nil {
		utils.Error(c, 500, "failed to delete gallery image")
		return
	}
	utils.Success(c, 200, gin.H{"deleted": id})
}
