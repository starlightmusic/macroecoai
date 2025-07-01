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
- `src/index.js` - Cloudflare Workers fetch handler with route management and authentication endpoints
- `server.js` - Express.js server for local development with in-memory user storage
- `public/index.html` - Homepage with newsletter signup and account management UI
- `public/subscribe.html` - Dedicated subscription page
- `public/article.html` - Demo article for content preview
- `public/assets/js/main.js` - Mobile menu, smooth scrolling, loading states, World Bank table filtering
- `public/assets/js/auth.js` - Authentication state management and API calls
- `public/assets/js/forms.js` - Form validation and submission handling
- `public/assets/css/style.css` - Custom CSS components, utilities, and authentication styling
- `wrangler.jsonc` - Cloudflare Workers configuration with D1 database binding
- `schema.sql` - Database schema for users and sessions tables

### Routing
Both deployment targets serve static files from `public/` directory:
- `/` → `index.html` (Homepage with World Bank economic research dashboard)
- `/subscribe` → `subscribe.html` (Subscription page)  
- `/article` → `article.html` (Demo article)
- `/success` → `success.html` (Success confirmation)

### API Endpoints

#### World Bank Integration
- `/api/worldbank` - Proxy for World Bank document search API (CORS fix)
- `/api/worldbank/text?url=<txturl>` - Proxy for fetching document text content
- `/api/worldbank/summary?url=<txturl>` - Generate AI summary of World Bank documents using Gemini

#### User Authentication
- `POST /api/auth/register` - User registration (name + email)
- `POST /api/auth/login` - User login (email only)
- `POST /api/auth/logout` - User logout and session termination
- `GET /api/auth/me` - Get current authenticated user info

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

### User Account Management System

#### Authentication Flow
- **Registration**: Users sign up with name and email (no password required initially)
- **Login**: Email-only authentication for simplicity
- **Session Management**: JWT-like session tokens with 7-day expiration
- **Persistent Login**: Sessions persist across browser restarts using localStorage

#### Database Architecture
- **Production**: Cloudflare D1 SQL database with users and sessions tables
- **Local Development**: In-memory storage using JavaScript Maps
- **Session Security**: HttpOnly cookies + localStorage for token persistence

#### UI Components
- **Header Integration**: Dynamic authentication state in desktop and mobile navigation
- **Modal System**: Responsive login/registration modals with form validation
- **Welcome Messages**: Success notifications for login and registration
- **State Management**: Real-time UI updates based on authentication status

#### API Integration
- **Dual Environment**: Same authentication endpoints work in both Express.js and Cloudflare Workers
- **Error Handling**: Comprehensive validation and user-friendly error messages
- **Session Validation**: Automatic session checking and token refresh

### World Bank Research Features
- **Document Filtering**: Toggle filter for "Macro Poverty Outlook" documents with country/date format
- **Table Management**: Dynamic filtering with document count display
- **Document Preview Modal**: Click Preview button to view document text with AI-generated summaries
- **User Input Field**: Text box in preview modal for future AI question/answer functionality
- **Auto-loading Dashboard**: Homepage automatically displays latest World Bank economic research

### Setup Instructions

#### Database Setup (Production)
1. Create Cloudflare D1 database: `wrangler d1 create macroecoai-db`
2. Update `database_id` in `wrangler.jsonc`
3. Run schema: `wrangler d1 execute macroecoai-db --file=schema.sql`

#### Local Development
- User data stored in memory (resets on server restart)
- No database setup required for testing authentication