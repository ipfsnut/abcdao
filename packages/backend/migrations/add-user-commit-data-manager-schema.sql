-- Migration: Add User/Commit Data Manager Schema
-- Implements systematic user and commit data collection following the data architecture redesign
-- File: migrations/add-user-commit-data-manager-schema.sql

-- Redesigned users table with clear data ownership
CREATE TABLE IF NOT EXISTS users_master (
  id SERIAL PRIMARY KEY,
  
  -- Primary identifiers
  wallet_address VARCHAR(42) UNIQUE,
  farcaster_fid INTEGER UNIQUE,
  github_username VARCHAR(255) UNIQUE,
  github_id INTEGER UNIQUE,
  
  -- Profile data
  farcaster_username VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,
  
  -- Computed stats (maintained by data manager)
  total_commits INTEGER DEFAULT 0,
  total_rewards_earned DECIMAL(18,6) DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_commit_at TIMESTAMP,
  
  -- Status
  membership_status VARCHAR(20) DEFAULT 'pending',
  membership_paid_at TIMESTAMP,
  membership_tx_hash VARCHAR(66),
  membership_amount DECIMAL(18,6),
  is_active BOOLEAN DEFAULT true,
  
  -- Auth tokens (encrypted or hashed in production)
  github_access_token TEXT,
  
  -- Timestamps
  first_commit_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Commits table with full data following the redesign
CREATE TABLE IF NOT EXISTS commits_master (
  id SERIAL PRIMARY KEY,
  
  -- Commit identity
  commit_hash VARCHAR(40) UNIQUE NOT NULL,
  repository_url VARCHAR(500) NOT NULL,
  repository_name VARCHAR(255) NOT NULL,
  
  -- Commit content
  commit_message TEXT NOT NULL,
  commit_url VARCHAR(500) NOT NULL,
  files_changed INTEGER DEFAULT 0,
  lines_added INTEGER DEFAULT 0,
  lines_deleted INTEGER DEFAULT 0,
  
  -- Author
  user_id INTEGER REFERENCES users_master(id),
  author_wallet VARCHAR(42),
  author_github_username VARCHAR(255),
  
  -- Rewards
  reward_amount DECIMAL(18,6) DEFAULT 0,
  reward_multiplier DECIMAL(4,2) DEFAULT 1.0,
  reward_reason VARCHAR(255),
  reward_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processed', 'failed'
  
  -- Processing
  processed_at TIMESTAMP,
  cast_posted BOOLEAN DEFAULT false,
  cast_url VARCHAR(500),
  
  -- Analysis
  commit_quality_score DECIMAL(3,2), -- 0.00 to 10.00
  commit_tags TEXT[], -- Array of tags like ['frontend', 'bug-fix', 'feature']
  
  -- Timestamps
  commit_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User activity snapshots for analytics
CREATE TABLE IF NOT EXISTS user_activity_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  
  -- Overall metrics
  total_active_users INTEGER NOT NULL,
  total_commits_today INTEGER NOT NULL,
  total_rewards_distributed DECIMAL(18,6) NOT NULL,
  
  -- Membership metrics
  new_members_today INTEGER DEFAULT 0,
  total_paid_members INTEGER NOT NULL,
  
  -- Engagement metrics
  avg_commits_per_user DECIMAL(8,2) DEFAULT 0,
  unique_repositories INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(snapshot_date)
);

-- Commit analytics for trend tracking
CREATE TABLE IF NOT EXISTS commit_analytics (
  id SERIAL PRIMARY KEY,
  analysis_date DATE NOT NULL,
  
  -- Volume metrics
  total_commits INTEGER NOT NULL,
  unique_contributors INTEGER NOT NULL,
  unique_repositories INTEGER NOT NULL,
  
  -- Quality metrics
  avg_commit_quality DECIMAL(3,2),
  commits_with_tests INTEGER DEFAULT 0,
  bug_fix_commits INTEGER DEFAULT 0,
  feature_commits INTEGER DEFAULT 0,
  
  -- Repository distribution
  top_repository VARCHAR(255),
  top_repo_commits INTEGER DEFAULT 0,
  
  -- Reward metrics
  total_rewards DECIMAL(18,6) DEFAULT 0,
  avg_reward_per_commit DECIMAL(18,6) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(analysis_date)
);

-- User streaks tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users_master(id),
  
  -- Streak data
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_commit_date DATE,
  streak_start_date DATE,
  
  -- Streak milestones
  streak_milestones INTEGER[] DEFAULT '{}', -- Array of milestone days achieved
  
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Repository analytics
CREATE TABLE IF NOT EXISTS repository_analytics (
  id SERIAL PRIMARY KEY,
  repository_name VARCHAR(255) NOT NULL,
  repository_url VARCHAR(500),
  
  -- Activity metrics
  total_commits INTEGER DEFAULT 0,
  unique_contributors INTEGER DEFAULT 0,
  last_commit_at TIMESTAMP,
  
  -- Quality metrics
  avg_commit_quality DECIMAL(3,2),
  total_lines_added INTEGER DEFAULT 0,
  total_lines_deleted INTEGER DEFAULT 0,
  
  -- Reward metrics
  total_rewards_distributed DECIMAL(18,6) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(repository_name)
);

-- Update data_freshness table for user/commit domain
INSERT INTO data_freshness (domain, last_update, is_healthy, error_count, last_error)
VALUES ('users_commits', NOW(), true, 0, NULL)
ON CONFLICT (domain) DO UPDATE SET
  last_update = NOW(),
  is_healthy = true,
  error_count = 0,
  last_error = NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_master_farcaster_fid ON users_master(farcaster_fid);
CREATE INDEX IF NOT EXISTS idx_users_master_github_username ON users_master(github_username);
CREATE INDEX IF NOT EXISTS idx_users_master_wallet_address ON users_master(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_master_membership_status ON users_master(membership_status);
CREATE INDEX IF NOT EXISTS idx_users_master_active ON users_master(is_active, total_commits DESC);

CREATE INDEX IF NOT EXISTS idx_commits_master_hash ON commits_master(commit_hash);
CREATE INDEX IF NOT EXISTS idx_commits_master_user_id ON commits_master(user_id);
CREATE INDEX IF NOT EXISTS idx_commits_master_repository ON commits_master(repository_name);
CREATE INDEX IF NOT EXISTS idx_commits_master_timestamp ON commits_master(commit_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_commits_master_processed ON commits_master(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_commits_master_reward_status ON commits_master(reward_status);

CREATE INDEX IF NOT EXISTS idx_user_activity_snapshots_date ON user_activity_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_commit_analytics_date ON commit_analytics(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_repository_analytics_name ON repository_analytics(repository_name);
CREATE INDEX IF NOT EXISTS idx_repository_analytics_active ON repository_analytics(is_active, total_commits DESC);

-- Grant necessary permissions (adjust user as needed)
-- GRANT SELECT, INSERT, UPDATE ON users_master TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON commits_master TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON user_activity_snapshots TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON commit_analytics TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON user_streaks TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON repository_analytics TO your_app_user;