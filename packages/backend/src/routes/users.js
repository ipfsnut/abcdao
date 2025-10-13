import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

// Get global stats
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    
    // Count active developers (users with GitHub linked and verified)
    const activeDevsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE github_username IS NOT NULL 
      AND "verified-at" IS NOT NULL
    `);
    
    // Get total commits count
    const totalCommitsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM commits
    `);
    
    // Get total rewards distributed
    const totalRewardsResult = await pool.query(`
      SELECT COALESCE(SUM(reward_amount), 0) as total
      FROM commits 
      WHERE reward_amount IS NOT NULL
    `);
    
    res.json({
      activeDevelopers: parseInt(activeDevsResult.rows[0].count),
      totalCommits: parseInt(totalCommitsResult.rows[0].count),
      totalRewards: parseFloat(totalRewardsResult.rows[0].total)
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get user's link status and stats
router.get('/:fid/status', async (req, res) => {
  const { fid } = req.params;
  
  try {
    const pool = getPool();
    
    // Get user info
    const userResult = await pool.query(`
      SELECT 
        farcaster_fid,
        farcaster_username,
        github_username,
        wallet_address,
        "verified-at",
        "created-at"
      FROM users 
      WHERE "farcaster-fid" = $1
    `, [fid]);
    
    if (userResult.rows.length === 0) {
      return res.json({
        linked: false,
        user: null,
        stats: null
      });
    }
    
    const user = userResult.rows[0];
    const isLinked = !!user.github_username && !!user['verified-at'];
    
    let stats = null;
    
    if (isLinked) {
      // Get user stats
      const statsResult = await pool.query(`
        SELECT 
          COUNT(c.id) as total_commits,
          COALESCE(SUM(c.reward_amount), 0) as total_rewards,
          COUNT(CASE WHEN c.processed_at >= CURRENT_DATE THEN 1 END) as commits_today,
          COALESCE(SUM(CASE WHEN c.processed_at >= CURRENT_DATE THEN c.reward_amount ELSE 0 END), 0) as rewards_today
        FROM users u
        LEFT JOIN commits c ON u.id = c."user-id"
        WHERE u.\"farcaster-fid\" = $1
        GROUP BY u.id
      `, [fid]);
      
      stats = statsResult.rows[0] || {
        total_commits: 0,
        total_rewards: 0,
        commits_today: 0,
        rewards_today: 0
      };
    }
    
    res.json({
      linked: isLinked,
      user: {
        farcaster_fid: user.farcaster_fid,
        farcaster_username: user.farcaster_username,
        github_username: user.github_username,
        has_wallet: !!user.wallet_address,
        verified_at: user['verified-at']
      },
      stats
    });
    
  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({ error: 'Failed to get user status' });
  }
});

// Get user's recent commits
router.get('/:fid/commits', async (req, res) => {
  const { fid } = req.params;
  const { limit = 10, offset = 0 } = req.query;
  
  try {
    const pool = getPool();
    
    const commitsResult = await pool.query(`
      SELECT 
        c.commit_hash,
        c.repository,
        c.commit_message,
        c.commit_url,
        c.reward_amount,
        c.cast_url,
        c.processed_at,
        c.created_at
      FROM commits c
      JOIN users u ON c.\"user-id\" = u.id
      WHERE u.\"farcaster-fid\" = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `, [fid, limit, offset]);
    
    res.json({
      commits: commitsResult.rows,
      total: commitsResult.rows.length
    });
    
  } catch (error) {
    console.error('Error getting user commits:', error);
    res.status(500).json({ error: 'Failed to get commits' });
  }
});

// Update user's wallet address
router.post('/:fid/wallet', async (req, res) => {
  const { fid } = req.params;
  const { walletAddress } = req.body;
  
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }
  
  try {
    const pool = getPool();
    
    await pool.query(`
      UPDATE users 
      SET wallet_address = $1, updated_at = NOW()
      WHERE farcaster_fid = $2
    `, [walletAddress, fid]);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error updating wallet:', error);
    res.status(500).json({ error: 'Failed to update wallet' });
  }
});

// Leaderboard endpoint
router.get('/leaderboard', async (req, res) => {
  const { timeframe = 'all', limit = 20 } = req.query;
  
  try {
    const pool = getPool();
    
    let query;
    let params = [limit];
    
    if (timeframe === 'today') {
      query = `
        SELECT 
          u.farcaster_username,
          u.github_username,
          COUNT(c.id) as commits,
          COALESCE(SUM(c.reward_amount), 0) as total_rewards
        FROM users u
        LEFT JOIN commits c ON u.id = c."user-id" AND c.processed_at >= CURRENT_DATE
        WHERE u."verified-at" IS NOT NULL
        GROUP BY u.id, u.farcaster_username, u.github_username
        ORDER BY total_rewards DESC, commits DESC
        LIMIT $1
      `;
    } else if (timeframe === 'week') {
      query = `
        SELECT 
          u.farcaster_username,
          u.github_username,
          COUNT(c.id) as commits,
          COALESCE(SUM(c.reward_amount), 0) as total_rewards
        FROM users u
        LEFT JOIN commits c ON u.id = c."user-id" AND c.processed_at >= CURRENT_DATE - INTERVAL '7 days'
        WHERE u."verified-at" IS NOT NULL
        GROUP BY u.id, u.farcaster_username, u.github_username
        ORDER BY total_rewards DESC, commits DESC
        LIMIT $1
      `;
    } else {
      query = `
        SELECT 
          u.farcaster_username,
          u.github_username,
          COUNT(c.id) as commits,
          COALESCE(SUM(c.reward_amount), 0) as total_rewards
        FROM users u
        LEFT JOIN commits c ON u.id = c."user-id"
        WHERE u."verified-at" IS NOT NULL
        GROUP BY u.id, u.farcaster_username, u.github_username
        ORDER BY total_rewards DESC, commits DESC
        LIMIT $1
      `;
    }
    
    const leaderboardResult = await pool.query(query, params);
    
    res.json({
      timeframe,
      leaderboard: leaderboardResult.rows
    });
    
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router;