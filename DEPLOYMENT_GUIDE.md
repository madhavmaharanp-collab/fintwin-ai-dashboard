> **Status correction:** This project is not verified production-ready. Mobile still uses Clerk, Supabase login and persistence are not wired end-to-end, and the existing database schema and RLS have not been verified. Do not run schema push or use this guide for production without a schema review and safe migrations. Some instructions below are outdated. See the Supabase setup note in README.

# PRODUCTION DEPLOYMENT GUIDE

## Phase-by-Phase Setup Instructions

### PHASE 1: Local Environment Setup (⏱️ 10-15 minutes)

#### Step 1: Install Dependencies
```powershell
cd G:\Fintwin-AI-Dashboard\Fintwin-AI-Dashboard
pnpm install
```

**Verification:**
```powershell
pnpm --version          # Should show 8.0+
node --version          # Should show 24.0+
pnpm list @workspace/*  # Shows all workspace packages
```

#### Step 2: Create Environment File
```powershell
cp .env.example .env
```

#### Step 3: Configure Supabase Credentials

Edit `.env` with your Supabase project details:

**From Supabase Dashboard → Settings → API:**
```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

**From Supabase Dashboard → Settings → Database:**
```env
# Copy the connection string and replace [PASSWORD] with actual password
DATABASE_URL=your-supabase-database-url
DIRECT_URL=your-supabase-direct-database-url


**From Supabase Dashboard → Settings → API → Project Keys:**
```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

**Gemini API Key (you already have this):**
```env
GEMINI_API_KEY=REPLACE_WITH_YOUR_GEMINI_API_KEY
```

**Local Development:**
```env
NODE_ENV=development
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
```

#### Step 4: Push Database Schema

```powershell
pnpm --filter @workspace/db run push
```

**Expected Output:**
```
✓ Creating tables: users, user_profiles, goals, transactions, ai_chats, ai_messages, sessions
✓ Schema migration complete
```

**If you see errors about tables already existing:**
```powershell
# That's normal for second run - tables already exist
# No action needed
```

---

### PHASE 2: Database Security Setup (⏱️ 5-10 minutes)

#### Enable Row-Level Security (RLS)

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Run this script to enable RLS and create policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can read own user data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can only access their own goals
CREATE POLICY "Users can read own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only access their own transactions
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only access their own AI chats
CREATE POLICY "Users can read own ai_chats"
  ON ai_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_chats"
  ON ai_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only access their own AI messages
CREATE POLICY "Users can read own ai_messages"
  ON ai_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_messages"
  ON ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only manage their own sessions
CREATE POLICY "Users can read own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Verification:**
- Go to **Authentication → Policies**
- Verify all tables show "RLS Enabled"
- Confirm policies are listed for each table

---

### PHASE 3: Development Testing (⏱️ 15-20 minutes)

#### Step 1: Type Check Project

```powershell
pnpm run typecheck
```

**Expected:** No errors, should complete in ~30-60 seconds

#### Step 2: Start Development Servers

**Open 3 PowerShell terminals:**

**Terminal 1: API Server**
```powershell
cd G:\Fintwin-AI-Dashboard\Fintwin-AI-Dashboard
pnpm --filter @workspace/api-server run dev
```

Expected output:
```
> @workspace/api-server dev
[timestamp] INFO (pino): Server listening on port 5000
```

Test health check:
```powershell
curl http://localhost:5000/api/healthz
# Should return: {"status":"ok"}
```

**Terminal 2: Mobile App**
```powershell
cd G:\Fintwin-AI-Dashboard\Fintwin-AI-Dashboard
pnpm --filter @workspace/mobile run dev
```

Expected output:
```
Expo dev server started at http://localhost:8081
```

**Terminal 3: Web Dashboard**
```powershell
cd G:\Fintwin-AI-Dashboard\Fintwin-AI-Dashboard
pnpm --filter @workspace/mockup-sandbox run dev
```

Expected output:
```
VITE v7.3.2 running at http://localhost:5173
```

#### Step 3: Test Authentication

1. **Open web app**: http://localhost:5173
2. Click "Sign Up"
3. Enter email and password
4. Check your email for Supabase confirmation link
5. Click the confirmation link
6. Return to app and log in
7. Verify dashboard appears

#### Step 4: Test Gemini AI Integration

Get JWT token from browser console:
```javascript
// In web app after login
const token = localStorage.getItem('sb-token') // or check Network tab
console.log(token)
```

Test API endpoint:
```powershell
curl -X POST http://localhost:5000/api/ai/coach `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d @'{
    "question": "How can I improve my savings rate?",
    "snapshot": {
      "currency": "USD",
      "monthlyIncome": 5000,
      "monthlyExpenses": 3000,
      "monthlySurplus": 2000,
      "savingsRate": 0.4,
      "netWorth": 50000,
      "transactions": [],
      "goals": []
    }
  }'
```

Expected response:
```json
{
  "answer": "Based on your financial snapshot...",
  "chart": {
    "title": "Savings Potential",
    "labels": ["Current", "Increased Savings"],
    "values": [2000, 2500]
  }
}
```

---

### PHASE 4: Mobile Android Setup (Optional, ⏱️ 30-45 minutes)

#### Prerequisites
- Android phone with Developer Mode enabled
- USB cable
- Android SDK Platform Tools installed

#### Step 1: Enable USB Debugging

On your Android phone:
1. Settings → About Phone
2. Tap "Build Number" 7 times
3. Back to Settings → Developer Options
4. Enable "USB Debugging"

#### Step 2: Connect and Verify

```powershell
adb devices
# Should output:
# List of attached devices
# your-device-id    device
```

#### Step 3: Build Debug APK

```powershell
pnpm --filter @workspace/mobile run build
```

**Output location:** `artifacts/mobile/bin/app-debug.apk`

#### Step 4: Install on Device

```powershell
adb install artifacts/mobile/bin/app-debug.apk
```

#### Step 5: Test on Phone

1. Tap app icon to open FinTwin
2. Go through sign up/login
3. Test financial features
4. Test AI Coach

---

### PHASE 5: Production Build & Deployment (⏱️ 20-30 minutes)

#### Step 1: Create Production .env

Create new `.env.production` with production values:

```env
NODE_ENV=production
DATABASE_URL=postgres://...your production database...
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_PROJECT_ID=your-prod-project-id
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
GEMINI_API_KEY=your-key
PORT=5000
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

#### Step 2: Build All Packages

```powershell
pnpm run build
```

**Outputs:**
- API: `artifacts/api-server/dist/index.mjs`
- Web: `artifacts/mockup-sandbox/dist/`
- Mobile: Ready for APK/AAB generation

#### Step 3: Deploy API Server

**Option A: Docker**

Create `Dockerfile`:
```dockerfile
FROM node:24-slim
WORKDIR /app
COPY . .
RUN pnpm install --prod
RUN pnpm run build
EXPOSE 5000
CMD ["node", "artifacts/api-server/dist/index.mjs"]
```

Build and push:
```powershell
docker build -t your-registry/fintwin-api:latest .
docker push your-registry/fintwin-api:latest
```

**Option B: Vercel**

```powershell
pnpm install -g vercel
cd artifacts/api-server
vercel --prod
```

**Option C: Railway/Render/Heroku**

```powershell
# Deploy the entire repo
# Set environment variables in platform dashboard
# Platform will run: node artifacts/api-server/dist/index.mjs
```

#### Step 4: Deploy Web App

**Option A: Vercel**

```powershell
cd artifacts/mockup-sandbox
vercel --prod
```

**Option B: Netlify**

```powershell
pnpm install -g netlify-cli
cd artifacts/mockup-sandbox
netlify deploy --prod --dir=dist
```

**Option C: Traditional Hosting (AWS S3, etc.)**

```powershell
cd artifacts/mockup-sandbox
pnpm run build
# Upload dist/ contents to web server
# Configure 404 → index.html rewrite for routing
```

#### Step 5: Configure Domain & SSL

1. Point DNS to your hosting provider
2. Enable HTTPS (free via Let's Encrypt)
3. Test endpoints are accessible

---

### PHASE 6: Production Verification (⏱️ 10-15 minutes)

#### Checklist

- [ ] API is responding: `curl https://api.yourdomain.com/api/healthz`
- [ ] Database connection works
- [ ] Can create new users via signup
- [ ] Can log in with existing users
- [ ] AI endpoint returns responses
- [ ] No API keys in frontend bundles
- [ ] HTTPS enforced on all connections
- [ ] CORS origin restrictions working
- [ ] Error logging configured
- [ ] Database backups enabled

#### Test Commands

```powershell
# Test API health
curl https://api.yourdomain.com/api/healthz

# Test signup (get new user)
$payload = @{
  email = "test@example.com"
  password = "SecurePassword123"
} | ConvertTo-Json

# First get JWT from Supabase, then:
curl -X POST https://api.yourdomain.com/api/auth/register `
  -H "Authorization: Bearer YOUR_JWT" `
  -H "Content-Type: application/json" `
  -d @'$payload'@

# Test AI endpoint
curl -X POST https://api.yourdomain.com/api/ai/coach `
  -H "Authorization: Bearer YOUR_JWT" `
  -H "Content-Type: application/json" `
  -d @'your-ai-payload'@
```

---

## 🔐 SECURITY VERIFICATION CHECKLIST

Before going live, verify:

```powershell
# 1. No API keys in source code
grep -r "GEMINI_API_KEY" artifacts/ src/
# Should return: nothing

# 2. .env is git-ignored
cat .gitignore | grep ".env"
# Should show: .env

# 3. Environment variables not hardcoded
grep -r "process.env" artifacts/
# Should only show process.env references, not values

# 4. Database password not in code
grep -r "postgres://" artifacts/ src/
# Should return: nothing

# 5. No credentials in version history
git log --oneline | head -20
# Should not show credential commits
```

---

## 📈 PERFORMANCE OPTIMIZATION

After deployment, consider:

### Database
```powershell
# Add more indexes for common queries
# Optimize slow queries with EXPLAIN ANALYZE
# Configure connection pooling
```

### API
```powershell
# Enable response caching
# Add rate limiting
# Compress responses with gzip
# Use CDN for static files
```

### Frontend
```powershell
# Enable lazy loading for components
# Code splitting for routes
# Image optimization
# Service worker for offline
```

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Production Issues

**Issue: Database connection fails in production**
```powershell
# Verify DATABASE_URL is correct in platform settings
# Check database isn't paused in Supabase
# Verify IP whitelist allows your server
```

**Issue: API returns 401 Unauthorized**
```powershell
# Verify JWT token is valid
# Check SUPABASE_JWT_SECRET matches Supabase setting
# Ensure Authorization header format: "Bearer TOKEN"
```

**Issue: CORS errors from frontend**
```powershell
# Update CORS_ORIGINS environment variable
# Include your domain
# Restart API server
```

**Issue: Gemini API errors**
```powershell
# Verify GEMINI_API_KEY is set
# Check API key is still valid
# Verify rate limits not exceeded
# Check request format matches Gemini API spec
```

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Set up monitoring**
   - Error tracking (Sentry, LogRocket)
   - Performance monitoring (New Relic, DataDog)
   - Uptime monitoring (StatusPage)

2. **Configure backups**
   - Enable automated Supabase backups
   - Set up database replication
   - Test restore process

3. **Set up CI/CD**
   - GitHub Actions for automated tests
   - Deploy on git push
   - Automated database migrations

4. **Plan maintenance**
   - Regular security updates
   - Database optimization
   - API versioning strategy

5. **Marketing & Launch**
   - Create landing page
   - Set up analytics (Google Analytics, Mixpanel)
   - Configure email notifications
   - Plan launch schedule

---

**Deployment Status**: 🟢 Ready  
**Last Updated**: November 10, 2026  
**Support**: See README.md and replit.md for more details
