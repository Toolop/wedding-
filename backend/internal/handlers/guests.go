package handlers

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"wedding-backend/internal/middleware"
	"wedding-backend/internal/models"
	"wedding-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type GuestHandler struct {
	db          *gorm.DB
	fonnteToken string
	client      *http.Client
	misses      *middleware.Limiter
}

// misses counts wrong guest codes per client IP, shared with the RSVP endpoint
// so neither can be used to guess codes.
func NewGuestHandler(db *gorm.DB, fonnteToken string, misses *middleware.Limiter) *GuestHandler {
	return &GuestHandler{
		db:          db,
		fonnteToken: fonnteToken,
		client:      &http.Client{Timeout: 15 * time.Second},
		misses:      misses,
	}
}

// no 0/o/1/l/i so a code read aloud or retyped from a screenshot still works
const codeAlphabet = "abcdefghjkmnpqrstuvwxyz23456789"

// 31^16 ≈ 2^79 codes: even with millions of guesses an invited guest's code
// can't be found by trying, so one guest can't open another's invitation.
const codeLength = 16

func newGuestCode() string {
	out := make([]byte, 0, codeLength)
	buf := make([]byte, 32)
	for len(out) < codeLength {
		if _, err := rand.Read(buf); err != nil {
			panic(err)
		}
		for _, b := range buf {
			// 248 = 8*31: dropping the top bytes keeps every letter equally likely
			if b < 248 && len(out) < codeLength {
				out = append(out, codeAlphabet[int(b)%len(codeAlphabet)])
			}
		}
	}
	return string(out)
}

// cleanCode normalises a code from a URL, or returns "" when it can't be one,
// so junk never reaches the database.
func cleanCode(raw string) string {
	code := strings.ToLower(strings.TrimSpace(raw))
	if len(code) != codeLength {
		return ""
	}
	for _, r := range code {
		if !strings.ContainsRune(codeAlphabet, r) {
			return ""
		}
	}
	return code
}

// lookupByCode finds the guest for a personal-link code. Wrong codes count
// against the client's IP; once over the allowance every lookup misses until
// the window passes, so guessing gets nowhere.
func lookupByCode(db *gorm.DB, misses *middleware.Limiter, ip, raw string) (models.Guest, bool) {
	var g models.Guest
	if misses.Blocked(ip) {
		return g, false
	}
	code := cleanCode(raw)
	if code == "" || db.Where("code = ?", code).First(&g).Error != nil {
		misses.Hit(ip)
		return g, false
	}
	return g, true
}

var errInvalidPhone = errors.New("nomor WhatsApp tidak valid")

// normalizePhone turns 0812-3456-789, +62 812 3456 789 or 812... into 62812...
// An empty input stays empty: a guest without a number gets their link by hand.
func normalizePhone(raw string) (string, error) {
	digits := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, raw)
	switch {
	case digits == "":
		return "", nil
	case strings.HasPrefix(digits, "0"):
		digits = "62" + digits[1:]
	case strings.HasPrefix(digits, "8"):
		digits = "62" + digits
	}
	if len(digits) < 10 || len(digits) > 15 {
		return "", errInvalidPhone
	}
	return digits, nil
}

type guestInput struct {
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Category string `json:"category"`
}

func (in guestInput) clean() (models.Guest, error) {
	name := strings.Join(strings.Fields(in.Name), " ")
	if len(name) < 2 || len(name) > 100 {
		return models.Guest{}, errors.New("nama harus 2-100 karakter")
	}
	phone, err := normalizePhone(in.Phone)
	if err != nil {
		return models.Guest{}, err
	}
	category := strings.TrimSpace(in.Category)
	if len(category) > 50 {
		category = category[:50]
	}
	return models.Guest{Name: name, Phone: phone, Category: category}, nil
}

// createWithCode gives the guest a fresh link code; a clash is vanishingly
// rare, and the unique index rejects one if it ever happens.
func createWithCode(tx *gorm.DB, g *models.Guest) error {
	g.Code = newGuestCode()
	return tx.Create(g).Error
}

type guestRsvp struct {
	Attendance models.AttendanceStatus `json:"attendance"`
	GuestCount int                     `json:"guest_count"`
	At         time.Time               `json:"at"`
}

type guestWithRsvp struct {
	models.Guest
	Rsvp *guestRsvp `json:"rsvp"`
}

// ---- Public ----

// GetByCode resolves a personal link to the guest's name and records the first open.
func (h *GuestHandler) GetByCode(c *gin.Context) {
	if h.misses.Blocked(c.ClientIP()) {
		utils.Error(c, 429, "terlalu banyak percobaan, coba lagi nanti")
		return
	}
	g, ok := lookupByCode(h.db, h.misses, c.ClientIP(), c.Param("code"))
	if !ok {
		utils.Error(c, 404, "guest not found")
		return
	}
	// the admin previewing a guest's link shouldn't count as the guest opening it
	if g.OpenedAt == nil && c.Query("preview") == "" {
		h.db.Model(&models.Guest{}).Where("id = ? AND opened_at IS NULL", g.ID).Update("opened_at", time.Now())
	}
	// only what the invitation shows; the phone number stays admin-only
	utils.Success(c, 200, gin.H{"name": g.Name, "code": g.Code})
}

// ---- Admin ----

func (h *GuestHandler) List(c *gin.Context) {
	var guests []models.Guest
	h.db.Order("created_at asc, id asc").Find(&guests)

	var wishes []models.Wish
	h.db.Where("guest_id IS NOT NULL").Order("created_at asc").Find(&wishes)
	latest := map[uint]*guestRsvp{}
	for _, w := range wishes {
		latest[*w.GuestID] = &guestRsvp{Attendance: w.Attendance, GuestCount: w.GuestCount, At: w.CreatedAt}
	}

	items := make([]guestWithRsvp, len(guests))
	for i, g := range guests {
		items[i] = guestWithRsvp{Guest: g, Rsvp: latest[g.ID]}
	}
	utils.Success(c, 200, gin.H{"items": items, "whatsapp_gateway": h.fonnteToken != ""})
}

func (h *GuestHandler) Create(c *gin.Context) {
	var in guestInput
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.Error(c, 400, "invalid request body")
		return
	}
	g, err := in.clean()
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}
	if err := createWithCode(h.db, &g); err != nil {
		utils.Error(c, 500, "failed to create guest")
		return
	}
	utils.Success(c, 201, guestWithRsvp{Guest: g})
}

const maxImportRows = 2000

type importSkip struct {
	Row    int    `json:"row"`
	Name   string `json:"name"`
	Reason string `json:"reason"`
}

// Import adds many guests at once (rows parsed from Excel on the client).
// Rows already on the list (same number, or same name when there is no number) are skipped.
func (h *GuestHandler) Import(c *gin.Context) {
	var req struct {
		Guests []guestInput `json:"guests"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, 400, "invalid request body")
		return
	}
	if len(req.Guests) == 0 || len(req.Guests) > maxImportRows {
		utils.Error(c, 400, fmt.Sprintf("kirim 1-%d tamu sekaligus", maxImportRows))
		return
	}

	var existing []models.Guest
	h.db.Select("name", "phone").Find(&existing)
	seenPhone := map[string]bool{}
	seenName := map[string]bool{}
	for _, g := range existing {
		if g.Phone != "" {
			seenPhone[g.Phone] = true
		} else {
			seenName[strings.ToLower(g.Name)] = true
		}
	}

	skipped := []importSkip{}
	created := 0
	err := h.db.Transaction(func(tx *gorm.DB) error {
		for i, in := range req.Guests {
			g, err := in.clean()
			if err != nil {
				skipped = append(skipped, importSkip{Row: i + 1, Name: in.Name, Reason: err.Error()})
				continue
			}
			if (g.Phone != "" && seenPhone[g.Phone]) || (g.Phone == "" && seenName[strings.ToLower(g.Name)]) {
				skipped = append(skipped, importSkip{Row: i + 1, Name: g.Name, Reason: "sudah ada di daftar"})
				continue
			}
			if err := createWithCode(tx, &g); err != nil {
				return err
			}
			if g.Phone != "" {
				seenPhone[g.Phone] = true
			} else {
				seenName[strings.ToLower(g.Name)] = true
			}
			created++
		}
		return nil
	})
	if err != nil {
		utils.Error(c, 500, "failed to import guests")
		return
	}
	utils.Success(c, 201, gin.H{"created": created, "skipped": skipped})
}

func (h *GuestHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	var g models.Guest
	if err := h.db.First(&g, id).Error; err != nil {
		utils.Error(c, 404, "guest not found")
		return
	}
	var req struct {
		Name     *string `json:"name"`
		Phone    *string `json:"phone"`
		Category *string `json:"category"`
		Sent     *bool   `json:"sent"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, 400, "invalid request body")
		return
	}

	in := guestInput{Name: g.Name, Phone: g.Phone, Category: g.Category}
	if req.Name != nil {
		in.Name = *req.Name
	}
	if req.Phone != nil {
		in.Phone = *req.Phone
	}
	if req.Category != nil {
		in.Category = *req.Category
	}
	cleaned, err := in.clean()
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}
	updates := map[string]interface{}{"name": cleaned.Name, "phone": cleaned.Phone, "category": cleaned.Category}
	if req.Sent != nil {
		if *req.Sent {
			updates["sent_at"] = time.Now()
		} else {
			updates["sent_at"] = nil
		}
	}
	if err := h.db.Model(&g).Updates(updates).Error; err != nil {
		utils.Error(c, 500, "failed to update guest")
		return
	}
	h.db.First(&g, id)
	utils.Success(c, 200, g)
}

// ResetLink gives a guest a new code, e.g. when their link was forwarded to
// someone else. The old link stops showing their name straight away.
func (h *GuestHandler) ResetLink(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	var g models.Guest
	if err := h.db.First(&g, id).Error; err != nil {
		utils.Error(c, 404, "guest not found")
		return
	}
	// the new link hasn't been sent or opened yet
	if err := h.db.Model(&g).Updates(map[string]interface{}{
		"code":      newGuestCode(),
		"sent_at":   nil,
		"opened_at": nil,
	}).Error; err != nil {
		utils.Error(c, 500, "failed to reset link")
		return
	}
	h.db.First(&g, id)
	utils.Success(c, 200, g)
}

func (h *GuestHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	if err := h.deleteGuests([]uint{uint(id)}); err != nil {
		utils.Error(c, 500, "failed to delete guest")
		return
	}
	utils.Success(c, 200, gin.H{"deleted": id})
}

func (h *GuestHandler) BulkDelete(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || len(req.IDs) == 0 {
		utils.Error(c, 400, "ids are required")
		return
	}
	if err := h.deleteGuests(req.IDs); err != nil {
		utils.Error(c, 500, "failed to delete guests")
		return
	}
	utils.Success(c, 200, gin.H{"deleted": len(req.IDs)})
}

// deleteGuests keeps the guests' RSVPs and wishes, just unlinked.
func (h *GuestHandler) deleteGuests(ids []uint) error {
	return h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Wish{}).Where("guest_id IN ?", ids).Update("guest_id", nil).Error; err != nil {
			return err
		}
		return tx.Delete(&models.Guest{}, ids).Error
	})
}

// Send delivers one guest's invitation through the Fonnte gateway. The client
// fills the message template and paces a broadcast one guest at a time, so each
// request stays well inside a serverless time limit.
func (h *GuestHandler) Send(c *gin.Context) {
	if h.fonnteToken == "" {
		utils.Error(c, 400, "WhatsApp gateway belum diatur (FONNTE_TOKEN)")
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.Error(c, 400, "invalid id")
		return
	}
	var g models.Guest
	if err := h.db.First(&g, id).Error; err != nil {
		utils.Error(c, 404, "guest not found")
		return
	}
	if g.Phone == "" {
		utils.Error(c, 400, "tamu ini belum punya nomor WhatsApp")
		return
	}
	var req struct {
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Message) == "" {
		utils.Error(c, 400, "message is required")
		return
	}

	if err := h.sendFonnte(c, g.Phone, req.Message); err != nil {
		log.Printf("whatsapp send to guest %d failed: %v", g.ID, err)
		utils.Error(c, 502, "gagal mengirim: "+err.Error())
		return
	}
	now := time.Now()
	h.db.Model(&g).Update("sent_at", now)
	g.SentAt = &now
	utils.Success(c, 200, g)
}

func (h *GuestHandler) sendFonnte(c *gin.Context, phone, message string) error {
	form := url.Values{"target": {phone}, "message": {message}, "countryCode": {"62"}}
	req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, "https://api.fonnte.com/send", strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", h.fonnteToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res, err := h.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(res.Body, 64*1024))

	// Fonnte answers 200 even on failure; "status" (sometimes "Status") says whether it queued
	var out map[string]interface{}
	if err := json.Unmarshal(body, &out); err != nil {
		return fmt.Errorf("unexpected gateway response (HTTP %d)", res.StatusCode)
	}
	ok, _ := out["status"].(bool)
	if !ok {
		reason, _ := out["reason"].(string)
		if reason == "" {
			reason = "ditolak gateway"
		}
		return errors.New(reason)
	}
	return nil
}
