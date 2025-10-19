-- Create token_market_data table for comprehensive token data
CREATE TABLE IF NOT EXISTS token_market_data (
    id SERIAL PRIMARY KEY,
    token_symbol VARCHAR(10) NOT NULL,
    price_usd DECIMAL(20, 12) NOT NULL DEFAULT 0,
    volume_24h DECIMAL(20, 2) DEFAULT 0,
    volume_6h DECIMAL(20, 2) DEFAULT 0,
    volume_1h DECIMAL(20, 2) DEFAULT 0,
    liquidity_usd DECIMAL(20, 2) DEFAULT 0,
    market_cap DECIMAL(20, 2) DEFAULT 0,
    price_change_24h DECIMAL(10, 4) DEFAULT 0,
    price_change_6h DECIMAL(10, 4) DEFAULT 0,
    price_change_1h DECIMAL(10, 4) DEFAULT 0,
    pair_address VARCHAR(42),
    dex_id VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint on token_symbol (for upserts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_market_data_symbol ON token_market_data(token_symbol);

-- Create index on updated_at for performance
CREATE INDEX IF NOT EXISTS idx_token_market_data_updated ON token_market_data(updated_at DESC);