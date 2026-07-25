package config

import (
	"log"
	"os"
)

type Config struct {
	Port          string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	JWTSecret     string
	AdminUsername string
	AdminPassword string
	UploadDir     string
	PublicBaseURL string
	AllowedOrigin string
}

func Load() *Config {
	cfg := &Config{
		Port:          getEnv("PORT", "8080"),
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "5432"),
		DBUser:        getEnv("DB_USER", "postgres"),
		DBPassword:    getEnv("DB_PASSWORD", "postgres"),
		DBName:        getEnv("DB_NAME", "wedding"),
		JWTSecret:     getEnv("JWT_SECRET", ""),
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: getEnv("ADMIN_PASSWORD", ""),
		UploadDir:     getEnv("UPLOAD_DIR", "./uploads"),
		PublicBaseURL: getEnv("PUBLIC_BASE_URL", "http://localhost:8080"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:3000"),
	}

	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET env var is required")
	}
	if cfg.AdminPassword == "" {
		log.Fatal("ADMIN_PASSWORD env var is required")
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
