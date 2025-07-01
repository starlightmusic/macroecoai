// Authentication helper functions
function generateSessionToken() {
  return crypto.randomUUID();
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function getSessionUser(request, env) {
  const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                      getCookie(request, 'session_token');
  
  if (!sessionToken) return null;
  
  try {
    const result = await env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.created_at, u.last_login, u.subscription_status, u.preview_count
      FROM users u 
      JOIN sessions s ON u.id = s.user_id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(sessionToken).first();
    
    return result || null;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

function setCookie(name, value, maxAge = 7 * 24 * 60 * 60) {
  return `${name}=${value}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict; Path=/`;
}

// Authentication API handlers
async function handleAuthRegister(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  try {
    const { name, email } = await request.json();
    
    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Check if user already exists
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists with this email' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Create new user
    const result = await env.DB.prepare(`
      INSERT INTO users (email, name, created_at) 
      VALUES (?, ?, datetime('now'))
    `).bind(email, name).run();
    
    const userId = result.meta.last_row_id;
    
    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await env.DB.prepare(`
      INSERT INTO sessions (token, user_id, expires_at) 
      VALUES (?, ?, ?)
    `).bind(sessionToken, userId, expiresAt.toISOString()).run();
    
    const user = {
      id: userId,
      email,
      name,
      subscription_status: 'none',
      preview_count: 0
    };
    
    return new Response(JSON.stringify({ 
      success: true, 
      user, 
      session_token: sessionToken 
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Set-Cookie': setCookie('session_token', sessionToken)
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleAuthLogin(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  try {
    const { email } = await request.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Find user
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Update last login
    await env.DB.prepare(`
      UPDATE users SET last_login = datetime('now') WHERE id = ?
    `).bind(user.id).run();
    
    // Create new session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await env.DB.prepare(`
      INSERT INTO sessions (token, user_id, expires_at) 
      VALUES (?, ?, ?)
    `).bind(sessionToken, user.id, expiresAt.toISOString()).run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_status: user.subscription_status || 'none',
        preview_count: user.preview_count || 0
      },
      session_token: sessionToken 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Set-Cookie': setCookie('session_token', sessionToken)
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleAuthLogout(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  try {
    const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                        getCookie(request, 'session_token');
    
    if (sessionToken) {
      // Delete session from database
      await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(sessionToken).run();
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Set-Cookie': setCookie('session_token', '', 0) // Clear cookie
      }
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleAuthMe(request, env) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  try {
    const user = await getSessionUser(request, env);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    console.error('Auth me error:', error);
    return new Response(JSON.stringify({ error: 'Authentication check failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleAuthIncrementPreview(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  try {
    const user = await getSessionUser(request, env);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Increment preview count
    const result = await env.DB.prepare(`
      UPDATE users 
      SET preview_count = preview_count + 1 
      WHERE id = ?
    `).bind(user.id).run();
    
    // Get updated count
    const updatedUser = await env.DB.prepare(`
      SELECT preview_count FROM users WHERE id = ?
    `).bind(user.id).first();
    
    return new Response(JSON.stringify({ 
      success: true,
      preview_count: updatedUser.preview_count 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    console.error('Increment preview error:', error);
    return new Response(JSON.stringify({ error: 'Failed to increment preview count' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleWorldBankAPI(request) {
  try {
    const response = await fetch('https://search.worldbank.org/api/v3/wds?format=json&owner=EMFMD&fl=count,txturl&strdate=2024-01-01&rows=100');
    
    if (!response.ok) {
      throw new Error(`World Bank API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return response with CORS headers
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('World Bank API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch World Bank data',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function handleWorldBankTextAPI(request) {
  try {
    const url = new URL(request.url);
    const documentUrl = url.searchParams.get('url');
    
    console.log('🔍 WORKERS DEBUG: /api/worldbank/text endpoint called');
    console.log('📥 Query params:', Object.fromEntries(url.searchParams.entries()));
    console.log('🔗 URL parameter:', documentUrl);
    
    if (!documentUrl) {
      console.log('❌ No URL parameter provided');
      return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    console.log('📡 Attempting to fetch:', documentUrl);
    
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
    
    const response = await fetch(documentUrl, {
      method: 'GET',
      headers: headers,
      redirect: 'follow'  // Follow redirects automatically
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
    
    // Return response with CORS headers
    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('❌ WORKERS ERROR: Document text fetch error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch document text',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function handleWorldBankSummaryAPI(request, env) {
  try {
    const url = new URL(request.url);
    const documentUrl = url.searchParams.get('url');
    
    console.log('🤖 WORKERS DEBUG: /api/worldbank/summary endpoint called');
    console.log('📥 Query params:', Object.fromEntries(url.searchParams.entries()));
    console.log('🔗 URL parameter:', documentUrl);
    
    if (!documentUrl) {
      console.log('❌ No URL parameter provided');
      return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    console.log('📡 Fetching document text from:', documentUrl);
    
    // First fetch the document text
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/plain,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Referer': 'https://www.worldbank.org/',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    
    const docResponse = await fetch(documentUrl, {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    });
    
    if (!docResponse.ok) {
      throw new Error(`Document fetch error: ${docResponse.status}`);
    }
    
    const documentText = await docResponse.text();
    console.log('✅ Document fetched, length:', documentText.length);
    
    // Generate AI summary using Gemini REST API
    console.log('🤖 Generating AI summary with Gemini 1.5 Flash...');
    const geminiApiKey = env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }
    
    const prompt = `Please summarize this World Bank economic document in exactly 250 words. Focus on the key economic findings, indicators, policy implications, and outlook. Structure the summary with clear paragraphs for readability. Here is the document text:

${documentText}`;
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.log('❌ Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }
    
    const geminiResult = await geminiResponse.json();
    const summary = geminiResult.candidates[0].content.parts[0].text;
    
    console.log('✅ AI summary generated, length:', summary.length);
    console.log('📝 Summary preview:', summary.substring(0, 100) + '...');
    
    // Return response with CORS headers
    return new Response(JSON.stringify({
      summary: summary,
      originalLength: documentText.length,
      summaryLength: summary.length
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('❌ WORKERS ERROR: AI summary generation error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate AI summary',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle different routes
    switch (pathname) {
      case '/':
        return env.ASSETS.fetch(new Request(url.origin + '/index.html'));
        
      case '/subscribe':
        return env.ASSETS.fetch(new Request(url.origin + '/subscribe.html'));
        
      case '/article':
        return env.ASSETS.fetch(new Request(url.origin + '/article.html'));
        
      case '/success':
        return env.ASSETS.fetch(new Request(url.origin + '/success.html'));
        
      case '/api/worldbank':
        return await handleWorldBankAPI(request);
        
      case '/api/worldbank/text':
        return await handleWorldBankTextAPI(request);
        
      case '/api/worldbank/summary':
        return await handleWorldBankSummaryAPI(request, env);
        
      case '/api/auth/register':
        return await handleAuthRegister(request, env);
        
      case '/api/auth/login':
        return await handleAuthLogin(request, env);
        
      case '/api/auth/logout':
        return await handleAuthLogout(request, env);
        
      case '/api/auth/me':
        return await handleAuthMe(request, env);
        
      case '/api/auth/increment-preview':
        return await handleAuthIncrementPreview(request, env);
        
      default:
        // Try to serve static assets directly
        try {
          return await env.ASSETS.fetch(request);
        } catch (error) {
          // If asset not found, redirect to homepage
          return env.ASSETS.fetch(new Request(url.origin + '/index.html'));
        }
    }
  }
};