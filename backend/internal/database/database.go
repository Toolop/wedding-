package database

import (
	"fmt"
	"log"
	"time"

	"wedding-backend/internal/config"
	"wedding-backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) *gorm.DB {
	dsn := cfg.DatabaseURL
	if dsn == "" {
		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Jakarta",
			cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode,
		)
	}

	var db *gorm.DB
	var err error

	for i := 0; i < 15; i++ {
		db, err = gorm.Open(postgres.New(postgres.Config{
			DSN: dsn,
			// poolers in transaction mode (Supabase :6543) can't hold prepared statements
			PreferSimpleProtocol: true,
		}), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		})
		if err == nil {
			break
		}
		log.Printf("waiting for database... (%d/15): %v", i+1, err)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	// serverless instances each open their own pool; keep them small
	if sqlDB, err := db.DB(); err == nil {
		sqlDB.SetMaxOpenConns(5)
		sqlDB.SetMaxIdleConns(2)
	}

	if err := db.AutoMigrate(
		&models.Settings{},
		&models.StoryEvent{},
		&models.GalleryImage{},
		&models.Wish{},
	); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	// Supabase serves the public schema over its REST API; RLS with no policies
	// shuts that path. This API connects as the tables' owner, which bypasses RLS.
	for _, table := range []string{"settings", "story_events", "gallery_images", "wishes"} {
		if err := db.Exec("ALTER TABLE " + table + " ENABLE ROW LEVEL SECURITY").Error; err != nil {
			log.Printf("could not enable RLS on %s: %v", table, err)
		}
	}

	seedDefaults(db)

	return db
}

func seedDefaults(db *gorm.DB) {
	// upgrade installs still on the previous default palette to the sketch theme,
	// without touching themes an admin already customized
	db.Model(&models.Settings{}).
		Where("primary_color = ?", "#F3E9D8").
		Updates(map[string]interface{}{
			"primary_color":    "#2E3237",
			"secondary_color":  "#E5E3DE",
			"accent_color":     "#4A7FA5",
			"background_color": "#F4F2EE",
			"font_heading":     "'Patrick Hand', cursive",
			"font_body":        "'Nunito', sans-serif",
		})
	db.Model(&models.Settings{}).
		Where("hero_image = '' OR hero_image IS NULL").
		Update("hero_image", "/images/hero.jpg")
	db.Model(&models.Settings{}).
		Where("couple_image = '' OR couple_image IS NULL").
		Update("couple_image", "/images/couple.jpg")

	var count int64
	db.Model(&models.Settings{}).Count(&count)
	if count == 0 {
		weddingDate, _ := time.Parse("2006-01-02", "2026-12-12")
		db.Create(&models.Settings{
			GroomName:       "Rafi",
			GroomFullName:   "Rafi Arya",
			GroomParents:    "Putra dari Bapak & Ibu",
			BrideName:       "Nadya",
			BrideFullName:   "Nadya Putri",
			BrideParents:    "Putri dari Bapak & Ibu",
			WeddingDate:     weddingDate,
			Quote:           "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
			QuoteAuthor:     "QS. Ar-Rum: 21",
			HeroImage:       "/images/hero.jpg",
			CoupleImage:     "/images/couple.jpg",
			PrimaryColor:    "#2E3237",
			SecondaryColor:  "#E5E3DE",
			AccentColor:     "#4A7FA5",
			BackgroundColor: "#F4F2EE",
			FontHeading:     "'Patrick Hand', cursive",
			FontBody:        "'Nunito', sans-serif",
			AkadTime:        "08:00 - 10:00 WIB",
			AkadDate:        "12 Desember 2026",
			AkadLocation:    "Kediaman Mempelai Wanita",
			AkadAddress:     "Jl. Contoh Alamat No. 123, Jakarta",
			ResepsiTime:     "11:00 - 14:00 WIB",
			ResepsiDate:     "12 Desember 2026",
			ResepsiLocation: "Gedung Serbaguna",
			ResepsiAddress:  "Jl. Contoh Alamat No. 123, Jakarta",
		})

		db.Create(&models.StoryEvent{
			EventDate:   "Januari 2020",
			Title:       "Pertama Bertemu",
			Description: "Awal pertemuan yang tidak disengaka di sebuah acara kampus.",
			Icon:        "sparkles",
			SortOrder:   1,
		})
		db.Create(&models.StoryEvent{
			EventDate:   "Juni 2022",
			Title:       "Menjalin Kasih",
			Description: "Memutuskan untuk menjalani hubungan yang lebih serius.",
			Icon:        "heart",
			SortOrder:   2,
		})
		db.Create(&models.StoryEvent{
			EventDate:   "Agustus 2026",
			Title:       "Lamaran",
			Description: "Melangkah ke jenjang yang lebih serius menuju pernikahan.",
			Icon:        "gem",
			SortOrder:   3,
		})
		db.Create(&models.StoryEvent{
			EventDate:   "Desember 2026",
			Title:       "Hari Bahagia",
			Description: "Hari dimana kami resmi menjadi sepasang suami istri.",
			Icon:        "church",
			SortOrder:   4,
		})
	}
}
