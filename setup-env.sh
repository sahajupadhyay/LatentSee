#!/bin/bash

# Environment Setup Script for LatentSee
# This script helps set up the environment files for the project

echo "🔧 Setting up environment files for LatentSee..."

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Creating backup..."
    cp .env.local .env.local.backup.$(date +"%Y%m%d_%H%M%S")
fi

# Copy the example file to create .env.local
if [ -f ".env.local.example" ]; then
    cp .env.local.example .env.local
    echo "✅ Created .env.local from .env.local.example"
else
    echo "❌ .env.local.example not found!"
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local and fill in your actual values"
echo "2. Get your Supabase URL and keys from: https://app.supabase.com/project/_/settings/api"
echo "3. For Redis, you can use a local Redis instance or a cloud service like Upstash"
echo "4. Generate a secure NEXTAUTH_SECRET: openssl rand -base64 32"
echo ""
echo "🔗 Useful links:"
echo "   Supabase Dashboard: https://app.supabase.com/"
echo "   Redis Setup: https://redis.io/docs/getting-started/"
echo "   NextAuth.js Docs: https://next-auth.js.org/"
echo ""
echo "🎉 Environment setup complete! Remember to never commit .env.local to git."