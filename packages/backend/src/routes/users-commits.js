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

/**
 * GET /api/users-commits/profile/:identifier
 * Returns user profile by wallet address, FID, or GitHub username
 */
router.get('/profile/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    
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
        firstCommitAt: user.first_commit_at
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

export default router;