import { getPool } from './database.js';
import { User } from '../models/User.js';
import { Commit } from '../models/Commit.js';

/**
 * User/Commit Data Manager
 * 
 * Responsible for all user accounts, GitHub commits, and reward data.
 * Implements the systematic data architecture pattern with proactive data collection.
 * 
 * Core Responsibilities:
 * 1. Knowing what user and commit data is needed
 * 2. Processing GitHub webhooks systematically
 * 3. Storing data in optimized database structures
 * 4. Serving data through clean APIs
 * 5. Maintaining data freshness and user statistics
 */
export class UserCommitDataManager {
  constructor() {
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    this.updateInterval = 5 * 60 * 1000; // 5 minutes for user stats
    this.analyticsInterval = 60 * 60 * 1000; // 1 hour for analytics
    this.isInitialized = false;
  }

  /**
   * Initialize the User/Commit Data Manager
   * Sets up periodic updates and performs initial data processing
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('User/Commit Data Manager already initialized');
      return;
    }

    console.log('👥 User/Commit Data Manager (DISABLED - using original tables only)');
    console.log('   - Webhook processing handled by /api/webhooks/github directly');
    console.log('   - User data queries use original users/commits tables');
    
    this.isInitialized = true;
    // Disabled - functionality moved to direct webhook processing
  }

  // Migration removed - using original tables only

  /**
   * Process GitHub webhook systematically
   */
  async processGitHubWebhook(payload) {
    try {
      console.log('🔄 Processing GitHub webhook...');
      
      const { repository, commits, pusher, head_commit } = payload;
      
      if (!commits || commits.length === 0) {
        console.log('No commits in webhook payload');
        return;
      }

      const pool = getPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        
        for (const commit of commits) {
          await this.processCommitSystematic(client, {
            commitHash: commit.id,
            repositoryUrl: repository.html_url,
            repositoryName: repository.name,
            commitMessage: commit.message,
            commitUrl: commit.url,
            authorUsername: commit.author.username || pusher.name,
            authorEmail: commit.author.email,
            commitTimestamp: new Date(commit.timestamp),
            filesChanged: commit.added?.length + commit.removed?.length + commit.modified?.length || 0,
            linesAdded: 0, // Would need GitHub API call for detailed stats
            linesDeleted: 0
          });
        }
        
        await client.query('COMMIT');
        console.log(`✅ Processed ${commits.length} commits`);
        
        // Update data freshness
        await this.updateDataFreshness('users_commits', true);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ Error processing GitHub webhook:', error);
      await this.recordDataError('webhook_processing', error.message);
    }
  }

  /**
   * Process individual commit systematically
   */
  async processCommitSystematic(client, commitData) {
    try {
      // 1. Find or create user
      const user = await this.findOrCreateUser(client, commitData.authorUsername);
      
      // 2. Store commit in systematic schema
      const storedCommit = await this.storeCommitSystematic(client, commitData, user.id);
      
      // 3. Calculate and assign reward
      const reward = await this.calculateCommitReward(storedCommit);
      await this.updateCommitReward(client, storedCommit.id, reward);
      
      // 4. Update user statistics
      await this.updateUserStatsIncremental(client, user.id, reward.amount);
      
      // 5. Update repository analytics
      await this.updateRepositoryAnalytics(client, commitData.repositoryName);
      
      return storedCommit;
      
    } catch (error) {
      console.error('Error processing commit:', error);
      throw error;
    }
  }

  /**
   * Find or create user in systematic schema
   */
  async findOrCreateUser(client, githubUsername) {
    // First try to find existing user
    let result = await client.query(`
      SELECT * FROM users_master WHERE github_username = $1
    `, [githubUsername]);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // Create new user with minimal data
    result = await client.query(`
      INSERT INTO users_master (
        github_username, display_name, is_active, created_at
      ) VALUES ($1, $2, true, NOW())
      RETURNING *
    `, [githubUsername, githubUsername]);
    
    return result.rows[0];
  }

  /**
   * Store commit in systematic schema
   */
  async storeCommitSystematic(client, commitData, userId) {
    const result = await client.query(`
      INSERT INTO commits_master (
        commit_hash, repository_url, repository_name, commit_message,
        commit_url, files_changed, lines_added, lines_deleted,
        user_id, author_github_username, commit_timestamp,
        reward_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', NOW())
      ON CONFLICT (commit_hash) DO UPDATE SET
        processed_at = NOW(),
        files_changed = EXCLUDED.files_changed
      RETURNING *
    `, [
      commitData.commitHash,
      commitData.repositoryUrl,
      commitData.repositoryName,
      commitData.commitMessage,
      commitData.commitUrl,
      commitData.filesChanged,
      commitData.linesAdded,
      commitData.linesDeleted,
      userId,
      commitData.authorUsername,
      commitData.commitTimestamp
    ]);
    
    return result.rows[0];
  }

  /**
   * Calculate commit reward with quality scoring
   */
  async calculateCommitReward(commit) {
    // Basic reward calculation (can be enhanced with quality scoring)
    const baseReward = 1.0; // Base reward in ABC tokens
    let multiplier = 1.0;
    
    // Quality multipliers
    if (commit.files_changed > 5) multiplier += 0.1;
    if (commit.commit_message.length > 50) multiplier += 0.1;
    if (commit.commit_message.toLowerCase().includes('fix')) multiplier += 0.2;
    if (commit.commit_message.toLowerCase().includes('feature')) multiplier += 0.3;
    
    const amount = baseReward * multiplier;
    
    return {
      amount,
      multiplier,
      reason: `Base: ${baseReward}, Multiplier: ${multiplier.toFixed(2)}`
    };
  }

  /**
   * Update commit with reward information
   */
  async updateCommitReward(client, commitId, reward) {
    await client.query(`
      UPDATE commits_master 
      SET 
        reward_amount = $2,
        reward_multiplier = $3,
        reward_reason = $4,
        reward_status = 'processed',
        processed_at = NOW()
      WHERE id = $1
    `, [commitId, reward.amount, reward.multiplier, reward.reason]);
  }

  /**
   * Update user statistics incrementally
   */
  async updateUserStatsIncremental(client, userId, rewardAmount) {
    await client.query(`
      UPDATE users_master 
      SET 
        total_commits = total_commits + 1,
        total_rewards_earned = total_rewards_earned + $2,
        last_commit_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `, [userId, rewardAmount]);
  }

  /**
   * Update repository analytics
   */
  async updateRepositoryAnalytics(client, repositoryName) {
    await client.query(`
      INSERT INTO repository_analytics (
        repository_name, total_commits, unique_contributors, 
        last_commit_at, updated_at
      ) VALUES ($1, 1, 1, NOW(), NOW())
      ON CONFLICT (repository_name) DO UPDATE SET
        total_commits = repository_analytics.total_commits + 1,
        last_commit_at = NOW(),
        updated_at = NOW()
    `, [repositoryName]);
  }

  /**
   * Update user statistics across all users
   */
  async updateUserStatistics() {
    try {
      console.log('📊 Updating user statistics...');
      
      const pool = getPool();
      
      // Recalculate all user stats from commits
      await pool.query(`
        UPDATE users_master 
        SET 
          total_commits = COALESCE(commit_stats.total_commits, 0),
          total_rewards_earned = COALESCE(commit_stats.total_rewards, 0),
          last_commit_at = commit_stats.last_commit_at,
          first_commit_at = COALESCE(users_master.first_commit_at, commit_stats.first_commit_at),
          updated_at = NOW()
        FROM (
          SELECT 
            user_id,
            COUNT(*) as total_commits,
            SUM(reward_amount) as total_rewards,
            MAX(commit_timestamp) as last_commit_at,
            MIN(commit_timestamp) as first_commit_at
          FROM commits_master 
          WHERE reward_status IN ('pending', 'claimable', 'processed')
          GROUP BY user_id
        ) AS commit_stats
        WHERE users_master.id = commit_stats.user_id
      `);
      
      console.log('✅ User statistics updated');
      
    } catch (error) {
      console.error('❌ Error updating user statistics:', error);
      await this.recordDataError('user_stats_update', error.message);
    }
  }

  /**
   * Generate daily analytics
   */
  async generateAnalytics() {
    try {
      console.log('📈 Generating analytics...');
      
      const pool = getPool();
      const today = new Date().toISOString().split('T')[0];
      
      // User activity snapshot
      await pool.query(`
        INSERT INTO user_activity_snapshots (
          snapshot_date, total_active_users, total_commits_today,
          total_rewards_distributed, new_members_today, total_paid_members
        )
        SELECT 
          $1::date,
          COUNT(DISTINCT CASE WHEN last_commit_at >= CURRENT_DATE THEN id END) as total_active_users,
          COALESCE(commit_stats.total_commits_today, 0),
          COALESCE(commit_stats.total_rewards_today, 0),
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as new_members_today,
          COUNT(CASE WHEN membership_status = 'active' THEN 1 END) as total_paid_members
        FROM users_master
        CROSS JOIN (
          SELECT 
            COUNT(*) as total_commits_today,
            SUM(reward_amount) as total_rewards_today
          FROM commits_master 
          WHERE DATE(commit_timestamp) = CURRENT_DATE
        ) AS commit_stats
        ON CONFLICT (snapshot_date) DO UPDATE SET
          total_active_users = EXCLUDED.total_active_users,
          total_commits_today = EXCLUDED.total_commits_today,
          total_rewards_distributed = EXCLUDED.total_rewards_distributed,
          new_members_today = EXCLUDED.new_members_today,
          total_paid_members = EXCLUDED.total_paid_members
      `, [today]);

      // Commit analytics
      await pool.query(`
        INSERT INTO commit_analytics (
          analysis_date, total_commits, unique_contributors, unique_repositories,
          total_rewards, avg_reward_per_commit
        )
        SELECT 
          $1::date,
          COUNT(*) as total_commits,
          COUNT(DISTINCT user_id) as unique_contributors,
          COUNT(DISTINCT repository_name) as unique_repositories,
          SUM(reward_amount) as total_rewards,
          AVG(reward_amount) as avg_reward_per_commit
        FROM commits_master 
        WHERE DATE(commit_timestamp) = CURRENT_DATE
        ON CONFLICT (analysis_date) DO UPDATE SET
          total_commits = EXCLUDED.total_commits,
          unique_contributors = EXCLUDED.unique_contributors,
          unique_repositories = EXCLUDED.unique_repositories,
          total_rewards = EXCLUDED.total_rewards,
          avg_reward_per_commit = EXCLUDED.avg_reward_per_commit
      `, [today]);

      console.log('✅ Analytics generated');
      
    } catch (error) {
      console.error('❌ Error generating analytics:', error);
      await this.recordDataError('analytics_generation', error.message);
    }
  }

  /**
   * Update user streaks
   */
  async updateUserStreaks() {
    try {
      console.log('🔥 Updating user streaks...');
      
      const pool = getPool();
      
      // This is a simplified version - can be enhanced with more sophisticated streak logic
      await pool.query(`
        INSERT INTO user_streaks (user_id, current_streak_days, last_commit_date)
        SELECT 
          id as user_id,
          CASE 
            WHEN last_commit_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1
            ELSE 0
          END as current_streak_days,
          DATE(last_commit_at) as last_commit_date
        FROM users_master 
        WHERE last_commit_at IS NOT NULL
        ON CONFLICT (user_id) DO UPDATE SET
          current_streak_days = EXCLUDED.current_streak_days,
          last_commit_date = EXCLUDED.last_commit_date,
          updated_at = NOW()
      `);
      
      console.log('✅ User streaks updated');
      
    } catch (error) {
      console.error('❌ Error updating user streaks:', error);
      await this.recordDataError('streak_update', error.message);
    }
  }

  /**
   * Update data freshness tracking
   */
  async updateDataFreshness(domain, isHealthy) {
    const pool = getPool();
    
    await pool.query(`
      INSERT INTO data_freshness (domain, last_update, is_healthy, error_count, last_error)
      VALUES ($1, NOW(), $2, 0, NULL)
      ON CONFLICT (domain) DO UPDATE SET
        last_update = NOW(),
        is_healthy = $2,
        error_count = CASE WHEN $2 THEN 0 ELSE data_freshness.error_count END,
        last_error = CASE WHEN $2 THEN NULL ELSE data_freshness.last_error END
    `, [domain, isHealthy]);
  }

  /**
   * Record data error for monitoring
   */
  async recordDataError(operation, errorMessage) {
    const pool = getPool();
    
    try {
      await pool.query(`
        INSERT INTO data_freshness (domain, last_update, is_healthy, error_count, last_error)
        VALUES ('users_commits', NOW(), false, 1, $1)
        ON CONFLICT (domain) DO UPDATE SET
          is_healthy = false,
          error_count = data_freshness.error_count + 1,
          last_error = $1
      `, [errorMessage]);
    } catch (e) {
      console.error('Failed to record data error:', e);
    }
  }

  /**
   * API Methods - Clean data serving endpoints
   */

  /**
   * Get user profile by identifier
   */
  async getUserProfile(identifier) {
    const pool = getPool();
    
    // Determine identifier type and query accordingly
    let query, params;
    
    if (identifier.startsWith('0x')) {
      // Wallet address - look in original users table with case-insensitive search
      query = 'SELECT * FROM users WHERE LOWER(wallet_address) = $1';
      params = [identifier.toLowerCase()];
    } else if (!isNaN(identifier)) {
      // Farcaster FID - look in original users table
      query = 'SELECT * FROM users WHERE farcaster_fid = $1';
      params = [parseInt(identifier)];
    } else {
      // String identifier - check if it's a GitHub username OR Farcaster username in original users table
      query = 'SELECT * FROM users WHERE github_username = $1 OR farcaster_username = $1';
      params = [identifier];
    }
    
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async getRecentUsers() {
    const pool = getPool();
    const result = await pool.query(
      'SELECT wallet_address, github_username, farcaster_username, discord_username, is_member FROM users ORDER BY created_at DESC LIMIT 10'
    );
    return result.rows;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(timeframe = 'all', limit = 20) {
    const pool = getPool();
    
    let timeFilter = '';
    if (timeframe === 'week') timeFilter = "AND c.commit_timestamp >= NOW() - INTERVAL '7 days'";
    if (timeframe === 'month') timeFilter = "AND c.commit_timestamp >= NOW() - INTERVAL '30 days'";
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.farcaster_username,
        u.github_username,
        u.display_name,
        u.avatar_url,
        u.membership_status,
        u.verified_at,
        COUNT(c.id) as commits,
        COALESCE(SUM(c.reward_amount), 0) as total_rewards,
        MAX(c.commit_timestamp) as last_commit_at
      FROM users_master u
      LEFT JOIN commits_master c ON u.id = c.user_id ${timeFilter}
      WHERE u.is_active = true
      GROUP BY u.id, u.farcaster_username, u.github_username, u.display_name, u.avatar_url, u.membership_status, u.verified_at
      ORDER BY total_rewards DESC, commits DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }

  /**
   * Get recent commits
   */
  async getRecentCommits(limit = 50) {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        c.*,
        u.farcaster_username,
        u.github_username,
        u.display_name,
        u.avatar_url
      FROM commits_master c
      JOIN users_master u ON c.user_id = u.id
      ORDER BY c.commit_timestamp DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }

  /**
   * Get user commits
   */
  async getUserCommits(userId, limit = 50, offset = 0) {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM commits_master 
      WHERE user_id = $1
      ORDER BY commit_timestamp DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    return result.rows;
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users_master WHERE is_active = true) as total_users,
        (SELECT COUNT(*) FROM users_master WHERE membership_status = 'active') as paid_members,
        (SELECT COUNT(*) FROM commits_master) as total_commits,
        (SELECT COUNT(DISTINCT repository_name) FROM commits_master) as unique_repositories,
        (SELECT SUM(reward_amount) FROM commits_master WHERE reward_status = 'processed') as total_rewards_distributed,
        (SELECT COUNT(*) FROM commits_master WHERE commit_timestamp >= NOW() - INTERVAL '24 hours') as commits_24h,
        (SELECT COUNT(*) FROM commits_master WHERE commit_timestamp >= NOW() - INTERVAL '7 days') as commits_7d,
        (SELECT COUNT(*) FROM commits_master WHERE commit_timestamp >= NOW() - INTERVAL '30 days') as commits_30d
    `);
    
    return result.rows[0];
  }

  /**
   * Get data freshness status
   */
  async getDataFreshness() {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM data_freshness WHERE domain = 'users_commits'
    `);
    
    return result.rows[0];
  }
}

// Export singleton instance
export const userCommitDataManager = new UserCommitDataManager();