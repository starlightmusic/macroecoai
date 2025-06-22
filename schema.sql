-- Database schema for macroeconomic data storage

-- Economic indicators table
CREATE TABLE economic_indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT NOT NULL,
    indicator_code TEXT NOT NULL,
    indicator_name TEXT NOT NULL,
    year TEXT NOT NULL,
    value REAL,
    date_collected TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_code, indicator_code, year)
);

-- News articles table
CREATE TABLE news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT UNIQUE,
    source TEXT,
    published_at TEXT,
    date_collected TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Countries table for future expansion
CREATE TABLE countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT UNIQUE NOT NULL,
    country_name TEXT NOT NULL,
    region TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert Ethiopia as default country
INSERT INTO countries (country_code, country_name, region, is_active) 
VALUES ('ETH', 'Ethiopia', 'Africa', 1);

-- Indexes for better performance
CREATE INDEX idx_economic_indicators_country_year ON economic_indicators(country_code, year);
CREATE INDEX idx_economic_indicators_indicator ON economic_indicators(indicator_code);
CREATE INDEX idx_news_articles_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_articles_source ON news_articles(source);