package handlers

import (
	"fmt"
	"log"
	"mime"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"wedding-backend/internal/models"
	"wedding-backend/internal/storage"
	"wedding-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GiftHandler struct {
	db    *gorm.DB
	store storage.Store
}

func NewGiftHandler(db *gorm.DB, store storage.Store) *GiftHandler {
	return &GiftHandler{db: db, store: store}
}

// ---- Accounts ----

type giftAccountRequest struct {
	Kind          *string `json:"kind"`
	Provider      *string `json:"provider"`
	AccountNumber *string `json:"account_number"`
	AccountName   *string `json:"account_name"`
	SortOrder     *int    `json:"sort_order"`
}

func (r giftAccountRequest) updates() map[string]interface{} {
	updates := map[string]interface{}{}
	if r.Kind != nil {
		kind := "bank"
		if *r.Kind == "ewallet" {
			kind = "ewallet"
		}
		updates["kind"] = kind
	}
	if r.Provider != nil {
		updates["provider"] = strings.TrimSpace(*r.Provider)
	}
	if r.AccountNumber != nil {
		updates["account_number"] = strings.TrimSpace(*r.AccountNumber)
	}
	if r.AccountName != nil {
		updates["account_name"] = strings.TrimSpace(*r.AccountName)
	}
	if r.SortOrder != nil {
		updates["sort_order"] = *r.SortOrder
	}
	return updates
}

func (h *GiftHandler) ListAccounts(c *gin.Context) {
	var items []models.GiftAccount
	h.db.Order("sort_order asc, id asc").Find(&items)
	utils.Success(c, 200, items)
}

func (h *GiftHandler) CreateAccount(c *gin.Context) {
	var req giftAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, 400, "invalid request body")
		return
	}
	item := models.GiftAccount{Kind: "bank"}
	if err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&item).Error; err != nil {
			return err
		}
		if updates := req.updates(); len(updates) > 0 {
			return tx.Model(&item).Updates(updates).Error
		}
		return nil
	}); err != nil {
		utils.Error(c, 500, "failed to create account")
		return
	}
	h.db.First(&item, item.ID)
	utils.Success(c, 201, item)
}

func (h *GiftHandler) UpdateAccount(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	var item models.GiftAccount
	if err := h.db.First(&item, id).Error; err != nil {
		utils.Error(c, 404, "account not found")
		return
	}
	var req giftAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, 400, "invalid request body")
		return
	}
	if updates := req.updates(); len(updates) > 0 {
		if err := h.db.Model(&item).Updates(updates).Error; err != nil {
			utils.Error(c, 500, "failed to update account")
			return
		}
	}
	h.db.First(&item, id)
	utils.Success(c, 200, item)
}

func (h *GiftHandler) DeleteAccount(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	if err := h.db.Delete(&models.GiftAccount{}, id).Error; err != nil {
		utils.Error(c, 500, "failed to delete account")
		return
	}
	utils.Success(c, 200, gin.H{"deleted": id})
}

// ---- Confirmations ----

// receipts are photos or screenshots; the client shrinks them under Vercel's ~4.5MB body cap
const maxProofSize = 5 * 1024 * 1024

var proofExt = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}

// CreateConfirmation is public: a guest posts name, optional account/amount/message and a receipt image.
func (h *GiftHandler) CreateConfirmation(c *gin.Context) {
	name := strings.TrimSpace(c.PostForm("name"))
	message := strings.TrimSpace(c.PostForm("message"))
	if len(name) < 2 || len(name) > 100 {
		utils.Error(c, 400, "name must be 2-100 characters")
		return
	}
	if len(message) > 500 {
		utils.Error(c, 400, "message is too long")
		return
	}

	var amount int64
	if raw := strings.TrimSpace(c.PostForm("amount")); raw != "" {
		v, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || v < 0 || v > 1_000_000_000_000 {
			utils.Error(c, 400, "invalid amount")
			return
		}
		amount = v
	}

	conf := models.GiftConfirmation{Name: name, Amount: amount, Message: message}
	if raw := strings.TrimSpace(c.PostForm("account_id")); raw != "" {
		id, err := strconv.Atoi(raw)
		var account models.GiftAccount
		if err != nil || h.db.First(&account, id).Error != nil {
			utils.Error(c, 400, "unknown account")
			return
		}
		accountID := account.ID
		conf.AccountID = &accountID
		conf.AccountLabel = fmt.Sprintf("%s · %s a.n. %s", account.Provider, account.AccountNumber, account.AccountName)
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.Error(c, 400, "receipt image is required")
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !proofExt[ext] {
		utils.Error(c, 400, "unsupported file type")
		return
	}
	if file.Size > maxProofSize {
		utils.Error(c, 400, "file too large (max 5MB)")
		return
	}
	src, err := file.Open()
	if err != nil {
		utils.Error(c, 400, "failed to read file")
		return
	}
	defer src.Close()

	filename := fmt.Sprintf("proof_%s_%d%s", uuid.NewString(), time.Now().Unix(), ext)
	url, err := h.store.Save(c.Request.Context(), filename, mime.TypeByExtension(ext), src)
	if err != nil {
		log.Printf("receipt upload failed: %v", err)
		utils.Error(c, 500, "failed to save file")
		return
	}
	conf.ProofURL = url

	if err := h.db.Create(&conf).Error; err != nil {
		utils.Error(c, 500, "failed to save confirmation")
		return
	}
	// guests only need to know it arrived; the receipt URL stays admin-only
	utils.Success(c, 201, gin.H{"id": conf.ID})
}

func (h *GiftHandler) ListConfirmations(c *gin.Context) {
	var items []models.GiftConfirmation
	h.db.Order("created_at desc").Find(&items)
	utils.Success(c, 200, items)
}

func (h *GiftHandler) UpdateConfirmation(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	var req struct {
		Verified *bool `json:"verified"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Verified == nil {
		utils.Error(c, 400, "verified is required")
		return
	}
	var item models.GiftConfirmation
	if err := h.db.First(&item, id).Error; err != nil {
		utils.Error(c, 404, "confirmation not found")
		return
	}
	if err := h.db.Model(&item).Update("verified", *req.Verified).Error; err != nil {
		utils.Error(c, 500, "failed to update confirmation")
		return
	}
	utils.Success(c, 200, item)
}

func (h *GiftHandler) DeleteConfirmation(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	if err := h.db.Delete(&models.GiftConfirmation{}, id).Error; err != nil {
		utils.Error(c, 500, "failed to delete confirmation")
		return
	}
	utils.Success(c, 200, gin.H{"deleted": id})
}
