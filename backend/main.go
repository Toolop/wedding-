package main

import (
	"log"
	"time"

	"wedding-backend/internal/config"
	"wedding-backend/internal/database"
	"wedding-backend/internal/handlers"
	"wedding-backend/internal/middleware"
	"wedding-backend/internal/storage"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	store, err := storage.New(cfg)
	if err != nil {
		log.Fatalf("failed to set up storage: %v", err)
	}

	db := database.Connect(cfg)

	router := gin.Default()

	// rate limits key on c.ClientIP(), so it must not be spoofable with a
	// forged X-Forwarded-For. Vercel overwrites X-Real-IP with the real client.
	if cfg.OnVercel {
		router.TrustedPlatform = "X-Real-IP"
	}
	if err := router.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		log.Fatalf("invalid TRUSTED_PROXIES: %v", err)
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	if local, ok := store.(*storage.Local); ok {
		router.Static("/uploads", local.Dir)
	}

	// touches the database so the daily Vercel cron also keeps a free Supabase project from pausing
	router.GET("/healthz", func(c *gin.Context) {
		if err := db.WithContext(c.Request.Context()).Exec("SELECT 1").Error; err != nil {
			c.JSON(503, gin.H{"status": "db unavailable"})
			return
		}
		c.JSON(200, gin.H{"status": "ok"})
	})

	authHandler := handlers.NewAuthHandler(cfg)
	invitationHandler := handlers.NewInvitationHandler(db)
	uploadHandler := handlers.NewUploadHandler(db, store)
	// wrong guest codes per IP, across both the link lookup and RSVPs. Generous,
	// because guests on one mobile carrier often share an IP.
	guestCodeMisses := middleware.NewLimiter(20, 15*time.Minute)

	wishHandler := handlers.NewWishHandler(db, guestCodeMisses)
	giftHandler := handlers.NewGiftHandler(db, store)
	guestHandler := handlers.NewGuestHandler(db, cfg.FonnteToken, guestCodeMisses)

	loginLimit := middleware.RateLimit(middleware.NewLimiter(10, 15*time.Minute))
	wishLimit := middleware.RateLimit(middleware.NewLimiter(30, time.Minute))
	giftLimit := middleware.RateLimit(middleware.NewLimiter(10, time.Minute))

	api := router.Group("/api")
	{
		api.GET("/invitation", invitationHandler.GetInvitation)
		api.POST("/wishes", wishLimit, wishHandler.CreateWish)
		api.GET("/wishes", wishHandler.ListWishes)
		api.POST("/gift-confirmations", giftLimit, giftHandler.CreateConfirmation)
		api.GET("/guests/:code", guestHandler.GetByCode)

		api.POST("/admin/login", loginLimit, authHandler.Login)

		admin := api.Group("/admin")
		admin.Use(middleware.JWTAuth(cfg.JWTSecret))
		{
			admin.PUT("/settings", invitationHandler.UpdateSettings)

			admin.GET("/story", invitationHandler.ListStory)
			admin.POST("/story", invitationHandler.CreateStory)
			admin.PUT("/story/:id", invitationHandler.UpdateStory)
			admin.DELETE("/story/:id", invitationHandler.DeleteStory)

			admin.GET("/gallery", invitationHandler.ListGallery)
			admin.PUT("/gallery/:id", invitationHandler.UpdateGalleryImage)
			admin.DELETE("/gallery/:id", invitationHandler.DeleteGalleryImage)

			admin.POST("/upload", uploadHandler.Upload)

			admin.DELETE("/wishes/:id", wishHandler.DeleteWish)

			admin.GET("/gift-accounts", giftHandler.ListAccounts)
			admin.POST("/gift-accounts", giftHandler.CreateAccount)
			admin.PUT("/gift-accounts/:id", giftHandler.UpdateAccount)
			admin.DELETE("/gift-accounts/:id", giftHandler.DeleteAccount)

			admin.GET("/gift-confirmations", giftHandler.ListConfirmations)
			admin.PUT("/gift-confirmations/:id", giftHandler.UpdateConfirmation)
			admin.DELETE("/gift-confirmations/:id", giftHandler.DeleteConfirmation)

			admin.GET("/guests", guestHandler.List)
			admin.POST("/guests", guestHandler.Create)
			admin.POST("/guests/import", guestHandler.Import)
			admin.POST("/guests/bulk-delete", guestHandler.BulkDelete)
			admin.PUT("/guests/:id", guestHandler.Update)
			admin.DELETE("/guests/:id", guestHandler.Delete)
			admin.POST("/guests/:id/reset-link", guestHandler.ResetLink)
			admin.POST("/guests/:id/send", guestHandler.Send)
		}
	}

	log.Printf("server listening on :%s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
