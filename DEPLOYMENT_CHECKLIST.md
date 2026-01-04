# SketchIt Deployment Checklist

Complete this checklist before deploying to production.

## Phase 1: Pre-Deployment Setup (Local)

### Database Setup

- [ ] Install PostgreSQL locally or choose cloud provider (Neon/Railway/AWS RDS)
- [ ] Create database
- [ ] Copy DATABASE_URL connection string
- [ ] Create `.env.local` with DATABASE_URL and JWT_SECRET
- [ ] Run `bash scripts/migrate.sh` to apply migrations
- [ ] Verify Prisma client is generated: `ls packages/db/src/generated/prisma/`

### Code Configuration

- [ ] Update `apps/frontend/config.ts` with correct API endpoints
- [ ] Update `apps/frontend/next.config.ts` has `transpilePackages` configured
- [ ] Update CORS in `apps/http-backend/src/index.ts` for frontend domain
- [ ] Update WebSocket CORS in `apps/ws-backend/src/index.ts` for frontend domain
- [ ] Verify all imports use `@repo/*` workspace packages
- [ ] Run `pnpm install` to install all dependencies
- [ ] Run `pnpm run build` to verify builds work locally
- [ ] Run `pnpm run dev` and test all features

### Local Testing

- [ ] Frontend loads at http://localhost:3000
- [ ] Signup endpoint works: `/api/signup`
- [ ] Signin endpoint works: `/api/signin`
- [ ] Create room endpoint works: `/api/room`
- [ ] Get chats endpoint works: `/api/chats/:roomId`
- [ ] WebSocket connects and sends messages
- [ ] No console errors or warnings
- [ ] No TypeScript errors: `pnpm run check-types`
- [ ] Lint passes: `pnpm run lint`

## Phase 2: Cloud Setup

### Database (Neon)

- [ ] Sign up at https://neon.tech
- [ ] Create project
- [ ] Copy connection string
- [ ] Verify connection: `psql "YOUR_CONNECTION_STRING" -c "SELECT 1;"`
- [ ] Store safely (don't commit to git)

### Secrets Generation

- [ ] Generate JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Store safely (don't commit to git)
- [ ] Document both DATABASE_URL and JWT_SECRET in secure location

### GitHub Repository

- [ ] Push code to GitHub main branch
- [ ] Verify repository is public or accessible to Vercel
- [ ] No sensitive data in repository
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.production.local` is in `.gitignore`

## Phase 3: Vercel Frontend Deployment

### Frontend Project Setup

- [ ] Log in to https://vercel.com/dashboard
- [ ] Click "Add New" → "Project"
- [ ] Connect GitHub SketchIt repository
- [ ] Framework Preset: **Next.js**
- [ ] Root Directory: **apps/frontend**
- [ ] Environment Variables (set before deploy):
  - [ ] NEXT_PUBLIC_HTTP_BACKEND_URL (temporary: http://localhost:3001)
  - [ ] NEXT_PUBLIC_WS_URL (temporary: ws://localhost:8080)
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Note Frontend URL: `https://sketchiit-frontend-xxx.vercel.app`

### Frontend Deployment Verification

- [ ] Deployment successful (no errors in logs)
- [ ] Can access frontend at Vercel URL
- [ ] Page loads (may show API errors initially)
- [ ] No 404 errors for static assets

## Phase 4: Vercel HTTP Backend Deployment

### HTTP Backend Project Setup

- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New" → "Project"
- [ ] Connect GitHub SketchIt repository (SAME repo)
- [ ] Framework Preset: **Other**
- [ ] Root Directory: **apps/http-backend**
- [ ] Build Command: `pnpm install && pnpm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `pnpm install --frozen-lockfile`
- [ ] Environment Variables (before deploy):
  - [ ] DATABASE_URL: `your-neon-database-url`
  - [ ] JWT_SECRET: `your-32-char-secret`
  - [ ] NEXT_PUBLIC_FRONTEND_URL: `https://sketchiit-frontend-xxx.vercel.app`
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Note HTTP Backend URL: `https://sketchiit-http-backend-xxx.vercel.app`

### Run Database Migrations

- [ ] Prepare migration command with DATABASE_URL
- [ ] Run: `cd packages/db && npx prisma migrate deploy`
- [ ] Or: Use Vercel's integration hooks (if available)
- [ ] Verify tables created: Check Neon dashboard

### HTTP Backend Deployment Verification

- [ ] Deployment successful
- [ ] Can make POST request to `/api/signup`
- [ ] Responses have correct status codes
- [ ] No 500 errors in logs

## Phase 5: Railway WebSocket Backend Deployment

### WebSocket Backend Project Setup

- [ ] Log in to https://railway.app
- [ ] Create new project
- [ ] Connect GitHub repository: SketchIt
- [ ] Select branch: main
- [ ] Root directory: `apps/ws-backend` (or auto-detect)
- [ ] Environment Variables:
  - [ ] DATABASE_URL: `your-neon-database-url`
  - [ ] JWT_SECRET: `your-32-char-secret`
- [ ] Railway will detect `package.json` and set commands
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Note WebSocket Backend URL: `wss://sketchiit-ws-backend-xxx.railway.app`

### WebSocket Backend Deployment Verification

- [ ] Deployment successful (check logs)
- [ ] Port 8080 is exposed correctly
- [ ] No connection errors in logs
- [ ] Can connect with WebSocket client

## Phase 6: Update Frontend Environment Variables

### Vercel Dashboard - Frontend Project

- [ ] Go to Settings → Environment Variables
- [ ] Update `NEXT_PUBLIC_HTTP_BACKEND_URL`:
  - Old: `http://localhost:3001`
  - New: `https://sketchiit-http-backend-xxx.vercel.app/api`
- [ ] Update `NEXT_PUBLIC_WS_URL`:
  - Old: `ws://localhost:8080`
  - New: `wss://sketchiit-ws-backend-xxx.railway.app`
- [ ] Go to Deployments tab
- [ ] Click on latest deployment
- [ ] Click "Redeploy" button
- [ ] Wait for redeployment to complete

### Frontend Verification After Redeploy

- [ ] Frontend still loads
- [ ] Can sign up new user
- [ ] Can sign in with credentials
- [ ] Can create room
- [ ] Can see room chats
- [ ] WebSocket connection established
- [ ] No CORS errors in browser console

## Phase 7: Comprehensive Testing

### Functionality Tests

- [ ] **Signup**: Create new user account
  - [ ] Valid email/password accepted
  - [ ] Duplicate email rejected
  - [ ] User stored in database
- [ ] **Signin**: Login with credentials
  - [ ] Valid credentials return JWT token
  - [ ] Invalid password rejected
  - [ ] Non-existent user rejected
- [ ] **Room Creation**: Create drawing room
  - [ ] Authenticated users can create
  - [ ] Unauthenticated users cannot create
  - [ ] Room stored in database
- [ ] **Room Access**: Access existing room
  - [ ] Can load room data
  - [ ] WebSocket connection established
  - [ ] Can see other users in room
- [ ] **Drawing Sync**: Real-time drawing
  - [ ] Strokes appear instantly
  - [ ] Sync across tabs/windows
  - [ ] No lag or delays
- [ ] **Chat/Messages**:
  - [ ] Can send messages
  - [ ] Messages persist in database
  - [ ] Messages broadcast to all users

### Security Tests

- [ ] No credentials exposed in logs
- [ ] Passwords are hashed in database
- [ ] JWT tokens verified correctly
- [ ] CORS headers correct
- [ ] No sensitive data in browser localStorage
- [ ] API rejects invalid tokens

### Performance Tests

- [ ] First page load < 3 seconds
- [ ] API responses < 500ms
- [ ] WebSocket reconnects after disconnect
- [ ] No memory leaks after extended use
- [ ] Database queries optimized

### Cross-Browser Tests

- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works on mobile (iPhone/Android)
- [ ] Responsive design works

## Phase 8: Monitoring & Logging Setup (Optional)

### Error Tracking

- [ ] Set up Sentry (https://sentry.io/)
  - [ ] Create project
  - [ ] Get DSN
  - [ ] Add to frontend `.env.production`
  - [ ] Add to backend `.env.production`
  - [ ] Test error reporting
- [ ] Alternative: LogRocket (https://logrocket.com/)

### Performance Monitoring

- [ ] Set up New Relic or DataDog (optional)
  - [ ] Monitor API response times
  - [ ] Monitor database queries
  - [ ] Set up alerts

### Logging

- [ ] Check Vercel logs dashboard
- [ ] Check Railway logs dashboard
- [ ] Configure log rotation (if needed)
- [ ] Archive old logs

## Phase 9: Backup & Security

### Database Backups

- [ ] Enable automatic backups in Neon
- [ ] Test backup restoration
- [ ] Document backup schedule
- [ ] Keep backup retention policy

### Secrets Management

- [ ] No secrets in `.env` files committed to git
- [ ] All secrets stored in platform dashboards (Vercel/Railway)
- [ ] Rotate JWT_SECRET if compromised
- [ ] Document secret rotation procedure

### SSL/TLS Certificates

- [ ] Vercel provides automatic SSL (✓ by default)
- [ ] Railway provides automatic SSL (✓ by default)
- [ ] All endpoints use HTTPS/WSS
- [ ] Certificate renewal automatic

## Phase 10: Documentation & Handoff

### Documentation

- [ ] Update README.md with deployment info
- [ ] Document environment variables
- [ ] Document API endpoints
- [ ] Document database schema
- [ ] Document deployment process
- [ ] Create troubleshooting guide

### Monitoring Dashboard

- [ ] Create links to dashboards:
  - [ ] Vercel: https://vercel.com/dashboard/projects
  - [ ] Railway: https://railway.app/dashboard
  - [ ] Neon: https://console.neon.tech
  - [ ] Sentry: https://sentry.io/ (if used)

### Team Onboarding

- [ ] Share credentials with team (securely)
- [ ] Document access procedures
- [ ] Explain deployment workflow
- [ ] Provide emergency contacts
- [ ] Create runbook for common issues

## Phase 11: Post-Deployment Monitoring (First Week)

### Daily Checks

- [ ] Check error logs daily
- [ ] Monitor database performance
- [ ] Check API response times
- [ ] Verify WebSocket connections stable
- [ ] Check disk usage

### Weekly Checks

- [ ] Review performance metrics
- [ ] Update dependencies if needed
- [ ] Backup verification
- [ ] Security scan results
- [ ] Team feedback

### Issues to Watch

- [ ] Database connection pool exhaustion
- [ ] JWT token expiration issues
- [ ] WebSocket reconnection loops
- [ ] CORS errors
- [ ] Memory leaks in Node.js

## Phase 12: Production Optimization (After Stabilization)

### Frontend Optimization

- [ ] Set up CDN (Vercel provides)
- [ ] Image optimization
- [ ] Code splitting
- [ ] Bundle size analysis
- [ ] Cache optimization

### Backend Optimization

- [ ] Database query optimization
- [ ] Connection pooling configuration
- [ ] Rate limiting setup
- [ ] Caching strategy (Redis if needed)
- [ ] Load balancing (if needed)

### Cost Optimization

- [ ] Monitor Vercel costs
- [ ] Monitor Railway costs
- [ ] Monitor Neon costs
- [ ] Optimize database indexes
- [ ] Consider reserved capacity

## Rollback Procedure

If deployment fails:

1. **Frontend Issue**:

   ```bash
   # Go to Vercel → Deployments
   # Click previous successful deployment
   # Click "Redeploy"
   ```

2. **Backend Issue**:

   ```bash
   # Go to Railway → Deployments
   # Select previous successful deployment
   # Click "Redeploy"
   ```

3. **Database Issue**:
   ```bash
   # Go to Neon → Backups
   # Restore from backup
   # Re-run migrations
   ```

## Emergency Contacts

- Vercel Support: https://vercel.com/support
- Railway Support: https://railway.app/support
- Neon Support: https://neon.tech/support
- GitHub Issues: Your repository issues

---

**Total Deployment Time**: 1-2 hours (including testing)

**Sign-off**:

- [ ] Development Lead: ******\_\_\_\_****** Date: **\_\_\_**
- [ ] QA Lead: ******\_\_\_\_****** Date: **\_\_\_**
- [ ] DevOps/Deployment: ******\_\_\_\_****** Date: **\_\_\_**
