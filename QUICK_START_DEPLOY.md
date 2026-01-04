# Quick Start: Deploy SketchIt to Vercel + Railway

Complete deployment in 15 minutes!

## Prerequisites

- GitHub account with SketchIt repository
- Vercel account (free)
- Railway account (free)
- Neon account (free PostgreSQL)

## Step 1: Setup Database (5 minutes)

### Create Neon Database

```bash
# 1. Go to https://neon.tech
# 2. Create account
# 3. Create new project
# 4. Copy connection string
# Example: postgresql://user:pass@ep-xxx.neon.tech:5432/neondb?sslmode=require
```

Save this as your `DATABASE_URL`.

## Step 2: Generate Secrets (2 minutes)

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a3f8c9e2b1d4e7f0a5c8b1e4d7a0f3c6e9b2d5f8a1c4e7b0d3f6a9c2e5f8b1

# Save this value
```

## Step 3: Deploy Frontend to Vercel (3 minutes)

```bash
# 1. Go to https://vercel.com/dashboard
# 2. Click "Add New" → "Project"
# 3. Import your GitHub SketchIt repository
# 4. Framework: Next.js
# 5. Root Directory: apps/frontend
# 6. Click "Deploy"

# Wait for deployment...

# After deployment, you'll get frontend URL:
# https://sketchiit-frontend-xxx.vercel.app
```

### Add Frontend Environment Variables

In Vercel Dashboard → Your Frontend Project → Settings → Environment Variables:

```
NEXT_PUBLIC_HTTP_BACKEND_URL = https://sketchiit-http-backend-xxx.vercel.app/api
NEXT_PUBLIC_WS_URL = wss://sketchiit-ws-backend-xxx.railway.app
```

(You'll update these after deploying backends)

## Step 4: Deploy HTTP Backend to Vercel (3 minutes)

```bash
# 1. Go to https://vercel.com/dashboard
# 2. Click "Add New" → "Project"
# 3. Import your GitHub SketchIt repository (SAME repo)
# 4. Framework: Other
# 5. Root Directory: apps/http-backend
# 6. Click "Deploy"

# Wait for deployment...

# After deployment, you'll get HTTP backend URL:
# https://sketchiit-http-backend-xxx.vercel.app
```

### Add HTTP Backend Environment Variables

In Vercel Dashboard → Your HTTP Backend Project → Settings → Environment Variables:

```
DATABASE_URL = postgresql://user:pass@ep-xxx.neon.tech:5432/neondb?sslmode=require
JWT_SECRET = a3f8c9e2b1d4e7f0a5c8b1e4d7a0f3c6e9b2d5f8a1c4e7b0d3f6a9c2e5f8b1
NEXT_PUBLIC_FRONTEND_URL = https://sketchiit-frontend-xxx.vercel.app
```

### Run Database Migrations

```bash
# Connect to your Vercel deployment to run migrations
vercel connect

# Set DATABASE_URL
vercel env add DATABASE_URL

# Run migrations via deployment hook or manually:
# In terminal:
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech:5432/neondb?sslmode=require"
cd packages/db
npx prisma migrate deploy
```

## Step 5: Deploy WebSocket Backend to Railway (2 minutes)

```bash
# 1. Go to https://railway.app
# 2. Create new project
# 3. Deploy from GitHub repo
# 4. Select repository: SketchIt
# 5. Root directory: apps/ws-backend (or leave empty if Railway auto-detects)
# 6. Add variables:

DATABASE_URL = postgresql://user:pass@ep-xxx.neon.tech:5432/neondb?sslmode=require
JWT_SECRET = a3f8c9e2b1d4e7f0a5c8b1e4d7a0f3c6e9b2d5f8a1c4e7b0d3f6a9c2e5f8b1

# 7. Click "Deploy"

# After deployment, you'll get WebSocket URL:
# wss://sketchiit-ws-backend-xxx.railway.app
```

## Step 6: Update Frontend Environment Variables (1 minute)

Go back to Vercel Dashboard → Frontend Project → Settings → Environment Variables

Update with actual backend URLs:

```
NEXT_PUBLIC_HTTP_BACKEND_URL = https://sketchiit-http-backend-xxx.vercel.app/api
NEXT_PUBLIC_WS_URL = wss://sketchiit-ws-backend-xxx.railway.app
```

Then trigger redeployment:

- Go to Deployments
- Click on latest deployment
- Click "Redeploy"

## Verification

### Test Frontend

```bash
curl https://sketchiit-frontend-xxx.vercel.app
# Should return HTML
```

### Test HTTP Backend

```bash
curl https://sketchiit-http-backend-xxx.vercel.app/api/health
# Should return JSON response
```

### Test WebSocket Backend

```bash
# Using websocat
websocat wss://sketchiit-ws-backend-xxx.railway.app

# Or in browser console of your app, check WebSocket connection
```

## Quick Troubleshooting

### "Cannot connect to database"

```bash
# Verify DATABASE_URL is correct
psql "postgresql://user:pass@ep-xxx.neon.tech:5432/neondb?sslmode=require" -c "SELECT 1;"
```

### "JWT errors"

```bash
# Ensure JWT_SECRET is same in all backends
# Regenerate if different:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### "CORS errors"

```bash
# Check backend CORS is allowing frontend domain
# Add to http-backend CORS configuration:
"https://sketchiit-frontend-xxx.vercel.app"
```

### "WebSocket won't connect"

```bash
# Verify wss:// protocol is used (not ws://)
# Check Railway logs for errors
# Verify JWT_SECRET in WebSocket backend
```

## Environment Variables Reference

| Service      | Variable                     | Value                                                               |
| ------------ | ---------------------------- | ------------------------------------------------------------------- |
| Frontend     | NEXT_PUBLIC_HTTP_BACKEND_URL | https://sketchiit-http-backend-xxx.vercel.app/api                   |
| Frontend     | NEXT_PUBLIC_WS_URL           | wss://sketchiit-ws-backend-xxx.railway.app                          |
| HTTP Backend | DATABASE_URL                 | postgresql://user:pass@ep-xxx.neon.tech:5432/neondb?sslmode=require |
| HTTP Backend | JWT_SECRET                   | (32 char secret)                                                    |
| HTTP Backend | NEXT_PUBLIC_FRONTEND_URL     | https://sketchiit-frontend-xxx.vercel.app                           |
| WS Backend   | DATABASE_URL                 | postgresql://user:pass@ep-xxx.neon.tech:5432/neondb?sslmode=require |
| WS Backend   | JWT_SECRET                   | (32 char secret)                                                    |

## Deployment URLs Format

- **Frontend**: `https://<project>-frontend-<random>.vercel.app`
- **HTTP Backend**: `https://<project>-http-backend-<random>.vercel.app`
- **WebSocket Backend**: `https://<project>-ws-backend-<random>.railway.app`

Replace `<project>` with your project name and `<random>` with auto-generated suffix.

## Common Errors & Solutions

| Error                       | Solution                                    |
| --------------------------- | ------------------------------------------- |
| Module not found            | Check root directory setting                |
| Database connection error   | Verify DATABASE_URL, check Neon credentials |
| CORS error                  | Update CORS allowed origins in backend      |
| WebSocket connection failed | Ensure wss:// protocol, check JWT_SECRET    |
| Timeout on first request    | First request can be slow, retry after 10s  |

## Post-Deployment

- [ ] Test all user flows
- [ ] Check error logs in Vercel/Railway dashboards
- [ ] Setup monitoring (optional: Sentry, LogRocket)
- [ ] Enable database backups in Neon
- [ ] Add custom domain (optional)

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

**Total Time**: ~15 minutes
**Cost**: Free (all services have free tier)
