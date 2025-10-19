import { BaseActionProcessor, ActionProcessorUtils } from './action-processor.js';

/**
 * Commit Action Processor
 * Handles GitHub commit actions with immediate rewards and real-time leaderboard updates
 */
export class CommitActionProcessor extends BaseActionProcessor {
  constructor() {
    super();
    this.rewardMultipliers = {
      normal: 1.0,
      high: 1.5,
      milestone: 2.0,
      experimental: 0.8
    };
  }

  /**
   * Process a GitHub commit webhook or manual commit submission
   */
  async processCommit(commitData) {
    const { 
      commitHash, 
      authorWallet, 
      repository, 
      commitMessage,
      githubUsername,
      commitUrl,
      tags = [],
      priority = 'normal'
    } = commitData;

    // Create action data structure
    const actionData = {
      type: 'commit',
      userWallet: authorWallet,
      data: {
        commitHash,
        repository,
        commitMessage,
        githubUsername,
        commitUrl,
        tags,
        priority
      },
      txHash: null // Commits don't have blockchain transactions
    };

    return this.processAction(actionData);
  }

  /**
   * Apply optimistic update for commit actions (always immediate for commits)
   */
  async applyOptimisticUpdate(client, actionData) {
    const { userWallet, data } = actionData;
    const {
      commitHash,
      repository,
      commitMessage,
      githubUsername,
      commitUrl,
      tags,
      priority
    } = data;

    // 1. Check if commit already exists
    const existingCommit = await client.query(`
      SELECT id FROM commits WHERE commit_hash = $1
    `, [commitHash]);

    if (existingCommit.rows.length > 0) {
      throw new Error(`Commit ${commitHash} already processed`);
    }

    // 2. Get or create user
    const user = await this.findOrCreateUser(client, userWallet, githubUsername);

    // 3. Check daily limit (10 commits per day)
    const today = new Date().toISOString().split('T')[0];
    const dailyCount = await client.query(`
      SELECT COUNT(*) as count
      FROM commits 
      WHERE author_wallet = $1 AND DATE(processed_at) = $2
    `, [userWallet, today]);

    const currentDailyCommits = parseInt(dailyCount.rows[0].count);
    const isAtDailyLimit = currentDailyCommits >= 10;

    // 4. Calculate reward amount
    const rewardAmount = isAtDailyLimit ? 0 : this.calculateReward(tags, priority);

    // 5. Store commit
    const commitResult = await client.query(`
      INSERT INTO commits (
        user_id, commit_hash, repository, commit_message, 
        commit_url, reward_amount, tags, priority, 
        processed_at, author_wallet
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      RETURNING *
    `, [
      user.id,
      commitHash,
      repository,
      commitMessage,
      commitUrl,
      rewardAmount,
      tags,
      priority,
      userWallet
    ]);

    const storedCommit = commitResult.rows[0];

    // 6. Update user statistics if reward was given
    let updatedUser = user;
    if (rewardAmount > 0) {
      updatedUser = await ActionProcessorUtils.updateUserStats(client, userWallet);
    }

    // 7. Update daily stats
    await this.updateDailyStats(client, user.id, today, rewardAmount);

    // 8. Get updated leaderboard data
    const leaderboardData = await ActionProcessorUtils.getLeaderboardData(client, 20);

    return {
      commit: storedCommit,
      user: updatedUser,
      rewardAmount,
      isAtDailyLimit,
      currentDailyCommits: currentDailyCommits + 1,
      leaderboard: leaderboardData,
      actionType: 'commit'
    };
  }

  /**
   * Find or create user by wallet and GitHub username
   */
  async findOrCreateUser(client, userWallet, githubUsername) {
    // First try to find by wallet
    let userResult = await client.query(`
      SELECT * FROM users WHERE wallet_address = $1
    `, [userWallet]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      
      // Update GitHub username if it's different
      if (user.github_username !== githubUsername) {
        await client.query(`
          UPDATE users 
          SET github_username = $1, updated_at = NOW()
          WHERE id = $2
        `, [githubUsername, user.id]);
        
        user.github_username = githubUsername;
      }
      
      return user;
    }

    // Try to find by GitHub username
    userResult = await client.query(`
      SELECT * FROM users WHERE github_username = $1
    `, [githubUsername]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      
      // Update wallet address
      await client.query(`
        UPDATE users 
        SET wallet_address = $1, updated_at = NOW()
        WHERE id = $2
      `, [userWallet, user.id]);
      
      user.wallet_address = userWallet;
      return user;
    }

    // Create new user
    const createResult = await client.query(`
      INSERT INTO users (
        wallet_address, github_username, display_name, 
        membership_status, created_at, updated_at
      ) VALUES ($1, $2, $3, 'active', NOW(), NOW())
      RETURNING *
    `, [userWallet, githubUsername, githubUsername]);

    return createResult.rows[0];
  }

  /**
   * Calculate reward amount based on tags and priority
   */
  calculateReward(tags = [], priority = 'normal') {
    // Base reward: 50k-60k ABC (95% chance)
    let baseReward;
    const rand = Math.random();
    
    if (rand < 0.95) {
      baseReward = Math.floor(Math.random() * 10000) + 50000; // 50k-60k
    } else if (rand < 0.975) {
      baseReward = Math.floor(Math.random() * 40000) + 60000; // 60k-100k
    } else {
      baseReward = Math.floor(Math.random() * 899000) + 100000; // 100k-999k
    }

    // Apply priority multiplier
    const multiplier = this.rewardMultipliers[priority] || 1.0;
    const finalReward = Math.floor(baseReward * multiplier);

    return finalReward;
  }

  /**
   * Update daily statistics
   */
  async updateDailyStats(client, userId, date, rewardAmount) {
    await client.query(`
      INSERT INTO daily_stats (user_id, date, commit_count, total_rewards)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (user_id, date) 
      DO UPDATE SET 
        commit_count = daily_stats.commit_count + 1,
        total_rewards = daily_stats.total_rewards + EXCLUDED.total_rewards
    `, [userId, date, rewardAmount]);
  }

  /**
   * Prepare broadcast data for commit updates
   */
  async prepareBroadcastData(client, actionData, updateResult) {
    const { userWallet, data } = actionData;
    const { commitHash, repository } = data;

    // Determine which users were affected by leaderboard changes
    const affectedUsers = await this.findLeaderboardChanges(
      client, 
      userWallet, 
      updateResult.user
    );

    return {
      type: 'commit_update',
      rooms: ['global', 'leaderboard', `user:${userWallet}`],
      data: {
        actionType: 'commit',
        userWallet,
        commitHash,
        repository: repository,
        commit: updateResult.commit,
        user: updateResult.user,
        rewardAmount: updateResult.rewardAmount,
        isAtDailyLimit: updateResult.isAtDailyLimit,
        currentDailyCommits: updateResult.currentDailyCommits,
        leaderboard: updateResult.leaderboard,
        affectedUsers,
        timestamp: Date.now()
      },
      actionId: actionData.id
    };
  }

  /**
   * Find users affected by leaderboard position changes
   */
  async findLeaderboardChanges(client, activeUserWallet, updatedUser) {
    // Get users within ±3 positions of the active user's new ranking
    const nearbyUsers = await client.query(`
      WITH user_rankings AS (
        SELECT 
          wallet_address,
          github_username,
          total_rewards_earned,
          total_commits,
          RANK() OVER (ORDER BY total_rewards_earned DESC, total_commits DESC) as rank
        FROM users
        WHERE is_active = true
      ),
      active_user_rank AS (
        SELECT rank FROM user_rankings WHERE wallet_address = $1
      )
      SELECT ur.* 
      FROM user_rankings ur, active_user_rank aur
      WHERE ur.rank BETWEEN aur.rank - 3 AND aur.rank + 3
      ORDER BY ur.rank
    `, [activeUserWallet]);

    return nearbyUsers.rows.map(user => user.wallet_address);
  }

  /**
   * Commits don't need blockchain verification, so these are no-ops
   */
  async applyRollback(client, actionData) {
    // Commits are final - no rollback needed
    console.log('Commit actions do not support rollback');
  }

  async prepareRollbackBroadcastData(client, actionData) {
    // Commits are final - no rollback needed
    return null;
  }

  /**
   * Get user's recent commits
   */
  async getUserCommits(userWallet, limit = 20) {
    const result = await this.pool.query(`
      SELECT 
        c.*,
        u.github_username,
        u.display_name
      FROM commits c
      JOIN users u ON c.user_id = u.id
      WHERE c.author_wallet = $1
      ORDER BY c.processed_at DESC
      LIMIT $2
    `, [userWallet, limit]);

    return result.rows;
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(repository, days = 30) {
    const result = await this.pool.query(`
      SELECT 
        COUNT(*) as total_commits,
        COUNT(DISTINCT author_wallet) as unique_contributors,
        SUM(reward_amount) as total_rewards,
        AVG(reward_amount) as avg_reward,
        MAX(processed_at) as last_commit_at
      FROM commits 
      WHERE repository = $1 
        AND processed_at >= NOW() - INTERVAL '${days} days'
    `, [repository]);

    return result.rows[0];
  }

  /**
   * Get daily commit activity
   */
  async getDailyActivity(days = 7) {
    const result = await this.pool.query(`
      SELECT 
        DATE(processed_at) as date,
        COUNT(*) as commit_count,
        COUNT(DISTINCT author_wallet) as active_users,
        SUM(reward_amount) as total_rewards,
        COUNT(DISTINCT repository) as unique_repos
      FROM commits 
      WHERE processed_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(processed_at)
      ORDER BY date DESC
    `);

    return result.rows;
  }

  /**
   * Check if user has reached daily limit
   */
  async checkDailyLimit(userWallet, date = null) {
    const checkDate = date || new Date().toISOString().split('T')[0];
    
    const result = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM commits 
      WHERE author_wallet = $1 AND DATE(processed_at) = $2
    `, [userWallet, checkDate]);

    const currentCount = parseInt(result.rows[0].count);
    
    return {
      currentCount,
      limit: 10,
      isAtLimit: currentCount >= 10,
      remaining: Math.max(0, 10 - currentCount)
    };
  }

  /**
   * Process GitHub webhook payload
   */
  async processGitHubWebhook(payload) {
    const { repository, commits, pusher } = payload;
    
    if (!commits || commits.length === 0) {
      console.log('No commits in webhook payload');
      return [];
    }

    const processedCommits = [];

    for (const commit of commits) {
      try {
        // Parse commit message for tags and priority
        const { tags, priority, cleanMessage } = this.parseCommitMessage(commit.message);
        
        // Skip if #norew tag is present
        if (tags.includes('norew')) {
          console.log(`Skipping commit ${commit.id} due to #norew tag`);
          continue;
        }

        const result = await this.processCommit({
          commitHash: commit.id,
          authorWallet: await this.getWalletForGitHubUser(pusher.name),
          repository: repository.full_name,
          commitMessage: cleanMessage,
          githubUsername: pusher.name,
          commitUrl: commit.url,
          tags,
          priority
        });

        processedCommits.push(result);
        
      } catch (error) {
        console.error(`Failed to process commit ${commit.id}:`, error.message);
      }
    }

    return processedCommits;
  }

  /**
   * Parse commit message for tags and priority
   */
  parseCommitMessage(message) {
    const tags = [];
    let priority = 'normal';
    
    // Extract hashtags
    const hashtagMatches = message.match(/#\w+/g) || [];
    hashtagMatches.forEach(tag => {
      const cleanTag = tag.substring(1).toLowerCase();
      tags.push(cleanTag);
      
      // Set priority based on tags
      if (cleanTag === 'milestone') priority = 'milestone';
      else if (cleanTag === 'high' || cleanTag === 'priority') priority = 'high';
      else if (cleanTag === 'experimental' || cleanTag === 'exp') priority = 'experimental';
    });

    // Remove hashtags from message for clean display
    const cleanMessage = message.replace(/#\w+\s*/g, '').trim();

    return { tags, priority, cleanMessage };
  }

  /**
   * Get wallet address for GitHub username
   */
  async getWalletForGitHubUser(githubUsername) {
    const result = await this.pool.query(`
      SELECT wallet_address FROM users 
      WHERE github_username = $1 AND wallet_address IS NOT NULL
      LIMIT 1
    `, [githubUsername]);

    if (result.rows.length === 0) {
      throw new Error(`No wallet found for GitHub user: ${githubUsername}`);
    }

    return result.rows[0].wallet_address;
  }
}