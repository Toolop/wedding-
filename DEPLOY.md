# Deploying for free: Vercel + Supabase

```
Vercel project "web"  (root: frontend/)  ── Next.js invitation + /admin
Vercel project "api"  (root: backend/)   ── Go API, Singapore (sin1)
Supabase (Singapore)                     ── Postgres + Storage bucket for photos
```

Two free accounts, no credit card. Allow about 30 minutes.

## 0. Before you start

1. **Push the code to GitHub.** Vercel deploys from your repo:
   ```bash
   git add -A
   git commit -m "Admin dashboard + Vercel/Supabase deploy"
   git push
   ```
2. **Make real secrets.** Never reuse the values from `.env.example`:
   ```bash
   openssl rand -base64 32   # → JWT_SECRET
   openssl rand -base64 18   # → ADMIN_PASSWORD (or pick your own long password)
   ```

## 1. Supabase: database and photo storage

1. Go to [supabase.com](https://supabase.com) → **New project**.
   - **Region:** Southeast Asia (Singapore)
   - **Database password:** use letters and numbers only, so it can go into a URL without escaping. Save it.
2. **Storage → New bucket**: name it `uploads` and turn **Public bucket** on.
3. Collect three values:
   | What | Where in the dashboard |
   |---|---|
   | `SUPABASE_URL` | Project Settings → Data API → Project URL (`https://xxxx.supabase.co`) |
   | `SUPABASE_SECRET_KEY` | Project Settings → API Keys → **Secret key** (`sb_secret_…`). The legacy `service_role` key also works. |
   | `DATABASE_URL` | **Connect** button → **Transaction pooler** (port `6543`). Replace `[YOUR-PASSWORD]` with your database password. |

   The secret key gives full access to your project. Only ever paste it into Vercel, never into frontend code.

## 2. Vercel: the API

1. [vercel.com](https://vercel.com) → **Add New → Project** → import your GitHub repo.
2. **Root Directory:** `backend`. Vercel picks the **Go** preset from `backend/vercel.json`.
3. **Environment Variables:**
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Transaction pooler URL from step 1 |
   | `SUPABASE_URL` | from step 1 |
   | `SUPABASE_SECRET_KEY` | from step 1 |
   | `SUPABASE_BUCKET` | `uploads` |
   | `JWT_SECRET` | from step 0 |
   | `ADMIN_USERNAME` | e.g. `admin` |
   | `ADMIN_PASSWORD` | from step 0 |
   | `ALLOWED_ORIGIN` | `https://example.com` for now; it gets fixed in step 4 |
4. **Deploy.** Then open `https://<your-api>.vercel.app/healthz`. You should see `{"status":"ok"}`. On this first start the API creates the tables and fills in sample data.

## 3. Vercel: the website

1. **Add New → Project** → import **the same repo** again.
2. **Root Directory:** `frontend`. The framework is detected as Next.js.
3. **Environment Variable:** `NEXT_PUBLIC_API_URL` = `https://<your-api>.vercel.app` (no trailing slash).
4. **Deploy.** Note the site URL, e.g. `https://<your-web>.vercel.app`.

## 4. Connect the two

In the **API** project → Settings → Environment Variables:
- Set `ALLOWED_ORIGIN` = `https://<your-web>.vercel.app`
- Then go to **Deployments → ⋯ → Redeploy**. Environment variable changes only take effect after a redeploy.

## 5. Optional: copy your current local data

This brings over your names, dates, quote, event details and love story from the Docker database. It skips gallery photos, because they live on your local disk (re-upload them in the admin), and the test RSVPs. It's safe to run more than once.

1. Supabase → **Connect** → **Session pooler** (port `5432`, works over IPv4). Copy the URL and fill in your password.
2. With your local Docker stack running:
   ```bash
   export SUPABASE_SESSION_URL='postgresql://postgres.xxxx:PASSWORD@aws-…-ap-southeast-1.pooler.supabase.com:5432/postgres'

   docker exec wedding-db-1 pg_dump -U postgres --clean --if-exists --no-owner --no-privileges \
     --exclude-table-data=gallery_images --exclude-table-data=wishes wedding \
   | docker run --rm -i postgres:16-alpine psql "$SUPABASE_SESSION_URL" -q -v ON_ERROR_STOP=1
   ```
   To keep the RSVPs too, remove `--exclude-table-data=wishes`.

## 6. Check it works

1. Open `https://<your-web>.vercel.app/admin/login` and sign in with your new admin password.
2. **Foto & Galeri** → upload a photo. Photos are resized in the browser first, because Vercel caps requests at about 4.5 MB.
3. Open the invitation and check the photo, names and RSVP form.
4. Personalised guest links work as before: `https://<your-web>.vercel.app/?to=Budi+Santoso`

## Custom domain (optional)

1. Add the domain in the **web** project → Settings → Domains, then follow the DNS instructions there.
2. Add it to the API's `ALLOWED_ORIGIN` as a comma-separated list, e.g. `https://ourwedding.com,https://<your-web>.vercel.app`, then redeploy the API.

## Free-tier notes

- **Supabase pauses a project after 7 days without database activity.** The API's daily cron calls `/healthz`, which queries the database, to prevent this. If it ever does pause, restore it from the Supabase dashboard.
- **Vercel Hobby** is for personal, non-commercial projects. A wedding invitation qualifies.
- The API sleeps when nobody is using it. The first visitor after a quiet period waits a moment while it starts.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Admin login shows a network or CORS error | `ALLOWED_ORIGIN` must exactly match the site URL (`https://`, no trailing slash). Redeploy the API after changing it. |
| `/healthz` fails, or the logs say `failed to connect to database` | Check `DATABASE_URL`: use the Transaction pooler URL, replace the `[YOUR-PASSWORD]` placeholder, and use a password without special characters. |
| Photo upload fails | Check the bucket is named `uploads` and is **Public**, and check `SUPABASE_SECRET_KEY`. The API project's **Logs** tab shows the exact Supabase error. |
| Site still calls the old API URL | `NEXT_PUBLIC_API_URL` is baked in at build time. Redeploy the **web** project after changing it. |

The Docker setup (`docker compose up`) keeps working unchanged for local development. When `SUPABASE_URL` and `DATABASE_URL` are unset, the API uses the local Postgres and the uploads folder.
