# 🚀 Vercel Deployment - Quick Reference

## Pre-Deployment Checklist

- [x] ✅ All TypeScript errors fixed
- [x] ✅ Build passes successfully
- [x] ✅ Environment variables configured
- [ ] 🔲 Code pushed to GitHub
- [ ] 🔲 Backend services deployed
- [ ] 🔲 Database created and migrated
- [ ] 🔲 Frontend deployed to Vercel

---

## Deploy in 3 Steps

### 1️⃣ Deploy Backend & Database (15 min)

**Deploy to Railway:**

```bash
# 1. Go to railway.app
# 2. Create new project
# 3. Add PostgreSQL database
# 4. Deploy http-backend (from apps/http-backend)
# 5. Deploy ws-backend (from apps/ws-backend)
```

**Environment Variables for BOTH backends:**

```env
DATABASE_URL=<copy from Railway PostgreSQL>
JWT_SECRET=<generate random 32+ char string>
```

**Run migrations:**

```bash
# In Railway console or locally with production DATABASE_URL
cd packages/db
npx prisma migrate deploy
```

**Note URLs:**

- HTTP Backend: `https://your-http-backend.up.railway.app`
- WS Backend: `wss://your-ws-backend.up.railway.app`

---

### 2️⃣ Deploy Frontend to Vercel (5 min)

**Option A: GitHub Integration (Recommended)**

1. Push code: `git push origin main`
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import repository: `StealthSilver/SketchIt`
4. Configure:
   - **Root Directory**: `apps/frontend`
   - **Framework**: Next.js
   - **Build Command**: `cd ../.. && pnpm install && pnpm run build --filter=frontend`

**Option B: CLI**

```bash
cd apps/frontend
vercel
# Follow prompts, set root directory to apps/frontend
```

---

### 3️⃣ Configure Environment Variables (2 min)

**In Vercel Dashboard** → Settings → Environment Variables:

| Name                           | Value                           | Environment |
| ------------------------------ | ------------------------------- | ----------- |
| `NEXT_PUBLIC_HTTP_BACKEND_URL` | `https://your-http.railway.app` | Production  |
| `NEXT_PUBLIC_WS_URL`           | `wss://your-ws.railway.app`     | Production  |

**Save and Redeploy** (Vercel will auto-redeploy)

---

## Quick Commands

```bash
# Test build locally
pnpm run build

# Test production build
cd apps/frontend
pnpm run build && pnpm run start

# Run migrations on production DB
DATABASE_URL="your_prod_url" cd packages/db && npx prisma migrate deploy

# View database
cd packages/db && pnpm db:studio
```

---

## Troubleshooting

| Issue                    | Solution                                    |
| ------------------------ | ------------------------------------------- |
| Build fails on Vercel    | Check build command includes `cd ../..`     |
| WebSocket not connecting | Ensure WS_URL uses `wss://` (not `ws://`)   |
| Database errors          | Run migrations: `npx prisma migrate deploy` |
| 500 errors               | Check backend logs on Railway               |
| CORS errors              | Add frontend URL to backend CORS config     |

---

## Architecture

```
Frontend (Vercel)           Backend (Railway)
├─ Next.js App       →     ├─ HTTP Backend (Express)
├─ React             →     ├─ WebSocket Server
└─ Canvas UI         →     └─ PostgreSQL Database (Neon/Railway)
```

---

## Environment URLs

### Development

- Frontend: `http://localhost:3000`
- HTTP Backend: `http://localhost:3001`
- WebSocket: `ws://localhost:8080`

### Production

- Frontend: `https://your-app.vercel.app`
- HTTP Backend: `https://your-http.railway.app`
- WebSocket: `wss://your-ws.railway.app`

---

## Cost Breakdown

| Service   | Free Tier                | Paid          |
| --------- | ------------------------ | ------------- |
| Vercel    | ✅ Unlimited deploys     | $20/mo Pro    |
| Railway   | ✅ $5 free credit/mo     | Pay as you go |
| Neon DB   | ✅ 0.5GB free            | $19/mo Pro    |
| **Total** | **$0** (with free tiers) | ~$40/mo       |

---

## Post-Deployment

1. ✅ Visit your Vercel URL
2. ✅ Create an account
3. ✅ Test creating a room
4. ✅ Test drawing features
5. ✅ Test real-time collaboration
6. ✅ Monitor logs on Railway/Vercel

---

## Support Links

- **Deployment Guide**: `DEPLOYMENT.md`
- **Build Fix Details**: `BUILD_FIX_SUMMARY.md`
- **Database Setup**: `DATABASE_SETUP.md`
- **Quick Fix**: `QUICK_FIX.md`

---

**Ready to deploy? Start with Step 1! 🚀**
