import express from 'express';
import { stakingDataManager } from '../services/staking-data-manager.js';
import { stakingService } from '../services/staking-service.js';

const router = express.Router();

/**
 * Staking API Routes
 * 
 * Clean, domain-focused endpoints following the data architecture redesign.
 * All routes consume pre-computed data from the Staking Data Manager.
 */

// Test route to verify mounting
router.get('/test', (req, res) => {
  res.json({ 
    status: 'staking routes are working', 
    timestamp: new Date().toISOString(),
    manager: 'StakingDataManager'
  });
});

/**
 * GET /api/staking/overview
 * Returns current staking metrics and APY breakdown
 */
router.get('/overview', async (req, res) => {
  try {
    // Try new staking service first (supports subgraph + blockchain)
    const stakingOverview = await stakingService.getStakingOverview();
    
    // Get APY data from the original staking data manager (if available)
    let apyBreakdown = [];
    let currentAPY = 0;
    let rewardsPoolBalance = 0;
    
    try {
      const dataManagerOverview = await stakingDataManager.getStakingOverview();
      if (dataManagerOverview.currentSnapshot) {
        currentAPY = parseFloat(dataManagerOverview.currentSnapshot.current_apy) || 0;
        rewardsPoolBalance = parseFloat(dataManagerOverview.currentSnapshot.rewards_pool_balance) || 0;
        apyBreakdown = dataManagerOverview.apyBreakdown || [];
      }
    } catch (dataManagerError) {
      console.warn('APY data not available from data manager:', dataManagerError.message);
    }

    res.json({
      // Current staking metrics from new service
      totalStaked: stakingOverview.totalStaked,
      totalStakers: stakingOverview.totalStakers,
      totalRewardsDistributed: stakingOverview.totalRewardsDistributed,
      lastUpdated: stakingOverview.lastUpdated,
      
      // APY and rewards pool from data manager (when available)
      currentAPY,
      rewardsPoolBalance,
      
      // APY breakdown by period
      apyBreakdown: apyBreakdown.map(apy => ({
        period: apy.calculation_period,
        apy: parseFloat(apy.calculated_apy),
        calculatedAt: apy.calculation_time,
        calculationDetails: apy.calculation_details ? 
          (typeof apy.calculation_details === 'string' ? 
            JSON.parse(apy.calculation_details) : 
            apy.calculation_details) : null
      }))
    });

  } catch (error) {
    console.error('Error fetching staking overview:', error);
    res.status(500).json({ error: 'Failed to fetch staking overview' });
  }
});

/**
 * GET /api/staking/leaderboard
 * Returns staking leaderboard with top stakers
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    if (limit < 1 || limit > 1000) {
      return res.status(400).json({ 
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 1000'
      });
    }

    // Get active stakers from the staking service (uses subgraph if available)
    const activeStakers = await stakingService.getActiveStakers();
    
    // Get the authoritative total from the blockchain contract (same as overview)
    const stakingOverview = await stakingService.getStakingOverview();
    const authoritativeTotalStaked = stakingOverview.totalStaked;
    
    // Get unbonding data for market transparency
    const unbondingOverview = await stakingService.getUnbondingOverview();
    
    // Sort by current stake amount (descending) and paginate
    const sortedStakers = activeStakers
      .sort((a, b) => b.currentStake - a.currentStake)
      .slice(offset, offset + limit);

    // Format for frontend consumption
    const leaderboard = sortedStakers.map((staker, index) => ({
      rank: offset + index + 1,
      address: staker.address,
      currentStake: staker.currentStake,
      totalStaked: staker.totalStaked || staker.currentStake,
      totalUnstaked: staker.totalUnstaked || 0,
      totalRewardsClaimed: staker.totalRewardsClaimed || staker.totalEthEarned || 0,
      pendingRewards: staker.pendingEth || 0,
      firstStakeTime: staker.firstStakeTime,
      lastStakeTime: staker.lastStakeTime,
      lastUnstakeTime: staker.lastUnstakeTime || null,
      // Calculate staking percentage of authoritative total (not just sum of known stakers)
      percentageOfTotal: authoritativeTotalStaked > 0 ? 
        (staker.currentStake / authoritativeTotalStaked) * 100 : 0
    }));

    // Use authoritative total from blockchain contract for summary
    const knownStakersSum = activeStakers.reduce((sum, staker) => sum + staker.currentStake, 0);
    const averageStake = activeStakers.length > 0 ? knownStakersSum / activeStakers.length : 0;

    res.json({
      leaderboard,
      pagination: {
        limit,
        offset,
        total: activeStakers.length,
        hasMore: offset + limit < activeStakers.length
      },
      summary: {
        totalActiveStakers: activeStakers.length,
        totalCurrentStaked: authoritativeTotalStaked, // Use blockchain contract total
        averageStake,
        largestStake: activeStakers.length > 0 ? Math.max(...activeStakers.map(s => s.currentStake)) : 0,
        smallestStake: activeStakers.length > 0 ? Math.min(...activeStakers.map(s => s.currentStake)) : 0,
        // Add note about data completeness
        dataNote: knownStakersSum !== authoritativeTotalStaked ? 
          `Showing ${activeStakers.length} known stakers (${knownStakersSum.toFixed(0)} ABC). Total includes all on-chain stakers.` : 
          null
      },
      unbonding: {
        totalUnbonding: unbondingOverview.totalUnbonding,
        totalWithdrawable: unbondingOverview.totalWithdrawable,
        totalPendingSell: unbondingOverview.totalPendingSell,
        stakersWithUnbonding: unbondingOverview.stakersWithUnbonding
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching staking leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch staking leaderboard' });
  }
});

/**
 * GET /api/staking/history?days=30
 * Returns historical staking data
 */
router.get('/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    if (days < 1 || days > 365) {
      return res.status(400).json({ 
        error: 'Invalid days parameter',
        message: 'Days must be between 1 and 365'
      });
    }

    const history = await stakingDataManager.getHistoricalData(days);
    
    const formattedHistory = history.map(snapshot => ({
      timestamp: snapshot.snapshot_time,
      totalStaked: parseFloat(snapshot.total_staked),
      totalStakers: parseInt(snapshot.total_stakers),
      rewardsPoolBalance: parseFloat(snapshot.rewards_pool_balance),
      totalRewardsDistributed: parseFloat(snapshot.total_rewards_distributed),
      currentAPY: parseFloat(snapshot.current_apy)
    }));

    res.json({
      days,
      snapshots: formattedHistory,
      count: formattedHistory.length
    });

  } catch (error) {
    console.error('Error fetching staking history:', error);
    res.status(500).json({ error: 'Failed to fetch staking history' });
  }
});

/**
 * GET /api/staking/position/:wallet
 * Returns staking position for specific wallet
 */
router.get('/position/:wallet', async (req, res) => {
  try {
    const walletAddress = req.params.wallet;
    
    // Validate wallet address format
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format' 
      });
    }

    const position = await stakingDataManager.getStakerPosition(walletAddress);
    
    if (!position) {
      return res.json({
        walletAddress,
        stakedAmount: 0,
        rewardsEarned: 0,
        pendingRewards: 0,
        lastStakeTime: null,
        isActive: false,
        message: 'No staking position found'
      });
    }

    res.json({
      walletAddress: position.wallet_address,
      stakedAmount: parseFloat(position.staked_amount),
      rewardsEarned: parseFloat(position.rewards_earned),
      pendingRewards: parseFloat(position.pending_rewards),
      lastStakeTime: position.last_stake_time,
      lastRewardClaim: position.last_reward_claim,
      isActive: position.is_active,
      lastUpdated: position.updated_at
    });

  } catch (error) {
    console.error('Error fetching staking position:', error);
    res.status(500).json({ error: 'Failed to fetch staking position' });
  }
});

/**
 * GET /api/staking/apy/historical?period=30d&days=30
 * Returns historical APY calculations
 */
router.get('/apy/historical', async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const days = parseInt(req.query.days) || 30;
    
    // Validate period
    const validPeriods = ['24h', '7d', '30d'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ 
        error: 'Invalid period parameter',
        message: 'Period must be one of: 24h, 7d, 30d'
      });
    }
    
    if (days < 1 || days > 365) {
      return res.status(400).json({ 
        error: 'Invalid days parameter',
        message: 'Days must be between 1 and 365'
      });
    }

    const apyHistory = await stakingDataManager.getAPYHistory(period, days);
    
    const formattedHistory = apyHistory.map(calc => ({
      period: calc.calculation_period,
      apy: parseFloat(calc.calculated_apy),
      rewardsDistributed: parseFloat(calc.rewards_distributed),
      averageStaked: parseFloat(calc.average_staked),
      calculatedAt: calc.calculation_time,
      calculationDetails: calc.calculation_details ? 
        (typeof calc.calculation_details === 'string' ? 
          JSON.parse(calc.calculation_details) : 
          calc.calculation_details) : null
    }));

    res.json({
      period,
      days,
      calculations: formattedHistory,
      count: formattedHistory.length
    });

  } catch (error) {
    console.error('Error fetching APY history:', error);
    res.status(500).json({ error: 'Failed to fetch APY history' });
  }
});


/**
 * GET /api/staking/stats
 * Returns staking statistics and analytics
 */
router.get('/stats', async (req, res) => {
  try {
    const overview = await stakingDataManager.getStakingOverview();
    const freshness = await stakingDataManager.getDataFreshness();
    
    if (!overview.currentSnapshot) {
      return res.status(404).json({ 
        error: 'No staking statistics available' 
      });
    }

    const snapshot = overview.currentSnapshot;
    const apyBreakdown = overview.apyBreakdown;

    res.json({
      statistics: {
        totalStaked: parseFloat(snapshot.total_staked),
        totalStakers: parseInt(snapshot.total_stakers),
        rewardsPoolBalance: parseFloat(snapshot.rewards_pool_balance),
        totalRewardsDistributed: parseFloat(snapshot.total_rewards_distributed),
        currentAPY: parseFloat(snapshot.current_apy),
        lastUpdate: snapshot.snapshot_time
      },
      apyAnalytics: {
        daily: apyBreakdown.find(a => a.calculation_period === '24h')?.calculated_apy || 0,
        weekly: apyBreakdown.find(a => a.calculation_period === '7d')?.calculated_apy || 0,
        monthly: apyBreakdown.find(a => a.calculation_period === '30d')?.calculated_apy || 0
      },
      dataHealth: {
        domain: freshness?.domain || 'staking',
        isHealthy: freshness?.is_healthy || false,
        lastUpdate: freshness?.last_update,
        errorCount: freshness?.error_count || 0,
        lastError: freshness?.last_error
      }
    });

  } catch (error) {
    console.error('Error fetching staking stats:', error);
    res.status(500).json({ error: 'Failed to fetch staking statistics' });
  }
});

/**
 * GET /api/staking/unbonding
 * Returns aggregate unbonding data across all known stakers
 */
router.get('/unbonding', async (req, res) => {
  try {
    const unbondingData = await stakingService.getUnbondingOverview();
    
    res.json({
      unbonding: {
        totalUnbonding: unbondingData.totalUnbonding,
        totalWithdrawable: unbondingData.totalWithdrawable,
        totalPendingSell: unbondingData.totalPendingSell,
        stakersWithUnbonding: unbondingData.stakersWithUnbonding,
        lastUpdated: unbondingData.lastUpdated
      },
      marketImpact: {
        description: "Tokens that could potentially be sold",
        inUnbondingPeriod: unbondingData.totalUnbonding,
        readyToSell: unbondingData.totalWithdrawable
      }
    });

  } catch (error) {
    console.error('Error fetching unbonding overview:', error);
    res.status(500).json({ error: 'Failed to fetch unbonding overview' });
  }
});

/**
 * GET /api/staking/health
 * Returns data manager health status
 */
router.get('/health', async (req, res) => {
  try {
    const freshness = await stakingDataManager.getDataFreshness();
    const isHealthy = freshness?.is_healthy || false;
    const lastUpdate = freshness?.last_update;
    const timeSinceUpdate = lastUpdate ? Date.now() - new Date(lastUpdate).getTime() : null;
    
    // Consider data stale if it's more than 5 minutes old
    const isStale = timeSinceUpdate && timeSinceUpdate > 5 * 60 * 1000;
    
    res.json({
      status: isHealthy && !isStale ? 'healthy' : 'unhealthy',
      domain: 'staking',
      isHealthy,
      isStale,
      lastUpdate,
      timeSinceUpdateMs: timeSinceUpdate,
      errorCount: freshness?.error_count || 0,
      lastError: freshness?.last_error
    });

  } catch (error) {
    console.error('Error checking staking health:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to check staking health',
      message: error.message
    });
  }
});

export default router;