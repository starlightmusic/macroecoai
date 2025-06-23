export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle different routes
    switch (pathname) {
      case '/':
        return new Response(await getStaticAsset('index.html'), {
          headers: { 'Content-Type': 'text/html' }
        });
        
      case '/subscribe':
        return new Response(await getStaticAsset('subscribe.html'), {
          headers: { 'Content-Type': 'text/html' }
        });
        
      case '/article':
        return new Response(await getStaticAsset('article.html'), {
          headers: { 'Content-Type': 'text/html' }
        });
        
      case '/success':
        return new Response(await getStaticAsset('success.html'), {
          headers: { 'Content-Type': 'text/html' }
        });
        
      default:
        // Handle static assets (CSS, JS, images, etc.)
        if (pathname.startsWith('/assets/')) {
          const contentType = getContentType(pathname);
          return new Response(await getStaticAsset(pathname.slice(1)), {
            headers: { 'Content-Type': contentType }
          });
        }
        
        // Handle other static files
        if (pathname === '/robots.txt') {
          return new Response(await getStaticAsset('robots.txt'), {
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        
        if (pathname === '/sitemap.xml') {
          return new Response(await getStaticAsset('sitemap.xml'), {
            headers: { 'Content-Type': 'application/xml' }
          });
        }
        
        // 404 - redirect to homepage
        return new Response(await getStaticAsset('index.html'), {
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        });
    }
  }
};

// Helper function to get static assets
async function getStaticAsset(path) {
  try {
    // This will be replaced by Cloudflare Workers' asset handling
    const response = await fetch(new URL(path, 'file://'));
    return await response.text();
  } catch (error) {
    return `<!DOCTYPE html><html><head><title>File Not Found</title></head><body><h1>File Not Found</h1><p>The requested file "${path}" could not be found.</p></body></html>`;
  }
}

// Helper function to get content type based on file extension
function getContentType(pathname) {
  const extension = pathname.split('.').pop();
  const contentTypes = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'txt': 'text/plain',
    'xml': 'application/xml'
  };
  
  return contentTypes[extension] || 'text/plain';
}