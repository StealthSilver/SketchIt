# SketchIt Complete Deployment Package

## 📦 What You Have

Your SketchIt application is now fully configured for deployment! This package includes everything needed to deploy your monorepo application to Vercel and Railway.

## 📋 Files Created/Updated

### Configuration Files

- ✅ **`vercel.json`** - Vercel deployment configuration
- ✅ **`Dockerfile.ws`** - WebSocket backend Docker image
- ✅ **`Dockerfile.http`** - HTTP backend Docker image
- ✅ **`railway.json`** - Railway deployment configuration
- ✅ **`.vercelrc`** - Vercel runtime configuration

### Updated Source Files

- ✅ **`apps/frontend/next.config.ts`** - Added transpilePackages configuration
- ✅ **`apps/http-backend/package.json`** - Added @vercel/node dependency
- ✅ **`apps/http-backend/api/index.ts`** - Vercel serverless function wrapper (NEW)

### Documentation

- ✅ **`VERCEL_DEPLOYMENT_GUIDE.md`** - Complete 15-step deployment guide (comprehensive)
- ✅ **`QUICK_START_DEPLOY.md`** - 6-step quick deployment (15 minutes)
- ✅ **`ENV_SETUP_GUIDE.md`** - Complete environment variables setup guide
- ✅ **`DEPLOYMENT_CHECKLIST.md`** - 12-phase pre-deployment checklist
- ✅ **`QUICK_REFERENCE.md`** - This file (quick reference)

### Scripts

- ✅ **`scripts/deploy.sh`** - Interactive deployment script
- ✅ **`scripts/migrate.sh`** - Database migration script

## 🚀 Quick Start (Choose One)

### Option A: 15-Minute Deployment (Recommended for MVP)

Follow **`QUICK_START_DEPLOY.md`**

### Option B: Complete Deployment

Follow **`VERCEL_DEPLOYMENT_GUIDE.md`**

### Option C: Using Interactive Script

```bash
bash scripts/deploy.sh
```

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        SketchIt                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Frontend         │  │ HTTP Backend │  │ WS Backend │ │
│  │  (Next.js)         │  │ (Express)    │  │ (Node.js)  │ │
│  │  Vercel            │  │ Vercel Func  │  │ Railway    │ │
│  └─────────┬──────────┘  └──────┬───────┘  └─────┬──────┘ │
│            │                    │               │         │
│            └────────────────────┴───────────────┘         │
│                                                             │
│            ┌───────────────────────────────┐               │
│            │   PostgreSQL (Neon)           │               │
│            │   Shared Database             │               │
│            └───────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Environment Variables Needed

### Generate These Values

```bash
# 1. Database URL (from Neon)
postgresql://user:password@ep-xxx.neon.tech:5432/neondb?sslmode=require

# 2. JWT Secret (generate this)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a3f8c9e2b1d4e7f0a5c8b1e4d7a0f3c6e9b2d5f8a1c4e7b0d3f6a9c2e5f8b1
```

### Required for Each Service

| Service      | Variables                                            |
| ------------ | ---------------------------------------------------- |
| Frontend     | `NEXT_PUBLIC_HTTP_BACKEND_URL`, `NEXT_PUBLIC_WS_URL` |
| HTTP Backend | `DATABASE_URL`, `JWT_SECRET`                         |
| WS Backend   | `DATABASE_URL`, `JWT_SECRET`                         |

See **`ENV_SETUP_GUIDE.md`** for detailed explanations.

## 📝 Pre-Deployment Checklist

- [ ] All code committed to Git
- [ ] Local tests passing (`pnpm run build`)
- [ ] No TypeScript errors (`pnpm run check-types`)
- [ ] Database connection string ready (Neon)
- [ ] JWT_SECRET generated
- [ ] Vercel account created
- [ ] Railway account created
- [ ] GitHub repository accessible

## 🔧 Deployment Steps Summary

### 1. Create Database (5 min)

- Sign up at [neon.tech](https://neon.tech)
- Create PostgreSQL database
- Copy connection string

### 2. Generate Secrets (2 min)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Deploy Frontend (3 min)

- Vercel Dashboard → Add New Project
- Select SketchIt repo, Next.js framework
- Root directory: `apps/frontend`

### 4. Deploy HTTP Backend (3 min)

- Vercel Dashboard → Add New Project
- Select SketchIt repo (same repo), Other framework
- Root directory: `apps/http-backend`

### 5. Deploy WebSocket Backend (2 min)

- Railway.app → New Project
- Connect GitHub, select SketchIt repo
- Add environment variables

### 6. Update URLs & Redeploy Frontend (1 min)

- Add actual backend URLs to frontend env vars
- Trigger redeployment

**Total Time: ~15 minutes**

## 📚 Documentation Map

| Document                     | Purpose                       | Read Time |
| ---------------------------- | ----------------------------- | --------- |
| `QUICK_START_DEPLOY.md`      | Fast deployment guide         | 5 min     |
| `VERCEL_DEPLOYMENT_GUIDE.md` | Complete reference            | 20 min    |
| `ENV_SETUP_GUIDE.md`         | Environment variables details | 10 min    |
| `DEPLOYMENT_CHECKLIST.md`    | Pre/post deployment checklist | 10 min    |
| This file                    | Quick reference               | 3 min     |

## 🆘 Common Issues & Solutions

### "Module not found"

- Check root directory in Vercel matches your file structure
- Verify `transpilePackages` in `next.config.ts`

### "Cannot connect to database"

- Verify DATABASE_URL format
- Check Neon credentials
- Ensure SSL mode is `require`

### "CORS error"

- Update CORS allowed origins in backend
- Include frontend URL in whitelist

### "WebSocket won't connect"

- Ensure using `wss://` (not `ws://`) in production
- Check JWT_SECRET matches in all backends
- Verify Railway deployment logs

### "JWT errors"

- Ensure same JWT_SECRET in all services
- Check token hasn't expired
- Regenerate if secret changed

See **`VERCEL_DEPLOYMENT_GUIDE.md`** → "Common Issues & Solutions" for more.

## 🔐 Security Checklist

- [ ] No secrets in `.env.local` committed to git
- [ ] `.env.local` in `.gitignore`
- [ ] All secrets in Vercel/Railway dashboards
- [ ] Using HTTPS/WSS in production
- [ ] CORS properly configured
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens verified on all endpoints

## 📊 Deployment Checklist

Use **`DEPLOYMENT_CHECKLIST.md`** with these phases:

1. Phase 1: Pre-Deployment Setup (Local)
2. Phase 2: Cloud Setup
3. Phase 3: Vercel Frontend Deployment
4. Phase 4: Vercel HTTP Backend Deployment
5. Phase 5: Railway WebSocket Backend Deployment
6. Phase 6: Update Frontend Environment Variables
7. Phase 7: Comprehensive Testing
8. Phase 8: Monitoring & Logging Setup
9. Phase 9: Backup & Security
10. Phase 10: Documentation & Handoff
11. Phase 11: Post-Deployment Monitoring
12. Phase 12: Production Optimization

## 🎯 What Gets Deployed Where

```
Frontend (Next.js)
├── Platform: Vercel
├── URL: https://sketchiit-frontend-xxx.vercel.app
└── Features: Static/SSR pages, API routes

HTTP Backend (Express)
├── Platform: Vercel Serverless Functions
├── URL: https://sketchiit-http-backend-xxx.vercel.app/api
└── Routes: /signup, /signin, /room, /chats/:roomId

WebSocket Backend (Node.js)
├── Platform: Railway (persistent process)
├── URL: wss://sketchiit-ws-backend-xxx.railway.app
└── Features: Real-time drawing sync, WebSocket connections

Database (PostgreSQL)
├── Platform: Neon
├── Type: Cloud PostgreSQL
└── Shared: Used by all backends
```

## 💡 Key Concepts

### Monorepo Structure

- All apps/packages in single Git repo
- Shared dependencies managed by pnpm workspaces
- Deployed as separate services on separate platforms

### Environment Variables

- **Public** (NEXT*PUBLIC*\*): Sent to browser, visible in frontend
- **Private**: Only in backend, never sent to browser
- Different values per environment (dev/prod)

### Vercel Functions

- Express app converted to serverless functions
- Each request gets new container instance
- Better for stateless APIs
- Database connections pooled

### WebSocket on Railway

- Vercel doesn't support persistent WebSockets
- Railway provides long-running processes
- Ideal for WebSocket servers

## 🚨 Important Notes

### Do NOT Do This

- ❌ Commit `.env.local` or `.env.production.local`
- ❌ Put secrets in code
- ❌ Use `ws://` in production (always use `wss://`)
- ❌ Deploy WebSocket to Vercel (won't work)
- ❌ Share environment variables in chat/email

### Do This Instead

- ✅ Use Vercel/Railway dashboards for secrets
- ✅ Use `.env.example` with placeholders
- ✅ Rotate secrets regularly
- ✅ Use environment variables for configuration
- ✅ Monitor logs after deployment

## 📞 Support Resources

| Resource          | URL                        |
| ----------------- | -------------------------- |
| Vercel Docs       | https://vercel.com/docs    |
| Next.js Docs      | https://nextjs.org/docs    |
| Railway Docs      | https://docs.railway.app   |
| Neon Docs         | https://neon.tech/docs     |
| Prisma Docs       | https://www.prisma.io/docs |
| Express Docs      | https://expressjs.com      |
| Node.js WebSocket | https://nodejs.org/en/docs |

## 📈 Next Steps (After Deployment)

1. **Monitoring**
   - Setup Sentry or LogRocket for error tracking
   - Monitor Vercel/Railway dashboards daily

2. **Optimization**
   - Analyze performance metrics
   - Optimize database queries
   - Setup caching if needed

3. **Scaling**
   - Monitor user growth
   - Plan for horizontal scaling
   - Consider CDN for static assets

4. **Maintenance**
   - Regular security updates
   - Database backups verification
   - Dependency updates
   - Performance tuning

## 📞 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Neon Console**: https://console.neon.tech
- **GitHub**: Your repository
- **Local Development**: `pnpm run dev` in root

## 🎓 Learning Resources

If new to these technologies:

- Vercel Deployment Guide: https://vercel.com/docs/concepts/deployments/overview
- Next.js Full Course: https://nextjs.org/learn
- Express.js Tutorial: https://expressjs.com/en/starter/basic-routing.html
- WebSocket Guide: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- Prisma Tutorial: https://www.prisma.io/docs/getting-started

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at HTTPS URL
- [ ] Can signup (creates user in database)
- [ ] Can signin (returns JWT token)
- [ ] Can create room
- [ ] Can load existing room
- [ ] WebSocket connects (real-time updates)
- [ ] No CORS errors in browser console
- [ ] No errors in Vercel/Railway logs
- [ ] Database has user/room/chat records

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Frontend loads without errors
- ✅ All API endpoints respond correctly
- ✅ WebSocket connections establish
- ✅ Real-time features work (drawing sync)
- ✅ No 500 errors in logs
- ✅ Database queries execute correctly
- ✅ CORS properly configured
- ✅ All features tested end-to-end

---

## 📖 How to Use This Package

1. **First Time**: Read `QUICK_START_DEPLOY.md` (15 min)
2. **Getting Details**: Read `VERCEL_DEPLOYMENT_GUIDE.md` (comprehensive)
3. **Setting Env Vars**: Follow `ENV_SETUP_GUIDE.md` (reference)
4. **Before Deploying**: Check `DEPLOYMENT_CHECKLIST.md` (validation)
5. **Troubleshooting**: See each guide's "Common Issues" section

---

**Created**: January 4, 2026
**Status**: Ready for Production Deployment
**Version**: 1.0

Next action: Choose QUICK_START or COMPLETE_GUIDE and begin deployment!
