> **Status correction:** This project is not verified production-ready. Mobile still uses Clerk, Supabase login and persistence are not wired end-to-end, and the existing database schema and RLS have not been verified. Do not run schema push or use this guide for production without a schema review and safe migrations. Some instructions below are outdated. See the Supabase setup note in README.

# QUICK REFERENCE - FinTwin Development Commands

## 📦 Dependency Management

```powershell
# Install all dependencies
pnpm install

# Install specific package
pnpm add package-name

# Install in specific workspace
pnpm --filter @workspace/api-server add package-name

# Update all packages
pnpm update

# List installed packages
pnpm list --depth 0
```

## 🔨 Building & Type Checking

```powershell
# Type check entire workspace
pnpm run typecheck

# Type check specific package
pnpm --filter @workspace/api-server run typecheck

# Build entire workspace
pnpm run build

# Build specific package
pnpm --filter @workspace/api-server run build

# Clean build artifacts
pnpm --filter @workspace/api-server run clean
```

## 🚀 Development Servers

### API Server (Express)

```powershell
# Development with hot reload
pnpm --filter @workspace/api-server run dev

# Start production build
pnpm --filter @workspace/api-server run start

# Test health endpoint
curl http://localhost:5000/api/healthz
```

**Port**: 5000  
**Logs**: Pino logger output  
**Hot Reload**: Yes (rebuilds on file change)

### Mobile App (Expo/React Native)

```powershell
# Start dev server
pnpm --filter @workspace/mobile run dev

# Android emulator
pnpm --filter @workspace/mobile exec expo start --android

# iOS simulator
pnpm --filter @workspace/mobile exec expo start --ios

# Web version
pnpm --filter @workspace/mobile exec expo start --web

# Clear cache and rebuild
pnpm --filter @workspace/mobile run dev -- --clear
```

**Port**: 8081  
**QR Code**: Scan with Expo Go app  
**Default Route**: App home screen or auth

### Web Dashboard (Vite)

```powershell
# Development with hot reload
pnpm --filter @workspace/mockup-sandbox run dev

# Preview production build locally
pnpm --filter @workspace/mockup-sandbox run preview

# Build for production
pnpm --filter @workspace/mockup-sandbox run build
```

**Port**: 5173  
**Hot Reload**: Yes (instant updates)  
**Build Output**: `dist/` folder

## 🗄️ Database Operations

```powershell
# Push schema changes to Supabase
pnpm --filter @workspace/db run push

# Force push (CAREFUL! May drop tables)
pnpm --filter @workspace/db run push-force

# Inspect schema locally
# Edit: lib/db/src/schema/index.ts
```

**Schema Location**: `lib/db/src/schema/index.ts`  
**Config File**: `lib/db/drizzle.config.ts`  
**Requires**: DATABASE_URL environment variable

## 🔧 Code Generation

```powershell
# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# This updates:
# - lib/api-zod/src/generated/
# - lib/api-client-react/src/generated/

# View spec
cat lib/api-spec/openapi.yaml
```

## 🧪 Testing

```powershell
# Run all tests
pnpm run test

# Run tests in specific package
pnpm --filter @workspace/api-server run test

# Watch mode
pnpm --filter @workspace/api-server run test -- --watch
```

## 📁 Workspace Navigation

```powershell
# Run script in specific package
pnpm --filter @workspace/api-server run dev

# Run script in all packages
pnpm -r run build

# Run script in all packages with condition
pnpm -r --if-present run build

# List all packages
pnpm list --depth 0

# Show package info
pnpm info @workspace/db
```

## 🔍 Debugging

### API Server Debugging

```powershell
# View logs
# Terminal output from: pnpm --filter @workspace/api-server run dev

# Test endpoints
curl http://localhost:5000/api/healthz
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer TOKEN"

# Enable verbose logging
# Set LOG_LEVEL=debug in .env
```

### Mobile App Debugging

```powershell
# View device logs
adb logcat | grep expo

# Clear app data
adb shell pm clear com.your.app

# Open app settings
adb shell am start -a android.settings.APPLICATION_DETAILS_SETTINGS -d package:com.your.app
```

### Web Dashboard Debugging

```powershell
# Browser DevTools
# Press F12 in Chrome/Firefox

# View network requests
# Network tab shows all API calls

# View console errors
# Console tab shows any JavaScript errors
```

## 🌍 Environment Variables

### Required for Development

```env
DATABASE_URL=postgres://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=sb_publishable_...
GEMINI_API_KEY=AQ...
NODE_ENV=development
PORT=5000
```

### Required for Production

```env
NODE_ENV=production
DATABASE_URL=postgres://...production...
SUPABASE_URL=https://...production...
SUPABASE_ANON_KEY=sb_publishable_...production...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
GEMINI_API_KEY=AQ...
CORS_ORIGINS=https://yourdomain.com
```

## 📝 Git Workflow

```powershell
# Create feature branch
git checkout -b feature/my-feature

# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "feat: add new feature"

# Push
git push origin feature/my-feature

# Create pull request on GitHub
```

## 🚢 Deployment

### Build for Production

```powershell
# Build everything
pnpm run build

# Build specific package
pnpm --filter @workspace/api-server run build
```

### Deploy API

```powershell
# Docker
docker build -t fintwin-api .
docker push your-registry/fintwin-api

# Vercel
vercel --prod --cwd artifacts/api-server

# Manual
node artifacts/api-server/dist/index.mjs
```

### Deploy Web

```powershell
# Vercel
cd artifacts/mockup-sandbox && vercel --prod

# Netlify
cd artifacts/mockup-sandbox && netlify deploy --prod --dir=dist

# Manual
# Upload artifacts/mockup-sandbox/dist/ to web server
```

## 📱 Mobile APK Generation

```powershell
# Build debug APK
pnpm --filter @workspace/mobile run build
# Output: artifacts/mobile/bin/app-debug.apk

# Install on connected device
adb install artifacts/mobile/bin/app-debug.apk

# Build release APK (requires signing config)
pnpm --filter @workspace/mobile exec eas build --platform android --build-type apk
```

## 🔐 Security Checks

```powershell
# Find hardcoded secrets
grep -r "GEMINI_API_KEY" artifacts/ lib/

# Check environment setup
$env:GEMINI_API_KEY -ne $null  # Should be: True

# Verify .env is ignored
git status | grep ".env"  # Should return nothing

# Check committed secrets
git log -p | grep "GEMINI_API_KEY"  # Should return nothing
```

## 📊 Monitoring & Logs

### API Logs

```powershell
# Real-time logs from: pnpm --filter @workspace/api-server run dev

# Format:
# [TIMESTAMP] [LEVEL] [MESSAGE]
# LEVEL: debug, info, warn, error, fatal
```

### Database Logs

```powershell
# Supabase Dashboard → Logs
# View query performance and errors
```

### Frontend Errors

```powershell
# Browser Console → Check for JavaScript errors
# Network Tab → Check API responses
```

## 🆘 Quick Fixes

```powershell
# Module not found error
pnpm install

# TypeScript errors
pnpm run typecheck

# Database connection error
# Check: DATABASE_URL in .env
# Check: Supabase project is active

# API not responding
# Check: pnpm --filter @workspace/api-server run dev is running
# Check: PORT 5000 is not in use

# CORS errors
# Check: CORS_ORIGINS in .env includes your origin
# Check: API server was restarted after env change

# Gemini API errors
# Check: GEMINI_API_KEY in .env
# Check: Key hasn't been revoked
# Check: API request format matches spec
```

## 📚 File Locations Quick Reference

| What | Location |
|------|----------|
| Database Schema | `lib/db/src/schema/index.ts` |
| API Routes | `artifacts/api-server/src/routes/` |
| Mobile App | `artifacts/mobile/app/` |
| Web App | `artifacts/mockup-sandbox/src/` |
| Environment | `.env` (root) |
| API Spec | `lib/api-spec/openapi.yaml` |
| Colors/Theme | `artifacts/mobile/constants/colors.ts` |
| CSS/Theme (Web) | `artifacts/mockup-sandbox/src/index.css` |
| Documentation | `README.md`, `replit.md`, `DEPLOYMENT_GUIDE.md` |

## 🎯 Common Tasks

### Add New API Endpoint

1. Edit `lib/api-spec/openapi.yaml`
2. Add endpoint definition
3. Run `pnpm --filter @workspace/api-spec run codegen`
4. Create handler in `artifacts/api-server/src/routes/`
5. Update `artifacts/api-server/src/routes/index.ts`
6. Test with `curl` or Postman

### Add New Database Table

1. Edit `lib/db/src/schema/index.ts`
2. Add table definition
3. Run `pnpm --filter @workspace/db run push`
4. Add Drizzle relations
5. Create API endpoint to use new table

### Add New Mobile Screen

1. Create file in `artifacts/mobile/app/`
2. Use Expo Router file-based routing
3. Import shared components from `components/`
4. Test with Expo dev server

### Add New Web Component

1. Create component in `artifacts/mockup-sandbox/src/components/`
2. Import in app or page
3. Use TailwindCSS classes for styling
4. Test with Vite dev server

## 💡 Pro Tips

```powershell
# Speed up TypeScript checking
pnpm run typecheck:libs  # Only check library types

# Rebuild only what changed
pnpm run build  # Uses esbuild incremental build

# Monitor file changes (TypeScript)
# Most IDEs auto-check on save

# View package dependency tree
pnpm list --recursive

# Check for security vulnerabilities
pnpm audit

# Clean up unused dependencies
pnpm prune
```

---

**Last Updated**: November 10, 2026  
**Status**: Production Ready  
**Version**: 0.0.0

For detailed guides, see: `README.md`, `replit.md`, `DEPLOYMENT_GUIDE.md`
