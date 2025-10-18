-- User-Triggered Data Architecture Schema
-- Adds tables for action processing, real-time connections, and verification

-- ============================================================================
-- USER ACTIONS TRACKING
-- ============================================================================

-- Track all user actions for audit trail and optimistic updates
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID PRIMARY KEY,
  user_wallet VARCHAR(42) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'stake', 'unstake', 'commit', 'claim', 'payment'
  action_data JSONB NOT NULL,
  tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  optimistic_update_applied BOOLEAN DEFAULT false,
  blockchain_verified BOOLEAN DEFAULT false,
  verification_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_actions_wallet_type ON user_actions(user_wallet, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_actions_tx_hash ON user_actions(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_actions_status ON user_actions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_verification ON user_actions(blockchain_verified, created_at) WHERE tx_hash IS NOT NULL;

-- ============================================================================
-- REAL-TIME CONNECTIONS
-- ============================================================================

-- Track WebSocket connections for real-time broadcasting
CREATE TABLE IF NOT EXISTS realtime_connections (
  id SERIAL PRIMARY KEY,
  connection_id VARCHAR(100) UNIQUE NOT NULL,
  user_wallet VARCHAR(42),
  user_fid INTEGER,
  rooms TEXT[] DEFAULT '{}',
  connected_at TIMESTAMP DEFAULT NOW(),
  last_ping_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

-- Indexes for connection management
CREATE INDEX IF NOT EXISTS idx_realtime_connections_user ON realtime_connections(user_wallet);
CREATE INDEX IF NOT EXISTS idx_realtime_connections_id ON realtime_connections(connection_id);
CREATE INDEX IF NOT EXISTS idx_realtime_connections_rooms ON realtime_connections USING GIN(rooms);
CREATE INDEX IF NOT EXISTS idx_realtime_connections_active ON realtime_connections(last_ping_at);

-- ============================================================================
-- VERIFICATION QUEUE
-- ============================================================================

-- Queue for background blockchain verification
CREATE TABLE IF NOT EXISTS verification_queue (
  id SERIAL PRIMARY KEY,
  action_id UUID REFERENCES user_actions(id) ON DELETE CASCADE,
  verification_type VARCHAR(50) NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  last_attempt_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for verification processing
CREATE INDEX IF NOT EXISTS idx_verification_queue_scheduled ON verification_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_verification_queue_action ON verification_queue(action_id);
CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON verification_queue(status, created_at);

-- ============================================================================
-- ENHANCED STAKING TABLES
-- ============================================================================

-- Enhanced staker positions with real-time status
CREATE TABLE IF NOT EXISTS staker_positions (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  staked_amount DECIMAL(18,6) NOT NULL DEFAULT 0,
  rewards_earned DECIMAL(18,6) DEFAULT 0,
  last_action_type VARCHAR(20), -- 'stake', 'unstake', 'claim'
  last_action_tx VARCHAR(66),
  last_action_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending_confirmation', 'failed'
  estimated_confirmation_time TIMESTAMP,
  stake_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  last_claim_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(wallet_address)
);

-- Indexes for staking queries
CREATE INDEX IF NOT EXISTS idx_staker_positions_wallet ON staker_positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_staker_positions_active ON staker_positions(is_active, status);
CREATE INDEX IF NOT EXISTS idx_staker_positions_amount ON staker_positions(staked_amount DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_staker_positions_last_action ON staker_positions(last_action_at DESC);

-- ============================================================================
-- ENHANCED APY CALCULATIONS
-- ============================================================================

-- APY calculations with trigger tracking
CREATE TABLE IF NOT EXISTS apy_calculations (
  id SERIAL PRIMARY KEY,
  calculation_method VARCHAR(50) NOT NULL, -- 'periodic', 'action_triggered', 'manual'
  calculation_period VARCHAR(20), -- '24h', '7d', '30d' for historical calculations
  tvl_amount DECIMAL(18,6) NOT NULL,
  annual_rewards_estimate DECIMAL(18,6) NOT NULL,
  calculated_apy DECIMAL(8,4) NOT NULL,
  calculation_trigger VARCHAR(50), -- 'stake_action', 'unstake_action', 'scheduled', etc.
  trigger_action_id UUID REFERENCES user_actions(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for APY queries
CREATE INDEX IF NOT EXISTS idx_apy_calculations_method ON apy_calculations(calculation_method, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apy_calculations_period ON apy_calculations(calculation_period, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apy_calculations_trigger ON apy_calculations(trigger_action_id) WHERE trigger_action_id IS NOT NULL;

-- ============================================================================
-- ENHANCED USERS TABLE
-- ============================================================================

-- Add new columns to existing users table for better real-time support
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS action_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS realtime_subscriptions TEXT[] DEFAULT '{}';

-- Indexes for enhanced user queries
CREATE INDEX IF NOT EXISTS idx_users_last_action ON users(last_action_at DESC) WHERE last_action_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_action_count ON users(action_count DESC);
CREATE INDEX IF NOT EXISTS idx_users_subscriptions ON users USING GIN(realtime_subscriptions);

-- ============================================================================
-- ENHANCED COMMITS TABLE
-- ============================================================================

-- Add author_wallet for direct lookups (populate from existing user relationships)
ALTER TABLE commits ADD COLUMN IF NOT EXISTS author_wallet VARCHAR(42);

-- Backfill author_wallet from existing user relationships
UPDATE commits 
SET author_wallet = u.wallet_address
FROM users u 
WHERE commits.user_id = u.id AND commits.author_wallet IS NULL;

-- Add index for wallet-based commit lookups
CREATE INDEX IF NOT EXISTS idx_commits_author_wallet ON commits(author_wallet, processed_at DESC) WHERE author_wallet IS NOT NULL;

-- ============================================================================
-- BROADCAST LOG
-- ============================================================================

-- Track real-time broadcasts for debugging and analytics
CREATE TABLE IF NOT EXISTS broadcast_log (
  id SERIAL PRIMARY KEY,
  broadcast_type VARCHAR(50) NOT NULL,
  target_rooms TEXT[] NOT NULL,
  message_data JSONB NOT NULL,
  connection_count INTEGER NOT NULL,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  trigger_action_id UUID REFERENCES user_actions(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for broadcast analytics
CREATE INDEX IF NOT EXISTS idx_broadcast_log_type ON broadcast_log(broadcast_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_log_action ON broadcast_log(trigger_action_id) WHERE trigger_action_id IS NOT NULL;

-- ============================================================================
-- DATA CONSISTENCY VIEWS
-- ============================================================================

-- View to check for inconsistent user statistics
CREATE OR REPLACE VIEW user_stats_consistency AS
SELECT 
  u.id,
  u.wallet_address,
  u.github_username,
  u.total_commits as stored_commits,
  COUNT(c.id) as actual_commits,
  u.total_rewards_earned as stored_rewards,
  COALESCE(SUM(c.reward_amount), 0) as actual_rewards,
  ABS(u.total_commits - COUNT(c.id)) as commit_diff,
  ABS(u.total_rewards_earned - COALESCE(SUM(c.reward_amount), 0)) as reward_diff,
  u.last_commit_at as stored_last_commit,
  MAX(c.processed_at) as actual_last_commit
FROM users u
LEFT JOIN commits c ON u.id = c.user_id AND c.processed_at IS NOT NULL
GROUP BY u.id, u.wallet_address, u.github_username, u.total_commits, u.total_rewards_earned, u.last_commit_at
HAVING u.total_commits != COUNT(c.id) 
    OR ABS(u.total_rewards_earned - COALESCE(SUM(c.reward_amount), 0)) > 0.01
    OR u.last_commit_at != MAX(c.processed_at);

-- View to check for unverified actions that need attention
CREATE OR REPLACE VIEW pending_verifications AS
SELECT 
  ua.id,
  ua.user_wallet,
  ua.action_type,
  ua.tx_hash,
  ua.created_at,
  vq.scheduled_for,
  vq.attempts,
  vq.error_message,
  CASE 
    WHEN vq.scheduled_for < NOW() THEN 'overdue'
    WHEN vq.attempts >= vq.max_attempts THEN 'failed'
    ELSE 'pending'
  END as verification_status
FROM user_actions ua
LEFT JOIN verification_queue vq ON ua.id = vq.action_id
WHERE ua.blockchain_verified = false 
  AND ua.tx_hash IS NOT NULL
  AND ua.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY ua.created_at DESC;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current staking metrics
CREATE OR REPLACE FUNCTION get_current_staking_metrics()
RETURNS TABLE(
  total_staked DECIMAL(18,6),
  total_stakers INTEGER,
  pending_confirmations INTEGER,
  current_apy DECIMAL(8,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(sp.staked_amount), 0) as total_staked,
    COUNT(sp.wallet_address)::INTEGER as total_stakers,
    COUNT(CASE WHEN sp.status = 'pending_confirmation' THEN 1 END)::INTEGER as pending_confirmations,
    COALESCE(
      (SELECT calculated_apy FROM apy_calculations 
       ORDER BY created_at DESC LIMIT 1), 
      0
    ) as current_apy
  FROM staker_positions sp
  WHERE sp.is_active = true AND sp.staked_amount > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old connections
CREATE OR REPLACE FUNCTION cleanup_stale_connections()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM realtime_connections 
  WHERE last_ping_at < NOW() - INTERVAL '10 minutes';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's action history
CREATE OR REPLACE FUNCTION get_user_action_history(user_wallet_addr VARCHAR(42), limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  action_id UUID,
  action_type VARCHAR(50),
  action_data JSONB,
  tx_hash VARCHAR(66),
  status VARCHAR(20),
  created_at TIMESTAMP,
  confirmed_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.action_type,
    ua.action_data,
    ua.tx_hash,
    ua.status,
    ua.created_at,
    ua.confirmed_at
  FROM user_actions ua
  WHERE ua.user_wallet = user_wallet_addr
  ORDER BY ua.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONSTRAINTS AND VALIDATION
-- ============================================================================

-- Ensure action types are valid
ALTER TABLE user_actions ADD CONSTRAINT check_action_type 
CHECK (action_type IN ('stake', 'unstake', 'commit', 'claim', 'payment', 'governance_vote'));

-- Ensure status values are valid
ALTER TABLE user_actions ADD CONSTRAINT check_action_status 
CHECK (status IN ('pending', 'confirmed', 'failed'));

-- Ensure staking amounts are positive
ALTER TABLE staker_positions ADD CONSTRAINT check_staked_amount_positive 
CHECK (staked_amount >= 0);

-- Ensure APY is not negative
ALTER TABLE apy_calculations ADD CONSTRAINT check_apy_not_negative 
CHECK (calculated_apy >= 0);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC CLEANUP
-- ============================================================================

-- Trigger to clean up old broadcast logs (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_broadcast_logs()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM broadcast_log 
  WHERE created_at < NOW() - INTERVAL '7 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_broadcast_logs
  AFTER INSERT ON broadcast_log
  EXECUTE FUNCTION cleanup_old_broadcast_logs();

-- Trigger to update user last_action_at when actions are created
CREATE OR REPLACE FUNCTION update_user_last_action()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET 
    last_action_at = NEW.created_at,
    action_count = action_count + 1,
    updated_at = NOW()
  WHERE wallet_address = NEW.user_wallet;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_last_action
  AFTER INSERT ON user_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_action();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Insert initial data for testing
INSERT INTO apy_calculations (
  calculation_method, tvl_amount, annual_rewards_estimate, 
  calculated_apy, calculation_trigger
) VALUES (
  'initial_setup', 0, 0, 0, 'migration'
) ON CONFLICT DO NOTHING;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'User-triggered data architecture schema migration completed successfully';
  RAISE NOTICE 'New tables created: user_actions, realtime_connections, verification_queue, staker_positions, apy_calculations, broadcast_log';
  RAISE NOTICE 'Enhanced existing tables: users, commits';
  RAISE NOTICE 'Added views: user_stats_consistency, pending_verifications';
  RAISE NOTICE 'Added functions: get_current_staking_metrics, cleanup_stale_connections, get_user_action_history';
END $$;