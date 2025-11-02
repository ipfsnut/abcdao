-- Commit Digest Bot Database Schema
-- Creates tables for storing commit data and digest post tracking
-- Phase 1: Database Foundation

-- Table for storing individual commit data for digest analysis
CREATE TABLE IF NOT EXISTS commit_digest_data (
  id SERIAL PRIMARY KEY,
  repository VARCHAR(255) NOT NULL,
  commit_hash VARCHAR(64) NOT NULL UNIQUE,
  author_fid INTEGER,
  author_username VARCHAR(100),
  author_github_username VARCHAR(100),
  commit_message TEXT,
  commit_url TEXT,
  reward_amount INTEGER DEFAULT 0,
  commit_tags JSONB,
  priority_level VARCHAR(20) DEFAULT 'normal',
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_for_digest BOOLEAN DEFAULT false
);

-- Table for tracking digest posts and their metrics
CREATE TABLE IF NOT EXISTS digest_posts (
  id SERIAL PRIMARY KEY,
  digest_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  cast_hash VARCHAR(100),
  cast_url TEXT,
  total_commits INTEGER DEFAULT 0,
  total_rewards BIGINT DEFAULT 0,
  unique_contributors INTEGER DEFAULT 0,
  repositories_involved TEXT[],
  top_contributors JSONB,
  activity_metrics JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_commit_digest_data_created_at ON commit_digest_data(created_at);
CREATE INDEX IF NOT EXISTS idx_commit_digest_data_repository ON commit_digest_data(repository);
CREATE INDEX IF NOT EXISTS idx_commit_digest_data_author_fid ON commit_digest_data(author_fid);
CREATE INDEX IF NOT EXISTS idx_commit_digest_data_processed ON commit_digest_data(processed_for_digest);
CREATE INDEX IF NOT EXISTS idx_digest_posts_period ON digest_posts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_digest_posts_type ON digest_posts(digest_type);

-- Add comments for documentation
COMMENT ON TABLE commit_digest_data IS 'Stores individual commit data for digest analysis and reporting';
COMMENT ON TABLE digest_posts IS 'Tracks published digest posts and their associated metrics';

COMMENT ON COLUMN commit_digest_data.commit_hash IS 'Unique Git commit hash for deduplication';
COMMENT ON COLUMN commit_digest_data.commit_tags IS 'JSON object containing commit metadata like priority, privacy flags';
COMMENT ON COLUMN commit_digest_data.processed_for_digest IS 'Flag to track if commit has been included in digest analysis';

COMMENT ON COLUMN digest_posts.repositories_involved IS 'Array of repository names included in this digest';
COMMENT ON COLUMN digest_posts.top_contributors IS 'JSON object with contributor rankings and statistics';
COMMENT ON COLUMN digest_posts.activity_metrics IS 'JSON object with detailed activity analysis for the period';