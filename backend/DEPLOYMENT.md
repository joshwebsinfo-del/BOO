# 🚀 EduMentor Kwekwe Poly: End-to-End Deployment Guide

This guide provides the complete, step-by-step instructions to deploy the **EduMentor** intelligent AI-powered study assistant platform. It covers setting up your Supabase PostgreSQL database, deploying the standalone Express.js backend on Render, and building the production-ready React Native client with Expo EAS.

---

## 📂 Architecture Overview
```
├── backend/            # Standalone Node.js/Express.js Backend (Render Web Service)
│    ├── routes/        # Auth, AI, Resources, Profiles, Dashboards, Notifications
│    ├── controllers/   # Business logic (JWT, cascading fallbacks, storage upload)
│    ├── middleware/    # Security validation & error handlers
│    └── server.js      # App entrypoint
│
└── edumentor-app/      # Android-first React Native Expo Application (Expo EAS Build)
     ├── app/           # Expo Router file-based screens layout
     ├── services/      # REST API & client network bridges
     └── package.json   # Node configurations
```

---

## 1. 🗄️ Database Setup (Supabase & PostgreSQL)

Before deploying the backend or mobile client, initialize your database schema in Supabase:

1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Go to **Database** ➔ **SQL Editor**.
3. Create a new query, paste the contents of `supabase_migration.sql` (found at the project root), and click **Run**.
4. This will create:
   - `profiles` (with authentic `role` and `student_no` fields)
   - `ai_conversations` (stores student tutoring histories)
   - `study_materials` (stores uploaded syllabus metadata)
   - `video_tutorials` (stores admin-published lesson links)
   - `planner_tasks` (stores checklist milestones)
5. Under **Database** ➔ **Connection Strings**, copy the connection string pooler URI (e.g. `postgres://postgres:[password]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres`). This is your `DATABASE_URL`.

---

## 2. 📡 Backend Deployment (Render Web Service)

The standalone backend runs on Node.js/Express.js and manages security, AI providers, and files.

### Step-by-Step Render Deployment:
1. Log in to [Render](https://dashboard.render.com).
2. Click **New** ➔ **Web Service** and connect your GitHub repository containing the backend code.
3. Configure the following deployment fields:
   - **Name:** `edumentor-backend`
   - **Root Directory:** `backend` (Ensure Render points specifically to the `backend/` folder)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Expand the **Advanced / Environment Variables** section and configure the following production keys:
   - `PORT`: `5000`
   - `JWT_SECRET`: `[Input a secure random string for signing JWT tokens]`
   - `DATABASE_URL`: `[Your copied Supabase PostgreSQL pool connection URI]`
   - `SUPABASE_URL`: `[Your Supabase Project URL, e.g. https://xyz.supabase.co]`
   - `SUPABASE_ANON_KEY`: `[Your Supabase public anon key]`
   - `GEMINI_API_KEY`: `[Your secure Google Gemini API Token]`
   - `GROQ_API_KEY`: `[Your secure Groq API Token]`
   - `OPENROUTER_API_KEY`: `[Your secure OpenRouter API Token]`
5. Click **Deploy Web Service**! Render will build and start your live backend server. Once complete, copy your service's live public domain (e.g. `https://edumentor-backend.onrender.com`).

---

## 3. 📱 Mobile Application Build (Expo EAS Build)

With your database and backend deployed, you are ready to configure and compile your mobile application for Android.

### Configure Base URL:
1. Open the file `edumentor-app/app/(tabs)/dashboard.tsx` (and other tabs/auth screens if appropriate) and ensure the `fetch` requests point to your live Render backend URL:
   ```typescript
   // Replace http://10.0.2.2:5000 with your live Render base URL:
   const res = await fetch('https://edumentor-backend.onrender.com/api/video_tutorials');
   ```

### Compile Android Preview APK:
1. Open a terminal and navigate to the mobile app directory:
   ```bash
   cd edumentor-app
   ```
2. Log in to your Expo account via the EAS CLI:
   ```bash
   npx eas-cli login
   ```
3. Set your Expo programmatic token as an environment variable (or let EAS resolve your session context):
   ```bash
   export EXPO_TOKEN="[Your active expo token]"
   ```
4. Execute the automated EAS preview compilation command:
   ```bash
   npx eas-cli build --platform android --profile preview --non-interactive
   ```
5. EAS will upload, queue, and compile a standalone, installable `.apk` file. Copy the direct build logs link returned by the CLI to monitor status and download your application directly when finished!

---

## 🔒 Security Best Practices
- **Never expose your environment keys** (`.env` or API tokens) inside public repositories or mobile code client-side.
- The React Native mobile client must always query AI or databases through the secure, rate-limited backend.
- Maintain CORS and Helmet protection on the Express backend to secure endpoints against unauthorized web requests.
