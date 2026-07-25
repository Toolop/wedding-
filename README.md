# Wedding Invitation

A full-stack animated wedding invitation website with an admin dashboard.

- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind CSS v4, Framer Motion)
- **Backend**: Go (Gin, GORM, PostgreSQL, JWT auth)
- **Infra**: Docker Compose (Postgres + Go API + Next.js)

## Features

**Public invitation page** (`/`)
- Envelope-style opening screen with guest name from `?to=` query param
- Animated hero, countdown timer, love story timeline, event details (Akad & Resepsi with Google Maps links), photo gallery with lightbox, gift/bank info, RSVP form with confetti, and a public guestbook/wishes wall
- Background music toggle
- Fully theme-able colors and fonts, driven by admin settings

**Admin dashboard** (`/admin`)
- Secure login (JWT)
- Edit couple names, parents, quote, wedding date, Akad/Resepsi details, bank info
- Change theme colors (primary/secondary/accent/background) and fonts live
- Upload/replace hero photo and couple photo
- Manage gallery photos (upload, delete)
- Manage love story timeline entries (add/edit/delete)
- View RSVP responses & guestbook messages with attendance summary, delete entries

## Quick start

```bash
cp .env.example .env
# edit .env and set JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD

docker compose up -d --build
```

- Invitation site: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin (login with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`)
- Backend API: http://localhost:8080

If ports 3000/8080 are already used on your machine, change `FRONTEND_PORT` / `BACKEND_PORT` in `.env` (and update `PUBLIC_BASE_URL` / `ALLOWED_ORIGIN` / `NEXT_PUBLIC_API_URL` to match), then rebuild.

## Project structure

```
backend/            Go API (Gin + GORM + PostgreSQL)
  internal/
    config/          env-based configuration
    database/        DB connection, migrations, default seed data
    handlers/        HTTP handlers (auth, invitation, upload, wishes)
    middleware/      JWT auth middleware
    models/          GORM models
  main.go
  Dockerfile

frontend/            Next.js app
  src/
    app/
      page.tsx                 public invitation page
      admin/login/page.tsx      admin login
      admin/(dashboard)/page.tsx admin dashboard (tabbed)
    components/
      invitation/               all public-facing animated sections
      admin/                     admin dashboard panels
    lib/               typed API client, auth token helpers, types
  Dockerfile

docker-compose.yml
.env.example
```

## Sharing the invitation with a guest name

Append `?to=<Nama+Tamu>` to the URL, e.g.:

```
https://your-domain.com/?to=Budi+Santoso
```

The guest's name will appear on the opening envelope screen.

## Notes

- Uploaded photos are stored on a Docker volume (`uploads_data`) and served by the Go backend at `/uploads/...`.
- `NEXT_PUBLIC_API_URL` is baked into the frontend at build time (browser calls the API directly) — if you change it, rebuild the `frontend` image.
- Change `JWT_SECRET` and `ADMIN_PASSWORD` before deploying publicly.
