package config

import (
	"log"
	"os"
	"strings"
)

type Config struct {
	Port string

	// DatabaseURL (e.g. Supabase's pooler connection string) wins over the
	// individual DB_* settings used by docker-compose.
	DatabaseURL string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	DBSSLMode   string

	JWTSecret     string
	AdminUsername string
	AdminPassword string

	// Uploads go to Supabase Storage when SupabaseURL is set, else to UploadDir.
	UploadDir      string
	SupabaseURL    string
	SupabaseKey    string
	SupabaseBucket string

	PublicBaseURL  string
	AllowedOrigins []string

	// Fonnte device token; when set, the admin can send invitations from the
	// server instead of opening WhatsApp for each guest.
	FonnteToken string

	// Client IPs are read from these proxies' X-Forwarded-For (e.g. an nginx
	// in front of docker-compose). On Vercel the platform's own header is used.
	TrustedProxies []string
	OnVercel       bool
}

func Load() *Config {
	cfg := &Config{
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "wedding"),
		DBSSLMode:      getEnv("DB_SSLMODE", "disable"),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		AdminUsername:  getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword:  getEnv("ADMIN_PASSWORD", ""),
		UploadDir:      getEnv("UPLOAD_DIR", "./uploads"),
		SupabaseURL:    strings.TrimRight(getEnv("SUPABASE_URL", ""), "/"),
		SupabaseKey:    getEnv("SUPABASE_SECRET_KEY", ""),
		SupabaseBucket: getEnv("SUPABASE_BUCKET", "uploads"),
		PublicBaseURL:  getEnv("PUBLIC_BASE_URL", "http://localhost:8080"),
		AllowedOrigins: splitList(getEnv("ALLOWED_ORIGIN", "http://localhost:3000")),
		FonnteToken:    getEnv("FONNTE_TOKEN", ""),
		TrustedProxies: splitList(getEnv("TRUSTED_PROXIES", "")),
		// set by Vercel at runtime
		OnVercel: os.Getenv("VERCEL") != "",
	}

	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET env var is required")
	}
	if cfg.AdminPassword == "" {
		log.Fatal("ADMIN_PASSWORD env var is required")
	}
	if cfg.SupabaseURL != "" && cfg.SupabaseKey == "" {
		log.Fatal("SUPABASE_SECRET_KEY env var is required when SUPABASE_URL is set")
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// splitList reads a comma-separated env value, e.g. both a custom domain and
// the *.vercel.app URL in ALLOWED_ORIGIN.
func splitList(v string) []string {
	var out []string
	for _, s := range strings.Split(v, ",") {
		if s = strings.TrimRight(strings.TrimSpace(s), "/"); s != "" {
			out = append(out, s)
		}
	}
	return out
}
