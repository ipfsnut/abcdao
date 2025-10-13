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