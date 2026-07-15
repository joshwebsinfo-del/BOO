# 🌤️ Deploying ZimHub to Cloudflare Pages (Mobile App PWA)

This guide walks you through deploying **ZimHub** to **Cloudflare Pages**—a high-performance hosting platform optimized for global delivery, offline PWAs, and sub-millisecond page loads.

---

## 🚀 Step 1: Prepare Your Codebase
We have already pre-configured the codebase for Cloudflare Pages:
1.  **SPA Routing Redirects:** Created `public/_redirects` which contains:
    ```text
    /* /index.html 200
    ```
    This ensures that reloading routed paths (like `/directory` or `/lodges`) works correctly without 404 errors.
2.  **PWA Manifest Support:** Built manifest definitions directly in the Vite configuration.

---

## 📦 Step 2: Deploy Frontend on Cloudflare Pages
1.  Log in to the **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
2.  In the left sidebar, navigate to **Workers & Pages** -> click **Create application** -> select the **Pages** tab.
3.  Click **Connect to Git** and authorize your GitHub repository.
4.  Configure the build settings:
    *   **Project Name:** `zimhub`
    *   **Production Branch:** `main` (or your active development branch)
    *   **Framework Preset:** `Vite`
    *   **Build Command:** `npm run build`
    *   **Build Output Directory:** `dist`
5.  Click **Save and Deploy**. Cloudflare will compile your React, TypeScript, and Tailwind code and deploy it globally!

---

## 🔌 Step 3: Connect to Your Backend (Render/Fly.io)
Since Cloudflare Pages hosts static frontend assets, you will keep the Express API backend server running on a server platform like **Render.com** or **Fly.io**:

1.  Deploy the Express API backend on Render (see `DEPLOYMENT.md` for PostgreSQL instructions).
2.  In your Cloudflare Pages dashboard:
    *   Go to **Settings** -> **Environment variables**.
    *   Add a variable named `VITE_API_URL` with your Render backend endpoint (e.g. `https://zimhub-backend.onrender.com`).
3.  Trigger a redeployment of your Cloudflare Page to apply the environment variable.

---

## 📱 Progressive Web App (PWA) Offline Access
Once deployed on Cloudflare:
*   Your app will secure an automatic free **SSL/TLS Certificate** on your custom domain.
*   The service worker (`sw.js`) and `manifest.json` will trigger, allowing users in Zimbabwe to click "Install" on their mobile devices and run **ZimHub** completely offline as a native-feeling app!
