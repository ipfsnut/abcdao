import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * Record a Clanker rewards claim transaction
 */
router.post('/record', async (req, res) => {
  try {
    const {
      walletAddress,
      transactionHash,
      rewardsAmount,
      blockNumber,
      gasUsed,
      claimDate,
      lastClaimBefore
    } = req.body;

    // Validate required fields
    if (!walletAddress || !transactionHash || !rewardsAmount) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, transactionHash, rewardsAmount' 
      });
    }

    const pool = await getPool();
    
    // Create clanker_claims table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clanker_claims (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        transaction_hash VARCHAR(66) UNIQUE NOT NULL,
        rewards_amount VARCHAR(50) NOT NULL,
        block_number INTEGER,
        gas_used VARCHAR(20),
        claim_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_claim_before TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Insert the claim record
    const result = await pool.query(`
      INSERT INTO clanker_claims (
        wallet_address, 
        transaction_hash, 
        rewards_amount, 
        block_number, 
        gas_used, 
        claim_date, 
        last_claim_before
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      walletAddress,
      transactionHash,
      rewardsAmount,
      blockNumber || null,
      gasUsed || null,
      claimDate || new Date().toISOString(),
      lastClaimBefore || null
    ]);

    console.log(`📝 Recorded Clanker claim: ${rewardsAmount} ETH - ${transactionHash}`);

    res.json({
      success: true,
      message: 'Clanker claim recorded successfully',
      claim: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error recording Clanker claim:', error);
    
    // Handle duplicate transaction hash
    if (error.code === '23505' && error.constraint === 'clanker_claims_transaction_hash_key') {
      return res.status(409).json({
        error: 'Claim already recorded for this transaction hash'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to record claim',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get Clanker claims history
 */
router.get('/history', async (req, res) => {
  try {
    const { wallet, limit = 50, offset = 0 } = req.query;
    
    const pool = await getPool();
    
    let query = 'SELECT * FROM clanker_claims';
    let params = [];
    
    if (wallet) {
      query += ' WHERE wallet_address = $1';
      params.push(wallet);
    }
    
    query += ' ORDER BY claim_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM clanker_claims';
    let countParams = [];
    
    if (wallet) {
      countQuery += ' WHERE wallet_address = $1';
      countParams.push(wallet);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      claims: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching Clanker claims history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch claims history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get Clanker claims statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clanker_claims'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        totalClaims: 0,
        totalRewards: '0',
        lastClaim: null,
        avgClaimAmount: '0',
        claimsThisWeek: 0,
        rewardsThisWeek: '0'
      });
    }
    
    // Get comprehensive statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_claims,
        COALESCE(SUM(CAST(rewards_amount AS DECIMAL)), 0) as total_rewards,
        MAX(claim_date) as last_claim,
        COALESCE(AVG(CAST(rewards_amount AS DECIMAL)), 0) as avg_claim_amount,
        COUNT(CASE WHEN claim_date >= NOW() - INTERVAL '7 days' THEN 1 END) as claims_this_week,
        COALESCE(SUM(CASE WHEN claim_date >= NOW() - INTERVAL '7 days' THEN CAST(rewards_amount AS DECIMAL) END), 0) as rewards_this_week
      FROM clanker_claims
    `);
    
    const result = stats.rows[0];
    
    res.json({
      totalClaims: parseInt(result.total_claims),
      totalRewards: result.total_rewards.toString(),
      lastClaim: result.last_claim,
      avgClaimAmount: result.avg_claim_amount.toString(),
      claimsThisWeek: parseInt(result.claims_this_week),
      rewardsThisWeek: result.rewards_this_week.toString()
    });

  } catch (error) {
    console.error('❌ Error fetching Clanker claims stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch claims statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Manual trigger for Clanker rewards check (admin only)
 */
router.post('/trigger', async (req, res) => {
  try {
    // Simple auth check
    const authKey = req.headers['x-admin-key'];
    if (authKey !== process.env.ADMIN_SECRET && req.body.adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if cron job is available
    if (!global.clankerRewardsCron) {
      return res.status(503).json({ 
        error: 'Clanker rewards cron job not initialized' 
      });
    }

    // Trigger the job manually
    console.log('🚀 Manual trigger of Clanker rewards check requested');
    await global.clankerRewardsCron.runNow();
    
    res.json({
      success: true,
      message: 'Clanker rewards check triggered successfully'
    });

  } catch (error) {
    console.error('❌ Error triggering Clanker rewards check:', error);
    res.status(500).json({ 
      error: 'Failed to trigger rewards check',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get next scheduled run time
 */
router.get('/schedule', async (req, res) => {
  try {
    if (!global.clankerRewardsCron) {
      return res.status(503).json({ 
        error: 'Clanker rewards cron job not initialized' 
      });
    }

    const nextRun = global.clankerRewardsCron.getNextRun();
    const isConfigured = global.clankerRewardsCron.validateConfiguration();
    
    res.json({
      nextRun: nextRun.toISOString(),
      timeUntilNext: nextRun.getTime() - Date.now(),
      schedule: 'Daily at 11:30 PM UTC',
      isConfigured,
      currentTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting Clanker rewards schedule:', error);
    res.status(500).json({ 
      error: 'Failed to get schedule information',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;