# Local Development Guide

This guide will help you set up the MacroEcoAI project for local development and testing.

## Quick Start

### Option 1: Automated Setup
```bash
# Run the setup script
./dev-setup.sh

# Follow the instructions printed by the script
```

### Option 2: Manual Setup

## Prerequisites

1. **Node.js and npm** installed
2. **Wrangler CLI** - `npm install -g wrangler`
3. **Cloudflare account** (free tier works)
4. **NewsAPI account** (free tier available)

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare
```bash
wrangler login
```

### 3. Create Local Resources

#### Create Local D1 Database
```bash
# Create the database
wrangler d1 create macroecoai-db-local

# Copy the database_id from the output and update wrangler.toml
# Replace "placeholder-local-db-id" with the actual ID
```

#### Create Local KV Namespace
```bash
# Create KV namespace for caching
wrangler kv:namespace create CACHE --preview

# Copy the id from the output and update wrangler.toml
# Replace "placeholder-local-kv-id" with the actual ID
```

### 4. Set Environment Variables

#### Option A: Using .dev.vars file (Recommended)
```bash
# Edit .dev.vars file
NEWS_API_KEY=your_actual_newsapi_key_here
```

#### Option B: Using Wrangler secrets
```bash
wrangler secret put NEWS_API_KEY --env local
```

### 5. Initialize Database
```bash
# Initialize database with schema
npm run db:init
```

### 6. Start Development

#### Terminal 1: Start Worker
```bash
npm run dev
# This starts the Worker at http://localhost:8787
```

#### Terminal 2: Serve Static Files
```bash
npm run serve
# This serves the website at http://localhost:3000
```

### 7. Open in Browser
Visit `http://localhost:3000` to see your website with local development setup.

## Available Scripts

```bash
# Development
npm run dev              # Start Worker locally
npm run dev:remote       # Start Worker with remote resources
npm run serve           # Serve static files on port 3000

# Database
npm run db:init         # Initialize database with schema
npm run db:reset        # Reset database (drops all tables and recreates)

# Deployment
npm run deploy          # Deploy to production

# Monitoring
npm run logs            # Tail Worker logs

# Setup helpers
npm run setup:local     # Show setup commands for local resources
npm run setup:db        # Show D1 database setup command
npm run setup:kv        # Show KV namespace setup command
```

## Development Workflow

### 1. Making Changes to Worker Code
- Edit `src/worker.js`
- Changes auto-reload with `npm run dev`
- Check logs in the terminal

### 2. Making Changes to Frontend
- Edit files in `assets/js/` or HTML files
- Refresh browser to see changes
- Worker URL automatically detects local vs production

### 3. Database Changes
- Edit `schema.sql`
- Run `npm run db:reset` to apply changes locally

### 4. Testing Scheduled Functions
The scheduled function won't run automatically in local development. To test:

1. Use Cloudflare dashboard to manually trigger
2. Or call the collection functions directly in your Worker code
3. Or deploy to a staging environment for full testing

## Local Development URLs

- **Website**: http://localhost:3000
- **Worker**: http://localhost:8787
- **Worker API**: 
  - http://localhost:8787/api/latest
  - http://localhost:8787/api/economic-data
  - http://localhost:8787/api/news

## Troubleshooting

### Common Issues

#### "Database not found"
```bash
# Make sure you've created and initialized the local database
wrangler d1 create macroecoai-db-local
npm run db:init
```

#### "NewsAPI key not set"
```bash
# Check your .dev.vars file
cat .dev.vars

# Or set it as a secret
wrangler secret put NEWS_API_KEY --env local
```

#### "KV namespace not found"
```bash
# Create the KV namespace
wrangler kv:namespace create CACHE --preview
# Update wrangler.toml with the returned ID
```

#### "Worker not responding"
```bash
# Check if Worker is running
# Terminal should show: "Ready on http://localhost:8787"
npm run dev
```

#### "Static files not loading"
```bash
# Make sure static server is running
npm run serve
# Visit http://localhost:3000 (not 8787)
```

### Debug Mode

Enable debug logs:
```bash
# Set debug flag
wrangler dev --local --env local --debug
```

### Reset Everything
If you need to start fresh:
```bash
# Reset database
npm run db:reset

# Clear KV cache (if needed)
wrangler kv:key list --binding CACHE --env local
```

## Local vs Production

The setup automatically detects the environment:

- **Local**: Uses `http://localhost:8787` for Worker API
- **Production**: Uses your deployed Worker URL

This is handled automatically in `assets/js/economic-data.js`:
```javascript
const isLocal = window.location.hostname === 'localhost';
const workerUrl = isLocal ? 'http://localhost:8787' : 'https://your-worker.workers.dev';
```

## Next Steps

Once local development is working:
1. Make your changes
2. Test locally
3. Follow the main deployment guide to deploy to production