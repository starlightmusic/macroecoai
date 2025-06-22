#!/bin/bash

# Local Development Setup Script for MacroEcoAI
echo "🚀 Setting up MacroEcoAI for local development..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Create local D1 database
echo "📊 Creating local D1 database..."
echo "Run this command and update wrangler.toml with the database_id:"
echo "wrangler d1 create macroecoai-db-local"
echo ""

# Create local KV namespace
echo "🗂️  Creating local KV namespace..."
echo "Run this command and update wrangler.toml with the id:"
echo "wrangler kv:namespace create CACHE --preview"
echo ""

# Instructions for .dev.vars
echo "🔑 Setting up environment variables..."
echo "1. Get a free API key from https://newsapi.org/"
echo "2. Update .dev.vars file with your NewsAPI key"
echo ""

echo "📋 Next steps after running the above commands:"
echo "1. Update wrangler.toml with the actual database_id and KV namespace id"
echo "2. Run: npm run db:init (to initialize the database)"
echo "3. Run: npm run dev (to start local development)"
echo "4. Run: npm run serve (in another terminal to serve static files)"
echo "5. Visit http://localhost:3000 to see your site"
echo ""

echo "✅ Setup script completed!"
echo "💡 Tip: Use 'npm run' to see all available commands"