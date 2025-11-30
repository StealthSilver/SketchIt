# Deploying Excelidraw to Vercel

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A PostgreSQL database (Neon, Supabase, or Vercel Postgres)
3. A server for WebSocket backend (Railway, Render, or similar)

## Step-by-Step Deployment

### 1. Database Setup

**Option A: Neon (Recommended)**

1. Go to [Neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it looks like `postgresql://user:pass@host.neon.tech/db`)

**Option B: Vercel Postgres**

1. In your Vercel dashboard, go to Storage
2. Create a new Postgres database
3. Copy the `POSTGRES_PRISMA_URL` connection string

**Option C: Supabase**

1. Go to [Supabase](https://supabase.com) and create a project
2. Go to Settings → Database
3. Copy the connection string (Connection Pooling mode)

### 2. Deploy Backend Services

**Deploy HTTP Backend & WebSocket Backend to Railway/Render:**

1. Create a new project on [Railway.app](https://railway.app) or [Render.com](https://render.com)
2. Deploy the `apps/http-backend` and `apps/ws-backend` as separate services
3. Set environment variables for each:
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_random_secret_key_min_32_chars
   PORT=8080 (for ws-backend)
   PORT=3001 (for http-backend)
   ```
4. Note the deployed URLs (e.g., `https://your-http-backend.railway.app` and `wss://your-ws-backend.railway.app`)

### 3. Deploy Frontend to Vercel

**Method A: Using Vercel CLI**

1. Install Vercel CLI:

   ```bash
   pnpm install -g vercel
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Deploy:

   ```bash
   cd apps/frontend
   vercel
   ```

4. Set environment variables:

   ```bash
   vercel env add NEXT_PUBLIC_HTTP_BACKEND_URL
   # Enter: https://your-http-backend-url

   vercel env add NEXT_PUBLIC_WS_URL
   # Enter: wss://your-ws-backend-url
   ```

**Method B: Using Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `cd ../.. && pnpm install && pnpm run build --filter=frontend`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

4. Add Environment Variables:

   ```
   NEXT_PUBLIC_HTTP_BACKEND_URL=https://your-http-backend.railway.app
   NEXT_PUBLIC_WS_URL=wss://your-ws-backend.railway.app
   ```

5. Click Deploy

### 4. Run Database Migrations

After deploying your backend, run migrations:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your_production_database_url"

cd packages/db
pnpm db:migrate
```

Or from your backend deployment platform (Railway/Render), run:

```bash
cd packages/db && npx prisma migrate deploy
```

### 5. Verify Deployment

1. Visit your Vercel URL
2. Create an account
3. Try creating a drawing room
4. Test real-time collaboration

## Environment Variables Reference

### Frontend (Vercel)

```
NEXT_PUBLIC_HTTP_BACKEND_URL=https://your-http-backend.com
NEXT_PUBLIC_WS_URL=wss://your-ws-backend.com
```

### Backend Services (Railway/Render)

```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
JWT_SECRET=your_long_random_secret_key_at_least_32_characters
PORT=8080 (ws-backend) or 3001 (http-backend)
NODE_ENV=production
```

## Troubleshooting

### Build Fails on Vercel

**Error: "Can't resolve '@repo/ui'"**

- Make sure root directory is set to `apps/frontend`
- Use build command: `cd ../.. && pnpm install && pnpm run build --filter=frontend`

**Error: "Type error in params"**

- Already fixed! Make sure you're using the latest code where `params` is typed as `Promise<{roomId: string}>`

### WebSocket Connection Fails

**"WebSocket connection failed"**

- Ensure WS_URL uses `wss://` (not `ws://`) for production
- Check CORS settings on your WebSocket server
- Verify the WebSocket backend is deployed and running

### Database Connection Issues

**"Can't reach database server"**

- Verify DATABASE_URL is correct in backend environment variables
- Check database is accessible from your backend server IP
- For Neon/Supabase, ensure connection pooling is enabled

### Authentication Issues

**"Invalid token"**

- Ensure JWT_SECRET is the same across http-backend and ws-backend
- JWT_SECRET must be at least 32 characters for production

## Monorepo Deployment Tips

Since this is a Turborepo monorepo:

1. **Deploy each app separately**: Frontend on Vercel, backends on Railway/Render
2. **Shared packages are bundled**: Vercel will build `@repo/ui`, `@repo/common`, etc.
3. **Use workspace protocol**: Ensure `package.json` uses `workspace:*` for local packages
4. **Build command must install from root**: Always run `pnpm install` from repo root

## Alternative: Deploy All to Railway

If you want to deploy everything on Railway:

1. Create 3 Railway services:
   - Frontend (Next.js)
   - HTTP Backend
   - WebSocket Backend

2. Add a PostgreSQL database

3. Configure each service with appropriate environment variables

4. Railway will auto-deploy on git push

## Production Checklist

- [ ] Database is set up (Neon/Supabase/Vercel Postgres)
- [ ] Database migrations are run
- [ ] JWT_SECRET is a secure random string (32+ chars)
- [ ] HTTP backend is deployed and accessible
- [ ] WebSocket backend is deployed and accessible
- [ ] Frontend environment variables are set
- [ ] CORS is configured on backends
- [ ] SSL/TLS is enabled (https:// and wss://)
- [ ] Test signup/signin flow
- [ ] Test creating and joining rooms
- [ ] Test real-time drawing features

## Useful Commands

```bash
# Build all packages locally to test
pnpm run build

# Build specific package
pnpm run build --filter=frontend

# Check for TypeScript errors
cd apps/frontend && pnpm run type-check

# Run Prisma migrations in production
cd packages/db && npx prisma migrate deploy
```

## Support

For deployment issues:

- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Neon: https://neon.tech/docs
