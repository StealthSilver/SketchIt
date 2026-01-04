# SketchIt Deployment Flow - Visual Guide

## Complete Deployment Process

```
START
  ↓
┌─────────────────────────────────────────┐
│  Step 1: Prerequisites Setup (5 min)    │
│                                         │
│  □ Create Vercel Account                │
│  □ Create Railway Account               │
│  □ Create Neon Account                  │
│  □ Verify Git repository on GitHub      │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Step 2: Database Setup (2 min)         │
│                                         │
│  □ Go to neon.tech                      │
│  □ Create PostgreSQL database           │
│  □ Copy CONNECTION STRING               │
│  □ Save as DATABASE_URL                 │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Step 3: Generate Secrets (1 min)       │
│                                         │
│  $ node -e "console.log(               │
│    require('crypto')                   │
│    .randomBytes(32).toString('hex')    │
│  )"                                     │
│                                         │
│  □ Save output as JWT_SECRET            │
└────────────────┬────────────────────────┘
                 ↓
         ┌───────┴───────┐
         ↓               ↓
    ┌─────────┐    ┌──────────────┐
    │FRONTEND │    │HTTP BACKEND  │
    │DEPLOY   │    │DEPLOY        │
    └────┬────┘    └──────┬───────┘
         │                │
    ┌────────────────────────────────────┐
    │  Vercel Setup (3 min each)         │
    │                                    │
    │  1. Go to vercel.com/dashboard     │
    │  2. Click "Add New" → "Project"    │
    │  3. Select SketchIt GitHub repo    │
    │  4. Choose Framework:              │
    │     - Frontend: Next.js             │
    │     - Backend: Other                │
    │  5. Root Directory:                │
    │     - Frontend: apps/frontend      │
    │     - Backend: apps/http-backend   │
    │  6. Add Env Variables:             │
    │     - Frontend: API URLs           │
    │     - Backend: DATABASE_URL,       │
    │       JWT_SECRET                   │
    │  7. Click Deploy                   │
    │  8. Wait for deployment...         │
    │  9. Note the deployment URLs       │
    └────────────────┬───────────────────┘
                     │
           ┌─────────┴─────────┐
           ↓                   ↓
    ┌────────────┐    ┌──────────────────┐
    │Run DB      │    │Note URLs         │
    │Migrations  │    │                  │
    │            │    │Frontend: .vercel │
    │$ DATABASE_ │    │Backend: .vercel  │
    │URL=...     │    └──────┬───────────┘
    │npx prisma  │           │
    │migrate     │      ┌────┴───────────┐
    │deploy      │      │               │
    └────────────┘      ↓               ↓
                  ┌──────────────────────────────┐
                  │  WebSocket Backend (2 min)   │
                  │                              │
                  │  1. Go to railway.app        │
                  │  2. New Project              │
                  │  3. Connect GitHub           │
                  │  4. Select SketchIt repo     │
                  │  5. Root: apps/ws-backend    │
                  │  6. Add Env Variables:       │
                  │     DATABASE_URL             │
                  │     JWT_SECRET               │
                  │  7. Deploy                   │
                  │  8. Wait for deployment      │
                  │  9. Note WebSocket URL       │
                  └────────────┬─────────────────┘
                               ↓
                  ┌──────────────────────────────┐
                  │  Update Frontend Env Vars    │
                  │  (1 min)                     │
                  │                              │
                  │  Vercel Dashboard:           │
                  │  Frontend Project Settings   │
                  │                              │
                  │  Add:                        │
                  │  NEXT_PUBLIC_HTTP_BACKEND_URL│
                  │    = HTTP backend URL        │
                  │  NEXT_PUBLIC_WS_URL          │
                  │    = WebSocket URL           │
                  │                              │
                  │  Click "Redeploy"            │
                  │  Wait for deployment...      │
                  └────────────┬─────────────────┘
                               ↓
                  ┌──────────────────────────────┐
                  │  Verification Testing        │
                  │  (5 min)                     │
                  │                              │
                  │  □ Frontend loads            │
                  │  □ Can signup                │
                  │  □ Can signin                │
                  │  □ Can create room           │
                  │  □ WebSocket connects        │
                  │  □ No console errors         │
                  │  □ No CORS errors            │
                  │  □ Database has data         │
                  └────────────┬─────────────────┘
                               ↓
                  ┌──────────────────────────────┐
                  │  SUCCESS! ✅                 │
                  │                              │
                  │  Your app is live at:        │
                  │  https://sketchiit-          │
                  │    frontend-xxx.vercel.app   │
                  │                              │
                  │  Check DEPLOYMENT_CHECKLIST  │
                  │  for post-deployment tasks   │
                  └──────────────────────────────┘
END
```

---

## Service Deployment Dependency Graph

```
                ┌─────────────────┐
                │ Neon Database   │
                │ (PostgreSQL)    │
                └────────┬────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ↓             ↓             ↓
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │ Vercel HTTP  │ │ Vercel   │ │ Railway      │
    │ Backend      │ │Frontend  │ │ WebSocket    │
    │ (API)        │ │(Next.js) │ │ (Node.js)    │
    └──────┬───────┘ └────┬─────┘ └──────┬───────┘
           │              │              │
           └──────────────┼──────────────┘
                          ↓
                    ┌──────────────┐
                    │  Browser     │
                    │  Client      │
                    └──────────────┘
```

---

## Environment Variable Flow

```
┌────────────────────────────────────────────────────────┐
│  Your Secrets (Generated & Stored Safely)              │
│                                                         │
│  ✓ DATABASE_URL ............. From Neon               │
│  ✓ JWT_SECRET ............... Generated               │
└────────────────┬─────────────────────────┬─────────────┘
                 │                         │
        ┌────────┴────────┐        ┌───────┴────────┐
        ↓                 ↓        ↓                ↓
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │Vercel HTTP   │  │Railway       │  │Vercel        │
  │Backend Env   │  │WebSocket Env │  │Frontend Env  │
  │              │  │              │  │              │
  │DATABASE_URL  │  │DATABASE_URL  │  │NEXT_PUBLIC_  │
  │JWT_SECRET    │  │JWT_SECRET    │  │HTTP_BACKEND_ │
  │              │  │              │  │URL           │
  │              │  │              │  │NEXT_PUBLIC_  │
  │              │  │              │  │WS_URL        │
  └──────────────┘  └──────────────┘  └──────────────┘
        │                 │                    │
        └─────────────────┼────────────────────┘
                          ↓
              ┌───────────────────────┐
              │  At Runtime           │
              │  Env vars loaded      │
              │  Services connect     │
              │  App runs!            │
              └───────────────────────┘
```

---

## Data Flow at Runtime

```
┌──────────────────────────────────────────────────────────┐
│  User Browser                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Frontend (Next.js)                                │  │
│  │  - Pages                                           │  │
│  │  - Components (Canvas, Chat, etc)                  │  │
│  │  - Reads: NEXT_PUBLIC_HTTP_BACKEND_URL             │  │
│  │          NEXT_PUBLIC_WS_URL                        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────┬─────────────────────────────┬──────────────┘
               │                             │
               │ REST API Calls              │ WebSocket
               │ (JSON)                      │ (Real-time)
               │                             │
        ┌──────┴─────────┐            ┌────┴────────────┐
        ↓                ↓            ↓                 ↓
   ┌─────────────┐  ┌──────────┐ ┌──────────┐  ┌─────────────┐
   │/signup      │  │/signin   │ │/room     │  │WebSocket    │
   │(POST)       │  │(POST)    │ │(POST)    │  │Connection   │
   │             │  │          │ │          │  │             │
   │Returns:     │  │Returns:  │ │Returns:  │  │Broadcasts: │
   │userId       │  │JWT token │ │roomId    │  │Draw events  │
   └──────┬──────┘  └────┬─────┘ └────┬─────┘  └──────┬──────┘
          │               │            │               │
          └───────────────┼────────────┴───────────────┘
                          ↓
          ┌───────────────────────────────┐
          │  Vercel HTTP Backend          │
          │  (Express.js)                 │
          │  ┌──────────────────────────┐ │
          │  │ Express Routes           │ │
          │  │ - Signup handler         │ │
          │  │ - Signin handler         │ │
          │  │ - Create room handler    │ │
          │  │ - Get chats handler      │ │
          │  └──────────────────────────┘ │
          │                                │
          │  + Railway WebSocket Backend   │
          │    (Node.js)                   │
          │  ┌──────────────────────────┐  │
          │  │ WebSocket Server         │  │
          │  │ - Connection handler     │  │
          │  │ - Message broadcast      │  │
          │  │ - User management        │  │
          │  └──────────────────────────┘  │
          └───────────────┬────────────────┘
                          ↓
          ┌───────────────────────────────┐
          │  PostgreSQL (Neon)            │
          │  ┌──────────────────────────┐ │
          │  │ Users Table              │ │
          │  │ - id, email, password    │ │
          │  │ - name, photo            │ │
          │  ├──────────────────────────┤ │
          │  │ Rooms Table              │ │
          │  │ - id, slug               │ │
          │  │ - adminId, createdAt     │ │
          │  ├──────────────────────────┤ │
          │  │ Chats Table              │ │
          │  │ - id, roomId, message    │ │
          │  │ - userId, timestamp      │ │
          │  └──────────────────────────┘ │
          └───────────────────────────────┘
```

---

## Deployment Timeline

```
Timeline: 15-30 minutes total

T+0:00   Start
         ↓
T+0:05   Prerequisites done
         ↓
T+0:07   Database created (Neon)
         ↓
T+0:08   Secrets generated
         ↓
T+0:11   Frontend deployed (Vercel)
         ├─ Building...
         ├─ Deploying...
         └─ Live! (may show API errors)
         ↓
T+0:14   HTTP Backend deployed (Vercel)
         ├─ Building...
         ├─ Deploying...
         └─ Live!
         ↓
T+0:16   DB Migrations run
         ├─ Connected to Neon...
         ├─ Applying migrations...
         └─ Complete!
         ↓
T+0:18   WebSocket Backend deployed (Railway)
         ├─ Building...
         ├─ Deploying...
         └─ Live!
         ↓
T+0:19   Frontend updated & redeployed
         ├─ Updated env vars...
         ├─ Redeploying...
         └─ Live!
         ↓
T+0:24   Testing
         ├─ Frontend loads ✓
         ├─ Can signup ✓
         ├─ Can signin ✓
         ├─ WebSocket connects ✓
         └─ All tests pass ✓
         ↓
T+0:30   COMPLETE! 🎉

Total time: ~15-30 minutes
```

---

## Troubleshooting Decision Tree

```
┌─────────────────────────────────────┐
│  Something went wrong?              │
└────────────┬────────────────────────┘
             ↓
    ┌────────────────────┐
    │ Which service?     │
    └────┬───────┬───┬───┘
         │       │   │
    FRONTEND  HTTP  WS  DB
         │       │   │   │
         ↓       ↓   ↓   ↓
    F  HTTP WS  DB  ERR

FRONTEND Errors:
├─ Can't load page?
│  ├─ Check Vercel deployment logs
│  ├─ Check browser console for errors
│  └─ Verify NEXT_PUBLIC_* env vars
├─ CORS errors?
│  ├─ Check HTTP backend CORS config
│  └─ Verify frontend URL in backend
└─ 404 on routes?
   ├─ Check root directory setting
   └─ Verify app/pages structure

HTTP BACKEND Errors:
├─ 500 errors?
│  ├─ Check Vercel function logs
│  ├─ Verify DATABASE_URL is correct
│  └─ Verify JWT_SECRET is set
├─ Database connection fails?
│  ├─ Test connection string: psql $DATABASE_URL
│  ├─ Check Neon credentials
│  └─ Verify SSL mode
└─ Module not found?
   ├─ Check root directory
   └─ Verify all dependencies in package.json

WEBSOCKET Errors:
├─ Won't connect?
│  ├─ Check Railway logs
│  ├─ Verify wss:// protocol (not ws://)
│  └─ Verify JWT_SECRET matches
├─ Connection drops?
│  ├─ Check Railway resource usage
│  └─ Review connection handler code
└─ 404 on WebSocket?
   ├─ Verify Railway deployment
   └─ Check port configuration

DATABASE Errors:
├─ Connection refused?
│  ├─ Verify Neon is running
│  ├─ Check connection string format
│  └─ Verify IP whitelisting
├─ Migrations failed?
│  ├─ Check SQL syntax
│  ├─ Verify schema changes
│  └─ Review migration logs
└─ Data not persisting?
   ├─ Verify table creation
   ├─ Check write permissions
   └─ Review Prisma schema
```

---

## After Deployment Checklist

```
Week 1: Monitor
├─ [ ] Check logs daily
├─ [ ] Monitor error rates
├─ [ ] Verify WebSocket stability
└─ [ ] Test all features

Week 2-4: Optimize
├─ [ ] Review performance metrics
├─ [ ] Optimize database queries
├─ [ ] Setup monitoring (Sentry)
└─ [ ] Update team documentation

Month 2+: Maintain
├─ [ ] Regular security updates
├─ [ ] Dependency updates
├─ [ ] Database backup verification
└─ [ ] Scaling considerations
```

---

## Quick Status Check Commands

```bash
# Check frontend status
curl -I https://sketchiit-frontend-xxx.vercel.app

# Check HTTP backend status
curl -I https://sketchiit-http-backend-xxx.vercel.app/api

# Check WebSocket (in browser console)
const ws = new WebSocket('wss://sketchiit-ws-backend-xxx.railway.app?token=test');
ws.onerror = (e) => console.error('WS Error:', e);
ws.onopen = () => console.log('WS Connected!');

# Check database connection
psql "your-connection-string" -c "SELECT COUNT(*) FROM users;"
```

---

**Visual Guide Created**: January 4, 2026
**Format**: ASCII Diagrams + Flow Charts
**Usage**: Reference for deployment understanding
