# Development Setup Guide

## Quick Start (No Authentication)

The LatentSee application can run without authentication features for development and demo purposes. Simply run:

```bash
npm install
npm run dev
```

The app will work with limited functionality (no user accounts, but all visual features work).

## Full Setup (With Authentication)

To enable user accounts and full authentication features:

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for project setup to complete (2-3 minutes)

### 2. Get Your Credentials
1. Go to Settings → API in your Supabase dashboard
2. Copy your Project URL and anon/public key

### 3. Configure Environment
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your credentials:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Database (Optional)
If you want to store user profiles and data:

1. Go to SQL Editor in Supabase
2. Copy and paste the contents of `migrations/001_initial_schema.sql`
3. Run the query

### 5. Restart Development Server
```bash
npm run dev
```

## Troubleshooting

### Common Issues

**Console Errors About Supabase**
- These are normal if you haven't configured Supabase yet
- The app will work in "demo mode" without authentication
- Configure environment variables to enable full features

**Empty Error Messages**
- Usually means Supabase isn't configured
- Check your `.env.local` file has the correct credentials
- Restart the dev server after making changes

**Authentication Not Working**
- Verify your Supabase project is active
- Check that your API keys are correct (no extra spaces)
- Make sure you're using the anon/public key, not the secret key

## Features Available

### Without Authentication
- ✅ Homepage and navigation
- ✅ Documentation page
- ✅ Visual demos and animations
- ✅ Performance simulations
- ❌ User accounts
- ❌ Personalized dashboards
- ❌ Data persistence

### With Authentication
- ✅ All features above
- ✅ User registration and login
- ✅ Personalized dashboards
- ✅ Settings and preferences
- ✅ Data persistence across sessions

## Next Steps

1. **Development**: The app works great without authentication for development
2. **Demo/Production**: Set up Supabase for full functionality
3. **Custom Features**: Extend the auth system for your specific needs

Need help? Check the main README.md or the troubleshooting section.