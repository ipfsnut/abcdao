import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

// Get overall reward statistics
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(c.id) as total_commits,
        COALESCE(SUM(c.reward_amount), 0) as total_rewards_distributed,
        COUNT(CASE WHEN c.processed_at >= CURRENT_DATE THEN 1 END) as commits_today,
        COALESCE(SUM(CASE WHEN c.processed_at >= CURRENT_DATE THEN c.reward_amount ELSE 0 END), 0) as rewards_today
      FROM commits c
      JOIN users u ON c.user_id = u.id
      WHERE c.reward_amount IS NOT NULL
    `);
    
    const stats = statsResult.rows[0];
    
    res.json({
      totalUsers: parseInt(stats.total_users),
      totalCommits: parseInt(stats.total_commits),
      totalRewardsDistributed: parseFloat(stats.total_rewards_distributed),
      commitsToday: parseInt(stats.commits_today),
      rewardsToday: parseFloat(stats.rewards_today)
    });
    
  } catch (error) {
    console.error('Error getting reward stats:', error);
    res.status(500).json({ error: 'Failed to get reward stats' });
  }
});

// Get recent reward activity
router.get('/recent', async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    const pool = getPool();
    
    const recentResult = await pool.query(`
      SELECT 
        u.farcaster_username,
        u.github_username,
        c.repository,
        c.commit_message,
        c.reward_amount,
        c.cast_url,
        c.processed_at
      FROM commits c
      JOIN users u ON c.user_id = u.id
      WHERE c.reward_amount IS NOT NULL
      ORDER BY c.processed_at DESC
      LIMIT $1
    `, [limit]);
    
    res.json({
      recentRewards: recentResult.rows
    });
    
  } catch (error) {
    console.error('Error getting recent rewards:', error);
    res.status(500).json({ error: 'Failed to get recent rewards' });
  }
});

// Get daily reward statistics for charts
router.get('/daily-stats', async (req, res) => {
  const { days = 30 } = req.query;
  
  try {
    const pool = getPool();
    
    const dailyStatsResult = await pool.query(`
      SELECT 
        DATE(c.processed_at) as date,
        COUNT(c.id) as commits,
        COALESCE(SUM(c.reward_amount), 0) as total_rewards,
        COUNT(DISTINCT c.user_id) as unique_users
      FROM commits c
      WHERE c.processed_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
        AND c.reward_amount IS NOT NULL
      GROUP BY DATE(c.processed_at)
      ORDER BY date DESC
    `);
    
    res.json({
      dailyStats: dailyStatsResult.rows
    });
    
  } catch (error) {
    console.error('Error getting daily stats:', error);
    res.status(500).json({ error: 'Failed to get daily stats' });
  }
});

// Get repository statistics
router.get('/repositories', async (req, res) => {
  const { limit = 20 } = req.query;
  
  try {
    const pool = getPool();
    
    const repoStatsResult = await pool.query(`
      SELECT 
        c.repository,
        COUNT(c.id) as total_commits,
        COALESCE(SUM(c.reward_amount), 0) as total_rewards,
        COUNT(DISTINCT c.user_id) as unique_contributors
      FROM commits c
      WHERE c.reward_amount IS NOT NULL
      GROUP BY c.repository
      ORDER BY total_rewards DESC, total_commits DESC
      LIMIT $1
    `, [limit]);
    
    res.json({
      repositories: repoStatsResult.rows
    });
    
  } catch (error) {
    console.error('Error getting repository stats:', error);
    res.status(500).json({ error: 'Failed to get repository stats' });
  }
});

// Get user's rewards with PENDING/CLAIMABLE status
router.get('/user/:fid', async (req, res) => {
  const { fid } = req.params;
  
  try {
    const pool = getPool();
    
    // Get user's rewards grouped by status
    const rewardsResult = await pool.query(`
      SELECT 
        c.id,
        c.commit_hash,
        c.repository,
        c.commit_message,
        c.reward_amount,
        c.reward_status,
        c.cast_url,
        c.processed_at,
        c.created_at,
        c.contract_tx_hash,
        c.transferred_at
      FROM commits c
      JOIN users u ON c.user_id = u.id
      WHERE u.farcaster_fid = $1 
        AND c.reward_amount IS NOT NULL
      ORDER BY c.created_at DESC
    `, [fid]);
    
    // Group rewards by status
    const pendingRewards = rewardsResult.rows.filter(r => r.reward_status === 'pending');
    const claimableRewards = rewardsResult.rows.filter(r => r.reward_status === 'claimable');
    
    // Calculate totals
    const pendingTotal = pendingRewards.reduce((sum, r) => sum + parseFloat(r.reward_amount), 0);
    const claimableTotal = claimableRewards.reduce((sum, r) => sum + parseFloat(r.reward_amount), 0);
    
    res.json({
      summary: {
        totalPending: pendingTotal,
        totalClaimable: claimableTotal,
        pendingCount: pendingRewards.length,
        claimableCount: claimableRewards.length
      },
      rewards: {
        pending: pendingRewards.map(r => ({
          id: r.id,
          commitHash: r.commit_hash,
          repository: r.repository,
          message: r.commit_message,
          amount: parseFloat(r.reward_amount),
          processedAt: r.processed_at,
          castUrl: r.cast_url
        })),
        claimable: claimableRewards.map(r => ({
          id: r.id,
          commitHash: r.commit_hash,
          repository: r.repository,
          message: r.commit_message,
          amount: parseFloat(r.reward_amount),
          processedAt: r.processed_at,
          castUrl: r.cast_url,
          contractTxHash: r.contract_tx_hash,
          transferredAt: r.transferred_at
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting user rewards:', error);
    res.status(500).json({ error: 'Failed to get user rewards' });
  }
});

export default router;