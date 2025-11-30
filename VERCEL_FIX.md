# 🔧 Vercel Deployment Fix Guide

## Issue: pnpm ERR_INVALID_THIS on Vercel

The error `ERR_INVALID_THIS` occurs due to pnpm lockfile version incompatibility with Vercel's build environment.

## ✅ Fixes Applied

### 1. Updated Package Manager Version
- Changed from `pnpm@9.0.0` to `pnpm@8.15.6` (more stable for Vercel)
- Updated `package.json` with engine specifications

### 2. Added .npmrc Configuration
Created `.npmrc` with Vercel-friendly settings:
```
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=true
```

### 3. Updated vercel.json
Added `--no-frozen-lockfile` flag to allow lockfile regeneration on Vercel

### 4. Regenerated Lockfile
- Removed old `pnpm-lock.yaml`
- Regenerated with compatible pnpm version
- Tested build successfully ✅

---

## 🚀 Deploy to Vercel Now

### Method 1: Automatic Deployment (Recommended)

1. **Commit and push the changes:**
   ```bash
   git add .
   git commit -m "Fix Vercel deployment with pnpm compatibility"
   git push origin main
   ```

2. **Vercel will auto-deploy** (if you've already connected the repo)
   - Or go to [vercel.com/new](https://vercel.com/new) and import

### Method 2: Manual Vercel Configuration

If the build still fails, configure Vercel manually:

**In Vercel Dashboard → Project Settings → General:**

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `apps/frontend` |
| Build Command | `cd ../.. && pnpm install --no-frozen-lockfile && pnpm run build --filter=frontend` |
| Output Directory | `.next` |
| Install Command | `pnpm install --no-frozen-lockfile` |
| Node Version | 18.x or 20.x |

**Environment Variables:**
```
NEXT_PUBLIC_HTTP_BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-ws.railway.app
```

---

## Alternative: Use npm Instead of pnpm

If pnpm continues to cause issues, you can switch to npm:

### Option A: Convert to npm

1. **Remove pnpm files:**
   ```bash
   rm -rf pnpm-lock.yaml node_modules .pnpm-store
   rm pnpm-workspace.yaml
   ```

2. **Update package.json:**
   ```json
   {
     "packageManager": "npm@10.0.0"
   }
   ```

3. **Create package-lock.json:**
   ```bash
   npm install
   ```

4. **Update vercel.json:**
   ```json
   {
     "buildCommand": "cd ../.. && npm install && npm run build --workspace=frontend",
     "installCommand": "npm install"
   }
   ```

### Option B: Use Turborepo's Remote Caching

1. **Update vercel.json:**
   ```json
   {
     "buildCommand": "npx turbo build --filter=frontend"
   }
   ```

2. **Vercel will automatically handle the rest**

---

## 🧪 Test Locally First

Before deploying, ensure everything works locally:

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Test build
pnpm run build --filter=frontend

# If successful, commit and push
git add .
git commit -m "Fix Vercel deployment"
git push origin main
```

---

## 📊 Expected Vercel Build Log (Success)

```
✓ Running "vercel build"
✓ Detected Turbo
✓ Running "install" command: pnpm install --no-frozen-lockfile
✓ Installing dependencies
✓ Building frontend
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (7/7)
✓ Build completed
```

---

## 🔍 Troubleshooting

### If Build Still Fails with pnpm

**Error: "lockfile is broken"**
```bash
# Locally:
rm -rf node_modules pnpm-lock.yaml .pnpm-store
pnpm install
git add pnpm-lock.yaml
git commit -m "Regenerate lockfile"
git push
```

**Error: "Cannot find module"**
- Check that all dependencies are in the correct `package.json`
- Ensure workspace protocol is used: `"@repo/ui": "workspace:*"`

### If Build Succeeds but App Doesn't Work

**Check these:**
1. ✅ Environment variables are set in Vercel
2. ✅ Backend URLs use `https://` and `wss://`
3. ✅ Backend services are running
4. ✅ Database is accessible from backend

---

## 🎯 Quick Fix Summary

**Changes made:**
1. ✅ Updated `package.json` - pnpm version downgrade
2. ✅ Created/Updated `.npmrc` - hoisting configuration
3. ✅ Updated `vercel.json` - no-frozen-lockfile flag
4. ✅ Regenerated `pnpm-lock.yaml` - compatible version
5. ✅ Tested build locally - all passing

**Next step:** Push to GitHub and Vercel will auto-deploy! 🚀

---

## 📚 Additional Resources

- [Vercel Turborepo Guide](https://vercel.com/docs/concepts/monorepos/turborepo)
- [pnpm on Vercel](https://vercel.com/docs/concepts/deployments/configure-a-build#pnpm)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Status: ✅ Ready for deployment**

All pnpm compatibility issues have been resolved. Push your changes and deploy!
