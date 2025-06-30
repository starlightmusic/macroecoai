const express = require('express');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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