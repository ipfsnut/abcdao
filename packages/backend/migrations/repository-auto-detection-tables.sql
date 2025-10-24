-- Migration: Repository Auto-Detection Tables
-- Description: Tables for automatic repository detection and management
-- Version: v2.0.0-repo-auto-detection
-- Date: $(date +%Y-%m-%d)

-- ============================================================================
-- USER REPOSITORIES TABLE (ENABLED REPOS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_repositories (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  
  -- GitHub repository information
  github_repo_id BIGINT NOT NULL,
  repo_name VARCHAR(255) NOT NULL,
  repo_full_name VARCHAR(500) NOT NULL, -- owner/repo-name
  repo_url VARCHAR(500) NOT NULL,
  clone_url VARCHAR(500),
  ssh_url VARCHAR(500),
  
  -- Repository metadata
  is_private BOOLEAN DEFAULT FALSE,
  language VARCHAR(100),
  description TEXT,
  stargazers_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  size INTEGER DEFAULT 0, -- Repository size in KB
  
  -- Auto-detection and scoring
  auto_enabled BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  score_factors JSONB DEFAULT '{}',
  
  -- Webhook configuration (for private repos)
  webhook_url VARCHAR(500),
  webhook_secret VARCHAR(255),
  webhook_configured BOOLEAN DEFAULT FALSE,
  
  -- Status and timing
  status VARCHAR(50) DEFAULT 'active', -- active, paused, disabled
  enabled_at TIMESTAMP DEFAULT NOW(),
  last_commit_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_repo UNIQUE (wallet_address, github_repo_id),
  CONSTRAINT valid_wallet_address CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'disabled')),
  
  -- Foreign key
  FOREIGN KEY (wallet_address) REFERENCES user_profiles(wallet_address) ON DELETE CASCADE
);

-- ============================================================================
-- REPOSITORY SUGGESTIONS TABLE (PENDING REPOS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS repository_suggestions (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  
  -- GitHub repository information
  github_repo_id BIGINT NOT NULL,
  repo_name VARCHAR(255) NOT NULL,
  repo_full_name VARCHAR(500) NOT NULL,
  repo_url VARCHAR(500) NOT NULL,
  
  -- Repository metadata
  is_private BOOLEAN DEFAULT FALSE,
  language VARCHAR(100),
  description TEXT,
  stargazers_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  size INTEGER DEFAULT 0,
  
  -- Scoring and recommendation
  score INTEGER DEFAULT 0,
  score_factors JSONB DEFAULT '{}',
  suggestion_reason TEXT,
  
  -- Suggestion status
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, expired
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_suggestion UNIQUE (wallet_address, github_repo_id),
  CONSTRAINT valid_suggestion_status CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  
  -- Foreign key
  FOREIGN KEY (wallet_address) REFERENCES user_profiles(wallet_address) ON DELETE CASCADE
);

-- ============================================================================
-- REPOSITORY ANALYTICS TABLE (TRACKING)
-- ============================================================================

CREATE TABLE IF NOT EXISTS repository_analytics (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  repo_id INTEGER NOT NULL,
  
  -- Analytics data
  total_commits INTEGER DEFAULT 0,
  total_rewards DECIMAL(20, 8) DEFAULT 0,
  last_commit_hash VARCHAR(40),
  last_commit_at TIMESTAMP,
  
  -- Weekly/monthly stats
  commits_this_week INTEGER DEFAULT 0,
  commits_this_month INTEGER DEFAULT 0,
  rewards_this_week DECIMAL(20, 8) DEFAULT 0,
  rewards_this_month DECIMAL(20, 8) DEFAULT 0,
  
  -- Reset tracking
  week_reset_at TIMESTAMP DEFAULT DATE_TRUNC('week', NOW()),
  month_reset_at TIMESTAMP DEFAULT DATE_TRUNC('month', NOW()),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_repo_analytics UNIQUE (wallet_address, repo_id),
  
  -- Foreign keys
  FOREIGN KEY (wallet_address) REFERENCES user_profiles(wallet_address) ON DELETE CASCADE,
  FOREIGN KEY (repo_id) REFERENCES user_repositories(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User repositories indexes
CREATE INDEX IF NOT EXISTS idx_user_repositories_wallet ON user_repositories(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_repositories_github_id ON user_repositories(github_repo_id);
CREATE INDEX IF NOT EXISTS idx_user_repositories_status ON user_repositories(status);
CREATE INDEX IF NOT EXISTS idx_user_repositories_auto_enabled ON user_repositories(auto_enabled) WHERE auto_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_repositories_active ON user_repositories(wallet_address, status) WHERE status = 'active';

-- Repository suggestions indexes
CREATE INDEX IF NOT EXISTS idx_repository_suggestions_wallet ON repository_suggestions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_repository_suggestions_status ON repository_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_repository_suggestions_score ON repository_suggestions(score DESC);
CREATE INDEX IF NOT EXISTS idx_repository_suggestions_pending ON repository_suggestions(wallet_address, status) WHERE status = 'pending';

-- Repository analytics indexes
CREATE INDEX IF NOT EXISTS idx_repository_analytics_wallet ON repository_analytics(wallet_address);
CREATE INDEX IF NOT EXISTS idx_repository_analytics_repo ON repository_analytics(repo_id);
CREATE INDEX IF NOT EXISTS idx_repository_analytics_commits ON repository_analytics(total_commits DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_repositories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_repositories_updated_at
    BEFORE UPDATE ON user_repositories
    FOR EACH ROW EXECUTE FUNCTION update_repositories_updated_at();

CREATE TRIGGER update_repository_suggestions_updated_at
    BEFORE UPDATE ON repository_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_repositories_updated_at();

CREATE TRIGGER update_repository_analytics_updated_at
    BEFORE UPDATE ON repository_analytics
    FOR EACH ROW EXECUTE FUNCTION update_repositories_updated_at();

-- Auto-create analytics when repository is enabled
CREATE OR REPLACE FUNCTION create_repository_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO repository_analytics (wallet_address, repo_id)
    VALUES (NEW.wallet_address, NEW.id)
    ON CONFLICT (wallet_address, repo_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_repository_analytics_trigger
    AFTER INSERT ON user_repositories
    FOR EACH ROW EXECUTE FUNCTION create_repository_analytics();

-- ============================================================================
-- HELPER VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active repositories with analytics
CREATE OR REPLACE VIEW active_repositories_with_stats AS
SELECT 
    ur.*,
    ra.total_commits,
    ra.total_rewards,
    ra.last_commit_at,
    ra.commits_this_week,
    ra.commits_this_month,
    ra.rewards_this_week,
    ra.rewards_this_month
FROM user_repositories ur
LEFT JOIN repository_analytics ra ON ur.id = ra.repo_id
WHERE ur.status = 'active'
ORDER BY ra.total_rewards DESC NULLS LAST;

-- Repository suggestions with priority
CREATE OR REPLACE VIEW priority_repository_suggestions AS
SELECT 
    *,
    CASE 
        WHEN score >= 60 THEN 'high'
        WHEN score >= 40 THEN 'medium'
        ELSE 'low'
    END as priority
FROM repository_suggestions
WHERE status = 'pending'
ORDER BY score DESC, created_at ASC;

-- User repository summary
CREATE OR REPLACE VIEW user_repository_summary AS
SELECT 
    ur.wallet_address,
    COUNT(*) as total_repositories,
    COUNT(*) FILTER (WHERE ur.auto_enabled = TRUE) as auto_enabled_count,
    COUNT(*) FILTER (WHERE ur.is_private = TRUE) as private_count,
    COUNT(*) FILTER (WHERE ur.status = 'active') as active_count,
    COALESCE(SUM(ra.total_commits), 0) as total_commits,
    COALESCE(SUM(ra.total_rewards), 0) as total_rewards,
    MAX(ra.last_commit_at) as last_commit_at
FROM user_repositories ur
LEFT JOIN repository_analytics ra ON ur.id = ra.repo_id
GROUP BY ur.wallet_address;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Get repository suggestions for a user
CREATE OR REPLACE FUNCTION get_user_repository_suggestions(user_wallet VARCHAR(42))
RETURNS TABLE (
    id INTEGER,
    repo_name VARCHAR(255),
    repo_full_name VARCHAR(500),
    language VARCHAR(100),
    description TEXT,
    score INTEGER,
    suggestion_reason TEXT,
    is_private BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.id,
        rs.repo_name,
        rs.repo_full_name,
        rs.language,
        rs.description,
        rs.score,
        rs.suggestion_reason,
        rs.is_private
    FROM repository_suggestions rs
    WHERE rs.wallet_address = user_wallet 
      AND rs.status = 'pending'
    ORDER BY rs.score DESC, rs.created_at ASC;
END;
$$ language 'plpgsql';

-- Get user's active repositories
CREATE OR REPLACE FUNCTION get_user_active_repositories(user_wallet VARCHAR(42))
RETURNS TABLE (
    id INTEGER,
    repo_name VARCHAR(255),
    repo_full_name VARCHAR(500),
    language VARCHAR(100),
    auto_enabled BOOLEAN,
    total_commits INTEGER,
    total_rewards DECIMAL(20, 8),
    last_commit_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        arvs.id,
        arvs.repo_name,
        arvs.repo_full_name,
        arvs.language,
        arvs.auto_enabled,
        arvs.total_commits,
        arvs.total_rewards,
        arvs.last_commit_at
    FROM active_repositories_with_stats arvs
    WHERE arvs.wallet_address = user_wallet
    ORDER BY arvs.total_rewards DESC, arvs.last_commit_at DESC NULLS LAST;
END;
$$ language 'plpgsql';

-- ============================================================================
-- CLEANUP AND MAINTENANCE
-- ============================================================================

-- Function to expire old suggestions (run periodically)
CREATE OR REPLACE FUNCTION expire_old_suggestions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE repository_suggestions 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ language 'plpgsql';

-- Function to reset weekly/monthly stats (run via cron)
CREATE OR REPLACE FUNCTION reset_periodic_stats()
RETURNS TEXT AS $$
BEGIN
    -- Reset weekly stats
    UPDATE repository_analytics 
    SET 
        commits_this_week = 0,
        rewards_this_week = 0,
        week_reset_at = DATE_TRUNC('week', NOW())
    WHERE week_reset_at < DATE_TRUNC('week', NOW());
    
    -- Reset monthly stats
    UPDATE repository_analytics 
    SET 
        commits_this_month = 0,
        rewards_this_month = 0,
        month_reset_at = DATE_TRUNC('month', NOW())
    WHERE month_reset_at < DATE_TRUNC('month', NOW());
    
    RETURN 'Weekly and monthly stats reset successfully';
END;
$$ language 'plpgsql';

COMMENT ON TABLE user_repositories IS 'Enabled repositories for earning rewards - auto-detected or manually added';
COMMENT ON TABLE repository_suggestions IS 'Pending repository suggestions from auto-detection';
COMMENT ON TABLE repository_analytics IS 'Analytics and statistics for user repositories';

COMMENT ON COLUMN user_repositories.auto_enabled IS 'TRUE if repository was automatically enabled (public repos)';
COMMENT ON COLUMN user_repositories.score IS 'Auto-detection score based on activity and relevance';
COMMENT ON COLUMN repository_suggestions.suggestion_reason IS 'Human-readable reason for suggesting this repository';