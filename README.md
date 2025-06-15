# Macroeconomics Newsletter Website

This site provides an AI-powered macroeconomics newsletter with a free beta subscription. The site uses vanilla HTML, Tailwind CSS, and minimal JavaScript.

## Development
Open the `index.html` file in a browser to preview locally. All assets are relative so no build step is required.

## Deployment
Deploy the repository root to Cloudflare Pages. Forms submit to Formspree endpoints and redirect to `success.html`.
Deploy the repository root to Cloudflare Pages. The `_redirects` file handles friendly URLs. Forms submit to Formspree endpoints and redirect to `success.html`.
codex/generate-full-macroeconomics-newsletter-website


When deploying with Wrangler, the included `wrangler.toml` sets the project name to `macroecoai`. If your Pages project uses a different name, update `wrangler.toml` accordingly.

Deploy with:

```bash
npx wrangler pages deploy .
```

