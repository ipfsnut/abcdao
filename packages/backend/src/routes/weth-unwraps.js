import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * Record a WETH unwrap transaction
 */
router.post('/record', async (req, res) => {
  try {
    const {
      walletAddress,
      transactionHash,
      wethAmount,
      ethReceived,
      blockNumber,
      gasUsed,
      unwrapDate,
      ethBalanceBefore,
      ethBalanceAfter
    } = req.body;

    // Validate required fields
    if (!walletAddress || !transactionHash || !wethAmount || !ethReceived) {
      return res.status(400).json({
        error: 'Missing required fields: walletAddress, transactionHash, wethAmount, ethReceived'
      });
    }

    const pool = getPool();
    
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weth_unwraps (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        transaction_hash VARCHAR(66) UNIQUE NOT NULL,
        weth_amount DECIMAL(36, 18) NOT NULL,
        eth_received DECIMAL(36, 18) NOT NULL,
        block_number BIGINT,
        gas_used BIGINT,
        unwrap_date TIMESTAMPTZ NOT NULL,
        eth_balance_before DECIMAL(36, 18),
        eth_balance_after DECIMAL(36, 18),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Insert unwrap record
    const result = await pool.query(`
      INSERT INTO weth_unwraps (
        wallet_address, transaction_hash, weth_amount, eth_received,
        block_number, gas_used, unwrap_date, eth_balance_before, eth_balance_after
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      walletAddress,
      transactionHash,
      wethAmount,
      ethReceived,
      blockNumber,
      gasUsed,
      unwrapDate,
      ethBalanceBefore,
      ethBalanceAfter
    ]);

    console.log(`✅ WETH unwrap recorded: ${transactionHash} (${wethAmount} WETH)`);

    res.json({
      success: true,
      id: result.rows[0].id,
      transactionHash
    });

  } catch (error) {
    console.error('❌ Error recording WETH unwrap:', error);
    
    if (error.code === '23505') { // Duplicate transaction hash
      res.status(409).json({
        error: 'Transaction already recorded',
        transactionHash: req.body.transactionHash
      });
    } else {
      res.status(500).json({
        error: 'Failed to record WETH unwrap',
        details: error.message
      });
    }
  }
});

/**
 * Get WETH unwrap history
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const pool = getPool();

    const result = await pool.query(`
      SELECT 
        id,
        wallet_address,
        transaction_hash,
        weth_amount,
        eth_received,
        block_number,
        gas_used,
        unwrap_date,
        eth_balance_before,
        eth_balance_after,
        created_at
      FROM weth_unwraps
      ORDER BY unwrap_date DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    const countResult = await pool.query('SELECT COUNT(*) FROM weth_unwraps');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      unwraps: result.rows,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('❌ Error fetching WETH unwrap history:', error);
    res.status(500).json({
      error: 'Failed to fetch unwrap history',
      details: error.message
    });
  }
});

/**
 * Get WETH unwrap statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_unwraps,
        SUM(weth_amount) as total_weth_unwrapped,
        SUM(eth_received) as total_eth_received,
        AVG(weth_amount) as avg_unwrap_amount,
        MAX(unwrap_date) as last_unwrap_date,
        MIN(unwrap_date) as first_unwrap_date
      FROM weth_unwraps
    `);

    const stats = result.rows[0];

    // Get recent activity (last 7 days)
    const recentResult = await pool.query(`
      SELECT 
        COUNT(*) as recent_unwraps,
        SUM(weth_amount) as recent_weth_unwrapped
      FROM weth_unwraps
      WHERE unwrap_date >= NOW() - INTERVAL '7 days'
    `);

    const recentStats = recentResult.rows[0];

    res.json({
      allTime: {
        totalUnwraps: parseInt(stats.total_unwraps),
        totalWethUnwrapped: stats.total_weth_unwrapped || '0',
        totalEthReceived: stats.total_eth_received || '0',
        avgUnwrapAmount: stats.avg_unwrap_amount || '0',
        firstUnwrap: stats.first_unwrap_date,
        lastUnwrap: stats.last_unwrap_date
      },
      recent: {
        unwrapsLast7Days: parseInt(recentStats.recent_unwraps),
        wethUnwrappedLast7Days: recentStats.recent_weth_unwrapped || '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching WETH unwrap stats:', error);
    res.status(500).json({
      error: 'Failed to fetch unwrap statistics',
      details: error.message
    });
  }
});

/**
 * Manually trigger WETH unwrap (admin only)
 */
router.post('/trigger', async (req, res) => {
  try {
    // Basic admin authentication
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if unwrap cron job is available
    const { WethUnwrapCron } = await import('../jobs/weth-unwrap-cron.js');
    
    if (!global.wethUnwrapCron) {
      return res.status(503).json({
        error: 'WETH unwrap cron job not initialized'
      });
    }

    // Trigger unwrap
    await global.wethUnwrapCron.runNow();

    res.json({
      success: true,
      message: 'WETH unwrap check triggered manually',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error triggering WETH unwrap:', error);
    res.status(500).json({
      error: 'Failed to trigger WETH unwrap',
      details: error.message
    });
  }
});

/**
 * Get next scheduled run times
 */
router.get('/schedule', async (req, res) => {
  try {
    if (!global.wethUnwrapCron) {
      return res.status(503).json({
        error: 'WETH unwrap cron job not initialized'
      });
    }

    const nextRuns = global.wethUnwrapCron.getNextRuns();

    res.json({
      schedule: 'Every 2 hours',
      nextRuns: nextRuns.map(run => run.toISOString()),
      timezone: 'UTC'
    });

  } catch (error) {
    console.error('❌ Error getting WETH unwrap schedule:', error);
    res.status(500).json({
      error: 'Failed to get schedule information',
      details: error.message
    });
  }
});

export default router;