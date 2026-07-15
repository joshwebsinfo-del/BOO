# ZimHub Super App Deployment & Architecture Guide (Production-Ready)

This document provides complete, step-by-step deployment and runtime architecture guides to launch **ZimHub**—the ultimate Zimbabwean super app ecosystem—in a live cloud environment.

---

## 🏛️ Deployment Architecture Overview

```
                          ┌────────────────────────┐
                          │     ZimHub Client      │
                          │   (PWA React Single    │
                          │     Page Application)  │
                          └───────────┬────────────┘
                                      │ Static Assets / PWA Bundles
                                      ▼
                          ┌────────────────────────┐
                          │    Cloudflare Pages    │
                          │    or Vercel Hosting   │
                          └───────────┬────────────┘
                                      │ Secure HTTPS REST / P2P Polling APIs
                                      ▼
                          ┌────────────────────────┐
                          │  Node.js Express API   │
                          │  (Render.com / Railway)│
                          └───────────┬────────────┘
                                      │ Prisma ORM Connection Handoff
                                      ▼
                          ┌────────────────────────┐
                          │ Neon PostgreSQL Cloud  │
                          │    (Relational DB)     │
                          └────────────────────────┘
```

---

## 1. 🗄️ Phase 1: Database Setup (Neon PostgreSQL)

ZimHub uses **Prisma ORM** to coordinate relational models. In production, we swap development SQLite (`dev.db`) for a highly available, serverless **Neon PostgreSQL** cluster.

### Step-by-Step database setup:
1. Navigate to [Neon.tech](https://neon.tech/) and sign up for a free tier account.
2. Click **Create Project** and name it `zimhub-prod`. Select **PostgreSQL 16** and the region nearest to your audience (e.g., `Europe (Frankfurt)` or `US East`).
3. Retrieve your **Connection String** from the dashboard. It will look like this:
   ```env
   DATABASE_URL="postgresql://josh:PASSWORD@ep-cloud-name.region.pooler.neon.tech/neondb?sslmode=require"
   ```
4. Copy this string securely. You will pass it to your backend host and local deployment variables.

---

## 2. 🔌 Phase 2: Express Backend Deployment (Render.com)

Render provides an excellent, native ecosystem to spin up continuous Node.js background processes.

### Step-by-Step API setup:
1. Log in to your [Render.com](https://render.com/) dashboard.
2. Click **New** -> **Web Service**.
3. Connect your Git repository containing ZimHub.
4. Configure the following runtime parameters:
   - **Name**: `zimhub-api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free` or `Starter`
5. Click **Advanced** to expand the **Environment Variables** configuration area, and specify:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `PORT` | `3000` | Port listening on express. |
   | `DATABASE_URL` | `postgresql://...` | Connection String obtained from Neon DB. |
   | `JWT_SECRET` | `A_VERY_SECURE_RANDOM_STRING_SECRET` | Secret to sign JWT session profiles. |
   | `NODE_ENV` | `production` | Prevents unnecessary dev logging. |
6. Click **Create Web Service**. Render will securely clone your code, generate your Prisma schema models, and boot the server.
7. Retrieve your live Web Service URL (e.g., `https://zimhub-api.onrender.com`).

---

## 3. 📲 Phase 3: PWA Frontend Deployment (Cloudflare Pages)

Cloudflare Pages offers lightning-fast, edge-cached content delivery networks (CDN) perfect for PWA client packages.

### Step-by-Step frontend setup:
1. Log in to [Cloudflare](https://dash.cloudflare.com/) and go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Select your repository.
3. Apply the following compilation build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
4. Set up the Environment Variables (if needed) and click **Save and Deploy**.
5. Once complete, Cloudflare will provide a custom subdomain (e.g., `https://zimhub.pages.dev`).

### Single Page Application (SPA) Routing Note:
To ensure React Router doesn't trigger 404 pages during direct URL refreshes, ensure a `_redirects` file is located inside your `public/` directory (included with this branch):
```
/*  /index.html  200
```

---

## 4. 🚀 Schema Migration & First Run Seeding

Once both hosts are connected, trigger the production PostgreSQL migration directly from your terminal:

```bash
# 1. Migrate the production database tables
npx prisma db push

# 2. Run the seeding script to populate default guesthouses and Admin 'josh'
NODE_ENV=production DATABASE_URL="postgresql://..." node server.js
```

### Initial Administrator Credentials:
- **Username**: `josh`
- **Email**: `joshuamujakari15@gmail.com`
- **Password**: `joshua#$#$`

---

## 🔒 Security Hardening Check-list
ZimHub comes pre-configured with top-tier security controls:
1. **Sliding-Window Rate Limiting**: The authentication endpoints (`/api/auth/login` and `/api/auth/register`) limit traffic to **5 requests per 15 minutes per IP** to prevent brute-force attacks.
2. **CSP Header Configuration**: Ensures script injection is locked down to standard edge servers and protects user interactions against iframe Clickjacking.
3. **PWA Mobile Offline Cache**: In case of low cellular signal (common in remote tourist areas), service workers will automatically fall back to edge cache states.
