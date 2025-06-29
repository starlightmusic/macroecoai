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