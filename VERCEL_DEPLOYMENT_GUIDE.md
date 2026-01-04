# Complete SketchIt Application Deployment Guide for Vercel

This guide covers the complete deployment process for your SketchIt monorepo application (Frontend + HTTP Backend + WebSocket Backend) on Vercel.

## Architecture Overview

```
SketchIt Monorepo
├── apps/
│   ├── frontend (Next.js - deployed on Vercel)
│   ├── http-backend (Express API - deployed on Vercel Functions)
│   └── ws-backend (WebSocket - deployed separately)
├── packages/
│   ├── db (Prisma)
│   ├── common (shared types)
│   ├── backend-common (shared config)
│   └── ui (shared components)
```

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your SketchIt repo should be on GitHub
3. **PostgreSQL Database**: Set up on:
   - Neon (Recommended for Vercel)
   - AWS RDS
   - Railway
   - DigitalOcean
4. **Node.js >= 18**
5. **pnpm** package manager

## Step 1: Database Setup (Neon PostgreSQL)

### Option A: Using Neon (Recommended for Vercel)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string that looks like:
   ```
   postgresql://user:password@ep-xxx-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require
   ```
4. Save this as `DATABASE_URL`

### Option B: Using Railway

1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the database URL

## Step 2: Prepare Your Repository

### 2.1 Update Configuration Files

#### Update `packages/backend-common/src/index.ts`

Currently:

```typescript
export const JWT_SECRET = process.env.JWT_SECRET || "123123";
```

No changes needed - it already reads from environment variables.

#### Update `apps/frontend/config.ts`

Currently:

```typescript
export const HTTP_BACKEND =
  process.env.NEXT_PUBLIC_HTTP_BACKEND_URL || "http://localhost:3001";

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
```

This is already correct. No changes needed.

### 2.2 Update HTTP Backend for Vercel

Since Vercel Functions have limitations, create a wrapper at `apps/http-backend/api/index.ts`:

```typescript
// apps/http-backend/api/index.ts
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

const app = express();

app.use(express.json());
app.use(cors());

// Copy all your route handlers from src/index.ts here
// Remove the hardcoded port and app.listen()

export default app;
```

### 2.3 Update `apps/http-backend/package.json`

```json
{
  "name": "http-backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "build": "tsc -b",
    "dev": "npm run build && npm run start",
    "start": "node ./dist/index.js",
    "vercel-build": "tsc -b"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "@types/bcrypt": "^6.0.0",
    "@types/jsonwebtoken": "^9.0.10",
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@repo/backend-common": "workspace:*",
    "@repo/common": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.3"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": ""
}
```

### 2.4 Create `.env.production.local` (Local Only - DO NOT COMMIT)

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET="your-super-secret-key-min-32-characters-long-change-this"
NEXT_PUBLIC_HTTP_BACKEND_URL="https://your-backend-domain.vercel.app/api"
NEXT_PUBLIC_WS_URL="wss://your-ws-backend-domain.vercel.app"
```

### 2.5 Update `.env.example` (Commit This)

```env
# Environment Variables Template
# Copy this file to .env.production.local and update with your actual values
# DO NOT commit .env.production.local

# Database Configuration
# Use a production PostgreSQL database (Neon, Railway, AWS RDS, etc.)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# JWT Secret for authentication - MUST be secure in production (32+ characters)
JWT_SECRET="your-secret-key-change-this-in-production"

# Frontend API endpoints
NEXT_PUBLIC_HTTP_BACKEND_URL="https://your-http-backend.vercel.app/api"
NEXT_PUBLIC_WS_URL="wss://your-ws-backend.vercel.app"
```

### 2.6 Update `.vercelrc` (if using Corepack)

```plaintext
ENABLE_EXPERIMENTAL_COREPACK=1
```

## Step 3: Deployment Strategy

### Option A: Deploy Everything to Single Vercel Project (Recommended for MVP)

**Frontend**: Vercel Hobby
**HTTP Backend**: Vercel Serverless Functions
**WebSocket Backend**: Separate Vercel or Railway/Render

### Option B: Deploy to Multiple Vercel Projects

1. Frontend Project
2. HTTP Backend Project
3. WebSocket Backend Project (separate, as Vercel doesn't support persistent WebSockets well)

## Step 4: Deploy HTTP Backend

### 4.1 Create Vercel Project for HTTP Backend

1. Push code to GitHub
2. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Select "SketchIt" as the project name
6. **Framework Preset**: Other
7. **Root Directory**: `apps/http-backend`
8. Click "Deploy"

### 4.2 Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL = your-neon-database-url
JWT_SECRET = your-secure-secret-key-32-chars-minimum
```

### 4.3 Configure Build & Output Settings

In Vercel Dashboard → Settings → General:

**Build Command**:

```bash
pnpm install && pnpm run build
```

**Output Directory**: `dist`

**Install Command**:

```bash
pnpm install --frozen-lockfile
```

## Step 5: Deploy Frontend

### 5.1 Create Vercel Project for Frontend

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository (same repo)
4. Select "SketchIt Frontend" as the project name
5. **Framework**: Next.js
6. **Root Directory**: `apps/frontend`
7. Click "Deploy"

### 5.2 Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_HTTP_BACKEND_URL = https://your-http-backend.vercel.app/api
NEXT_PUBLIC_WS_URL = wss://your-ws-backend-domain.com
```

### 5.3 Configure Build Settings

**Build Command**:

```bash
pnpm install && pnpm run build
```

**Output Directory**: `.next`

## Step 6: Deploy WebSocket Backend

**⚠️ Important**: Vercel Serverless Functions don't support persistent WebSocket connections. Use alternatives:

### Option A: Deploy to Railway (Recommended)

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Select `apps/ws-backend` as root directory
5. Set environment variables:
   ```
   DATABASE_URL = your-database-url
   JWT_SECRET = your-secret-key
   ```
6. Railway will detect `package.json` and run `npm run build && npm run start`

### Option B: Deploy to Render

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect your GitHub repo
4. **Build Command**: `cd apps/ws-backend && npm run build`
5. **Start Command**: `npm run start`
6. Set environment variables
7. Deploy

### Option C: Use Fly.io

1. Install fly: `brew install flyctl`
2. Create `fly.toml` in root:

```toml
[build]
dockerfile = "Dockerfile.ws"

[env]
DATABASE_URL = ""
JWT_SECRET = ""

[[services]]
internal_port = 8080
protocol = "tcp"

[[services.ports]]
port = 443
handlers = ["tls"]

[[services.ports]]
port = 80
handlers = ["http"]
```

3. Create `Dockerfile.ws`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN cd apps/ws-backend && pnpm run build
CMD ["node", "apps/ws-backend/dist/index.js"]
```

## Step 7: Update DNS & CORS

### 7.1 Update CORS Configuration

In `apps/http-backend/src/index.ts`:

```typescript
const allowedOrigins = [
  "http://localhost:3000",
  "https://your-frontend.vercel.app",
  "https://your-domain.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
```

### 7.2 Update WebSocket CORS

In `apps/ws-backend/src/index.ts`:

```typescript
const wss = new WebSocketServer({
  port: 8080,
  perMessageDeflate: false,
});

wss.on("connection", function connection(ws, request) {
  const origin = request.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "https://your-frontend.vercel.app",
    "https://your-domain.com",
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    ws.close();
    return;
  }
  // ... rest of code
});
```

## Step 8: Environment Variables Summary

### Vercel Environment Variables to Set

**HTTP Backend Project**:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-key-32-chars
```

**Frontend Project**:

```
NEXT_PUBLIC_HTTP_BACKEND_URL=https://http-backend-xxx.vercel.app/api
NEXT_PUBLIC_WS_URL=wss://ws-backend-xxx.railway.app
```

**WebSocket Backend Project** (Railway/Render/Fly):

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-key-32-chars
```

## Step 9: Database Migrations

### Run Migrations on Deployment

Add to `vercel.json` for HTTP Backend:

```json
{
  "buildCommand": "pnpm install && cd packages/db && pnpm exec prisma migrate deploy && cd ../../apps/http-backend && pnpm run build",
  "outputDirectory": "dist"
}
```

Or create `scripts/migrate.sh`:

```bash
#!/bin/bash
cd packages/db
npx prisma migrate deploy
```

And run before each deployment.

## Step 10: Testing Deployment

### 1. Test Frontend

```bash
curl https://your-frontend.vercel.app
```

### 2. Test HTTP Backend

```bash
curl https://your-http-backend.vercel.app/api/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","name":"Test","password":"password123"}'
```

### 3. Test WebSocket Backend

```bash
# Using websocat or similar
websocat wss://your-ws-backend.railway.app
```

## Step 11: Custom Domain Setup (Optional)

### Add Domain to Vercel

1. Vercel Dashboard → Project → Settings → Domains
2. Add custom domain
3. Update DNS records with values provided by Vercel

## Common Issues & Solutions

### Issue 1: "Module not found" errors

**Solution**: Ensure all dependencies are in `package.json` of respective app. Vercel doesn't install workspace dependencies automatically in some cases.

### Issue 2: WebSocket connection fails

**Solution**: WebSocket in Vercel Serverless doesn't work. Use Railway/Render/Fly instead.

### Issue 3: Database connection timeout

**Solution**:

- Check DATABASE_URL is correct
- Ensure database is not in a private VPC
- For Neon: Whitelist Vercel IP ranges in firewall settings

### Issue 4: "Cannot find module" in frontend

**Solution**: Ensure next.config.ts has proper transpilation settings:

```typescript
const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/common"],
};
export default nextConfig;
```

### Issue 5: CORS errors

**Solution**: Update CORS configuration in backends to include Vercel domain.

## Vercel CLI Commands (Optional)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy entire project
vercel --prod

# View logs
vercel logs

# List deployments
vercel list
```

## Git Workflow for Deployment

```bash
# 1. Make changes locally
git checkout -b feature/new-feature

# 2. Test locally
pnpm install
pnpm run dev

# 3. Build to verify
pnpm run build

# 4. Commit and push
git add .
git commit -m "feat: new feature"
git push origin feature/new-feature

# 5. Create PR on GitHub
# 6. Merge to main
# 7. Vercel auto-deploys main branch
```

## Production Checklist

- [ ] Database migrations applied
- [ ] Environment variables set in all Vercel projects
- [ ] CORS configured for all backends
- [ ] SSL certificates valid
- [ ] Error logging setup (optional: Sentry, LogRocket)
- [ ] Monitoring setup (optional: Better Stack, DataDog)
- [ ] Backups configured for database
- [ ] Rate limiting configured for APIs
- [ ] Authentication tokens rotating
- [ ] Secrets not committed to git
- [ ] Performance optimized (images, code splitting)

## Monitoring & Maintenance

### Vercel Dashboard

- Check deployment logs
- Monitor function execution time
- Review edge requests

### Database

- Monitor connection pool usage
- Check query performance
- Setup backups

### Error Tracking

- Setup error monitoring (Sentry/LogRocket)
- Configure alerts for errors
- Review error logs regularly

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Railway Deployment](https://docs.railway.app/)
- [Neon PostgreSQL](https://neon.tech/docs)

---

**Last Updated**: January 4, 2026
**Version**: 1.0
