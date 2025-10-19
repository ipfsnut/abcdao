-- Migration: Add Blockchain Events Manager Schema
-- Implements systematic blockchain event monitoring following the data architecture redesign
-- File: migrations/add-blockchain-events-schema.sql

-- Blockchain events table for systematic event processing
CREATE TABLE IF NOT EXISTS blockchain_events (
  id SERIAL PRIMARY KEY,
  block_number BIGINT NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  log_index INTEGER NOT NULL,
  contract_address VARCHAR(42) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(transaction_hash, log_index)
);

-- Contract states for tracking current state
CREATE TABLE IF NOT EXISTS contract_states (
  id SERIAL PRIMARY KEY,
  contract_address VARCHAR(42) NOT NULL,
  state_name VARCHAR(100) NOT NULL,
  state_value JSONB NOT NULL,
  block_number BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(contract_address, state_name)
);

-- Event processing log for monitoring
CREATE TABLE IF NOT EXISTS event_processing_log (
  id SERIAL PRIMARY KEY,
  contract_address VARCHAR(42) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  last_processed_block BIGINT NOT NULL,
  events_processed INTEGER DEFAULT 0,
  last_error TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(contract_address, event_name)
);

-- Transaction monitoring for important contract transactions
CREATE TABLE IF NOT EXISTS monitored_transactions (
  id SERIAL PRIMARY KEY,
  transaction_hash VARCHAR(66) UNIQUE NOT NULL,
  contract_address VARCHAR(42) NOT NULL,
  function_name VARCHAR(100),
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42) NOT NULL,
  value_eth DECIMAL(18,6) DEFAULT 0,
  gas_used INTEGER,
  gas_price BIGINT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  confirmation_count INTEGER DEFAULT 0,
  block_number BIGINT,
  timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update data_freshness table for blockchain events domain
INSERT INTO data_freshness (domain, last_update, is_healthy, error_count, last_error)
VALUES ('blockchain_events', NOW(), true, 0, NULL)
ON CONFLICT (domain) DO UPDATE SET
  last_update = NOW(),
  is_healthy = true,
  error_count = 0,
  last_error = NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blockchain_events_contract ON blockchain_events(contract_address, event_name);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_block ON blockchain_events(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_timestamp ON blockchain_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_processed ON blockchain_events(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_tx_hash ON blockchain_events(transaction_hash);

CREATE INDEX IF NOT EXISTS idx_contract_states_address ON contract_states(contract_address);
CREATE INDEX IF NOT EXISTS idx_contract_states_updated ON contract_states(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_processing_contract ON event_processing_log(contract_address);

CREATE INDEX IF NOT EXISTS idx_monitored_transactions_hash ON monitored_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_monitored_transactions_status ON monitored_transactions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_monitored_transactions_contract ON monitored_transactions(contract_address);

-- Grant necessary permissions (adjust user as needed)
-- GRANT SELECT, INSERT, UPDATE ON blockchain_events TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON contract_states TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON event_processing_log TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON monitored_transactions TO your_app_user;