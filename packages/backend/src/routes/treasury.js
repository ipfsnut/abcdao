import express from 'express';
import { treasuryDataManager } from '../services/treasury-data-manager.js';

const router = express.Router();

/**
 * Treasury API Routes
 * 
 * Clean, domain-focused endpoints following the data architecture redesign.
 * All routes consume pre-computed data from the Treasury Data Manager.
 */

// Test route to verify mounting
router.get('/test', (req, res) => {
  res.json({ 
    status: 'treasury routes are working', 
    timestamp: new Date().toISOString(),
    manager: 'TreasuryDataManager'
  });
});

/**
 * GET /api/treasury/current
 * Returns the most recent treasury snapshot
 */
router.get('/current', async (req, res) => {
  try {
    const snapshot = await treasuryDataManager.getCurrentSnapshot();
    
    if (!snapshot) {
      return res.status(404).json({ 
        error: 'No treasury data available',
        message: 'Treasury data manager may still be initializing'
      });
    }

    res.json({
      timestamp: snapshot.snapshot_time,
      ethBalance: parseFloat(snapshot.eth_balance),
      abcBalance: parseFloat(snapshot.abc_balance),
      totalValueUSD: parseFloat(snapshot.total_value_usd),
      stakingTVL: parseFloat(snapshot.staking_tvl),
      lastUpdated: snapshot.created_at
    });

  } catch (error) {
    console.error('Error fetching current treasury snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch treasury data' });
  }
});

/**
 * GET /api/treasury/history?days=30
 * Returns historical treasury data
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

    const history = await treasuryDataManager.getHistoricalData(days);
    
    const formattedHistory = history.map(snapshot => ({
      timestamp: snapshot.snapshot_time,
      ethBalance: parseFloat(snapshot.eth_balance),
      abcBalance: parseFloat(snapshot.abc_balance),
      totalValueUSD: parseFloat(snapshot.total_value_usd),
      stakingTVL: parseFloat(snapshot.staking_tvl)
    }));

    res.json({
      days,
      snapshots: formattedHistory,
      count: formattedHistory.length
    });

  } catch (error) {
    console.error('Error fetching treasury history:', error);
    res.status(500).json({ error: 'Failed to fetch treasury history' });
  }
});

/**
 * GET /api/treasury/token-data?symbol=ABC
 * Returns comprehensive token market data including volume, liquidity, market cap
 */
router.get('/token-data', async (req, res) => {
  try {
    const symbol = req.query.symbol?.toUpperCase();
    
    if (symbol) {
      // Get specific token data
      const tokenData = await treasuryDataManager.getTokenMarketData(symbol);
      
      if (!tokenData) {
        return res.status(404).json({ 
          error: 'Token data not found',
          message: `No market data available for ${symbol}`
        });
      }

      res.json({
        symbol,
        price: parseFloat(tokenData.price_usd),
        volume24h: parseFloat(tokenData.volume_24h || 0),
        volume6h: parseFloat(tokenData.volume_6h || 0),
        volume1h: parseFloat(tokenData.volume_1h || 0),
        liquidity: parseFloat(tokenData.liquidity_usd || 0),
        marketCap: parseFloat(tokenData.market_cap || 0),
        priceChange24h: parseFloat(tokenData.price_change_24h || 0),
        priceChange6h: parseFloat(tokenData.price_change_6h || 0),
        priceChange1h: parseFloat(tokenData.price_change_1h || 0),
        pairAddress: tokenData.pair_address,
        dexId: tokenData.dex_id,
        lastUpdated: tokenData.updated_at
      });
    } else {
      // Get all token data
      const allTokenData = await treasuryDataManager.getTokenMarketData();
      
      res.json({
        tokens: allTokenData,
        lastUpdated: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error fetching token market data:', error);
    res.status(500).json({ error: 'Failed to fetch token market data' });
  }
});

/**
 * GET /api/treasury/prices
 * Returns current token prices (legacy endpoint for backward compatibility)
 */
router.get('/prices', async (req, res) => {
  try {
    const prices = await treasuryDataManager.getCurrentTokenPrices();
    
    res.json({
      prices,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching token prices:', error);
    res.status(500).json({ error: 'Failed to fetch token prices' });
  }
});

/**
 * GET /api/treasury/stats
 * Returns treasury statistics and analytics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await treasuryDataManager.getTreasuryStats();
    const freshness = await treasuryDataManager.getDataFreshness();
    
    res.json({
      statistics: {
        totalSnapshots: parseInt(stats.total_snapshots || 0),
        peakValue: parseFloat(stats.peak_value || 0),
        minimumValue: parseFloat(stats.min_value || 0),
        averageValue: parseFloat(stats.avg_value || 0),
        lastUpdate: stats.last_update
      },
      dataHealth: {
        domain: freshness?.domain || 'treasury',
        isHealthy: freshness?.is_healthy || false,
        lastUpdate: freshness?.last_update,
        errorCount: freshness?.error_count || 0,
        lastError: freshness?.last_error
      }
    });

  } catch (error) {
    console.error('Error fetching treasury stats:', error);
    res.status(500).json({ error: 'Failed to fetch treasury statistics' });
  }
});

/**
 * POST /api/treasury/refresh
 * Manually trigger treasury data and price updates
 */
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Manual treasury refresh triggered...');
    
    // Trigger treasury data update
    await treasuryDataManager.updateTreasuryData();
    
    // Trigger price update  
    await treasuryDataManager.updateTokenPrices();
    
    res.json({
      success: true,
      message: 'Treasury data and prices refreshed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error manually refreshing treasury data:', error);
    res.status(500).json({ 
      error: 'Failed to refresh treasury data',
      message: error.message 
    });
  }
});

/**
 * GET /api/treasury/health
 * Returns data manager health status
 */
router.get('/health', async (req, res) => {
  try {
    const freshness = await treasuryDataManager.getDataFreshness();
    const isHealthy = freshness?.is_healthy || false;
    const lastUpdate = freshness?.last_update;
    const timeSinceUpdate = lastUpdate ? Date.now() - new Date(lastUpdate).getTime() : null;
    
    // Consider data stale if it's more than 10 minutes old
    const isStale = timeSinceUpdate && timeSinceUpdate > 10 * 60 * 1000;
    
    res.json({
      status: isHealthy && !isStale ? 'healthy' : 'unhealthy',
      domain: 'treasury',
      isHealthy,
      isStale,
      lastUpdate,
      timeSinceUpdateMs: timeSinceUpdate,
      errorCount: freshness?.error_count || 0,
      lastError: freshness?.last_error
    });

  } catch (error) {
    console.error('Error checking treasury health:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to check treasury health',
      message: error.message
    });
  }
});

export default router;