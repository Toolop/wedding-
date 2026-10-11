package main

import (
	"log"

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
	wishHandler := handlers.NewWishHandler(db)

	api := router.Group("/api")
	{
		api.GET("/invitation", invitationHandler.GetInvitation)
		api.POST("/wishes", wishHandler.CreateWish)
		api.GET("/wishes", wishHandler.ListWishes)

		api.POST("/admin/login", authHandler.Login)

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
		}
	}

	log.Printf("server listening on :%s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
