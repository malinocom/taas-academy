# TaaS API

Express + TypeScript + Prisma API for the TaaS Academy frontend.

## Local setup

```bash
npm ci
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ADMIN_PASSWORD` before starting the API. Do not commit `.env`.

## Production

```bash
npm ci
npm run build
npm start
```

Configure the production environment variables in the hosting provider. Set `NODE_ENV=production`, `COOKIE_SECURE=true`, and `FRONTEND_ORIGINS=https://taas.runflare.run` (or the exact origin of the deployed frontend).

The API should be reachable at `https://backend-taas.runflare.run`. Set both `BACKEND_URL` and `PUBLIC_BASE_URL` to that public API origin so uploaded PDFs and images receive correct URLs. Keep `COOKIE_SAME_SITE=lax` when the frontend and API are sibling HTTPS subdomains of the same site.

Uploads are stored in `UPLOAD_DIR`; use persistent storage because exam PDFs, note images and work-report images must remain available after restarts or redeploys.

### Note PDF files

Note PDF metadata is stored in `Note.pdfUrl` and `Note.pdfFileName`. After deploying this version, run `npx prisma db push` once to add these nullable columns. PDF files for notes are stored in the private `uploads/note-files/` directory and are streamed only after an authenticated admin request or an approved student order. Keep `UPLOAD_DIR` on persistent storage.
