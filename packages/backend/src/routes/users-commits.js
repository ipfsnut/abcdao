import express from 'express';
import { userCommitDataManager } from '../services/user-commit-data-manager.js';

const router = express.Router();

/**
 * Users/Commits API Routes
 * 
 * Clean, domain-focused endpoints following the data architecture redesign.
 * All routes consume pre-computed data from the User/Commit Data Manager.
 */

// Test route to verify mounting
router.get('/test', (req, res) => {
  res.json({ 
    status: 'users/commits routes are working', 
    timestamp: new Date().toISOString(),
    manager: 'UserCommitDataManager',
    deploymentTest: 'META_FIELD_UPDATE_DEPLOYED'
  });
});

// Debug route to check wallet addresses
router.get('/debug/users', async (req, res) => {
  try {
    const users = await userCommitDataManager.getRecentUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users-commits/profile/:identifier
 * Returns user profile by wallet address, FID, or GitHub username
 */
router.get('/profile/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier.toLowerCase();
    
    if (!identifier) {
      return res.status(400).json({ 
        error: 'Missing identifier' 
      });
    }

    const user = await userCommitDataManager.getUserProfile(identifier);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        identifier
      });
    }

    // Get repository count from registered_repositories table
    let uniqueRepositories = 0;
    try {
      const { getPool } = await import('../services/database.js');
      const pool = getPool();
      const repoCountResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM registered_repositories rr
        JOIN users u ON rr.registered_by_user_id = u.id
        WHERE u.farcaster_fid = $1 AND rr.status = 'active'
      `, [user.farcaster_fid]);
      
      uniqueRepositories = parseInt(repoCountResult.rows[0]?.count || 0);
    } catch (error) {
      console.error('Error fetching repository count:', error);
      uniqueRepositories = 0;
    }

    res.json({
      id: user.id,
      identifiers: {
        walletAddress: user.wallet_address,
        farcasterFid: user.farcaster_fid,
        githubUsername: user.github_username,
        githubId: user.github_id
      },
      profile: {
        farcasterUsername: user.farcaster_username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        websiteUrl: user.website_url
      },
      stats: {
        totalCommits: user.total_commits,
        totalRewardsEarned: parseFloat(user.total_rewards_earned),
        currentStreakDays: user.current_streak_days,
        longestStreakDays: user.longest_streak_days,
        lastCommitAt: user.last_commit_at,
        firstCommitAt: user.first_commit_at,
        uniqueRepositories: uniqueRepositories
      },
      membership: {
        status: user.membership_status,
        paidAt: user.membership_paid_at,
        amount: user.membership_amount ? parseFloat(user.membership_amount) : null,
        txHash: user.membership_tx_hash
      },
      meta: {
        isActive: user.is_active,
        verifiedAt: user.verified_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * GET /api/users-commits/leaderboard?timeframe=all&limit=20
 * Returns user leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'all';
    const limit = parseInt(req.query.limit) || 20;
    
    // Validate timeframe
    const validTimeframes = ['all', 'week', 'month'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ 
        error: 'Invalid timeframe parameter',
        message: 'Timeframe must be one of: all, week, month'
      });
    }
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ 
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 100'
      });
    }

    const leaderboard = await userCommitDataManager.getLeaderboard(timeframe, limit);
    
    const formattedLeaderboard = leaderboard.map((user, index) => {
      // Determine if user is active based on having any commits (1+ commits)
      const hasAnyCommits = parseInt(user.commits) > 0;
      
      return {
        rank: index + 1,
        id: user.id,
        profile: {
          farcasterUsername: user.farcaster_username,
          githubUsername: user.github_username,
          displayName: user.display_name,
          avatarUrl: user.avatar_url
        },
        stats: {
          commits: parseInt(user.commits),
          totalRewards: parseFloat(user.total_rewards),
          lastCommitAt: user.last_commit_at
        },
        membership: {
          status: user.membership_status
        },
        meta: {
          isActive: hasAnyCommits, // Active if user has 1+ commits
          verifiedAt: user.verified_at,
          joinedAt: null, // Could add this from user creation date if needed
          createdAt: null  // Could add this from user creation date if needed
        }
      };
    });

    res.json({
      timeframe,
      limit,
      leaderboard: formattedLeaderboard,
      count: formattedLeaderboard.length
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/users-commits/commits/recent?limit=50
 * Returns recent commits across all users
 */
router.get('/commits/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    if (limit < 1 || limit > 200) {
      return res.status(400).json({ 
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 200'
      });
    }

    const commits = await userCommitDataManager.getRecentCommits(limit);
    
    const formattedCommits = commits.map(commit => ({
      id: commit.id,
      commit: {
        hash: commit.commit_hash,
        message: commit.commit_message,
        url: commit.commit_url,
        timestamp: commit.commit_timestamp
      },
      repository: {
        name: commit.repository_name,
        url: commit.repository_url
      },
      author: {
        githubUsername: commit.author_github_username,
        farcasterUsername: commit.farcaster_username,
        displayName: commit.display_name,
        avatarUrl: commit.avatar_url
      },
      metrics: {
        filesChanged: commit.files_changed,
        linesAdded: commit.lines_added,
        linesDeleted: commit.lines_deleted
      },
      reward: {
        amount: parseFloat(commit.reward_amount),
        multiplier: parseFloat(commit.reward_multiplier),
        reason: commit.reward_reason,
        status: commit.reward_status
      },
      meta: {
        processedAt: commit.processed_at,
        castPosted: commit.cast_posted,
        castUrl: commit.cast_url
      }
    }));

    res.json({
      commits: formattedCommits,
      count: formattedCommits.length,
      limit
    });

  } catch (error) {
    console.error('Error fetching recent commits:', error);
    res.status(500).json({ error: 'Failed to fetch recent commits' });
  }
});

/**
 * GET /api/users-commits/commits/user/:userId?limit=50&offset=0
 * Returns commits for specific user
 */
router.get('/commits/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    if (isNaN(userId)) {
      return res.status(400).json({ 
        error: 'Invalid user ID' 
      });
    }
    
    if (limit < 1 || limit > 200) {
      return res.status(400).json({ 
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 200'
      });
    }

    const commits = await userCommitDataManager.getUserCommits(userId, limit, offset);
    
    const formattedCommits = commits.map(commit => ({
      id: commit.id,
      commit: {
        hash: commit.commit_hash,
        message: commit.commit_message,
        url: commit.commit_url,
        timestamp: commit.commit_timestamp
      },
      repository: {
        name: commit.repository_name,
        url: commit.repository_url
      },
      metrics: {
        filesChanged: commit.files_changed,
        linesAdded: commit.lines_added,
        linesDeleted: commit.lines_deleted,
        qualityScore: commit.commit_quality_score
      },
      reward: {
        amount: parseFloat(commit.reward_amount),
        multiplier: parseFloat(commit.reward_multiplier),
        reason: commit.reward_reason,
        status: commit.reward_status
      },
      tags: commit.commit_tags || [],
      meta: {
        processedAt: commit.processed_at,
        castPosted: commit.cast_posted,
        castUrl: commit.cast_url
      }
    }));

    res.json({
      userId,
      commits: formattedCommits,
      count: formattedCommits.length,
      limit,
      offset,
      hasMore: formattedCommits.length === limit
    });

  } catch (error) {
    console.error('Error fetching user commits:', error);
    res.status(500).json({ error: 'Failed to fetch user commits' });
  }
});

/**
 * GET /api/users-commits/stats
 * Returns system-wide statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await userCommitDataManager.getSystemStats();
    const freshness = await userCommitDataManager.getDataFreshness();

    res.json({
      statistics: {
        totalUsers: parseInt(stats.total_users),
        paidMembers: parseInt(stats.paid_members),
        totalCommits: parseInt(stats.total_commits),
        uniqueRepositories: parseInt(stats.unique_repositories),
        totalRewardsDistributed: parseFloat(stats.total_rewards_distributed),
        recentActivity: {
          commits24h: parseInt(stats.commits_24h),
          commits7d: parseInt(stats.commits_7d),
          commits30d: parseInt(stats.commits_30d)
        }
      },
      dataHealth: {
        domain: freshness?.domain || 'users_commits',
        isHealthy: freshness?.is_healthy || false,
        lastUpdate: freshness?.last_update,
        errorCount: freshness?.error_count || 0,
        lastError: freshness?.last_error
      }
    });

  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

/**
 * GET /api/users-commits/health
 * Returns data manager health status
 */
router.get('/health', async (req, res) => {
  try {
    const freshness = await userCommitDataManager.getDataFreshness();
    const isHealthy = freshness?.is_healthy || false;
    const lastUpdate = freshness?.last_update;
    const timeSinceUpdate = lastUpdate ? Date.now() - new Date(lastUpdate).getTime() : null;
    
    // Consider data stale if it's more than 10 minutes old
    const isStale = timeSinceUpdate && timeSinceUpdate > 10 * 60 * 1000;
    
    res.json({
      status: isHealthy && !isStale ? 'healthy' : 'unhealthy',
      domain: 'users_commits',
      isHealthy,
      isStale,
      lastUpdate,
      timeSinceUpdateMs: timeSinceUpdate,
      errorCount: freshness?.error_count || 0,
      lastError: freshness?.last_error
    });

  } catch (error) {
    console.error('Error checking users/commits health:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to check users/commits health',
      message: error.message
    });
  }
});

/**
 * GET /api/users-commits/activity/:walletAddress?limit=50&offset=0
 * Returns activity feed for specific user by wallet address
 */
router.get('/activity/:walletAddress', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Missing wallet address' 
      });
    }
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ 
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 100'
      });
    }

    // Get user profile first
    const user = await userCommitDataManager.getUserProfile(walletAddress);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        walletAddress
      });
    }

    // Get recent commits for this user
    const commits = await userCommitDataManager.getUserCommits(user.id, Math.min(limit, 30), offset);
    
    // Format commits as activity items
    const commitActivities = commits.map(commit => ({
      id: `commit-${commit.id}`,
      type: 'commit',
      title: 'Code Contribution',
      description: commit.commit_message || 'New commit',
      timestamp: commit.commit_timestamp,
      amount: `${parseFloat(commit.reward_amount)} ABC`,
      repository: commit.repository_name,
      hash: commit.commit_hash?.substring(0, 8),
      icon: '💻',
      link: commit.commit_url,
      metadata: {
        filesChanged: commit.files_changed,
        linesAdded: commit.lines_added,
        linesDeleted: commit.lines_deleted,
        rewardStatus: commit.reward_status
      }
    }));

    // TODO: Add staking activities when staking activity tracking is implemented
    // TODO: Add reward claim activities when reward tracking is implemented
    // TODO: Add social activities when social interaction tracking is implemented

    // For now, return commit activities sorted by timestamp
    const allActivities = commitActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      walletAddress,
      userId: user.id,
      activities: allActivities,
      count: allActivities.length,
      limit,
      offset,
      hasMore: allActivities.length === limit,
      summary: {
        totalCommits: commits.length,
        totalStakeActions: 0, // TODO: Implement when staking tracking available
        totalRewardClaims: 0, // TODO: Implement when reward tracking available
        totalSocialActions: 0 // TODO: Implement when social tracking available
      }
    });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

/**
 * GET /api/users-commits/metrics/:walletAddress
 * Returns comprehensive metrics for specific user by wallet address
 */
router.get('/metrics/:walletAddress', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    
    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Missing wallet address' 
      });
    }

    // Get user profile
    const user = await userCommitDataManager.getUserProfile(walletAddress);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        walletAddress
      });
    }

    // Get user's recent commits for additional metrics
    const recentCommits = await userCommitDataManager.getUserCommits(user.id, 100, 0);
    
    // Calculate commit-based metrics
    const last30DaysCommits = recentCommits.filter(commit => {
      const commitDate = new Date(commit.commit_timestamp);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return commitDate >= thirtyDaysAgo;
    });

    const totalEarnedFromCommits = recentCommits.reduce((sum, commit) => {
      return sum + parseFloat(commit.reward_amount || 0);
    }, 0);

    res.json({
      walletAddress,
      userId: user.id,
      metrics: {
        // Token metrics (using user profile data)
        tokenBalance: (user.total_rewards_earned / 1000000).toFixed(1), // Convert to millions
        stakedAmount: '0', // TODO: Get from staking contract when available
        pendingRewards: '0', // TODO: Get from staking contract when available
        totalEarned: (totalEarnedFromCommits / 1000000).toFixed(1),
        
        // Commit metrics
        commitCount: user.total_commits || 0,
        commitsLast30Days: last30DaysCommits.length,
        currentStreak: user.current_streak_days || 0,
        longestStreak: user.longest_streak_days || 0,
        
        // Performance metrics
        averageRewardPerCommit: recentCommits.length > 0 
          ? (totalEarnedFromCommits / recentCommits.length).toFixed(2)
          : '0',
        
        // Staking metrics (placeholder until staking integration)
        stakingAPY: '0', // TODO: Calculate from staking contract
        stakingRewardsEarned: '0', // TODO: Get from staking history
        
        // Activity metrics
        lastActivityAt: user.last_commit_at,
        firstActivityAt: user.first_commit_at,
        isActive: user.is_active
      },
      membership: {
        status: user.membership_status,
        paidAt: user.membership_paid_at,
        type: user.membership_status === 'active' ? 'premium' : 'free'
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(500).json({ error: 'Failed to fetch user metrics' });
  }
});

/**
 * POST /api/users-commits/webhook/github
 * GitHub webhook endpoint for systematic commit processing
 */
router.post('/webhook/github', async (req, res) => {
  try {
    const payload = req.body;
    
    // Validate webhook payload
    if (!payload || !payload.repository || !payload.commits) {
      return res.status(400).json({ 
        error: 'Invalid webhook payload' 
      });
    }

    // Process webhook systematically
    await userCommitDataManager.processGitHubWebhook(payload);
    
    res.json({ 
      success: true, 
      message: `Processed ${payload.commits.length} commits`,
      repository: payload.repository.name
    });

  } catch (error) {
    console.error('Error processing GitHub webhook:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      message: error.message
    });
  }
});

/**
 * GET /api/users-commits/analytics/:walletAddress?timeframe=30d
 * Returns comprehensive developer analytics for a specific user
 */
router.get('/analytics/:walletAddress', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const timeframe = req.query.timeframe || '30d';
    
    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Missing wallet address' 
      });
    }

    // Validate timeframe
    const validTimeframes = ['7d', '30d', '90d', 'all'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ 
        error: 'Invalid timeframe parameter',
        message: 'Timeframe must be one of: 7d, 30d, 90d, all'
      });
    }

    // Get user profile
    const user = await userCommitDataManager.getUserProfile(walletAddress);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        walletAddress
      });
    }

    // Calculate timeframe date filter
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // 'all'
        startDate = new Date('2020-01-01'); // Far enough back to include all data
    }

    // Get user's commits for the timeframe
    const allCommits = await userCommitDataManager.getUserCommits(user.id, 1000, 0); // Get up to 1000 commits
    const timeframeCommits = allCommits.filter(commit => {
      const commitDate = new Date(commit.commit_timestamp);
      return commitDate >= startDate;
    });

    // Calculate earning trends
    const earningTrends = calculateEarningTrends(timeframeCommits, timeframe);
    
    // Calculate performance metrics
    const totalEarned = timeframeCommits.reduce((sum, commit) => sum + parseFloat(commit.reward_amount || 0), 0);
    const totalDays = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
    const commitFrequency = timeframeCommits.length / totalDays;
    const averageRewardPerCommit = timeframeCommits.length > 0 ? totalEarned / timeframeCommits.length : 0;
    
    // Calculate quality scores (simplified scoring algorithm)
    const qualityScores = timeframeCommits.map(commit => {
      let score = 50; // Base score
      
      // Lines of code impact
      const linesChanged = (commit.lines_added || 0) + (commit.lines_deleted || 0);
      score += Math.min(linesChanged / 10, 30); // Max 30 points for large changes
      
      // Files changed impact
      score += Math.min((commit.files_changed || 0) * 2, 15); // Max 15 points for multiple files
      
      // Commit message quality (basic check)
      const messageLength = (commit.commit_message || '').length;
      if (messageLength > 50) score += 5; // Good commit message length
      
      return Math.min(score, 100);
    });
    
    const averageQualityScore = qualityScores.length > 0 ? 
      qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;

    // Calculate consistency score (based on commit frequency distribution)
    const consistencyScore = calculateConsistencyScore(timeframeCommits, totalDays);
    
    // Repository breakdown
    const repoStats = {};
    timeframeCommits.forEach(commit => {
      const repo = commit.repository_name || 'Unknown';
      if (!repoStats[repo]) {
        repoStats[repo] = { commits: 0, earned: 0 };
      }
      repoStats[repo].commits++;
      repoStats[repo].earned += parseFloat(commit.reward_amount || 0);
    });
    
    const repositoryBreakdown = Object.entries(repoStats)
      .map(([repo, stats]) => ({
        repository: repo,
        commits: stats.commits,
        earned: stats.earned,
        percentage: totalEarned > 0 ? (stats.earned / totalEarned) * 100 : 0
      }))
      .sort((a, b) => b.earned - a.earned)
      .slice(0, 10); // Top 10 repositories

    // Language stats (simplified - would need better language detection)
    const languageStats = [
      {
        language: 'JavaScript',
        commits: Math.floor(timeframeCommits.length * 0.4),
        earned: totalEarned * 0.4,
        avgReward: averageRewardPerCommit * 0.4
      },
      {
        language: 'TypeScript',
        commits: Math.floor(timeframeCommits.length * 0.3),
        earned: totalEarned * 0.3,
        avgReward: averageRewardPerCommit * 0.3
      },
      {
        language: 'Python',
        commits: Math.floor(timeframeCommits.length * 0.2),
        earned: totalEarned * 0.2,
        avgReward: averageRewardPerCommit * 0.2
      },
      {
        language: 'Other',
        commits: Math.floor(timeframeCommits.length * 0.1),
        earned: totalEarned * 0.1,
        avgReward: averageRewardPerCommit * 0.1
      }
    ].filter(lang => lang.commits > 0);

    // Generate achievements based on metrics
    const achievements = generateAchievements(user, timeframeCommits, averageQualityScore, consistencyScore);

    res.json({
      walletAddress,
      userId: user.id,
      timeframe,
      earningTrends,
      performanceMetrics: {
        averageRewardPerCommit: Math.round(averageRewardPerCommit),
        commitFrequency: parseFloat(commitFrequency.toFixed(2)),
        codeQualityScore: Math.round(averageQualityScore),
        consistencyScore: Math.round(consistencyScore),
        totalCodeImpact: timeframeCommits.reduce((sum, commit) => 
          sum + (commit.lines_added || 0) + (commit.lines_deleted || 0), 0)
      },
      repositoryBreakdown,
      languageStats,
      achievements,
      summary: {
        totalCommits: timeframeCommits.length,
        totalEarned: Math.round(totalEarned),
        activeDays: calculateActiveDays(timeframeCommits),
        longestStreak: user.longest_streak_days || 0,
        currentStreak: user.current_streak_days || 0
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching developer analytics:', error);
    res.status(500).json({ error: 'Failed to fetch developer analytics' });
  }
});

// Helper functions
function calculateEarningTrends(commits, timeframe) {
  const trends = { daily: [], weekly: [], monthly: [] };
  
  if (commits.length === 0) return trends;
  
  // Group commits by date
  const dailyEarnings = {};
  commits.forEach(commit => {
    const date = new Date(commit.commit_timestamp).toISOString().split('T')[0];
    if (!dailyEarnings[date]) dailyEarnings[date] = 0;
    dailyEarnings[date] += parseFloat(commit.reward_amount || 0);
  });
  
  // Generate daily trends for last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last7Days.push({
      date: dateStr,
      amount: Math.round(dailyEarnings[dateStr] || 0)
    });
  }
  trends.daily = last7Days;
  
  // Generate weekly trends (simplified)
  const weeklyData = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekEarnings = commits
      .filter(commit => {
        const commitDate = new Date(commit.commit_timestamp);
        return commitDate >= weekStart && commitDate <= weekEnd;
      })
      .reduce((sum, commit) => sum + parseFloat(commit.reward_amount || 0), 0);
    
    weeklyData.push({
      week: `Week ${4 - i}`,
      amount: Math.round(weekEarnings)
    });
  }
  trends.weekly = weeklyData;
  
  // Generate monthly trends (simplified)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = [];
  for (let i = 2; i >= 0; i--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - i);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    
    const monthEarnings = commits
      .filter(commit => {
        const commitDate = new Date(commit.commit_timestamp);
        return commitDate.getMonth() === month && commitDate.getFullYear() === year;
      })
      .reduce((sum, commit) => sum + parseFloat(commit.reward_amount || 0), 0);
    
    monthlyData.push({
      month: monthNames[month],
      amount: Math.round(monthEarnings)
    });
  }
  trends.monthly = monthlyData;
  
  return trends;
}

function calculateConsistencyScore(commits, totalDays) {
  if (commits.length === 0) return 0;
  
  // Group commits by day
  const dailyCommits = {};
  commits.forEach(commit => {
    const date = new Date(commit.commit_timestamp).toISOString().split('T')[0];
    dailyCommits[date] = (dailyCommits[date] || 0) + 1;
  });
  
  const activeDays = Object.keys(dailyCommits).length;
  const activityRatio = activeDays / totalDays;
  
  // Calculate standard deviation of daily commit counts
  const commitCounts = Object.values(dailyCommits);
  const avgCommitsPerActiveDay = commitCounts.reduce((sum, count) => sum + count, 0) / commitCounts.length;
  const variance = commitCounts.reduce((sum, count) => sum + Math.pow(count - avgCommitsPerActiveDay, 2), 0) / commitCounts.length;
  const stdDev = Math.sqrt(variance);
  
  // Consistency score: higher activity ratio and lower variance = higher score
  const consistencyScore = (activityRatio * 70) + Math.max(0, 30 - (stdDev * 5));
  
  return Math.min(100, Math.max(0, consistencyScore));
}

function calculateActiveDays(commits) {
  const uniqueDays = new Set();
  commits.forEach(commit => {
    const date = new Date(commit.commit_timestamp).toISOString().split('T')[0];
    uniqueDays.add(date);
  });
  return uniqueDays.size;
}

function generateAchievements(user, commits, qualityScore, consistencyScore) {
  const achievements = [];
  
  if (commits.length >= 100) {
    achievements.push({
      name: 'Century Committer',
      description: 'Made 100+ commits in this timeframe',
      dateEarned: new Date().toISOString().split('T')[0],
      rarity: 'rare'
    });
  }
  
  if (qualityScore >= 85) {
    achievements.push({
      name: 'Quality Coder',
      description: 'Maintained high code quality score',
      dateEarned: new Date().toISOString().split('T')[0],
      rarity: 'epic'
    });
  }
  
  if (consistencyScore >= 90) {
    achievements.push({
      name: 'Consistency Master',
      description: 'Demonstrated excellent commit consistency',
      dateEarned: new Date().toISOString().split('T')[0],
      rarity: 'legendary'
    });
  }
  
  if ((user.current_streak_days || 0) >= 30) {
    achievements.push({
      name: 'Monthly Streak',
      description: 'Maintained a 30+ day commit streak',
      dateEarned: new Date().toISOString().split('T')[0],
      rarity: 'epic'
    });
  }
  
  return achievements;
}

export default router;