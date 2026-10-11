package handlers

import (
	"fmt"
	"log"
	"mime"
	"path/filepath"
	"strings"
	"time"

	"wedding-backend/internal/models"
	"wedding-backend/internal/storage"
	"wedding-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UploadHandler struct {
	db    *gorm.DB
	store storage.Store
}

func NewUploadHandler(db *gorm.DB, store storage.Store) *UploadHandler {
	return &UploadHandler{db: db, store: store}
}

var allowedExt = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true,
}

func (h *UploadHandler) Upload(c *gin.Context) {
	target := c.PostForm("target") // hero | couple | gallery
	if target == "" {
		target = "gallery"
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.Error(c, 400, "file is required")
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		utils.Error(c, 400, "unsupported file type")
		return
	}
	if file.Size > 10*1024*1024 {
		utils.Error(c, 400, "file too large (max 10MB)")
		return
	}

	filename := fmt.Sprintf("%s_%d%s", uuid.NewString(), time.Now().Unix(), ext)

	src, err := file.Open()
	if err != nil {
		utils.Error(c, 400, "failed to read file")
		return
	}
	defer src.Close()

	publicURL, err := h.store.Save(c.Request.Context(), filename, mime.TypeByExtension(ext), src)
	if err != nil {
		log.Printf("upload failed: %v", err)
		utils.Error(c, 500, "failed to save file")
		return
	}

	switch target {
	case "hero":
		h.db.Model(&models.Settings{}).Where("1 = 1").Update("hero_image", publicURL)
	case "couple":
		h.db.Model(&models.Settings{}).Where("1 = 1").Update("couple_image", publicURL)
	case "gallery":
		var maxOrder struct{ Max int }
		h.db.Model(&models.GalleryImage{}).Select("COALESCE(MAX(sort_order), 0) as max").Scan(&maxOrder)
		img := models.GalleryImage{ImageURL: publicURL, SortOrder: maxOrder.Max + 1}
		h.db.Create(&img)
	}

	utils.Success(c, 200, gin.H{"url": publicURL, "target": target})
}
