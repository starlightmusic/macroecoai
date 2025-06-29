# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
- `npm run dev` - Start Cloudflare Workers development server (http://localhost:8787)
- `npm run local` or `npm start` - Start Express.js server for local development (http://localhost:3000)

### Deployment
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run preview` - Preview with Cloudflare Workers development server

### Build
- `npm run build` - No-op command (no build step required for static assets)

## Architecture Overview

This is a dual-deployment web application that serves as an AI-powered macroeconomics newsletter website:

- **Static Frontend**: Located in `public/` directory with vanilla HTML, Tailwind CSS (CDN), and minimal JavaScript
- **Dual Backend**: Can run on both Express.js (`server.js`) for local development and Cloudflare Workers (`src/index.js`) for production
- **Form Handling**: Client-side validation with Formspree integration for newsletter subscriptions

### Key Files Structure
- `src/index.js` - Cloudflare Workers fetch handler with route management
- `server.js` - Express.js server for local development
- `public/index.html` - Homepage with newsletter signup
- `public/subscribe.html` - Dedicated subscription page
- `public/article.html` - Demo article for content preview
- `public/assets/js/main.js` - Mobile menu, smooth scrolling, loading states
- `public/assets/js/forms.js` - Form validation and submission handling
- `public/assets/css/style.css` - Custom CSS components and utilities

### Routing
Both deployment targets serve static files from `public/` directory:
- `/` → `index.html` (Homepage)
- `/subscribe` → `subscribe.html` (Subscription page)  
- `/article` → `article.html` (Demo article)
- `/success` → `success.html` (Success confirmation)

### Form Integration
Forms use Formspree for submission handling and redirect to `/success` on completion. Client-side validation is handled in `assets/js/forms.js`.

### Styling Architecture
- **Tailwind CSS**: Primary framework via CDN
- **Custom CSS**: Components in `assets/css/style.css` for buttons, cards, forms, and gradient backgrounds
- **Responsive**: Mobile-first design with Tailwind utilities

### SEO & Analytics
- Google Analytics integration (G-GR0QN9Y7EJ)
- SEO optimization with `robots.txt` and `sitemap.xml`
- Open Graph properties for social sharing