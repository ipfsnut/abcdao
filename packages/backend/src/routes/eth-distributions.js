import express from 'express';
import { ethers } from 'ethers';
import { getPool } from '../services/database.js';

const router = express.Router();

// Test route to verify mounting
router.get('/test', (req, res) => {
  res.json({ status: 'eth-distributions routes are working', timestamp: new Date().toISOString() });
});

// Get ETH distribution history
router.get('/history', async (req, res) => {
  try {
    const pool = getPool();
    
    // Get distributions from database
    const result = await pool.query(`
      SELECT 
        id,
        transaction_hash,
        block_number,
        timestamp,
        eth_amount,
        total_staked_at_time,
        stakers_count,
        eth_price_usd,
        calculated_apy,
        created_at
      FROM eth_distributions 
      ORDER BY timestamp DESC 
      LIMIT 50
    `);

    const distributions = result.rows.map(row => ({
      id: row.transaction_hash,
      timestamp: new Date(row.timestamp).getTime(),
      ethAmount: parseFloat(row.eth_amount),
      totalStaked: parseFloat(row.total_staked_at_time),
      stakersCount: row.stakers_count,
      apy: parseFloat(row.calculated_apy || 0),
      ethPrice: parseFloat(row.eth_price_usd),
      transactionHash: row.transaction_hash,
      blockNumber: row.block_number
    }));

    res.json(distributions);

  } catch (error) {
    console.error('Error fetching ETH distribution history:', error);
    res.status(500).json({ error: 'Failed to fetch distribution history' });
  }
});

// Record a new ETH distribution (called by distribution cron)
router.post('/record', async (req, res) => {
  const { transactionHash, ethAmount, totalStaked, stakersCount } = req.body;

  if (!transactionHash || !ethAmount) {
    return res.status(400).json({ error: 'Transaction hash and ETH amount required' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    const pool = getPool();

    // Get transaction details
    const tx = await provider.getTransaction(transactionHash);
    const receipt = await provider.getTransactionReceipt(transactionHash);
    const block = await provider.getBlock(receipt.blockNumber);

    if (!tx || !receipt || !block) {
      return res.status(400).json({ error: 'Invalid transaction hash' });
    }

    // Get current ETH price
    let ethPrice = 3200; // Fallback
    try {
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const priceData = await priceResponse.json();
      ethPrice = priceData.ethereum?.usd || 3200;
    } catch (e) {
      console.warn('Could not fetch ETH price, using fallback');
    }

    // Calculate APY
    const weeklyEthPerABC = ethAmount / (totalStaked || 711483264);
    const abcPrice = 0.0000123; // Estimate
    const weeklyReturn = (weeklyEthPerABC * ethPrice) / abcPrice;
    const calculatedAPY = weeklyReturn * 52 * 100;

    // Check if already recorded
    const existing = await pool.query(
      'SELECT id FROM eth_distributions WHERE transaction_hash = $1',
      [transactionHash]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Distribution already recorded' });
    }

    // Insert new distribution record
    const insertResult = await pool.query(`
      INSERT INTO eth_distributions (
        transaction_hash,
        block_number,
        timestamp,
        eth_amount,
        total_staked_at_time,
        stakers_count,
        eth_price_usd,
        calculated_apy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      transactionHash,
      receipt.blockNumber,
      new Date(block.timestamp * 1000),
      ethAmount,
      totalStaked || 711483264,
      stakersCount || 15,
      ethPrice,
      calculatedAPY
    ]);

    console.log(`✅ Recorded ETH distribution: ${ethAmount} ETH to staking contract`);

    res.json({
      success: true,
      distributionId: insertResult.rows[0].id,
      ethAmount,
      calculatedAPY,
      transactionHash
    });

  } catch (error) {
    console.error('Error recording ETH distribution:', error);
    res.status(500).json({ error: 'Failed to record distribution' });
  }
});

// Get distribution statistics
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_distributions,
        COALESCE(SUM(eth_amount), 0) as total_eth_distributed,
        COALESCE(AVG(calculated_apy), 0) as average_apy,
        MAX(timestamp) as last_distribution_time,
        COALESCE(AVG(CASE WHEN timestamp > NOW() - INTERVAL '30 days' THEN calculated_apy END), 0) as apy_30d_avg
      FROM eth_distributions
    `);

    const stats = statsResult.rows[0];

    res.json({
      totalDistributions: parseInt(stats.total_distributions),
      totalETHDistributed: parseFloat(stats.total_eth_distributed),
      averageAPY: parseFloat(stats.average_apy),
      lastDistribution: stats.last_distribution_time,
      apy30DayAverage: parseFloat(stats.apy_30d_avg)
    });

  } catch (error) {
    console.error('Error fetching distribution stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;