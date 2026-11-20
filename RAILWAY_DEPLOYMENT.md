# Taas Academy — Railway deployment

This repository has two services plus the existing Railway PostgreSQL database.

## Upload the repository

Push the **contents** of this directory (not the ZIP file itself) to the private GitHub repository `malinocom/taas-academy` on the `main` branch. Do not commit `.env` files, node_modules, dist, or uploads. The root `.gitignore` excludes them.

## Backend service

- Source: same GitHub repo, branch `main`
- Root directory: `/backend`
- Build: `npm ci && npm run build`
- Start: `npm run start`
- Pre-deploy: `npx prisma db push` then `npm run db:seed` (only after credentials are configured)
- Healthcheck: `/health`
- Volume: mount at `/data`; set `UPLOAD_DIR=/data/uploads`
- Variables:
  - `DATABASE_URL=${{Postgres.DATABASE_URL}}` (Railway reference, not literal URL)
  - `NODE_ENV=production`
  - `PORT=4000`
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: two independent strong random secrets
  - `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD`: strong, unique password
  - `FRONTEND_ORIGINS=https://<frontend-domain>`
  - `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=lax`
  - `BACKEND_URL=https://<frontend-domain>`
  - `PUBLIC_BASE_URL=https://<frontend-domain>`
- Set the backend private network endpoint to `taas-api` (internal hostname `taas-api.railway.internal`).

## Frontend service

- Source: same GitHub repo, branch `main`
- Root directory: `/frontend`
- Build: `npm ci && npm run build`
- Start: `npm run start`
- Variable: `BACKEND_INTERNAL_URL=http://taas-api.railway.internal:4000`
- **Do not set** `VITE_API_URL` in production. API requests use the same frontend origin and are reverse-proxied by `frontend/server.mjs`.
- Generate a public Railway domain for the frontend.

## After deployment

1. Visit frontend `/health` and confirm `{ "ok": true }`.
2. Test registration, login, refresh and logout.
3. Test admin login, upload PDF and image, access to protected note PDFs, and purchase/order flows.
4. Verify that data survives a service restart and that uploaded files persist on the volume.
5. Enable backups for PostgreSQL and test a restore.

## Domain note

Existing Runflare domains are not automatically transferred to Railway. Use a Railway-provided domain first, then attach a domain you control and update the backend origin/base URL variables.
