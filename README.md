# Macroeconomics Newsletter & Data Collector

This project hosts a static newsletter website and a Cloudflare Worker that collects Ethiopian macroeconomic indicators daily from the DB‑NOMICS API. Collected data is stored in a D1 database.

## Development

Install the Cloudflare Wrangler CLI and run the development server:

```bash
npm install
npm run dev
```

## Deployment

The `scripts/deploy.sh` script automates database creation, schema setup, and deployment of the Pages site and Worker:

```bash
bash scripts/deploy.sh
```

## Database

Database schema is defined in `database/schema.sql` and migrations are in `database/migrations/`.

## Manual Data Collection

Trigger a manual collection with the Worker endpoint:

```bash
curl -X POST https://eth-data-collector.YOUR-SUBDOMAIN.workers.dev/collect
```

Logs can be tailed with `npm run logs`.

## Cloudflare Setup

Use the Wrangler CLI to deploy to Cloudflare. After installing Wrangler run:

```bash
# authenticate Wrangler with your Cloudflare account
wrangler login

# (one time) create a Pages project and a D1 database
wrangler pages project create macroeconomics-newsletter
wrangler d1 create ethiopian-macro-data
wrangler d1 execute ethiopian-macro-data --file=./database/schema.sql

# deploy the static site and worker
wrangler pages deploy ./website
wrangler deploy ./workers/data-collector.js
```

The cron trigger specified in `wrangler.toml` will run daily at 09:00 UTC.
