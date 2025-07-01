# MacroAI Newsletter Website

This site provides an AI-powered macroeconomics newsletter with a free beta subscription and integrated user account management. The application features:

- **Dual Deployment**: Can run on both Express.js (local development) and Cloudflare Workers (production)
- **User Authentication**: Email-based registration and login system
- **Preview Limit System**: 3 free document previews for guests, unlimited for registered users
- **World Bank Integration**: Live economic research dashboard with document filtering
- **AI-Powered Summaries**: Gemini AI generates summaries of World Bank documents
- **Responsive Design**: Mobile-first design with Tailwind CSS

Key features include user registration/login, preview usage tracking, World Bank document filtering, AI document summaries, and a modern responsive interface.

## Development

### Environment Setup

#### 1. Get your Gemini API key:
- Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
- Sign in with your Google account
- Click "Create API Key"
- Copy the generated key

#### 2. Create environment files:
- **For Express.js local development**: Create `.env` file:
  ```bash
  GEMINI_API_KEY=your_gemini_api_key_here
  ```
- **For Cloudflare Workers local development**: Create `.dev.vars` file:
  ```bash
  GEMINI_API_KEY=your_gemini_api_key_here
  ```

#### 3. For Cloudflare Workers production deployment:
```bash
wrangler secret put GEMINI_API_KEY
```
(Enter your Gemini API key when prompted)

#### 4. Install Dependencies:
```bash
npm install
```

If you don't have the required packages for local development, install them:
```bash
npm install cookie-parser
```

## Database Setup

### For Cloudflare Workers (Production)

The authentication system uses Cloudflare D1 database for production deployments.

#### 1. Create the D1 Database:
```bash
wrangler d1 create macroecoai-db
```

#### 2. Update wrangler.jsonc:
Copy the `database_id` from the command output and update `wrangler.jsonc`:
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "macroecoai-db",
      "database_id": "your-database-id-here"
    }
  ]
}
```

#### 3. Run Database Schema:
```bash
wrangler d1 execute macroecoai-db --file=schema.sql
```

#### 4. Verify Database Setup:
```bash
wrangler d1 execute macroecoai-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```
You should see `users` and `sessions` tables listed.

#### 5. (Optional) Migrate Existing Database:
If you already have a users table without the `preview_count` column, run this migration:
```bash
wrangler d1 execute macroecoai-db --file=migration-preview-count.sql
```

#### 6. (Optional) Check Database Contents:
```bash
# View all users with preview counts
wrangler d1 execute macroecoai-db --command="SELECT id, email, name, preview_count FROM users;"

# View active sessions
wrangler d1 execute macroecoai-db --command="SELECT * FROM sessions WHERE expires_at > datetime('now');"

# Check database schema to verify preview_count column exists
wrangler d1 execute macroecoai-db --command="PRAGMA table_info(users);"
```

### For Local Development

Local development uses **in-memory storage** - no database setup required!

- User data is stored in JavaScript `Map` objects
- Data persists only while the Express.js server is running
- Perfect for testing authentication features without database complexity
- When you restart the server, all user data is reset

This makes local development simple and fast for testing the authentication system.

## Local Development

### Local Development with Cloudflare Workers
1. Install dependencies:
```bash
npm install
```

2. Ensure you have a `.dev.vars` file (see Environment Setup above)

3. Start the Cloudflare Workers development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:8787`

**Note**: The `.dev.vars` file is used for local development only. Production deployments use secrets set via `wrangler secret put`.

### Local Development with Express.js (Alternative)
```bash
npm run local
```
Opens on `http://localhost:3000`

### Static Preview
You can still open the `public/index.html` file directly in a browser for static preview since all assets are relative.

## Deployment to Cloudflare Workers

### Prerequisites
- Complete the Database Setup (see above) before deploying
- Ensure your `wrangler.jsonc` has the correct `database_id`
- Set up your Gemini API key secret

### Deployment Steps

#### Option 1: Command Line Deployment
```bash
wrangler deploy
```

#### Option 2: GitHub Integration
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create** → **Workers**  
3. Click **Connect to Git** and select your GitHub repository
4. Configure deployment settings:
   - **Project name**: `macroecoai`
   - **Production branch**: `main`
   - **Build command**: Leave empty (no build required)
   - **Root directory**: `.` (root directory)
5. Click **Save and Deploy**

### Post-Deployment Verification

1. **Test Authentication**:
   - Visit your deployed site
   - Try registering a new account
   - Test login/logout functionality

2. **Check Database**:
   ```bash
   wrangler d1 execute macroecoai-db --command="SELECT COUNT(*) as user_count FROM users;"
   ```

3. **Monitor Logs**:
   ```bash
   wrangler tail
   ```

The site will be accessible at your Cloudflare Workers domain (e.g., `https://macroecoai.your-subdomain.workers.dev`).

## Project Structure
```
macroecoai/
├── src/
│   └── index.js        # Cloudflare Workers entry point with auth endpoints
├── public/             # Static assets directory
│   ├── index.html      # Homepage with authentication UI
│   ├── subscribe.html  # Subscription page
│   ├── article.html    # Demo article
│   ├── success.html    # Success page
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css  # Custom styles + auth modal styling
│   │   └── js/
│   │       ├── auth.js            # Authentication state management
│   │       ├── preview-tracker.js # Preview limit tracking and UI
│   │       ├── main.js            # Core functionality + World Bank filtering
│   │       └── forms.js           # Form validation
│   ├── robots.txt
│   └── sitemap.xml
├── server.js                      # Express.js server with in-memory auth
├── schema.sql                     # Database schema for users and sessions
├── migration-preview-count.sql    # Migration to add preview_count column
├── package.json                   # Node.js dependencies and scripts
├── wrangler.jsonc                 # Cloudflare Workers config with D1 binding
└── README.md                     # This file
```

## Features

### Authentication System
- **Email-based registration**: Users sign up with name and email
- **Simple login**: Login with just email address (no password required initially)
- **Session management**: 7-day persistent sessions with automatic validation
- **Responsive UI**: Authentication works on desktop and mobile
- **Real-time updates**: UI dynamically updates based on login state

### Preview Limit System
- **Free tier**: 3 free document previews for unregistered users
- **Usage tracking**: Real-time countdown showing remaining free previews
- **Registration prompt**: Attractive modal encouraging signup when limit reached
- **Unlimited access**: Registered users get unlimited document previews
- **Preview counter**: Shows total preview usage for authenticated users
- **Persistent tracking**: Uses localStorage for guests, database for users
- **Cross-device sync**: Preview counts sync across devices for registered users

### World Bank Integration
- **Live data**: Automatically fetches latest economic research documents
- **Document filtering**: Toggle filter for "Macro Poverty Outlook" reports
- **AI summaries**: Generate document summaries using Gemini AI
- **Document preview**: View document content in modal with user input field
- **Preview limits**: Enforced before document loading to encourage registration

### Technical Features
- **Dual deployment**: Works with both Express.js and Cloudflare Workers
- **Database flexibility**: D1 for production, in-memory for local development
- **Mobile responsive**: Mobile-first design with Tailwind CSS
- **Error handling**: Comprehensive validation and user-friendly error messages

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration (name + email)
- `POST /api/auth/login` - User login (email only)
- `POST /api/auth/logout` - User logout and session termination
- `GET /api/auth/me` - Get current authenticated user info
- `POST /api/auth/increment-preview` - Increment preview count for authenticated users

### World Bank Integration
- `GET /api/worldbank` - Fetch World Bank documents (CORS proxy)
- `GET /api/worldbank/text?url=<url>` - Fetch document text content
- `GET /api/worldbank/summary?url=<url>` - Generate AI summary with Gemini

## Troubleshooting

### Database Issues
```bash
# Check if database exists
wrangler d1 list

# Verify tables exist
wrangler d1 execute macroecoai-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check database schema
wrangler d1 execute macroecoai-db --command=".schema"
```

### Authentication Issues
- **Local development**: Check server logs for in-memory storage state
- **Production**: Verify D1 database has correct tables and data
- **Sessions**: Check browser localStorage for `session_token`

### Preview System Issues
```bash
# Check if preview_count column exists
wrangler d1 execute macroecoai-db --command="PRAGMA table_info(users);"

# Reset a user's preview count
wrangler d1 execute macroecoai-db --command="UPDATE users SET preview_count = 0 WHERE email = 'user@example.com';"

# Check localStorage preview count (in browser console)
localStorage.getItem('free_preview_count')

# Reset localStorage preview count (in browser console)
localStorage.removeItem('free_preview_count')
```

### Common Setup Issues
1. **Missing API key**: Ensure `GEMINI_API_KEY` is set in `.env`/`.dev.vars`
2. **Database not found**: Run `wrangler d1 create macroecoai-db` and update `wrangler.jsonc`
3. **Cookie-parser missing**: Run `npm install cookie-parser` for local development
