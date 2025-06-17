#!/usr/bin/env bash
set -e
wrangler d1 create ethiopian-macro-data
wrangler d1 execute ethiopian-macro-data --file=./database/schema.sql
wrangler pages deploy ./website
wrangler deploy ./workers/data-collector.js
echo "Deployment complete. Visit your Cloudflare dashboard for URLs."
