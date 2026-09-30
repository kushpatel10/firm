#!/bin/bash
set -e

echo "🚀 Deploying updates for Firm Platform..."

# 1. Pull latest code (adjust branch if needed)
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# 3. Update Prisma schema & generate client
echo "🗄️ Updating database client..."
npm run db:generate
npm run db:push

# 4. Build Next.js frontend
echo "🏗️ Building frontend..."
npm run build

# 5. Reload PM2 processes
echo "🔄 Reloading PM2 services..."
pm2 reload ecosystem.config.cjs --update-env

echo "✅ Firm Platform deployment complete and running 24/7!"
