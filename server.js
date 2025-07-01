const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for local development (replace with real database in production)
const users = new Map();
const sessions = new Map();

// Helper functions for authentication
function generateSessionToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getSessionUser(req) {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.session_token;
    if (!sessionToken) return null;
    
    const session = sessions.get(sessionToken);
    if (!session || session.expiresAt < new Date()) {
        sessions.delete(sessionToken);
        return null;
    }
    
    return users.get(session.userId);
}

// Authentication API endpoints
app.post('/api/auth/register', (req, res) => {
    try {
        const { name, email } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Check if user already exists
        if (Array.from(users.values()).some(user => user.email === email)) {
            return res.status(409).json({ error: 'User already exists with this email' });
        }
        
        // Create new user
        const userId = Date.now().toString();
        const user = {
            id: userId,
            email,
            name,
            createdAt: new Date(),
            subscriptionStatus: 'none',
            previewCount: 0
        };
        
        users.set(userId, user);
        
        // Create session
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        sessions.set(sessionToken, {
            userId,
            expiresAt
        });
        
        res.cookie('session_token', sessionToken, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: 'strict'
        });
        
        res.status(201).json({ 
            success: true, 
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscription_status: user.subscriptionStatus,
                preview_count: user.previewCount
            },
            session_token: sessionToken 
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Find user
        const user = Array.from(users.values()).find(u => u.email === email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update last login
        user.lastLogin = new Date();
        
        // Create new session
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        sessions.set(sessionToken, {
            userId: user.id,
            expiresAt
        });
        
        res.cookie('session_token', sessionToken, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: 'strict'
        });
        
        res.json({ 
            success: true, 
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscription_status: user.subscriptionStatus || 'none',
                preview_count: user.previewCount || 0
            },
            session_token: sessionToken 
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.session_token;
        
        if (sessionToken) {
            sessions.delete(sessionToken);
        }
        
        res.clearCookie('session_token');
        res.json({ success: true });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

app.get('/api/auth/me', (req, res) => {
    try {
        const user = getSessionUser(req);
        
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        res.json({ 
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscription_status: user.subscriptionStatus || 'none',
                preview_count: user.previewCount || 0
            }
        });
        
    } catch (error) {
        console.error('Auth me error:', error);
        res.status(500).json({ error: 'Authentication check failed' });
    }
});

app.post('/api/auth/increment-preview', (req, res) => {
    try {
        const user = getSessionUser(req);
        
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        // Increment preview count
        user.previewCount = (user.previewCount || 0) + 1;
        
        res.json({ 
            success: true,
            preview_count: user.previewCount
        });
        
    } catch (error) {
        console.error('Increment preview error:', error);
        res.status(500).json({ error: 'Failed to increment preview count' });
    }
});

// API endpoint for World Bank data (CORS fix)
app.get('/api/worldbank', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://search.worldbank.org/api/v3/wds?format=json&owner=EMFMD&fl=count,txturl&strdate=2024-01-01&rows=100');
        
        if (!response.ok) {
            throw new Error(`World Bank API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        
        res.json(data);
    } catch (error) {
        console.error('World Bank API error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch World Bank data',
            message: error.message 
        });
    }
});

// API endpoint for World Bank document text (CORS fix)
app.get('/api/worldbank/text', async (req, res) => {
    try {
        const { url } = req.query;
        
        console.log('🔍 EXPRESS DEBUG: /api/worldbank/text endpoint called');
        console.log('📥 Query params:', req.query);
        console.log('🔗 URL parameter:', url);
        
        if (!url) {
            console.log('❌ No URL parameter provided');
            return res.status(400).json({ error: 'URL parameter is required' });
        }
        
        console.log('📡 Attempting to fetch:', url);
        
        const fetch = (await import('node-fetch')).default;
        
        // Add browser-like headers to avoid 403 errors
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/plain,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Referer': 'https://www.worldbank.org/',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
        
        console.log('📤 Using headers:', headers);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            redirect: 'follow',
            follow: 20  // Maximum number of redirects to follow
        });
        
        console.log('📊 World Bank response status:', response.status);
        console.log('📊 World Bank response ok:', response.ok);
        console.log('📊 World Bank response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            console.log('❌ World Bank returned error status:', response.status);
            const errorBody = await response.text();
            console.log('❌ Error response body:', errorBody.substring(0, 500));
            throw new Error(`Document fetch error: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('✅ Successfully fetched text from World Bank, length:', text.length);
        console.log('📝 First 200 chars:', text.substring(0, 200));
        
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Content-Type', 'text/plain');
        
        res.send(text);
    } catch (error) {
        console.error('❌ EXPRESS ERROR: Document text fetch error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch document text',
            message: error.message 
        });
    }
});

// API endpoint for World Bank document AI summary
app.get('/api/worldbank/summary', async (req, res) => {
    try {
        const { url } = req.query;
        
        console.log('🤖 EXPRESS DEBUG: /api/worldbank/summary endpoint called');
        console.log('📥 Query params:', req.query);
        console.log('🔗 URL parameter:', url);
        
        if (!url) {
            console.log('❌ No URL parameter provided');
            return res.status(400).json({ error: 'URL parameter is required' });
        }
        
        console.log('📡 Fetching document text from:', url);
        
        // First fetch the document text
        const fetch = (await import('node-fetch')).default;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/plain,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Referer': 'https://www.worldbank.org/',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
        
        const docResponse = await fetch(url, {
            method: 'GET',
            headers: headers,
            redirect: 'follow',
            follow: 20
        });
        
        if (!docResponse.ok) {
            throw new Error(`Document fetch error: ${docResponse.status}`);
        }
        
        const documentText = await docResponse.text();
        console.log('✅ Document fetched, length:', documentText.length);
        
        // Generate AI summary using Gemini
        console.log('🤖 Generating AI summary with Gemini 1.5 Flash...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Please summarize this World Bank economic document in exactly 250 words. Focus on the key economic findings, indicators, policy implications, and outlook. Structure the summary with clear paragraphs for readability. Here is the document text:

${documentText}`;
        
        const result = await model.generateContent(prompt);
        const summary = result.response.text();
        
        console.log('✅ AI summary generated, length:', summary.length);
        console.log('📝 Summary preview:', summary.substring(0, 100) + '...');
        
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Content-Type', 'application/json');
        
        res.json({ 
            summary: summary,
            originalLength: documentText.length,
            summaryLength: summary.length
        });
        
    } catch (error) {
        console.error('❌ EXPRESS ERROR: AI summary generation error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate AI summary',
            message: error.message 
        });
    }
});

// Route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for specific pages
app.get('/subscribe', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subscribe.html'));
});

app.get('/article', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'article.html'));
});

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;