package models

import "time"

type Settings struct {
	ID uint `gorm:"primaryKey" json:"id"`

	GroomName     string `json:"groom_name"`
	GroomFullName string `json:"groom_full_name"`
	GroomParents  string `json:"groom_parents"`
	GroomInstagram string `json:"groom_instagram"`

	BrideName      string `json:"bride_name"`
	BrideFullName  string `json:"bride_full_name"`
	BrideParents   string `json:"bride_parents"`
	BrideInstagram string `json:"bride_instagram"`

	WeddingDate time.Time `json:"wedding_date"`
	Quote       string    `json:"quote"`
	QuoteAuthor string    `json:"quote_author"`

	HeroImage    string `json:"hero_image"`
	CoupleImage  string `json:"couple_image"`

	PrimaryColor   string `json:"primary_color"`
	SecondaryColor string `json:"secondary_color"`
	AccentColor    string `json:"accent_color"`
	BackgroundColor string `json:"background_color"`
	FontHeading    string `json:"font_heading"`
	FontBody       string `json:"font_body"`

	MusicURL string `json:"music_url"`

	AkadTime     string `json:"akad_time"`
	AkadDate     string `json:"akad_date"`
	AkadLocation string `json:"akad_location"`
	AkadAddress  string `json:"akad_address"`
	AkadMapsURL  string `json:"akad_maps_url"`

	ResepsiTime     string `json:"resepsi_time"`
	ResepsiDate     string `json:"resepsi_date"`
	ResepsiLocation string `json:"resepsi_location"`
	ResepsiAddress  string `json:"resepsi_address"`
	ResepsiMapsURL  string `json:"resepsi_maps_url"`

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
	AttendanceHadir     AttendanceStatus = "hadir"
	AttendanceTidakHadir AttendanceStatus = "tidak_hadir"
	AttendanceRagu      AttendanceStatus = "masih_ragu"
)

type Wish struct {
	ID         uint             `gorm:"primaryKey" json:"id"`
	Name       string           `json:"name"`
	Attendance AttendanceStatus `json:"attendance"`
	GuestCount int              `json:"guest_count"`
	Message    string           `json:"message"`
	CreatedAt  time.Time        `json:"created_at"`
}
