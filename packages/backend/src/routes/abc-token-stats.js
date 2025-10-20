import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * Record an ABC token statistics update
 */
router.post('/record', async (req, res) => {
  try {
    const {
      protocolBalance,
      totalClaimedRewards,
      totalAllocatedRewards,
      totalPendingRewards,
      uniqueDevelopers,
      totalCommits,
      castHash,
      castUrl
    } = req.body;

    // Validate required fields
    if (protocolBalance === undefined || totalClaimedRewards === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: protocolBalance, totalClaimedRewards' 
      });
    }

    const pool = getPool();
    
    // Create abc_token_stats_updates table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS abc_token_stats_updates (
        id SERIAL PRIMARY KEY,
        update_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        protocol_balance DECIMAL(30, 6) NOT NULL,
        total_claimed_rewards DECIMAL(30, 6) NOT NULL,
        total_allocated_rewards DECIMAL(30, 6) NOT NULL,
        total_pending_rewards DECIMAL(30, 6) NOT NULL,
        unique_developers INTEGER NOT NULL,
        total_commits INTEGER NOT NULL,
        cast_hash VARCHAR(66),
        cast_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Insert the stats record
    const result = await pool.query(`
      INSERT INTO abc_token_stats_updates (
        protocol_balance, 
        total_claimed_rewards, 
        total_allocated_rewards,
        total_pending_rewards,
        unique_developers,
        total_commits,
        cast_hash,
        cast_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      protocolBalance,
      totalClaimedRewards,
      totalAllocatedRewards || 0,
      totalPendingRewards || 0,
      uniqueDevelopers || 0,
      totalCommits || 0,
      castHash || null,
      castUrl || null
    ]);

    console.log(`📝 Recorded ABC token stats update: ${protocolBalance} ABC protocol balance, ${totalClaimedRewards} ABC claimed rewards`);

    res.json({
      success: true,
      message: 'ABC token stats update recorded successfully',
      statsUpdate: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error recording ABC token stats update:', error);
    
    res.status(500).json({ 
      error: 'Failed to record stats update',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get ABC token statistics history
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    
    const pool = getPool();
    
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'abc_token_stats_updates'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        statsUpdates: [],
        pagination: {
          total: 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        }
      });
    }
    
    const query = `
      SELECT * FROM abc_token_stats_updates
      ORDER BY update_date DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [parseInt(limit), parseInt(offset)]);
    
    // Get total count for pagination
    const countResult = await pool.query('SELECT COUNT(*) FROM abc_token_stats_updates');
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      statsUpdates: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching ABC token stats history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get ABC token statistics summary
 */
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'abc_token_stats_updates'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        totalUpdates: 0,
        latestProtocolBalance: '0',
        latestTotalClaimed: '0',
        latestUpdate: null,
        averageProtocolBalance: '0',
        totalDevelopers: 0,
        totalCommits: 0
      });
    }
    
    // Get comprehensive statistics
    const stats = await pool.query(`
      WITH latest_stats AS (
        SELECT * FROM abc_token_stats_updates 
        ORDER BY update_date DESC 
        LIMIT 1
      )
      SELECT 
        (SELECT COUNT(*) FROM abc_token_stats_updates) as total_updates,
        (SELECT protocol_balance FROM latest_stats) as latest_protocol_balance,
        (SELECT total_claimed_rewards FROM latest_stats) as latest_total_claimed,
        (SELECT total_allocated_rewards FROM latest_stats) as latest_total_allocated,
        (SELECT total_pending_rewards FROM latest_stats) as latest_total_pending,
        (SELECT unique_developers FROM latest_stats) as latest_unique_developers,
        (SELECT total_commits FROM latest_stats) as latest_total_commits,
        (SELECT update_date FROM latest_stats) as latest_update,
        COALESCE(AVG(protocol_balance), 0) as avg_protocol_balance,
        COALESCE(MAX(protocol_balance), 0) as max_protocol_balance,
        COALESCE(MIN(protocol_balance), 0) as min_protocol_balance
      FROM abc_token_stats_updates
      WHERE update_date >= NOW() - INTERVAL '30 days'
    `);
    
    const result = stats.rows[0];
    
    res.json({
      totalUpdates: parseInt(result.total_updates),
      latestProtocolBalance: result.latest_protocol_balance?.toString() || '0',
      latestTotalClaimed: result.latest_total_claimed?.toString() || '0',
      latestTotalAllocated: result.latest_total_allocated?.toString() || '0',
      latestTotalPending: result.latest_total_pending?.toString() || '0',
      latestUniqueDevelopers: parseInt(result.latest_unique_developers || 0),
      latestTotalCommits: parseInt(result.latest_total_commits || 0),
      latestUpdate: result.latest_update,
      averageProtocolBalance: result.avg_protocol_balance?.toString() || '0',
      maxProtocolBalance: result.max_protocol_balance?.toString() || '0',
      minProtocolBalance: result.min_protocol_balance?.toString() || '0'
    });

  } catch (error) {
    console.error('❌ Error fetching ABC token stats summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats summary',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Manual trigger for ABC token stats update (admin only)
 */
router.post('/trigger', async (req, res) => {
  try {
    // Simple auth check
    const authKey = req.headers['x-admin-key'];
    if (authKey !== process.env.ADMIN_SECRET && req.body.adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if cron job is available
    if (!global.abcTokenStatsCron) {
      return res.status(503).json({ 
        error: 'ABC Token Statistics cron job not initialized' 
      });
    }

    // Trigger the job manually
    console.log('🚀 Manual trigger of ABC token statistics update requested');
    await global.abcTokenStatsCron.runNow();
    
    res.json({
      success: true,
      message: 'ABC token statistics update triggered successfully'
    });

  } catch (error) {
    console.error('❌ Error triggering ABC token stats update:', error);
    res.status(500).json({ 
      error: 'Failed to trigger stats update',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get next scheduled run time
 */
router.get('/schedule', async (req, res) => {
  try {
    if (!global.abcTokenStatsCron) {
      return res.status(503).json({ 
        error: 'ABC Token Statistics cron job not initialized' 
      });
    }

    const nextRun = global.abcTokenStatsCron.getNextRun();
    const isConfigured = global.abcTokenStatsCron.validateConfiguration();
    
    res.json({
      nextRun: nextRun.toISOString(),
      timeUntilNext: nextRun.getTime() - Date.now(),
      schedule: 'Daily at 2:00 PM UTC',
      isConfigured,
      currentTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting ABC token stats schedule:', error);
    res.status(500).json({ 
      error: 'Failed to get schedule information',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get current ABC token balances and stats (real-time)
 */
router.get('/current', async (req, res) => {
  try {
    // Check if cron job is available for real-time data
    if (!global.abcTokenStatsCron) {
      return res.status(503).json({ 
        error: 'ABC Token Statistics cron job not initialized' 
      });
    }

    // Get real-time data
    const protocolBalance = await global.abcTokenStatsCron.getProtocolABCBalance();
    const rewardStats = await global.abcTokenStatsCron.getTotalClaimedRewards();
    const treasuryContext = await global.abcTokenStatsCron.getTreasuryContext();
    
    res.json({
      protocolBalance: {
        raw: protocolBalance.raw.toString(),
        formatted: protocolBalance.formatted,
        decimals: protocolBalance.decimals
      },
      rewardStats: {
        totalClaimed: rewardStats.totalClaimed,
        totalAllocated: rewardStats.totalAllocated,
        totalPending: rewardStats.totalPending,
        totalDistributed: rewardStats.totalDistributed,
        uniqueDevelopers: rewardStats.uniqueDevelopers,
        totalCommits: rewardStats.totalCommits
      },
      treasuryContext: {
        totalSupply: treasuryContext.totalSupply,
        decimals: treasuryContext.decimals
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching current ABC token stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;