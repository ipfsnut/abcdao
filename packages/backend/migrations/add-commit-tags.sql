-- Migration: Add commit tag support to commits table
-- Date: 2025-10-13
-- Description: Adds columns for commit tags, priority, and privacy flags

-- Add new columns to commits table
ALTER TABLE commits 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Add index for tag-based queries
CREATE INDEX IF NOT EXISTS idx_commits_tags ON commits USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_commits_priority ON commits (priority);
CREATE INDEX IF NOT EXISTS idx_commits_privacy ON commits (is_private);

-- Add is_active column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for active users
CREATE INDEX IF NOT EXISTS idx_users_active ON users (is_active);

-- Update existing commits to have default values
UPDATE commits 
SET tags = '{}', priority = 'normal', is_private = false
WHERE tags IS NULL OR priority IS NULL OR is_private IS NULL;

-- Update existing users to be active by default
UPDATE users 
SET is_active = true
WHERE is_active IS NULL;

-- Create priority tag usage tracking table
CREATE TABLE IF NOT EXISTS priority_tag_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commit_hash VARCHAR(255) NOT NULL,
  tag_type VARCHAR(50) NOT NULL CHECK (tag_type IN ('priority', 'milestone')),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per commit
  UNIQUE(user_id, commit_hash)
);

-- Add indexes for priority tag usage queries
CREATE INDEX IF NOT EXISTS idx_priority_usage_user_date ON priority_tag_usage (user_id, used_at);
CREATE INDEX IF NOT EXISTS idx_priority_usage_tag_type ON priority_tag_usage (tag_type);

-- Add weekly cleanup function (optional, can be run manually or via cron)
COMMENT ON TABLE priority_tag_usage IS 'Tracks usage of priority and milestone tags for weekly limits (5 per week per user)';
COMMENT ON COLUMN priority_tag_usage.tag_type IS 'Type of priority tag used: priority or milestone';
COMMENT ON COLUMN priority_tag_usage.used_at IS 'When the priority tag was used (for weekly limit calculation)';