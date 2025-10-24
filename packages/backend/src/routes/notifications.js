import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * Notifications API Routes
 * 
 * Provides real-time notifications for user activity and system events
 */

// Test route to verify mounting
router.get('/test', (req, res) => {
  res.json({ 
    status: 'notifications routes are working', 
    timestamp: new Date().toISOString(),
    manager: 'NotificationsAPI'
  });
});

/**
 * GET /api/notifications/:walletAddress?since=timestamp&limit=20
 * Returns notifications for a specific user
 */
router.get('/:walletAddress', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const since = req.query.since; // ISO timestamp for polling
    const limit = parseInt(req.query.limit) || 20;
    
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

    // Generate notifications based on recent user activity
    const notifications = await generateUserNotifications(walletAddress, since, limit);
    
    res.json({
      notifications,
      count: notifications.length,
      limit,
      walletAddress,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * POST /api/notifications/:walletAddress/:notificationId/read
 * Marks a notification as read
 */
router.post('/:walletAddress/:notificationId/read', async (req, res) => {
  try {
    const { walletAddress, notificationId } = req.params;
    
    if (!walletAddress || !notificationId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // For now, just return success (could implement actual read tracking in database)
    res.json({
      success: true,
      notificationId,
      walletAddress,
      markedAsRead: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * POST /api/notifications/:walletAddress/mark-all-read
 * Marks all notifications as read for a user
 */
router.post('/:walletAddress/mark-all-read', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Missing wallet address' });
    }

    // For now, just return success (could implement actual read tracking in database)
    res.json({
      success: true,
      walletAddress,
      markedCount: 0, // Placeholder
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Helper function to generate user notifications
async function generateUserNotifications(walletAddress, since, limit) {
  const pool = getPool();
  const notifications = [];
  
  try {
    // Get user profile
    const userResult = await pool.query(`
      SELECT id, github_username, total_commits, total_rewards_earned, current_streak_days
      FROM users 
      WHERE wallet_address = $1
    `, [walletAddress]);
    
    if (userResult.rows.length === 0) {
      return []; // User not found
    }
    
    const user = userResult.rows[0];
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    // Get recent commits for commit reward notifications
    const recentCommits = await pool.query(`
      SELECT id, commit_message, reward_amount, created_at, repository_name
      FROM user_commits 
      WHERE user_id = $1 AND created_at > $2
      ORDER BY created_at DESC
      LIMIT $3
    `, [user.id, sinceDate, Math.min(limit, 10)]);
    
    // Generate commit reward notifications
    recentCommits.rows.forEach(commit => {
      const reward = parseFloat(commit.reward_amount || 0);
      if (reward > 0) {
        notifications.push({
          id: `commit-reward-${commit.id}`,
          type: 'commit_reward',
          title: 'ABC Tokens Earned!',
          message: `You earned ${(reward / 1000000).toFixed(2)}M ABC tokens for your commit to ${commit.repository_name}`,
          amount: `${(reward / 1000000).toFixed(2)}M ABC`,
          timestamp: commit.created_at,
          isRead: false,
          actionUrl: '/developers',
          actionText: 'View Earnings',
          icon: '💰',
          priority: reward > 100000 ? 'high' : 'medium'
        });
      }
    });
    
    // Generate milestone notifications
    if (user.total_commits % 50 === 0 && user.total_commits > 0) {
      notifications.push({
        id: `milestone-commits-${user.total_commits}`,
        type: 'milestone',
        title: 'Commit Milestone Reached!',
        message: `Congratulations! You've reached ${user.total_commits} total commits. Keep up the great work!`,
        timestamp: new Date(),
        isRead: false,
        actionUrl: '/developers',
        actionText: 'View Stats',
        icon: '🎉',
        priority: 'medium'
      });
    }
    
    // Generate streak notifications
    if (user.current_streak_days >= 7 && user.current_streak_days % 7 === 0) {
      notifications.push({
        id: `streak-${user.current_streak_days}`,
        type: 'achievement',
        title: 'Commit Streak Achievement!',
        message: `Amazing! You're on a ${user.current_streak_days}-day commit streak. Consistency is key to maximizing your earnings!`,
        timestamp: new Date(),
        isRead: false,
        actionUrl: '/developers',
        actionText: 'Keep Going',
        icon: '🔥',
        priority: 'high'
      });
    }
    
    // Generate staking notifications (if user has staking activity)
    // TODO: Add staking-related notifications when staking activity tracking is available
    
    // Generate system notifications for new users
    if (user.total_commits < 5) {
      notifications.push({
        id: `welcome-${user.id}`,
        type: 'system',
        title: 'Welcome to ABC DAO!',
        message: 'Start making commits to your registered repositories to earn ABC tokens. Each quality commit can earn you thousands of tokens!',
        timestamp: new Date(),
        isRead: false,
        actionUrl: '/developers',
        actionText: 'Get Started',
        icon: '👋',
        priority: 'medium'
      });
    }
    
    // Sort by timestamp (most recent first) and limit
    return notifications
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
      .map(notification => ({
        ...notification,
        timestamp: notification.timestamp.toISOString()
      }));
    
  } catch (error) {
    console.error('Error generating notifications:', error);
    return [];
  }
}

export default router;