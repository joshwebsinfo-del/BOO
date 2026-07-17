# EduMentor Kwekwe Poly Standalone Backend

This is the production-ready Node.js & Express.js backend project built specifically for the **EduMentor** Android-first mobile application.

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database Connection:** pg PostgreSQL Pool
- **Storage:** Supabase Storage
- **Authentication:** Supabase Auth Integration & JWT Role gating
- **Security:** Helmet, CORS (open-origin for mobile clients), Express Rate Limiter, custom input validators

---

## 📂 Project Structure
```
backend/
 ├── routes/          # API Endpoint Router mappings
 ├── controllers/     # Controller modules mapping business logic
 ├── middleware/      # JWT, Role Gating, input validations, error handlers
 ├── services/        # AI cascading fallbacks & Storage services
 ├── config/          # PostgreSQL & Supabase connection configs
 ├── uploads/         # Local scratch directory (optional)
 ├── server.js        # Main Express application entrypoint
 ├── package.json     # Node.js dependencies & scripts configuration
 ├── .env.example     # Template environment configurations
 └── README.md        # Deployment instructions
```

---

## ⚡ Deployment to Render

To launch this backend as a web service on **Render**:

1. **Push the repository** to GitHub/GitLab.
2. Go to [Render Dashboard](https://dashboard.render.com).
3. Click **New** ➔ **Web Service**.
4. Link your repository.
5. Apply the following settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Add the following **Environment Variables** in the service panel:
   - `PORT`: `5000`
   - `JWT_SECRET`: `[Your custom key string]`
   - `DATABASE_URL`: `[Supabase connection pooler URL]`
   - `SUPABASE_URL`: `[Supabase Project URL]`
   - `SUPABASE_ANON_KEY`: `[Supabase Anon Key]`
   - `GEMINI_API_KEY`: `[Google Gemini Token]`
   - `GROQ_API_KEY`: `[Groq API Key]`
   - `OPENROUTER_API_KEY`: `[OpenRouter Key]`
7. Click **Deploy Web Service**!

---

## 📱 Mobile App Connection Configuration

To point your existing React Native application to this newly deployed backend, update your API connection configurations (`services/aiService.js` or matching network clients) to point to your live Render base URL:

```javascript
const BACKEND_BASE_URL = 'https://edumentor-backend.onrender.com';
```
