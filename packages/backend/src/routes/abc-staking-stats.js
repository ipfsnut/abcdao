import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * Record an ABC staking statistics update
 */
router.post('/record', async (req, res) => {
  try {
    const {
      totalStaked,
      stakingRatio,
      currentApy,
      totalRewardsDistributed,
      rewardsPoolBalance,
      uniqueStakers,
      totalStakeActions,
      totalUnstakeActions,
      castHash,
      castUrl
    } = req.body;

    // Validate required fields
    if (totalStaked === undefined || stakingRatio === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: totalStaked, stakingRatio' 
      });
    }

    const pool = getPool();
    
    // Create abc_staking_stats_updates table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS abc_staking_stats_updates (
        id SERIAL PRIMARY KEY,
        update_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        total_staked DECIMAL(30, 6) NOT NULL,
        staking_ratio DECIMAL(5, 2) NOT NULL,
        current_apy DECIMAL(8, 4) NOT NULL,
        total_rewards_distributed DECIMAL(18, 6) NOT NULL,
        rewards_pool_balance DECIMAL(18, 6) NOT NULL,
        unique_stakers INTEGER NOT NULL,
        total_stake_actions INTEGER NOT NULL,
        total_unstake_actions INTEGER NOT NULL,
        cast_hash VARCHAR(66),
        cast_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Insert the stats record
    const result = await pool.query(`
      INSERT INTO abc_staking_stats_updates (
        total_staked,
        staking_ratio,
        current_apy,
        total_rewards_distributed,
        rewards_pool_balance,
        unique_stakers,
        total_stake_actions,
        total_unstake_actions,
        cast_hash,
        cast_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      totalStaked,
      stakingRatio,
      currentApy || 0,
      totalRewardsDistributed || 0,
      rewardsPoolBalance || 0,
      uniqueStakers || 0,
      totalStakeActions || 0,
      totalUnstakeActions || 0,
      castHash || null,
      castUrl || null
    ]);

    console.log(`📝 Recorded ABC staking stats update: ${totalStaked} ABC staked (${stakingRatio}%)`);

    res.json({
      success: true,
      message: 'ABC staking stats update recorded successfully',
      stakingStatsUpdate: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error recording ABC staking stats update:', error);
    
    res.status(500).json({ 
      error: 'Failed to record staking stats update',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get ABC staking statistics history
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    
    const pool = getPool();
    
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'abc_staking_stats_updates'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        stakingStatsUpdates: [],
        pagination: {
          total: 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        }
      });
    }
    
    const query = `
      SELECT * FROM abc_staking_stats_updates
      ORDER BY update_date DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [parseInt(limit), parseInt(offset)]);
    
    // Get total count for pagination
    const countResult = await pool.query('SELECT COUNT(*) FROM abc_staking_stats_updates');
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      stakingStatsUpdates: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching ABC staking stats history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch staking stats history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get ABC staking statistics summary
 */
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'abc_staking_stats_updates'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        totalUpdates: 0,
        latestTotalStaked: '0',
        latestStakingRatio: '0',
        latestAPY: '0',
        latestUpdate: null,
        averageStakingRatio: '0',
        maxStakingRatio: '0',
        uniqueStakers: 0
      });
    }
    
    // Get comprehensive statistics
    const stats = await pool.query(`
      WITH latest_stats AS (
        SELECT * FROM abc_staking_stats_updates 
        ORDER BY update_date DESC 
        LIMIT 1
      )
      SELECT 
        (SELECT COUNT(*) FROM abc_staking_stats_updates) as total_updates,
        (SELECT total_staked FROM latest_stats) as latest_total_staked,
        (SELECT staking_ratio FROM latest_stats) as latest_staking_ratio,
        (SELECT current_apy FROM latest_stats) as latest_apy,
        (SELECT total_rewards_distributed FROM latest_stats) as latest_total_rewards,
        (SELECT rewards_pool_balance FROM latest_stats) as latest_rewards_pool,
        (SELECT unique_stakers FROM latest_stats) as latest_unique_stakers,
        (SELECT update_date FROM latest_stats) as latest_update,
        COALESCE(AVG(staking_ratio), 0) as avg_staking_ratio,
        COALESCE(MAX(staking_ratio), 0) as max_staking_ratio,
        COALESCE(MIN(staking_ratio), 0) as min_staking_ratio
      FROM abc_staking_stats_updates
      WHERE update_date >= NOW() - INTERVAL '30 days'
    `);
    
    const result = stats.rows[0];
    
    res.json({
      totalUpdates: parseInt(result.total_updates),
      latestTotalStaked: result.latest_total_staked?.toString() || '0',
      latestStakingRatio: result.latest_staking_ratio?.toString() || '0',
      latestAPY: result.latest_apy?.toString() || '0',
      latestTotalRewards: result.latest_total_rewards?.toString() || '0',
      latestRewardsPool: result.latest_rewards_pool?.toString() || '0',
      latestUniqueStakers: parseInt(result.latest_unique_stakers || 0),
      latestUpdate: result.latest_update,
      averageStakingRatio: result.avg_staking_ratio?.toString() || '0',
      maxStakingRatio: result.max_staking_ratio?.toString() || '0',
      minStakingRatio: result.min_staking_ratio?.toString() || '0'
    });

  } catch (error) {
    console.error('❌ Error fetching ABC staking stats summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch staking stats summary',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Manual trigger for ABC staking stats update (admin only)
 */
router.post('/trigger', async (req, res) => {
  try {
    // Simple auth check
    const authKey = req.headers['x-admin-key'];
    if (authKey !== process.env.ADMIN_SECRET && req.body.adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if cron job is available
    if (!global.abcStakingStatsCron) {
      return res.status(503).json({ 
        error: 'ABC Staking Statistics cron job not initialized' 
      });
    }

    // Trigger the job manually
    console.log('🚀 Manual trigger of ABC staking statistics update requested');
    await global.abcStakingStatsCron.runNow();
    
    res.json({
      success: true,
      message: 'ABC staking statistics update triggered successfully'
    });

  } catch (error) {
    console.error('❌ Error triggering ABC staking stats update:', error);
    res.status(500).json({ 
      error: 'Failed to trigger staking stats update',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get next scheduled run time
 */
router.get('/schedule', async (req, res) => {
  try {
    if (!global.abcStakingStatsCron) {
      return res.status(503).json({ 
        error: 'ABC Staking Statistics cron job not initialized' 
      });
    }

    const nextRun = global.abcStakingStatsCron.getNextRun();
    const isConfigured = global.abcStakingStatsCron.validateConfiguration();
    
    res.json({
      nextRun: nextRun.toISOString(),
      timeUntilNext: nextRun.getTime() - Date.now(),
      schedule: 'Daily at 10:00 AM UTC',
      isConfigured,
      currentTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting ABC staking stats schedule:', error);
    res.status(500).json({ 
      error: 'Failed to get schedule information',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get current ABC staking data (real-time)
 */
router.get('/current', async (req, res) => {
  try {
    // Check if cron job is available for real-time data
    if (!global.abcStakingStatsCron) {
      return res.status(503).json({ 
        error: 'ABC Staking Statistics cron job not initialized' 
      });
    }

    // Get real-time data
    const blockchainData = await global.abcStakingStatsCron.getBlockchainStakingData();
    const dbMetrics = await global.abcStakingStatsCron.getDatabaseStakingMetrics();
    
    res.json({
      blockchain: {
        totalStaked: blockchainData.totalStaked,
        totalRewardsDistributed: blockchainData.totalRewardsDistributed,
        totalSupply: blockchainData.totalSupply,
        stakingRatio: blockchainData.stakingRatio
      },
      metrics: {
        currentAPY: dbMetrics.currentAPY,
        rewardsPoolBalance: dbMetrics.rewardsPoolBalance,
        uniqueStakers: dbMetrics.uniqueStakers,
        activityStats: dbMetrics.activityStats,
        lastUpdate: dbMetrics.lastUpdate
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching current ABC staking stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current staking stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;