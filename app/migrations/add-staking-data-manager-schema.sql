-- Migration: Add Staking Data Manager Schema
-- Implements systematic staking data collection following the data architecture redesign
-- File: migrations/add-staking-data-manager-schema.sql

-- Staking snapshots for historical tracking
CREATE TABLE IF NOT EXISTS staking_snapshots (
  id SERIAL PRIMARY KEY,
  total_staked DECIMAL(18,6) NOT NULL,
  total_stakers INTEGER NOT NULL,
  rewards_pool_balance DECIMAL(18,6) NOT NULL,
  total_rewards_distributed DECIMAL(18,6) NOT NULL,
  current_apy DECIMAL(8,4) NOT NULL,
  snapshot_time TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual staker positions
CREATE TABLE IF NOT EXISTS staker_positions (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL UNIQUE,
  staked_amount DECIMAL(18,6) NOT NULL DEFAULT 0,
  rewards_earned DECIMAL(18,6) DEFAULT 0,
  pending_rewards DECIMAL(18,6) DEFAULT 0,
  last_stake_time TIMESTAMP,
  last_reward_claim TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- APY calculations and history
CREATE TABLE IF NOT EXISTS apy_calculations (
  id SERIAL PRIMARY KEY,
  calculation_period VARCHAR(20) NOT NULL, -- '24h', '7d', '30d'
  rewards_distributed DECIMAL(18,6) NOT NULL,
  average_staked DECIMAL(18,6) NOT NULL,
  calculated_apy DECIMAL(8,4) NOT NULL,
  calculation_time TIMESTAMP DEFAULT NOW()
);

-- Unbonding information tracking
CREATE TABLE IF NOT EXISTS unbonding_positions (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  release_time TIMESTAMP NOT NULL,
  is_withdrawn BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  withdrawn_at TIMESTAMP,
  
  INDEX idx_wallet_address (wallet_address),
  INDEX idx_release_time (release_time),
  INDEX idx_active_unbonding (wallet_address, is_withdrawn, release_time)
);

-- Update data_freshness table for staking domain
INSERT INTO data_freshness (domain, last_update, is_healthy, error_count, last_error)
VALUES ('staking', NOW(), true, 0, NULL)
ON CONFLICT (domain) DO UPDATE SET
  last_update = NOW(),
  is_healthy = true,
  error_count = 0,
  last_error = NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staking_snapshots_time ON staking_snapshots(snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_staker_positions_wallet ON staker_positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_staker_positions_active ON staker_positions(is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_apy_calculations_period ON apy_calculations(calculation_period, calculation_time DESC);

-- Grant necessary permissions (adjust user as needed)
-- GRANT SELECT, INSERT, UPDATE ON staking_snapshots TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON staker_positions TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON apy_calculations TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON unbonding_positions TO your_app_user;