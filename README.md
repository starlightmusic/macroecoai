# Macroeconomics Newsletter Website

This site provides an AI-powered macroeconomics newsletter with a free beta subscription. The site uses vanilla HTML, Tailwind CSS, and minimal JavaScript with an Express.js server for dynamic deployment.

A demo article is available at `article.html` so readers can preview the content before subscribing.

## Development

### Local Development with Cloudflare Workers
1. Install dependencies:
```bash
npm install
```

2. Start the Cloudflare Workers development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:8787`

### Local Development with Express.js (Alternative)
```bash
npm run local
```
Opens on `http://localhost:3000`

### Static Preview
You can still open the `index.html` file directly in a browser for static preview since all assets are relative.

## Deployment to Cloudflare Workers

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create** → **Workers**
3. Click **Connect to Git** and select your GitHub repository
4. Configure deployment settings:
   - **Project name**: `macroecoai`
   - **Production branch**: `main`
   - **Build command**: Leave empty (no build required)
   - **Root directory**: `.` (root directory)
5. Click **Save and Deploy**

The site will be accessible at your Cloudflare Workers domain (e.g., `https://macroecoai.your-subdomain.workers.dev`).

### Post-Deployment
- Forms submit to Formspree endpoints and redirect to `success.html`
- All static assets are served through the Cloudflare Workers runtime
- Dynamic functionality can be easily added to the Worker script at `src/index.js`

## Project Structure
```
macroecoai/
├── src/
│   └── index.js        # Cloudflare Workers entry point
├── server.js           # Express.js server (for local dev)
├── package.json        # Node.js dependencies and scripts
├── wrangler.jsonc      # Cloudflare Workers configuration
├── index.html          # Homepage
├── subscribe.html      # Subscription page
├── article.html        # Demo article
├── success.html        # Success page
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
│       └── forms.js
├── robots.txt
└── sitemap.xml
```
