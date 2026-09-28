# Link Messenger — Complete Deployment Guide 🚀

This guide explains how Link Messenger's backend is deployed to **Render** and how the Expo mobile app is compiled using **EAS**.

---

## 1. Backend Service Architecture
- **Service Name:** `link-messenger-backend`
- **Default Port:** `6070`
- **Database Persistence:** Automatic Dual Storage (Supabase REST API + SQLite WAL database)

### Environment Variables
| Variable | Value | Description |
| :--- | :--- | :--- |
| `PORT` | `6070` | Server listening port |
| `SUPABASE_URL` | `https://dvyvcqztgmkklswbuqje.supabase.co` | Supabase API endpoint |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR...` | Service role key for automatic table access |

---

## 2. One-Click Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your repository and set the root directory to `link-messenger/backend`.
4. Configure settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Click **Deploy Web Service**.

Render will automatically deploy the web service on port **6070**.

---

## 3. Mobile EAS Build (Android APK)

The mobile application is located under `link-messenger/mobile`.

To trigger a new build via EAS:
```bash
cd link-messenger/mobile
eas build -p android --profile preview
```

The compiled installable APK will be generated automatically on Expo servers.
