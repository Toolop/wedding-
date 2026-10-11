package middleware

import (
	"sync"
	"time"

	"wedding-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// Limiter counts events per key (client IP) in fixed windows. It lives in
// memory, so each serverless instance keeps its own count: a speed bump on top
// of codes that are already too long to guess, not the only defence.
type Limiter struct {
	mu     sync.Mutex
	max    int
	window time.Duration
	hits   map[string]*bucket
}

type bucket struct {
	count int
	reset time.Time
}

func NewLimiter(max int, window time.Duration) *Limiter {
	return &Limiter{max: max, window: window, hits: map[string]*bucket{}}
}

// Blocked reports whether key has used up its allowance, without counting.
func (l *Limiter) Blocked(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	b, ok := l.hits[key]
	return ok && time.Now().Before(b.reset) && b.count >= l.max
}

// Hit counts one event for key and reports whether it went over the allowance.
func (l *Limiter) Hit(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	if len(l.hits) > 10000 {
		for k, b := range l.hits {
			if now.After(b.reset) {
				delete(l.hits, k)
			}
		}
	}
	b, ok := l.hits[key]
	if !ok || now.After(b.reset) {
		b = &bucket{reset: now.Add(l.window)}
		l.hits[key] = b
	}
	b.count++
	return b.count > l.max
}

// RateLimit rejects a client's requests beyond max per window.
func RateLimit(l *Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if l.Hit(c.ClientIP()) {
			utils.Error(c, 429, "terlalu banyak permintaan, coba lagi nanti")
			c.Abort()
			return
		}
		c.Next()
	}
}
