Render deployment and DATABASE_URL setup

This project can be deployed to Render (https://render.com).

Steps to configure the service and add `DATABASE_URL`:

1. Create or open your service on Render (Web Service).
2. Connect your GitHub repo and choose the `main` branch.
3. In the service settings, go to the **Environment** tab.
4. Add the environment variable `DATABASE_URL` with your Postgres connection string. Example:

   postgres://username:password@hostname:5432/databasename

   - For Render Postgres addons, use the connection string provided by Render.
   - For external Postgres, use the host/port/user/password for that DB.

5. Set `NODE_ENV` to `production` (if not already set).
6. If you changed environment variables, trigger a redeploy from the Render dashboard.

Troubleshooting:

- If the deploy log shows `FATAL ERROR: DATABASE_URL is not defined`, confirm that `DATABASE_URL` exists in the Environment tab of the service and that it has no leading/trailing whitespace.
- Do not commit `.env` to Git. This repo already ignores `.env` via `.gitignore`.

Render build/start settings (already in this repo):

- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/`

Optional (Render CLI):

You can set env vars via the Render CLI (if you have it configured):

```bash
render services env set <service-id> DATABASE_URL "postgres://username:password@host:5432/dbname"
render services env set <service-id> NODE_ENV production
render services restart <service-id>
```

If you want the instructions added directly to `README.md`, tell me and I'll append a short section and push the change.