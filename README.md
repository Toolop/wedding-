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

**Admin dashboard** (`/admin`, built with shadcn/ui sidebar dashboard)
- Secure login (JWT)
- Overview: countdown, RSVP totals with guest headcount, completeness checklist, latest RSVPs
- Mempelai / Acara / Hadiah / Tampilan pages: edit couple info, quote, wedding date, Akad/Resepsi, bank info, theme colors, fonts and music (only changed fields are saved)
- Foto & Galeri: replace hero/couple photo; upload, caption, reorder and delete gallery photos
- Kisah Cinta: add/edit/reorder/delete love story moments
- RSVP & Ucapan: search, filter by attendance, export CSV, delete entries

shadcn's theme lives in `frontend/src/styles/admin-theme.css` and only applies while an admin page is open, so it never restyles the invitation. Add more components with `npx shadcn@latest add <name>` from `frontend/`.

## Deploying

Free hosting on Vercel + Supabase: see **[DEPLOY.md](DEPLOY.md)**.

## Quick start (local, Docker)

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
      admin/(dashboard)/         admin dashboard pages (overview, couple, event, story, photos, gift, guests, appearance)
    components/
      invitation/               all public-facing animated sections
      admin/                     admin sidebar, header, settings-form helpers
      ui/                        shadcn/ui components
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
