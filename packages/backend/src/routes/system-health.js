import express from 'express';
import { treasuryDataManager } from '../services/treasury-data-manager.js';
import { stakingDataManager } from '../services/staking-data-manager.js';
import { userCommitDataManager } from '../services/user-commit-data-manager.js';
import { blockchainEventsManager } from '../services/blockchain-events-manager.js';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * System Health Monitoring API
 * 
 * Provides comprehensive health monitoring for all systematic data managers
 * following the data architecture redesign implementation.
 */

/**
 * GET /api/system-health/overview
 * Returns comprehensive health status for all data managers
 */
router.get('/overview', async (req, res) => {
  try {
    console.log('🏥 Checking system health overview...');
    
    const healthChecks = await Promise.allSettled([
      checkTreasuryHealth(),
      checkStakingHealth(),
      checkUserCommitHealth(),
      checkBlockchainEventsHealth(),
      checkDatabaseHealth()
    ]);

    const results = {
      treasury: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : { status: 'error', error: healthChecks[0].reason?.message },
      staking: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : { status: 'error', error: healthChecks[1].reason?.message },
      userCommits: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : { status: 'error', error: healthChecks[2].reason?.message },
      blockchainEvents: healthChecks[3].status === 'fulfilled' ? healthChecks[3].value : { status: 'error', error: healthChecks[3].reason?.message },
      database: healthChecks[4].status === 'fulfilled' ? healthChecks[4].value : { status: 'error', error: healthChecks[4].reason?.message }
    };

    // Calculate overall system health
    const healthyDomains = Object.values(results).filter(r => r.status === 'healthy').length;
    const totalDomains = Object.keys(results).length;
    const overallHealth = healthyDomains / totalDomains;

    res.json({
      overallStatus: overallHealth >= 0.8 ? 'healthy' : overallHealth >= 0.5 ? 'degraded' : 'unhealthy',
      overallScore: (overallHealth * 100).toFixed(1),
      healthyDomains,
      totalDomains,
      domains: results,
      lastChecked: new Date().toISOString(),
      systemUptime: process.uptime()
    });

  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ 
      overallStatus: 'error',
      error: 'Failed to check system health',
      message: error.message
    });
  }
});

/**
 * GET /api/system-health/details
 * Returns detailed health information for all domains
 */
router.get('/details', async (req, res) => {
  try {
    const pool = getPool();
    
    // Get detailed data freshness information
    const freshnessResult = await pool.query(`
      SELECT 
        domain,
        last_update,
        is_healthy,
        error_count,
        last_error,
        EXTRACT(EPOCH FROM (NOW() - last_update)) / 60 as minutes_since_update
      FROM data_freshness
      ORDER BY domain
    `);

    // Get system statistics
    const systemStats = await getSystemStatistics();
    
    // Get data manager initialization status
    const managerStatus = {
      treasury: global.treasuryDataManager?.isInitialized || false,
      staking: global.stakingDataManager?.isInitialized || false,
      userCommits: global.userCommitDataManager?.isInitialized || false,
      blockchainEvents: global.blockchainEventsManager?.isInitialized || false
    };

    res.json({
      dataFreshness: freshnessResult.rows,
      systemStatistics: systemStats,
      managerInitialization: managerStatus,
      environmentInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        pid: process.pid
      },
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting health details:', error);
    res.status(500).json({ 
      error: 'Failed to get health details',
      message: error.message 
    });
  }
});

/**
 * GET /api/system-health/metrics
 * Returns performance metrics for all data managers
 */
router.get('/metrics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24h';
    const hoursBack = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 24;
    
    const pool = getPool();
    
    // Get treasury data volume metrics
    const treasuryMetrics = await pool.query(`
      SELECT COUNT(*) as snapshots_count
      FROM treasury_snapshots 
      WHERE snapshot_time >= NOW() - INTERVAL '${hoursBack} hours'
    `);

    // Get staking data volume metrics  
    const stakingMetrics = await pool.query(`
      SELECT COUNT(*) as snapshots_count
      FROM staking_snapshots
      WHERE snapshot_time >= NOW() - INTERVAL '${hoursBack} hours'
    `);

    // Get commit processing metrics
    const commitMetrics = await pool.query(`
      SELECT 
        COUNT(*) as commits_processed,
        COUNT(DISTINCT user_id) as unique_contributors
      FROM commits_master 
      WHERE created_at >= NOW() - INTERVAL '${hoursBack} hours'
    `);

    // Get blockchain events metrics
    const eventsMetrics = await pool.query(`
      SELECT 
        COUNT(*) as events_processed,
        COUNT(DISTINCT contract_address) as contracts_monitored
      FROM blockchain_events 
      WHERE timestamp >= NOW() - INTERVAL '${hoursBack} hours'
    `);

    res.json({
      timeframe,
      metrics: {
        treasury: {
          snapshotsCount: parseInt(treasuryMetrics.rows[0]?.snapshots_count || 0),
          expectedSnapshots: Math.floor(hoursBack * 12), // Every 5 minutes
          healthScore: calculateHealthScore(treasuryMetrics.rows[0]?.snapshots_count, hoursBack * 12)
        },
        staking: {
          snapshotsCount: parseInt(stakingMetrics.rows[0]?.snapshots_count || 0),
          expectedSnapshots: Math.floor(hoursBack * 30), // Every 2 minutes  
          healthScore: calculateHealthScore(stakingMetrics.rows[0]?.snapshots_count, hoursBack * 30)
        },
        userCommits: {
          commitsProcessed: parseInt(commitMetrics.rows[0]?.commits_processed || 0),
          uniqueContributors: parseInt(commitMetrics.rows[0]?.unique_contributors || 0),
          avgCommitsPerContributor: commitMetrics.rows[0]?.unique_contributors > 0 
            ? (commitMetrics.rows[0]?.commits_processed / commitMetrics.rows[0]?.unique_contributors).toFixed(2) 
            : 0
        },
        blockchainEvents: {
          eventsProcessed: parseInt(eventsMetrics.rows[0]?.events_processed || 0),
          contractsMonitored: parseInt(eventsMetrics.rows[0]?.contracts_monitored || 0)
        }
      },
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ 
      error: 'Failed to get metrics',
      message: error.message 
    });
  }
});

/**
 * POST /api/system-health/refresh-all
 * Manually trigger refresh for all data managers
 */
router.post('/refresh-all', async (req, res) => {
  try {
    console.log('🔄 Triggering manual refresh for all data managers...');
    
    const refreshResults = await Promise.allSettled([
      treasuryDataManager.updateTreasuryData(),
      treasuryDataManager.updateTokenPrices(),
      stakingDataManager.updateStakingData(),
      stakingDataManager.calculateAPY(),
      userCommitDataManager.updateUserStatistics(),
      userCommitDataManager.generateAnalytics()
    ]);

    const results = {
      treasury: {
        data: refreshResults[0].status,
        prices: refreshResults[1].status
      },
      staking: {
        data: refreshResults[2].status,
        apy: refreshResults[3].status
      },
      userCommits: {
        statistics: refreshResults[4].status,
        analytics: refreshResults[5].status
      }
    };

    const successCount = refreshResults.filter(r => r.status === 'fulfilled').length;
    const totalCount = refreshResults.length;

    res.json({
      success: true,
      message: `Triggered refresh for all data managers: ${successCount}/${totalCount} operations successful`,
      results,
      successRate: ((successCount / totalCount) * 100).toFixed(1),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error triggering refresh:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to trigger refresh for all data managers',
      message: error.message 
    });
  }
});

/**
 * Helper Functions
 */

async function checkTreasuryHealth() {
  try {
    const freshness = await treasuryDataManager.getDataFreshness();
    const currentSnapshot = await treasuryDataManager.getCurrentSnapshot();
    
    if (!freshness || !currentSnapshot) {
      return { status: 'unhealthy', reason: 'No data available' };
    }

    const timeSinceUpdate = Date.now() - new Date(freshness.last_update).getTime();
    const isStale = timeSinceUpdate > 10 * 60 * 1000; // 10 minutes

    return {
      status: freshness.is_healthy && !isStale ? 'healthy' : 'unhealthy',
      lastUpdate: freshness.last_update,
      timeSinceUpdateMs: timeSinceUpdate,
      errorCount: freshness.error_count,
      lastError: freshness.last_error,
      currentData: {
        totalValueUSD: currentSnapshot.total_value_usd,
        ethBalance: currentSnapshot.eth_balance,
        abcBalance: currentSnapshot.abc_balance
      }
    };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function checkStakingHealth() {
  try {
    const freshness = await stakingDataManager.getDataFreshness();
    const overview = await stakingDataManager.getStakingOverview();
    
    if (!freshness) {
      return { status: 'unhealthy', reason: 'No freshness data available' };
    }

    const timeSinceUpdate = Date.now() - new Date(freshness.last_update).getTime();
    const isStale = timeSinceUpdate > 5 * 60 * 1000; // 5 minutes

    return {
      status: freshness.is_healthy && !isStale ? 'healthy' : 'unhealthy',
      lastUpdate: freshness.last_update,
      timeSinceUpdateMs: timeSinceUpdate,
      errorCount: freshness.error_count,
      lastError: freshness.last_error,
      currentData: overview.currentSnapshot ? {
        totalStaked: overview.currentSnapshot.total_staked,
        totalStakers: overview.currentSnapshot.total_stakers,
        currentAPY: overview.currentSnapshot.current_apy
      } : null
    };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function checkUserCommitHealth() {
  try {
    const freshness = await userCommitDataManager.getDataFreshness();
    const stats = await userCommitDataManager.getSystemStats();
    
    if (!freshness) {
      return { status: 'unhealthy', reason: 'No freshness data available' };
    }

    const timeSinceUpdate = Date.now() - new Date(freshness.last_update).getTime();
    const isStale = timeSinceUpdate > 60 * 60 * 1000; // 1 hour

    return {
      status: freshness.is_healthy && !isStale ? 'healthy' : 'unhealthy',
      lastUpdate: freshness.last_update,
      timeSinceUpdateMs: timeSinceUpdate,
      errorCount: freshness.error_count,
      lastError: freshness.last_error,
      currentData: {
        totalUsers: stats.total_users,
        totalCommits: stats.total_commits,
        commits24h: stats.commits_24h,
        paidMembers: stats.paid_members
      }
    };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function checkBlockchainEventsHealth() {
  try {
    const freshness = await blockchainEventsManager.getDataFreshness();
    const processingStatus = await blockchainEventsManager.getProcessingStatus();
    
    if (!freshness) {
      return { status: 'unhealthy', reason: 'No freshness data available' };
    }

    const timeSinceUpdate = Date.now() - new Date(freshness.last_update).getTime();
    const isStale = timeSinceUpdate > 2 * 60 * 1000; // 2 minutes

    return {
      status: freshness.is_healthy && !isStale ? 'healthy' : 'unhealthy',
      lastUpdate: freshness.last_update,
      timeSinceUpdateMs: timeSinceUpdate,
      errorCount: freshness.error_count,
      lastError: freshness.last_error,
      currentData: {
        contractsMonitored: processingStatus.length,
        lastProcessedBlock: Math.max(...processingStatus.map(p => p.last_processed_block || 0))
      }
    };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function checkDatabaseHealth() {
  try {
    const pool = getPool();
    const start = Date.now();
    
    await pool.query('SELECT 1');
    
    const responseTime = Date.now() - start;
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTimeMs: responseTime,
      connectionStatus: 'connected'
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message,
      connectionStatus: 'failed'
    };
  }
}

async function getSystemStatistics() {
  try {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM treasury_snapshots) as treasury_snapshots,
        (SELECT COUNT(*) FROM staking_snapshots) as staking_snapshots,
        (SELECT COUNT(*) FROM users_master WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM commits_master) as total_commits,
        (SELECT COUNT(*) FROM blockchain_events) as blockchain_events,
        (SELECT COUNT(*) FROM data_freshness WHERE is_healthy = true) as healthy_domains,
        (SELECT COUNT(*) FROM data_freshness) as total_domains
    `);

    return result.rows[0];
  } catch (error) {
    console.warn('Could not get system statistics:', error.message);
    return {};
  }
}

function calculateHealthScore(actual, expected) {
  if (expected === 0) return 100;
  const score = Math.min(100, (actual / expected) * 100);
  return parseFloat(score.toFixed(1));
}

export default router;