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

This is a dual-deployment web application that serves as an AI-powered macroeconomics newsletter website with integrated World Bank economic research dashboard:

- **Static Frontend**: Located in `public/` directory with vanilla HTML, Tailwind CSS (CDN), and minimal JavaScript
- **Dual Backend**: Can run on both Express.js (`server.js`) for local development and Cloudflare Workers (`src/index.js`) for production
- **Form Handling**: Client-side validation with Formspree integration for newsletter subscriptions
- **World Bank Integration**: Server-side API proxy for fetching economic documents and text content

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
- `/` → `index.html` (Homepage with World Bank economic research dashboard)
- `/subscribe` → `subscribe.html` (Subscription page)  
- `/article` → `article.html` (Demo article)
- `/success` → `success.html` (Success confirmation)

### API Endpoints
- `/api/worldbank` - Proxy for World Bank document search API (CORS fix)
- `/api/worldbank/text?url=<txturl>` - Proxy for fetching document text content

### Form Integration
Forms use Formspree for submission handling and redirect to `/success` on completion. Client-side validation is handled in `assets/js/forms.js`.

### Styling Architecture
- **Tailwind CSS**: Primary framework via CDN
- **Custom CSS**: Components in `assets/css/style.css` for buttons, cards, forms, and gradient backgrounds
- **Responsive**: Mobile-first design with Tailwind utilities

### World Bank Research Dashboard
- **Homepage Integration**: Interactive economic research table replaces sample articles section
- **Document Preview**: Hover cards display document text content with user input field
- **Auto-loading**: World Bank data automatically loads on homepage visit
- **Table Features**: Country, Document Title, PDF/Text links, and Preview functionality
- **CORS Solution**: Server-side proxy endpoints prevent browser CORS issues

### SEO & Analytics
- Google Analytics integration (G-GR0QN9Y7EJ)
- SEO optimization with `robots.txt` and `sitemap.xml`
- Open Graph properties for social sharing

### Planned Features
- **Document Preview Modal**: Click Preview button to view document text in hover card
- **User Input Field**: Text box in preview modal for future AI question/answer functionality
- **Auto-loading Dashboard**: Homepage automatically displays latest World Bank economic research