package storage

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"wedding-backend/internal/config"
)

// Store saves an uploaded file and returns the URL saved in the database.
type Store interface {
	Save(ctx context.Context, name, contentType string, body io.Reader) (string, error)
}

// New picks Supabase Storage when it's configured (serverless hosts have no
// persistent disk), otherwise the local upload directory.
func New(cfg *config.Config) (Store, error) {
	if cfg.SupabaseURL != "" {
		return &Supabase{
			URL:    cfg.SupabaseURL,
			Key:    cfg.SupabaseKey,
			Bucket: cfg.SupabaseBucket,
			Client: &http.Client{Timeout: 30 * time.Second},
		}, nil
	}
	if err := os.MkdirAll(cfg.UploadDir, 0755); err != nil {
		return nil, fmt.Errorf("create upload dir: %w", err)
	}
	return &Local{Dir: cfg.UploadDir}, nil
}

// Local writes into Dir; main.go serves it at /uploads.
type Local struct {
	Dir string
}

func (l *Local) Save(_ context.Context, name, _ string, body io.Reader) (string, error) {
	f, err := os.Create(filepath.Join(l.Dir, name))
	if err != nil {
		return "", err
	}
	defer f.Close()
	if _, err := io.Copy(f, body); err != nil {
		return "", err
	}
	return "/uploads/" + name, nil
}

// Supabase uploads into a public bucket through the Storage REST API.
type Supabase struct {
	URL    string
	Key    string
	Bucket string
	Client *http.Client
}

func (s *Supabase) Save(ctx context.Context, name, contentType string, body io.Reader) (string, error) {
	endpoint := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.URL, s.Bucket, name)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, body)
	if err != nil {
		return "", err
	}
	// same headers supabase-js sends; works for both sb_secret_ and legacy service_role keys
	req.Header.Set("apikey", s.Key)
	req.Header.Set("Authorization", "Bearer "+s.Key)
	req.Header.Set("Content-Type", contentType)
	// file names are unique, so browsers and the CDN can cache them forever
	req.Header.Set("Cache-Control", "max-age=31536000")

	resp, err := s.Client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return "", fmt.Errorf("supabase storage: %s: %s", resp.Status, msg)
	}
	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.URL, s.Bucket, name), nil
}
