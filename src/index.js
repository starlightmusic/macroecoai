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