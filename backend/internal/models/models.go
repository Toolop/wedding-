package models

import "time"

type Settings struct {
	ID uint `gorm:"primaryKey" json:"id"`

	GroomName      string `json:"groom_name"`
	GroomFullName  string `json:"groom_full_name"`
	GroomParents   string `json:"groom_parents"`
	GroomInstagram string `json:"groom_instagram"`
	GroomPhoto     string `json:"groom_photo"`

	BrideName      string `json:"bride_name"`
	BrideFullName  string `json:"bride_full_name"`
	BrideParents   string `json:"bride_parents"`
	BrideInstagram string `json:"bride_instagram"`
	BridePhoto     string `json:"bride_photo"`

	WeddingDate time.Time `json:"wedding_date"`
	Quote       string    `json:"quote"`
	QuoteAuthor string    `json:"quote_author"`

	HeroImage   string `json:"hero_image"`
	CoupleImage string `json:"couple_image"`

	PrimaryColor    string `json:"primary_color"`
	SecondaryColor  string `json:"secondary_color"`
	AccentColor     string `json:"accent_color"`
	BackgroundColor string `json:"background_color"`
	FontHeading     string `json:"font_heading"`
	FontBody        string `json:"font_body"`

	MusicURL string `json:"music_url"`

	// WhatsApp invitation text; {nama}, {link} and {mempelai} are filled per guest
	WaTemplate string `json:"wa_template"`

	AkadTime     string `json:"akad_time"`
	AkadDate     string `json:"akad_date"`
	AkadLocation string `json:"akad_location"`
	AkadAddress  string `json:"akad_address"`
	AkadMapsURL  string `json:"akad_maps_url"`
	AkadMapImage string `json:"akad_map_image"`
	// JSON: pin position, nearby markers and legend features drawn over the map image
	AkadMapMeta string `gorm:"type:text" json:"akad_map_meta"`
	// a real photo of the venue, pinned to the map like a polaroid
	AkadVenuePhoto string `json:"akad_venue_photo"`

	ResepsiTime       string `json:"resepsi_time"`
	ResepsiDate       string `json:"resepsi_date"`
	ResepsiLocation   string `json:"resepsi_location"`
	ResepsiAddress    string `json:"resepsi_address"`
	ResepsiMapsURL    string `json:"resepsi_maps_url"`
	ResepsiMapImage   string `json:"resepsi_map_image"`
	ResepsiMapMeta    string `gorm:"type:text" json:"resepsi_map_meta"`
	ResepsiVenuePhoto string `json:"resepsi_venue_photo"`

	BankName          string `json:"bank_name"`
	BankAccountNumber string `json:"bank_account_number"`
	BankAccountName   string `json:"bank_account_name"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type StoryEvent struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	EventDate   string    `json:"event_date"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type GalleryImage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ImageURL  string    `json:"image_url"`
	Caption   string    `json:"caption"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

type AttendanceStatus string

const (
	AttendanceHadir      AttendanceStatus = "hadir"
	AttendanceTidakHadir AttendanceStatus = "tidak_hadir"
	AttendanceRagu       AttendanceStatus = "masih_ragu"
)

type Wish struct {
	ID         uint             `gorm:"primaryKey" json:"id"`
	Name       string           `json:"name"`
	Attendance AttendanceStatus `json:"attendance"`
	GuestCount int              `json:"guest_count"`
	Message    string           `json:"message"`
	// set when the RSVP came through a guest's personal link
	GuestID   *uint     `gorm:"index" json:"guest_id"`
	CreatedAt time.Time `json:"created_at"`
}

// GiftAccount is one bank account or e-wallet guests can send a gift to.
type GiftAccount struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Kind          string    `json:"kind"` // bank | ewallet
	Provider      string    `json:"provider"`
	AccountNumber string    `json:"account_number"`
	AccountName   string    `json:"account_name"`
	SortOrder     int       `json:"sort_order"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// GiftConfirmation is a guest's "I've sent a gift" note with a transfer receipt.
type GiftConfirmation struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Name      string `json:"name"`
	AccountID *uint  `json:"account_id"`
	// snapshot of the account as shown to the guest, so it survives the account being edited or removed
	AccountLabel string    `json:"account_label"`
	Amount       int64     `json:"amount"`
	Message      string    `json:"message"`
	ProofURL     string    `json:"proof_url"`
	Verified     bool      `json:"verified"`
	CreatedAt    time.Time `json:"created_at"`
}

// Guest is someone on the invitation list. Code is the token in their personal
// link (/?u=<code>), so the invitation greets them by name.
type Guest struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Code     string `gorm:"uniqueIndex;size:16" json:"code"`
	Name     string `json:"name"`
	Phone    string `json:"phone"` // digits only, international form (62...)
	Category string `json:"category"`
	// when the invitation was sent over WhatsApp, and when the link was first opened
	SentAt    *time.Time `json:"sent_at"`
	OpenedAt  *time.Time `json:"opened_at"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
