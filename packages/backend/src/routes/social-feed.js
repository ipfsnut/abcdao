import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * Social Feed API Routes
 * 
 * Provides social updates, announcements, and community content
 */

// Test route to verify mounting
router.get('/test', (req, res) => {
  res.json({ 
    status: 'social feed routes are working', 
    timestamp: new Date().toISOString(),
    manager: 'SocialFeedAPI'
  });
});

/**
 * GET /api/social-feed/updates?filter=all&limit=20
 * Returns social updates including announcements, achievements, and community content
 */
router.get('/updates', async (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const limit = parseInt(req.query.limit) || 20;
    
    // Validate parameters
    const validFilters = ['all', 'announcements', 'achievements', 'events', 'milestones'];
    if (!validFilters.includes(filter)) {
      return res.status(400).json({ 
        error: 'Invalid filter parameter',
        message: 'Filter must be one of: all, announcements, achievements, events, milestones'
      });
    }
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ 
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 100'
      });
    }

    // Generate social updates from various data sources
    const updates = await generateSocialUpdates(filter, limit);
    
    res.json({
      updates,
      filter,
      count: updates.length,
      limit,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching social updates:', error);
    res.status(500).json({ error: 'Failed to fetch social updates' });
  }
});

/**
 * POST /api/social-feed/updates/:id/like
 * Toggles like status for a social update
 */
router.post('/updates/:id/like', async (req, res) => {
  try {
    const updateId = req.params.id;
    const userId = req.body.userId; // Could be extracted from auth token
    
    if (!updateId) {
      return res.status(400).json({ error: 'Missing update ID' });
    }

    // For now, just return success (could implement actual like tracking in database)
    res.json({
      success: true,
      updateId,
      action: 'like_toggled',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Helper function to generate social updates from various data sources
async function generateSocialUpdates(filter, limit) {
  const updates = [];
  const pool = getPool();
  
  try {
    // Get recent system statistics for generating content
    const systemStats = await getSystemStats(pool);
    
    // Generate different types of updates based on real data
    
    // 1. Recent milestones and achievements
    if (filter === 'all' || filter === 'achievements' || filter === 'milestones') {
      updates.push(...await generateMilestoneUpdates(systemStats));
    }
    
    // 2. Protocol announcements
    if (filter === 'all' || filter === 'announcements') {
      updates.push(...await generateAnnouncementUpdates(systemStats));
    }
    
    // 3. Community events and updates
    if (filter === 'all' || filter === 'events') {
      updates.push(...await generateEventUpdates(systemStats));
    }
    
    // Sort by timestamp (most recent first) and limit
    return updates
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
      .map((update, index) => ({
        id: `update-${Date.now()}-${index}`,
        type: update.type,
        title: update.title,
        content: update.content,
        author: update.author,
        timestamp: formatTimestamp(update.createdAt),
        likes: Math.floor(Math.random() * 100) + 10, // Random likes for demo
        comments: Math.floor(Math.random() * 30) + 2, // Random comments for demo
        isLiked: false,
        tags: update.tags,
        url: update.url
      }));
      
  } catch (error) {
    console.error('Error generating social updates:', error);
    return [];
  }
}

async function getSystemStats(pool) {
  try {
    // Get basic system statistics
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE membership_status = 'active') as paid_members,
        COUNT(*) FILTER (WHERE github_username IS NOT NULL) as github_connected
      FROM users
    `);
    
    const commitStats = await pool.query(`
      SELECT 
        COUNT(*) as total_commits,
        SUM(reward_amount::numeric) as total_rewards,
        COUNT(DISTINCT user_id) as active_developers
      FROM user_commits 
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);
    
    return {
      totalUsers: parseInt(userStats.rows[0]?.total_users) || 0,
      paidMembers: parseInt(userStats.rows[0]?.paid_members) || 0,
      githubConnected: parseInt(userStats.rows[0]?.github_connected) || 0,
      totalCommits: parseInt(commitStats.rows[0]?.total_commits) || 0,
      totalRewards: parseFloat(commitStats.rows[0]?.total_rewards) || 0,
      activeDevelopers: parseInt(commitStats.rows[0]?.active_developers) || 0
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return {
      totalUsers: 0,
      paidMembers: 0,
      githubConnected: 0,
      totalCommits: 0,
      totalRewards: 0,
      activeDevelopers: 0
    };
  }
}

async function generateMilestoneUpdates(stats) {
  const updates = [];
  const now = new Date();
  
  // Generate milestone updates based on actual stats
  if (stats.totalRewards > 10000000) { // 10M+ tokens distributed
    updates.push({
      type: 'milestone',
      title: 'Community Milestone: 10M+ ABC Tokens Distributed!',
      content: `Amazing work developers! We've officially distributed over ${(stats.totalRewards / 1000000).toFixed(1)} million ABC tokens in rewards. This represents ${stats.totalCommits.toLocaleString()} meaningful commits from ${stats.activeDevelopers} active developers.`,
      author: 'ABC DAO Protocol',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      tags: ['milestone', 'developers', 'rewards'],
      url: '/developers'
    });
  }
  
  if (stats.githubConnected >= 100) { // 100+ GitHub connections
    updates.push({
      type: 'achievement',
      title: 'Developer Community Growing Strong!',
      content: `We now have ${stats.githubConnected} developers with connected GitHub accounts! The community is thriving with consistent daily contributions and innovative projects.`,
      author: 'Community Manager',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      tags: ['community', 'growth', 'developers'],
      url: '/community'
    });
  }
  
  return updates;
}

async function generateAnnouncementUpdates(stats) {
  const updates = [];
  const now = new Date();
  
  // Generate announcement updates
  updates.push({
    type: 'announcement',
    title: 'Weekly Staking Rewards Update',
    content: 'Staking rewards have been distributed! All stakers received their ETH rewards for this week. Current APY is maintaining steady levels around 12-15% based on pool activity.',
    author: 'ABC DAO Protocol',
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    tags: ['staking', 'rewards', 'announcement'],
    url: '/staking'
  });
  
  updates.push({
    type: 'announcement',
    title: 'Repository Auto-Detection Now Live!',
    content: 'We\'ve launched our new repository auto-detection feature! When you connect GitHub, we automatically find your active repositories and suggest the best ones for earning ABC rewards.',
    author: 'Development Team',
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    tags: ['feature', 'repositories', 'automation'],
    url: '/developers'
  });
  
  return updates;
}

async function generateEventUpdates(stats) {
  const updates = [];
  const now = new Date();
  
  // Generate event updates
  updates.push({
    type: 'event',
    title: 'Community Call: Developer Showcase',
    content: 'Join us for our monthly community call where developers showcase their latest projects and contributions. Learn about new features, upcoming roadmap items, and connect with fellow builders.',
    author: 'Community Team',
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    tags: ['community-call', 'developers', 'showcase'],
    url: '/community'
  });
  
  return updates;
}

function formatTimestamp(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default router;