# Macroeconomics Newsletter Website

This site provides an AI-powered macroeconomics newsletter with a free beta subscription. The site uses vanilla HTML, Tailwind CSS, and minimal JavaScript with an Express.js server for dynamic deployment.

A demo article is available at `article.html` so readers can preview the content before subscribing.

## Development

### Local Development
1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Static Preview
Alternatively, you can still open the `index.html` file directly in a browser for static preview since all assets are relative.

## Deployment to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **Create a project**
3. Click **Connect to Git** and select your GitHub repository
4. Configure build settings:
   - **Project name**: `macroecoai` (or your preferred name)
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `.` (root directory)
   - **Root directory**: `.` (root directory)
5. Add environment variables (optional):
   - `NODE_VERSION`: `18` (or your preferred Node.js version)
6. Click **Save and Deploy**

The site will be accessible at your Cloudflare Pages domain (e.g., `https://macroecoai.pages.dev`).

### Post-Deployment
- Forms submit to Formspree endpoints and redirect to `success.html`
- All static assets (CSS, JS, images) are served directly
- The Express.js server handles routing and serves HTML files

## Project Structure
```
macroecoai/
├── server.js           # Express.js server
├── package.json        # Node.js dependencies and scripts
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
