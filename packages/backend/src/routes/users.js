import express from 'express';
import { getPool } from '../services/database.js';
import { farcasterService } from '../services/farcaster.js';

const router = express.Router();

// Get all users (basic endpoint)
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        farcaster_fid,
        farcaster_username,
        github_username,
        display_name,
        membership_status,
        total_abc_earned,
        total_commits,
        created_at
      FROM users 
      ORDER BY total_abc_earned DESC, total_commits DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    res.json({
      users: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get global stats
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    
    // Count total developers (all registered users)
    const totalDevsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users
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
      totalDevelopers: parseInt(totalDevsResult.rows[0].count),
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
    
    // Get user info including membership status
    const userResult = await pool.query(`
      SELECT 
        u.farcaster_fid,
        u.farcaster_username,
        u.github_username,
        u.wallet_address,
        u.verified_at,
        u.created_at,
        u.membership_status,
        u.membership_paid_at,
        u.membership_tx_hash,
        u.membership_amount
      FROM users u
      WHERE u.farcaster_fid = $1
    `, [fid]);
    
    if (userResult.rows.length === 0) {
      return res.json({
        linked: false,
        user: null,
        stats: null
      });
    }
    
    const user = userResult.rows[0];
    const isLinked = !!user.github_username && !!user.verified_at;
    
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
        LEFT JOIN commits c ON u.id = c.user_id
        WHERE u.farcaster_fid = $1
        GROUP BY u.id
      `, [fid]);
      
      stats = statsResult.rows[0] || {
        total_commits: 0,
        total_rewards: 0,
        commits_today: 0,
        rewards_today: 0
      };
    }
    
    // Try to get Farcaster avatar (non-blocking)
    let avatar_url = null;
    try {
      const farcasterUser = await farcasterService.getUserByFid(fid);
      avatar_url = farcasterUser?.pfp_url || null;
    } catch (error) {
      console.log(`⚠️ Could not fetch avatar for FID ${fid}:`, error.message);
    }

    // Get ETH rewards from staking if user has wallet
    let eth_rewards = { earned: 0, pending: 0 };
    if (user.wallet_address) {
      try {
        const pool = getPool();
        // Query staker_positions table for ETH rewards
        const ethResult = await pool.query(`
          SELECT 
            COALESCE(rewards_earned, 0) as total_eth_earned,
            COALESCE(pending_rewards, 0) as pending_eth_rewards
          FROM staker_positions 
          WHERE LOWER(wallet_address) = $1 AND is_active = true
        `, [user.wallet_address.toLowerCase()]);
        
        if (ethResult.rows.length > 0) {
          eth_rewards.earned = parseFloat(ethResult.rows[0].total_eth_earned || 0);
          eth_rewards.pending = parseFloat(ethResult.rows[0].pending_eth_rewards || 0);
        }
      } catch (error) {
        console.log(`⚠️ Could not fetch ETH rewards for ${user.wallet_address}:`, error.message);
      }
    }

    res.json({
      linked: isLinked,
      membership_tx_hash: user.membership_tx_hash,
      membership_status: user.membership_status,
      membership_paid_at: user.membership_paid_at,
      user: {
        farcaster_fid: user.farcaster_fid,
        farcaster_username: user.farcaster_username,
        github_username: user.github_username,
        has_wallet: !!user.wallet_address,
        verified_at: user.verified_at,
        avatar_url,
        wallet_address: user.wallet_address
      },
      stats,
      eth_rewards
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
      JOIN users u ON c.user_id = u.id
      WHERE u.farcaster_fid = $1
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
        LEFT JOIN commits c ON u.id = c.user_id AND c.processed_at >= CURRENT_DATE
        WHERE u.verified_at IS NOT NULL
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
        LEFT JOIN commits c ON u.id = c.user_id AND c.processed_at >= CURRENT_DATE - INTERVAL '7 days'
        WHERE u.verified_at IS NOT NULL
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
        LEFT JOIN commits c ON u.id = c.user_id
        WHERE u.verified_at IS NOT NULL
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

// Debug endpoint to check user's full record (temporary)
router.get('/:fid/debug', async (req, res) => {
  const { fid } = req.params;
  
  try {
    const pool = getPool();
    
    // Get complete user record
    const userResult = await pool.query(`
      SELECT * FROM users WHERE farcaster_fid = $1
    `, [fid]);
    
    if (userResult.rows.length === 0) {
      return res.json({ error: 'User not found' });
    }
    
    // Get membership records
    const membershipResult = await pool.query(`
      SELECT * FROM memberships WHERE user_id = $1
    `, [userResult.rows[0].id]);
    
    res.json({
      user_record: userResult.rows[0],
      membership_records: membershipResult.rows
    });
    
  } catch (error) {
    console.error('Debug query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual payment processing endpoint (temporary)
router.post('/:fid/process-payment', async (req, res) => {
  const { fid } = req.params;
  const { txHash } = req.body;
  
  if (!txHash) {
    return res.status(400).json({ error: 'Transaction hash required' });
  }
  
  try {
    const { PaymentMonitor } = await import('../services/payment-monitor.js');
    const monitor = new PaymentMonitor();
    
    // Get transaction details
    const { ethers } = await import('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Process the payment transaction
    const result = await monitor.processPaymentTransaction(tx);
    
    res.json({
      success: true,
      message: 'Payment processed manually',
      transaction: txHash,
      result: result
    });
    
  } catch (error) {
    console.error('Manual payment processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user notification settings
router.get('/:fid/settings', async (req, res) => {
  const { fid } = req.params;
  
  try {
    const pool = getPool();
    
    const userResult = await pool.query(`
      SELECT notification_settings
      FROM users 
      WHERE farcaster_fid = $1
    `, [fid]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      notification_settings: userResult.rows[0].notification_settings || {
        commit_casts: { enabled: true, tag_me: true, include_repo_name: true, include_commit_message: true, max_message_length: 100 },
        daily_limit_casts: { enabled: true, tag_me: true, custom_message: null },
        welcome_casts: { enabled: true, tag_me: true, custom_message: null },
        privacy: { show_github_username: true, show_real_name: false }
      }
    });
    
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ error: 'Failed to get user settings' });
  }
});

// Update user notification settings
router.put('/:fid/settings', async (req, res) => {
  const { fid } = req.params;
  const { notification_settings } = req.body;
  
  if (!notification_settings) {
    return res.status(400).json({ error: 'notification_settings required' });
  }
  
  try {
    const pool = getPool();
    
    // Get current settings first
    const currentResult = await pool.query(`
      SELECT notification_settings
      FROM users 
      WHERE farcaster_fid = $1
    `, [fid]);
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Merge with existing settings (only update provided fields)
    const currentSettings = currentResult.rows[0].notification_settings || {};
    const updatedSettings = {
      commit_casts: { ...currentSettings.commit_casts, ...notification_settings.commit_casts },
      daily_limit_casts: { ...currentSettings.daily_limit_casts, ...notification_settings.daily_limit_casts },
      welcome_casts: { ...currentSettings.welcome_casts, ...notification_settings.welcome_casts },
      privacy: { ...currentSettings.privacy, ...notification_settings.privacy }
    };
    
    // Update in database
    await pool.query(`
      UPDATE users 
      SET notification_settings = $1, updated_at = NOW()
      WHERE farcaster_fid = $2
    `, [JSON.stringify(updatedSettings), fid]);
    
    res.json({
      success: true,
      notification_settings: updatedSettings
    });
    
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Roster endpoint - get all active developers with pagination
router.get('/roster', async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    filter = 'all', // 'all', 'active', 'inactive'
    sort = 'commits' // 'commits', 'rewards', 'joined'
  } = req.query;
  
  try {
    const pool = getPool();
    const offset = (page - 1) * limit;
    
    // For now, show any users with a GitHub username (remove verified_at requirement for testing)
    let whereClause = 'WHERE u.github_username IS NOT NULL';
    let orderByClause = 'ORDER BY total_commits DESC, u.created_at DESC';
    
    // Apply filters
    if (filter === 'active') {
      // Active = has commits in last 30 days
      whereClause += ' AND u.last_commit_at >= NOW() - INTERVAL \'30 days\'';
    } else if (filter === 'inactive') {
      // Inactive = no commits in last 30 days OR no commits at all
      whereClause += ' AND (u.last_commit_at IS NULL OR u.last_commit_at < NOW() - INTERVAL \'30 days\')';
    }
    
    // Apply sorting
    if (sort === 'rewards') {
      orderByClause = 'ORDER BY total_rewards DESC, total_commits DESC, u.created_at DESC';
    } else if (sort === 'joined') {
      orderByClause = 'ORDER BY u.created_at DESC';
    }
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].total);
    
    // Get roster data
    const rosterQuery = `
      SELECT 
        u.id,
        u.farcaster_username,
        u.github_username,
        COALESCE(u.created_at, NOW()) as created_at,
        u.last_commit_at,
        COALESCE(u.total_commits, 0) as total_commits,
        COALESCE(u.total_rewards_earned, 0)::numeric as total_rewards,
        u.membership_status,
        CASE 
          WHEN u.last_commit_at >= NOW() - INTERVAL '30 days' THEN true
          WHEN COALESCE(u.total_commits, 0) > 0 AND u.last_commit_at < NOW() - INTERVAL '30 days' THEN false
          WHEN COALESCE(u.total_commits, 0) = 0 THEN false
          ELSE false
        END as is_active
      FROM users u
      ${whereClause}
      ${orderByClause}
      LIMIT $1 OFFSET $2
    `;
    
    const rosterResult = await pool.query(rosterQuery, [limit, offset]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    res.json({
      developers: rosterResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit: parseInt(limit)
      },
      filters: {
        activeFilter: filter,
        sortBy: sort
      }
    });
    
  } catch (error) {
    console.error('Error fetching roster:', error);
    res.status(500).json({ error: 'Failed to fetch roster data' });
  }
});

// Get user's FID by wallet address (for frontend integration)
router.get('/lookup/wallet/:address', async (req, res) => {
  const { address } = req.params;
  
  try {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT farcaster_fid, farcaster_username, github_username
      FROM users 
      WHERE LOWER(wallet_address) = $1
    `, [address.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      farcaster_fid: result.rows[0].farcaster_fid,
      farcaster_username: result.rows[0].farcaster_username,
      github_username: result.rows[0].github_username
    });
    
  } catch (error) {
    console.error('Error looking up user by wallet:', error);
    res.status(500).json({ error: 'Failed to lookup user' });
  }
});

export default router;