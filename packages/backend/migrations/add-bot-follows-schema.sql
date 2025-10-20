-- Bot Follows Tracking Schema
-- Tracks which ABC DAO members the bot has followed on Farcaster

CREATE TABLE IF NOT EXISTS bot_follows (
  id SERIAL PRIMARY KEY,
  target_fid INTEGER NOT NULL UNIQUE, -- Farcaster FID of the user we followed
  target_username TEXT, -- Farcaster username for reference
  followed_at TIMESTAMP DEFAULT NOW(), -- When we successfully followed them
  follow_status VARCHAR(20) DEFAULT 'pending', -- pending, active, failed, unfollowed
  retry_count INTEGER DEFAULT 0, -- Number of retry attempts
  last_attempt_at TIMESTAMP DEFAULT NOW(), -- Last time we tried to follow
  error_message TEXT, -- Error message if follow failed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bot_follows_fid ON bot_follows(target_fid);
CREATE INDEX IF NOT EXISTS idx_bot_follows_status ON bot_follows(follow_status);
CREATE INDEX IF NOT EXISTS idx_bot_follows_retry ON bot_follows(retry_count, last_attempt_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bot_follows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bot_follows_updated_at
  BEFORE UPDATE ON bot_follows
  FOR EACH ROW
  EXECUTE PROCEDURE update_bot_follows_updated_at();

-- Comments for documentation
COMMENT ON TABLE bot_follows IS 'Tracks Farcaster following actions by the ABC DAO bot';
COMMENT ON COLUMN bot_follows.target_fid IS 'Farcaster FID of the user we are following';
COMMENT ON COLUMN bot_follows.follow_status IS 'Status: pending, active, failed, unfollowed';
COMMENT ON COLUMN bot_follows.retry_count IS 'Number of failed follow attempts (max 3)';