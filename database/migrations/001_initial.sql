-- Schema for Ethiopian macroeconomic data
CREATE TABLE IF NOT EXISTS ethiopian_indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicator_name TEXT NOT NULL,
    indicator_code TEXT NOT NULL,
    macro_angle TEXT NOT NULL,
    value REAL,
    period_date DATE NOT NULL,
    frequency TEXT NOT NULL,
    data_source TEXT DEFAULT 'DB-NOMICS',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(indicator_code, period_date)
);

CREATE TABLE IF NOT EXISTS collection_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_date DATE NOT NULL,
    total_indicators INTEGER DEFAULT 5,
    successful_collections INTEGER DEFAULT 0,
    failed_collections INTEGER DEFAULT 0,
    error_details TEXT,
    execution_duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_indicator_period ON ethiopian_indicators(indicator_code, period_date);
CREATE INDEX IF NOT EXISTS idx_collection_date ON collection_logs(collection_date);
CREATE INDEX IF NOT EXISTS idx_macro_angle ON ethiopian_indicators(macro_angle);
