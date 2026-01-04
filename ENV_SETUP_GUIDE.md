# Environment Variables Setup Guide for SketchIt

This document explains all environment variables needed for the SketchIt application to function properly across all services.

## Quick Reference Table

| Variable                       | Service             | Required | Description                  | Example                                               |
| ------------------------------ | ------------------- | -------- | ---------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`                 | Backend (HTTP & WS) | Yes      | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET`                   | Backend (HTTP & WS) | Yes      | Secret key for JWT tokens    | `your-super-secret-key-min-32-chars`                  |
| `NEXT_PUBLIC_HTTP_BACKEND_URL` | Frontend            | Yes      | HTTP backend API endpoint    | `https://api.example.com`                             |
| `NEXT_PUBLIC_WS_URL`           | Frontend            | Yes      | WebSocket backend endpoint   | `wss://ws.example.com`                                |
| `NEXT_PUBLIC_FRONTEND_URL`     | Backend             | No       | Frontend URL for CORS        | `https://app.example.com`                             |

## Local Development Environment

### 1. Create `.env.local` in root directory

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sketchit?schema=public"

# JWT Secret (any value for local dev)
JWT_SECRET="local-dev-secret-key"

# Frontend URLs (these are used by frontend app)
NEXT_PUBLIC_HTTP_BACKEND_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:8080"
```

### 2. Database Setup for Local Development

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL using docker-compose
docker-compose up -d

# Apply migrations
bash scripts/migrate.sh
```

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb sketchit

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://postgres@localhost:5432/sketchit?schema=public"

# Apply migrations
bash scripts/migrate.sh
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Application Locally

```bash
# Terminal 1: Frontend (http://localhost:3000)
cd apps/frontend
pnpm run dev

# Terminal 2: HTTP Backend (http://localhost:3001)
cd apps/http-backend
pnpm run dev

# Terminal 3: WebSocket Backend (ws://localhost:8080)
cd apps/ws-backend
pnpm run dev
```

## Production Environment (Vercel)

### 1. Frontend Project (.vercel/env.production)

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_HTTP_BACKEND_URL=https://your-http-backend.vercel.app/api
NEXT_PUBLIC_WS_URL=wss://your-ws-backend.railway.app
```

### 2. HTTP Backend Project (.vercel/env.production)

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://user:password@your-neon-db.neon.tech:5432/database?sslmode=require
JWT_SECRET=your-production-secret-key-min-32-characters
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend.vercel.app
```

### 3. WebSocket Backend (Railway/Render/.env)

Set these in deployment platform's environment variables:

```env
DATABASE_URL=postgresql://user:password@your-neon-db.neon.tech:5432/database?sslmode=require
JWT_SECRET=your-production-secret-key-min-32-characters
```

## Detailed Variable Explanations

### DATABASE_URL

**Purpose**: Connection string for PostgreSQL database

**Format**:

```
postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
```

**Examples**:

- **Neon (Cloud)**:

  ```
  postgresql://neon_user:neon_password@ep-xxx-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require
  ```

- **Local PostgreSQL**:

  ```
  postgresql://postgres:postgres@localhost:5432/sketchit?schema=public
  ```

- **AWS RDS**:

  ```
  postgresql://admin:password@sketch-db.c9akciq32.us-east-1.rds.amazonaws.com:5432/sketchidb
  ```

- **Railway**:
  ```
  postgresql://postgres:password@containers-us-west-xyz.railway.app:7526/railway
  ```

**Important**:

- Always use `sslmode=require` for cloud databases
- Keep credentials secure, never commit to git
- Use connection pooling for serverless functions

### JWT_SECRET

**Purpose**: Secret key used to sign and verify JWT authentication tokens

**Requirements**:

- Minimum 32 characters for production
- Random and unpredictable
- Same across all backend services
- Changed when compromised

**Generation**:

```bash
# Generate secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example**:

```
a3f8c9e2b1d4e7f0a5c8b1e4d7a0f3c6e9b2d5f8a1c4e7b0d3f6a9c2e5f8b1
```

### NEXT_PUBLIC_HTTP_BACKEND_URL

**Purpose**: URL where frontend fetches data from HTTP backend API

**Format**: Full URL with protocol and domain

**Examples**:

- Local: `http://localhost:3001`
- Development: `https://api-dev.example.com`
- Production: `https://api.example.com`
- Vercel: `https://http-backend-xxx.vercel.app`

**Important**:

- Must be accessible from browser
- Include protocol (http/https)
- No trailing slash
- For Vercel, use `/api` path if routing through frontend

### NEXT_PUBLIC_WS_URL

**Purpose**: WebSocket URL for real-time communication with backend

**Format**: WebSocket protocol URL

**Examples**:

- Local: `ws://localhost:8080`
- Development: `wss://ws-dev.example.com`
- Production: `wss://ws.example.com`
- Railway: `wss://ws-backend-xxx.railway.app`

**Important**:

- Use `wss://` (secure) in production
- Use `ws://` (unsecure) only in local development
- Must support WebSocket protocol
- Vercel doesn't support persistent WebSockets

### NEXT_PUBLIC_FRONTEND_URL

**Purpose**: Frontend URL for CORS configuration in backend

**Format**: Full URL with protocol

**Examples**:

- Local: `http://localhost:3000`
- Development: `https://app-dev.example.com`
- Production: `https://app.example.com`

**Important**:

- Used to whitelist origins in CORS
- Can include multiple origins separated by commas
- Frontend needs to be on same domain or explicit CORS

## Platform-Specific Setup

### Neon PostgreSQL

1. Sign up at [neon.tech](https://neon.tech)
2. Create project
3. Copy connection string:
   ```
   postgresql://user:password@ep-xxx-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require
   ```
4. Set as `DATABASE_URL`

### Railway

1. Sign up at [railway.app](https://railway.app)
2. Create PostgreSQL database
3. Get DATABASE_URL from service variables
4. Deploy WebSocket backend:
   ```bash
   railway link
   railway up
   ```

### Vercel

1. Create project for Frontend and HTTP Backend
2. Set environment variables per service:
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add NEXT_PUBLIC_HTTP_BACKEND_URL
   ```

## Security Best Practices

### 1. Never Commit Secrets

✅ **Do commit**:

- `.env.example` with placeholder values
- `DATABASE_URL` with dummy value

❌ **Don't commit**:

- `.env.local`
- `.env.production.local`
- Actual secret values

### 2. Use Secret Management

For production:

- Use Vercel Environment Variables (encrypted)
- Use GitHub Secrets for CI/CD
- Use HashiCorp Vault for advanced setups
- Never log secrets

### 3. Rotate Secrets Regularly

```bash
# Generate new JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in all services
# 1. Vercel Dashboard
# 2. Railway Dashboard
# 3. Render Dashboard
```

### 4. Validate Environment Variables

Add to `apps/http-backend/src/middleware.ts`:

```typescript
export function validateEnv() {
  const requiredVars = ["DATABASE_URL", "JWT_SECRET"];
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}
```

## Troubleshooting

### "Cannot connect to database"

- Check DATABASE_URL format
- Verify database is running
- Check firewall/security groups
- For Neon: Verify SSL mode setting

### "Invalid JWT"

- Ensure JWT_SECRET is same across all services
- Regenerate tokens after SECRET change
- Check token expiration

### "CORS error"

- Verify NEXT_PUBLIC_FRONTEND_URL in backend
- Check origin headers
- Ensure credentials: true if needed

### "WebSocket connection failed"

- Verify NEXT_PUBLIC_WS_URL is correct
- Check WebSocket backend is running
- Verify firewall allows WebSocket
- Check protocol (ws vs wss)

## Verification Commands

```bash
# Verify DATABASE_URL
psql "$DATABASE_URL" -c "SELECT 1;"

# Verify JWT_SECRET is set
echo $JWT_SECRET

# Verify frontend URLs from browser console
console.log(process.env.NEXT_PUBLIC_HTTP_BACKEND_URL)

# Test API connection
curl https://api.example.com/health
```

## Next Steps

After setting up environment variables:

1. ✅ Run local development
2. ✅ Run build checks
3. ✅ Deploy to Vercel/Railway
4. ✅ Verify production deployment
5. ✅ Monitor logs for errors

---

**Last Updated**: January 4, 2026
