# Deployment Guide - Render

This guide covers deploying both the backend API and frontend static site to Render.

## Prerequisites

1. GitHub account with this repository
2. Render account (free tier available)
3. Supabase project (already configured in `backend/.env`)

## Step 1: Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`

## Step 2: Configure Environment Variables

In Render Dashboard, go to your service → "Environment" and add these variables:

### Database (Supabase)

Copy these values from your `backend/.env` file:

```
DATABASE_URL=<your-supabase-pooler-url>
DIRECT_URL=<your-supabase-direct-url>
```

### Supabase Auth

Copy these values from your `backend/.env` file:

```
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_SERVICE_KEY=<your-supabase-service-role-key>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### AI Providers

Copy these values from your `backend/.env` file:

```
ANTHROPIC_API_KEY=<your-anthropic-api-key>
OPENAI_API_KEY=<your-openai-api-key>
```

**⚠️ Security Note:** Never commit API keys to version control. Copy them directly from your local `backend/.env` file to Render Dashboard.

### Server Config (auto-configured in render.yaml)

These are already set in `render.yaml`, but you can override:

```
NODE_ENV=production
PORT=3001
UPLOAD_DIR=/var/data/uploads
MAX_FILE_SIZE=52428800
```

## Step 3: Deploy

1. Click "Apply" in Render
2. Render will:
   - Clone your repository
   - Install dependencies
   - Run `npx prisma generate`
   - Build TypeScript (`npm run build`)
   - Start the server (`npm start`)

3. Monitor deployment logs in Render Dashboard

## Step 4: Verify Deployment

Once deployed, your backend will be available at:

```
https://pacy-backend.onrender.com
```

Test health endpoint:

```bash
curl https://pacy-backend.onrender.com/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "2025-12-19T..." }
```

## Step 5: Configure Frontend Environment Variables

The frontend is automatically deployed along with the backend using the `render.yaml` blueprint.

### Required Environment Variables (Frontend Service)

In Render Dashboard, go to `pacy-frontend` service → "Environment" and add:

**Backend API URL** (auto-configured in render.yaml):

```
VITE_API_URL=https://pacy-backend.onrender.com
```

**Supabase (for client-side auth)**:
Copy these values from your `backend/.env` file:

```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

**⚠️ Note:** The `VITE_` prefix is required for Vite to expose variables to the client.

## Step 6: Verify Frontend Deployment

Once deployed, your frontend will be available at:

```
https://pacy-frontend.onrender.com
```

The frontend automatically:

- ✅ Uses `VITE_API_URL` to connect to backend
- ✅ Handles SPA routing (all routes serve index.html)
- ✅ Sets security headers (X-Frame-Options, X-Content-Type-Options)
- ✅ Connects to backend API via CORS (already configured)

## Step 7: CORS Configuration (Already Done)

Backend CORS is pre-configured in `backend/src/index.ts` to allow:

- `http://localhost:5173` (local development)
- `https://pacy-frontend.onrender.com` (production)
- Custom frontend URL via `FRONTEND_URL` environment variable (optional)

No additional configuration needed unless using a custom domain.

## Database Migrations

Run migrations on production database:

```bash
# In Render shell (Dashboard → Shell tab)
npx prisma migrate deploy
```

Or use Render Blueprint with a `preDeployCommand`:

```yaml
preDeployCommand: cd backend && npx prisma migrate deploy
```

## Troubleshooting

### Build fails

- Check build logs in Render Dashboard
- Verify all dependencies are in `dependencies` (not `devDependencies`)
- Ensure TypeScript compiles locally first: `cd backend && npm run build`

### Health check fails

- Verify `/health` endpoint is accessible
- Check server logs for startup errors
- Ensure PORT environment variable is set

### Database connection fails

- Verify DATABASE_URL is correct
- Check Supabase dashboard for connection limits
- Use DIRECT_URL for migrations, DATABASE_URL for queries

### File uploads fail

- Check disk is mounted at `/var/data/uploads`
- Verify UPLOAD_DIR environment variable
- Ensure disk size is sufficient (1GB default)

## Auto-Deploy

Push to `main` branch to trigger automatic deployment:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render will automatically rebuild and redeploy.

## Monitoring

- **Logs**: Render Dashboard → Logs tab
- **Metrics**: Dashboard → Metrics tab (CPU, memory, requests)
- **Health**: Automatic checks every 30 seconds via `/health`

## Cost Estimate

**Free Tier:**

- Backend (Web Service): Free (spins down after 15 min inactivity)
- Frontend (Static Site): **FREE** (no spin-down, always available)
- Disk: 1GB included
- **Total: $0/month** (with cold starts on backend)

**Starter Plan ($7/month per service):**

- Backend: $7/month (always-on, no cold starts)
- Frontend: **FREE** (static sites are always free on Render)
- **Total: $7/month** (backend only)
- Better performance
- 1GB disk included

**Database:**

- Using existing Supabase (separate billing)
- No additional cost from Render
