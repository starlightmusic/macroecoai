export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS for all requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API endpoints
      if (path === '/api/economic-data') {
        return await getEconomicData(env, corsHeaders);
      }
      
      if (path === '/api/news') {
        return await getNews(env, corsHeaders);
      }

      if (path === '/api/latest') {
        return await getLatestData(env, corsHeaders);
      }

      // Return 404 for unknown endpoints
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
  },

  async scheduled(event, env, ctx) {
    console.log('Starting scheduled data collection...');
    
    try {
      // Collect economic data from World Bank API
      await collectEconomicData(env);
      
      // Collect news data
      await collectNewsData(env);
      
      console.log('Scheduled data collection completed successfully');
    } catch (error) {
      console.error('Scheduled task failed:', error);
      throw error;
    }
  }
};

// Collect economic data from World Bank API
async function collectEconomicData(env) {
  const indicators = [
    'NY.GDP.MKTP.CD',      // GDP (current US$)
    'NY.GDP.PCAP.CD',      // GDP per capita
    'NY.GDP.MKTP.KD.ZG',   // GDP growth (annual %)
    'SL.UEM.TOTL.ZS',      // Unemployment rate
    'FP.CPI.TOTL.ZG',      // Inflation rate
    'PA.NUS.FCRF'          // Exchange rate (LCU per US$)
  ];

  for (const indicator of indicators) {
    try {
      const response = await fetch(
        `https://api.worldbank.org/v2/country/ETH/indicator/${indicator}?format=json&date=2020:2024&per_page=100`
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch ${indicator}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data && data.length > 1 && data[1]) {
        for (const entry of data[1]) {
          if (entry.value !== null) {
            await env.DB.prepare(`
              INSERT OR REPLACE INTO economic_indicators 
              (country_code, indicator_code, indicator_name, year, value, date_collected)
              VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
              entry.country.id,
              entry.indicator.id,
              entry.indicator.value,
              entry.date,
              entry.value,
              new Date().toISOString()
            ).run();
          }
        }
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error collecting data for ${indicator}:`, error);
    }
  }

  // Cache latest data in KV
  await cacheLatestEconomicData(env);
}

// Collect news data
async function collectNewsData(env) {
  try {
    const query = 'Ethiopia economy OR Ethiopian economy OR Ethiopia GDP OR Ethiopia inflation';
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${env.NEWS_API_KEY}`
    );

    if (!response.ok) {
      console.error(`News API request failed: ${response.status}`);
      return;
    }

    const data = await response.json();
    
    if (data.articles) {
      for (const article of data.articles) {
        try {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO news_articles 
            (title, description, url, source, published_at, date_collected)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            article.title,
            article.description,
            article.url,
            article.source.name,
            article.publishedAt,
            new Date().toISOString()
          ).run();
        } catch (error) {
          console.error('Error inserting article:', error);
        }
      }
    }

    // Cache latest news in KV
    await cacheLatestNews(env);

  } catch (error) {
    console.error('Error collecting news data:', error);
  }
}

// Cache latest economic data in KV for fast access
async function cacheLatestEconomicData(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT indicator_code, indicator_name, year, value
      FROM economic_indicators 
      WHERE country_code = 'ETH'
      AND year = (
        SELECT MAX(year) 
        FROM economic_indicators ei2 
        WHERE ei2.indicator_code = economic_indicators.indicator_code
        AND ei2.country_code = 'ETH'
      )
      ORDER BY indicator_code
    `).all();

    await env.CACHE.put('latest_economic_data', JSON.stringify(result.results), {
      expirationTtl: 86400 // 24 hours
    });
  } catch (error) {
    console.error('Error caching economic data:', error);
  }
}

// Cache latest news in KV
async function cacheLatestNews(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT title, description, url, source, published_at
      FROM news_articles 
      ORDER BY published_at DESC 
      LIMIT 10
    `).all();

    await env.CACHE.put('latest_news', JSON.stringify(result.results), {
      expirationTtl: 86400 // 24 hours
    });
  } catch (error) {
    console.error('Error caching news data:', error);
  }
}

// API endpoint handlers
async function getEconomicData(env, corsHeaders) {
  try {
    const result = await env.DB.prepare(`
      SELECT indicator_code, indicator_name, year, value, date_collected
      FROM economic_indicators 
      WHERE country_code = 'ETH'
      ORDER BY indicator_code, year DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      data: result.results
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch economic data'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function getNews(env, corsHeaders) {
  try {
    const result = await env.DB.prepare(`
      SELECT title, description, url, source, published_at
      FROM news_articles 
      ORDER BY published_at DESC 
      LIMIT 20
    `).all();

    return new Response(JSON.stringify({
      success: true,
      data: result.results
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch news data'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function getLatestData(env, corsHeaders) {
  try {
    // Try to get from cache first
    const economicData = await env.CACHE.get('latest_economic_data');
    const newsData = await env.CACHE.get('latest_news');

    let economic = [];
    let news = [];

    if (economicData) {
      economic = JSON.parse(economicData);
    } else {
      // Fallback to database
      const result = await env.DB.prepare(`
        SELECT indicator_code, indicator_name, year, value
        FROM economic_indicators 
        WHERE country_code = 'ETH'
        AND year = (
          SELECT MAX(year) 
          FROM economic_indicators ei2 
          WHERE ei2.indicator_code = economic_indicators.indicator_code
          AND ei2.country_code = 'ETH'
        )
        ORDER BY indicator_code
      `).all();
      economic = result.results;
    }

    if (newsData) {
      news = JSON.parse(newsData);
    } else {
      // Fallback to database
      const result = await env.DB.prepare(`
        SELECT title, description, url, source, published_at
        FROM news_articles 
        ORDER BY published_at DESC 
        LIMIT 5
      `).all();
      news = result.results;
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        economic,
        news
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch latest data'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}