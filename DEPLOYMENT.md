# LatentSee Vercel Deployment Guide

## Environment Variables Setup

Add these environment variables in your Vercel project settings:

### Required Variables (Production)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
API_SECRET_KEY=your_generated_secret_key
NEXTAUTH_SECRET=your_generated_nextauth_secret
NODE_ENV=production
```

> **⚠️ Security Note**: Replace the placeholder values above with your actual credentials in Vercel's environment variables panel. Never commit real API keys to version control.

### Where to Get These Values

- **NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY**: From your Supabase project settings
- **OPENAI_API_KEY**: From https://platform.openai.com/api-keys  
- **API_SECRET_KEY**: Generate with `openssl rand -hex 32`
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`

### Optional Variables
```
APP_NAME=LatentSee
APP_VERSION=0.1.0
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
CACHE_TTL=3600
ENABLE_CACHE=true
```

## Deployment Steps

1. **Push code to GitHub** (with the fixed package.json and .npmrc)
2. **Import project in Vercel**
3. **Add environment variables** (copy from above)
4. **Deploy!**

## Fixed Issues

- ✅ **Zod Version Conflict**: Package.json uses Zod ^3.23.8 (compatible with OpenAI SDK)
- ✅ **Legacy Peer Dependencies**: Added .npmrc with `legacy-peer-deps=true`
- ✅ **Build Configuration**: Added vercel.json with proper settings
- ✅ **Dependency Resolution**: Regenerated package-lock.json with correct versions

## Post-Deployment Testing

After successful deployment, test these features:

### Core Functionality
- [ ] Home page loads correctly
- [ ] Authentication (login/logout) works
- [ ] All API endpoints respond:
  - `/api/always-fresh` (Neural Authority)
  - `/api/check-fast` (Neural Cache) 
  - `/api/smart-memory` (Smart Memory)
  - `/api/health` (Health check)

### AI Features (Phase 1 & 2)
- [ ] Run 2 consistency model tests
- [ ] AI Insights button appears and works
- [ ] AI analysis modal displays properly
- [ ] Budget tracking shows correctly
- [ ] All AI insights render without errors

### Dashboard & Analytics
- [ ] Dashboard page loads with metrics
- [ ] Performance charts display data
- [ ] User profiles save test results (when logged in)

## Troubleshooting

If deployment still fails:

1. **Check Build Logs**: Look for specific error messages
2. **Environment Variables**: Ensure all required vars are set
3. **Dependencies**: Verify package-lock.json is committed
4. **Node Version**: Vercel uses Node 18+ by default (compatible)

## Success Indicators

✅ Build completes without ERESOLVE errors  
✅ All pages render correctly  
✅ AI functionality works as expected  
✅ No console errors in browser  
✅ Performance metrics track properly