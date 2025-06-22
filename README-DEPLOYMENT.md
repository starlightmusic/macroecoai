# Economic Data Feature Deployment Guide

This guide will help you deploy the new dynamic economic data feature to your Cloudflare setup.

## Prerequisites

1. Cloudflare account with Workers and Pages access
2. Wrangler CLI installed: `npm install -g wrangler`
3. NewsAPI account (free tier available at https://newsapi.org/)

## Step 1: Setup Cloudflare D1 Database

```bash
# Create D1 database
wrangler d1 create macroecoai-db

# This will return a database_id. Update wrangler.toml with this ID
# Replace "placeholder-db-id" in wrangler.toml with the actual ID

# Initialize database with schema
wrangler d1 execute macroecoai-db --file=./schema.sql
```

## Step 2: Setup Cloudflare KV Namespace

```bash
# Create KV namespace for caching
wrangler kv:namespace create "CACHE"

# This will return a namespace ID. Update wrangler.toml with this ID
# Replace "placeholder-kv-id" in wrangler.toml with the actual ID
```

## Step 3: Configure Environment Variables

```bash
# Set up NewsAPI key (get free key from https://newsapi.org/)
wrangler secret put NEWS_API_KEY
# Enter your NewsAPI key when prompted
```

## Step 4: Update Worker URL in Frontend

Edit `assets/js/economic-data.js` and update the `workerUrl`:

```javascript
// Replace this line:
const workerUrl = 'https://macroecoai.your-subdomain.workers.dev';

// With your actual Worker URL:
const workerUrl = 'https://macroecoai.your-username.workers.dev';
```

## Step 5: Deploy

```bash
# Deploy the Worker
wrangler deploy

# Deploy to Pages (if using Pages)
wrangler pages deploy . --project-name=macroecoai
```

## Step 6: Test the Setup

1. Visit your website
2. Go to the new "Economic Data" page or scroll to the economic data section on the home page
3. Click "Load Latest Economic Data" to test the API
4. Data should load from the World Bank API and news from NewsAPI

## Step 7: Verify Scheduled Function

```bash
# Check if cron trigger is set up correctly
wrangler tail

# Then trigger manually to test:
# Go to Cloudflare Dashboard > Workers & Pages > Your Worker > Triggers
# You can test the scheduled function manually
```

## Troubleshooting

### Common Issues:

1. **"Failed to load economic data"**
   - Check that D1 database is properly configured
   - Verify database ID in wrangler.toml
   - Check Worker logs: `wrangler tail`

2. **News not loading**
   - Verify NewsAPI key is set: `wrangler secret list`
   - Check NewsAPI quota (100 requests/day on free tier)

3. **Worker URL not found**
   - Update the workerUrl in `economic-data.js` with your actual Worker URL
   - Check that Worker is deployed: `wrangler whoami`

4. **CORS errors**
   - The Worker includes CORS headers, but verify your domain is correctly configured

### Manual Data Collection

To manually trigger data collection:

```bash
# You can trigger the scheduled function manually from the Cloudflare dashboard
# Or use the Workers environment to test the collection
```

## Features Included

### Economic Indicators (from World Bank API):
- GDP (Current US$)
- GDP per Capita
- GDP Growth Rate
- Unemployment Rate
- Inflation Rate
- Exchange Rate (ETB/USD)

### News Integration:
- Economic news related to Ethiopia
- Filtered for relevance
- Cached for performance

### Database Schema:
- `economic_indicators`: Historical economic data
- `news_articles`: Economic news articles
- `countries`: Future expansion support

### Frontend Features:
- Live data loading
- Error handling
- Loading states
- Responsive design
- Data formatting and visualization

## Maintenance

- Scheduled function runs weekly (every Monday at midnight UTC)
- Data is cached in KV storage for 24 hours
- Database will grow over time - monitor usage in Cloudflare dashboard
- NewsAPI free tier allows 100 requests/day, 500/month

## Cost Estimate

With Cloudflare's generous free tiers:
- Workers: 100,000 requests/day free
- D1: 5 GB storage, 25 million reads/month free
- KV: 100,000 reads/day free
- NewsAPI: 500 requests/month free

This setup should run completely free for most use cases.