# SketchIt Code Changes Summary

This document summarizes all code changes needed for production deployment.

## Files Modified

### 1. `apps/frontend/next.config.ts` ✅ UPDATED

**Purpose**: Configure Next.js to transpile workspace packages

**Before**:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**After**:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/common"],
  /* config options here */
};

export default nextConfig;
```

**Why**: Enables monorepo package imports in frontend

---

### 2. `apps/http-backend/package.json` ✅ UPDATED

**Purpose**: Add Vercel Node runtime dependency

**Added to dependencies**:

```json
"@vercel/node": "^2.15.2"
```

**Why**: Required for Vercel serverless function deployment

---

### 3. `apps/http-backend/api/index.ts` ✅ CREATED

**Purpose**: Vercel serverless function wrapper for Express app

**Content**:

```typescript
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "../src/middleware";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.NEXT_PUBLIC_FRONTEND_URL || "",
    ].filter(Boolean),
    credentials: true,
  })
);

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.json({
      message: "Incorrect Input",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data.username,
        password: hashedPassword,
        name: parsedData.data.name,
      },
    });

    res.json({
      userId: user.id,
    });
  } catch (e) {
    res.status(411).json({
      message: "user already exists with this username",
    });
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.json({
      message: "Incorrect Input",
    });
  }

  try {
    const user = await prismaClient.user.findFirst({
      where: {
        email: parsedData.data.username,
      },
    });

    if (!user) {
      res.status(403).json({
        message: "user not found",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      parsedData.data.password,
      user.password
    );

    if (!isPasswordValid) {
      res.status(403).json({
        message: "Incorrect password",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET
    );

    res.json({
      token,
    });
  } catch (e) {
    res.status(411).json({
      message: "Error while signing in",
    });
  }
});

app.post("/room", middleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.json({
      message: "Incorrect Input",
    });
  }

  try {
    //@ts-ignore
    const userId = req.userId;

    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId,
      },
    });

    res.json({
      roomId: room.id,
    });
  } catch (e) {
    res.status(411).json({
      message: "Error while creating a room",
    });
  }
});

app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);

  try {
    const messages = await prismaClient.chat.findMany({
      where: {
        roomId,
      },
      include: {
        user: true,
      },
    });

    res.json({
      messages,
    });
  } catch (e) {
    res.status(411).json({
      message: "Error while getting chats",
    });
  }
});

export default (req: VercelRequest, res: VercelResponse) => {
  return new Promise((resolve) => {
    app(req as any, res as any);
    res.on("finish", resolve);
  });
};
```

**Why**: Vercel requires serverless function handlers instead of `app.listen()`

---

## Configuration Files Created

### 1. `vercel.json` ✅ CREATED

**Purpose**: Configure Vercel deployment for entire monorepo

**Location**: Root directory

---

### 2. `Dockerfile.ws` ✅ CREATED

**Purpose**: Docker image for WebSocket backend deployment to Railway

**Location**: Root directory

---

### 3. `Dockerfile.http` ✅ CREATED

**Purpose**: Docker image for HTTP backend deployment (if using Docker)

**Location**: Root directory

---

### 4. `railway.json` ✅ CREATED

**Purpose**: Railway deployment configuration

**Location**: Root directory

---

## Environment Variables Configuration

### Required Environment Variables

#### Frontend Project (Vercel)

```env
NEXT_PUBLIC_HTTP_BACKEND_URL=https://sketchiit-http-backend-xxx.vercel.app/api
NEXT_PUBLIC_WS_URL=wss://sketchiit-ws-backend-xxx.railway.app
```

#### HTTP Backend Project (Vercel)

```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech:5432/neondb?sslmode=require
JWT_SECRET=your-32-character-random-secret-string
NEXT_PUBLIC_FRONTEND_URL=https://sketchiit-frontend-xxx.vercel.app
```

#### WebSocket Backend (Railway)

```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech:5432/neondb?sslmode=require
JWT_SECRET=your-32-character-random-secret-string
```

**Generate JWT_SECRET**:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## No Changes Needed (Already Correct)

These files are already configured correctly:

✅ `apps/frontend/config.ts` - Correctly reads from env variables
✅ `apps/http-backend/src/index.ts` - Contains all API routes
✅ `apps/ws-backend/src/index.ts` - WebSocket server configured
✅ `packages/backend-common/src/index.ts` - Reads JWT_SECRET from env
✅ `packages/db/prisma/schema.prisma` - Database schema correct
✅ `.vercelrc` - Corepack configuration correct
✅ `.env.example` - Template provided

---

## File Structure After Changes

```
SketchIt/
├── apps/
│   ├── frontend/
│   │   ├── app/
│   │   ├── components/
│   │   ├── next.config.ts ✅ MODIFIED
│   │   └── package.json
│   ├── http-backend/
│   │   ├── api/
│   │   │   └── index.ts ✅ CREATED
│   │   ├── src/
│   │   └── package.json ✅ MODIFIED
│   └── ws-backend/
│       └── src/
├── packages/
│   ├── db/
│   ├── common/
│   └── ...
├── scripts/ ✅ CREATED
│   ├── deploy.sh
│   └── migrate.sh
├── vercel.json ✅ CREATED
├── Dockerfile.ws ✅ CREATED
├── Dockerfile.http ✅ CREATED
├── railway.json ✅ CREATED
├── VERCEL_DEPLOYMENT_GUIDE.md ✅ CREATED
├── QUICK_START_DEPLOY.md ✅ CREATED
├── ENV_SETUP_GUIDE.md ✅ CREATED
├── DEPLOYMENT_CHECKLIST.md ✅ CREATED
├── QUICK_REFERENCE.md ✅ CREATED
└── README.md
```

---

## Deployment Steps Summary

### Step 1: Local Verification

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Verify no errors
pnpm run check-types
pnpm run lint
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "feat: add Vercel/Railway deployment configuration"
git push origin main
```

### Step 3: Create Database

- Sign up at [neon.tech](https://neon.tech)
- Create PostgreSQL database
- Copy connection string

### Step 4: Deploy Frontend

- Vercel Dashboard → Add New Project
- Select SketchIt repo, Next.js framework
- Root: `apps/frontend`
- Add env variables (with temporary localhost values)

### Step 5: Deploy HTTP Backend

- Vercel Dashboard → Add New Project
- Select SketchIt repo, Other framework
- Root: `apps/http-backend`
- Add DATABASE_URL and JWT_SECRET

### Step 6: Deploy WebSocket Backend

- Railway.app → New Project
- Connect GitHub repo
- Root: `apps/ws-backend`
- Add environment variables

### Step 7: Update Frontend URLs

- Update NEXT_PUBLIC_HTTP_BACKEND_URL with actual backend URL
- Update NEXT_PUBLIC_WS_URL with actual WebSocket URL
- Redeploy frontend

### Step 8: Test

- Test signup/signin
- Test room creation
- Test WebSocket connection
- Check error logs

---

## Verification Checklist

After deployment, verify:

```bash
# Test Frontend
curl https://sketchiit-frontend-xxx.vercel.app

# Test HTTP Backend Signup
curl -X POST https://sketchiit-http-backend-xxx.vercel.app/api/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","name":"Test","password":"password123"}'

# Test HTTP Backend Signin
curl -X POST https://sketchiit-http-backend-xxx.vercel.app/api/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password123"}'

# Test WebSocket (in browser console)
const ws = new WebSocket('wss://sketchiit-ws-backend-xxx.railway.app?token=YOUR_JWT');
ws.onopen = () => console.log('Connected');
```

---

## Common Errors & Solutions

### "Module not found"

- Ensure transpilePackages in next.config.ts
- Check root directory settings

### "Cannot connect to database"

- Verify DATABASE_URL format
- Check PostgreSQL is accessible
- Verify connection string from Neon

### "CORS error"

- Update CORS in HTTP backend
- Add frontend URL to allowed origins

### "WebSocket won't connect"

- Ensure using wss:// (not ws://)
- Check JWT_SECRET matches
- Verify Railway deployment logs

---

## Security Notes

⚠️ **NEVER**:

- Commit `.env.local` files
- Put secrets in code
- Use `ws://` in production
- Share environment variables

✅ **ALWAYS**:

- Use `.env.example` with placeholders
- Store secrets in Vercel/Railway dashboards
- Use HTTPS/WSS URLs in production
- Rotate secrets if compromised

---

## Next Steps

1. Review **QUICK_START_DEPLOY.md** for 15-minute deployment
2. Or follow **VERCEL_DEPLOYMENT_GUIDE.md** for complete reference
3. Use **DEPLOYMENT_CHECKLIST.md** for pre-deployment validation
4. Refer to **ENV_SETUP_GUIDE.md** for environment variable details

---

**Status**: ✅ All code changes complete
**Ready for**: Vercel + Railway deployment
**Time to Deploy**: ~15-30 minutes
