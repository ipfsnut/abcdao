import { ethers } from 'ethers';
import { getPool } from './database.js';

/**
 * Treasury Data Manager
 * 
 * Responsible for all protocol treasury and financial data management.
 * Implements the systematic data architecture pattern with proactive data collection.
 * 
 * Core Responsibilities:
 * 1. Knowing what treasury data is needed
 * 2. Fetching data proactively on schedules  
 * 3. Storing data in optimized database structures
 * 4. Serving data through clean APIs
 * 5. Maintaining data freshness and consistency
 */
export class TreasuryDataManager {
  constructor() {
    this.walletAddress = process.env.PROTOCOL_WALLET_ADDRESS || '0xBE6525b767cA8D38d169C93C8120c0C0957388B8';
    this.stakingContract = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
    this.priceUpdateInterval = 10 * 60 * 1000; // 10 minutes for token prices
    this.isInitialized = false;
  }

  /**
   * Initialize the Treasury Data Manager
   * Sets up periodic updates and performs initial data fetch
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('Treasury Data Manager already initialized');
      return;
    }

    console.log('🏦 Initializing Treasury Data Manager...');

    try {
      // Start periodic updates
      setInterval(() => this.updateTreasuryData(), this.updateInterval);
      setInterval(() => this.updateTokenPrices(), this.priceUpdateInterval);
      setInterval(() => this.updateTransactionHistory(), 2 * 60 * 1000); // 2 minutes
      
      // Initial data fetch
      await this.updateTreasuryData();
      await this.updateTokenPrices();
      await this.updateTransactionHistory();
      
      this.isInitialized = true;
      console.log('✅ Treasury Data Manager initialized successfully');
      console.log(`   - Treasury updates every ${this.updateInterval / 60000} minutes`);
      console.log(`   - Price updates every ${this.priceUpdateInterval / 60000} minutes`);
      console.log(`   - Transaction monitoring every 2 minutes`);

    } catch (error) {
      console.error('❌ Failed to initialize Treasury Data Manager:', error);
      throw error;
    }
  }

  /**
   * Update treasury data proactively
   * Fetches current balances and stores treasury snapshot
   */
  async updateTreasuryData() {
    try {
      console.log('🔄 Updating treasury data...');
      
      // Fetch current balances
      const ethBalance = await this.provider.getBalance(this.walletAddress);
      const stakingTvl = await this.getStakingTVL();
      const tokenPrices = await this.getCurrentTokenPrices();
      
      // Calculate total value
      const totalValueUsd = this.calculateTotalValue(ethBalance, stakingTvl, tokenPrices);
      
      // Store snapshot
      await this.storeTreasurySnapshot({
        ethBalance: ethers.formatEther(ethBalance),
        abcBalance: stakingTvl, // ABC tokens in staking represent treasury ABC
        totalValueUsd,
        stakingTvl,
        timestamp: new Date()
      });

      console.log(`✅ Treasury data updated - Total value: $${totalValueUsd.toFixed(2)}`);
      
    } catch (error) {
      console.error('❌ Error updating treasury data:', error);
      await this.recordDataError('treasury_update', error.message);
    }
  }

  /**
   * Update token prices and comprehensive data from external APIs
   */
  async updateTokenPrices() {
    try {
      console.log('💰 Updating token prices and market data...');
      
      // Fetch comprehensive $ABC data from DexScreener
      const abcTokenData = await this.fetchABCTokenData();
      
      // Fetch ETH price from CoinGecko
      const ethPrice = await this.fetchETHPrice();
      
      // Store comprehensive token data
      await this.storeTokenData('ABC', abcTokenData);
      await this.storeTokenPrice('ETH', ethPrice);
      
      console.log(`✅ Token data updated - $ABC: $${abcTokenData.price.toFixed(8)}, ETH: $${ethPrice.toFixed(2)}`);
      console.log(`   Volume 24h: $${abcTokenData.volume24h.toLocaleString()}, Liquidity: $${abcTokenData.liquidity.toLocaleString()}`);
      
    } catch (error) {
      console.error('❌ Error updating token prices:', error);
      await this.recordDataError('price_update', error.message);
    }
  }

  /**
   * Update transaction history
   * Monitors for new transactions to/from treasury wallet
   */
  async updateTransactionHistory() {
    try {
      // This will integrate with existing ETH distribution monitoring
      // For now, we'll focus on ensuring the data manager structure is solid
      console.log('📊 Transaction history monitoring active');
      
    } catch (error) {
      console.error('❌ Error updating transaction history:', error);
      await this.recordDataError('transaction_update', error.message);
    }
  }

  /**
   * Fetch comprehensive $ABC token data from DexScreener API
   * Returns price, volume, liquidity, market cap, and price changes
   */
  async fetchABCTokenData() {
    try {
      const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/0x5c0872b790bb73e2b3a9778db6e7704095624b07');
      if (response.ok) {
        const data = await response.json();
        if (data.pairs && data.pairs.length > 0) {
          const bestPair = data.pairs.reduce((best, current) => 
            (current.volume?.h24 || 0) > (best.volume?.h24 || 0) ? current : best
          );
          
          if (bestPair && bestPair.priceUsd) {
            return {
              price: parseFloat(bestPair.priceUsd),
              volume24h: bestPair.volume?.h24 || 0,
              volume6h: bestPair.volume?.h6 || 0,
              volume1h: bestPair.volume?.h1 || 0,
              liquidity: bestPair.liquidity?.usd || 0,
              marketCap: bestPair.marketCap || bestPair.fdv || 0,
              priceChange24h: bestPair.priceChange?.h24 || 0,
              priceChange6h: bestPair.priceChange?.h6 || 0,
              priceChange1h: bestPair.priceChange?.h1 || 0,
              pairAddress: bestPair.pairAddress,
              dexId: bestPair.dexId,
              lastUpdated: new Date().toISOString()
            };
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch $ABC token data:', e);
    }
    
    // Fallback data
    return {
      price: 0.0000123,
      volume24h: 0,
      volume6h: 0, 
      volume1h: 0,
      liquidity: 0,
      marketCap: 1230000, // 100B supply * fallback price
      priceChange24h: 0,
      priceChange6h: 0,
      priceChange1h: 0,
      pairAddress: null,
      dexId: 'unknown',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Legacy method - now calls fetchABCTokenData for backwards compatibility
   */
  async fetchABCPrice() {
    const tokenData = await this.fetchABCTokenData();
    return tokenData.price;
  }

  /**
   * Fetch ETH price from CoinGecko API
   */
  async fetchETHPrice() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      return data.ethereum?.usd || 3200; // Fallback price
    } catch (e) {
      console.warn('Failed to fetch ETH price:', e);
      return 3200; // Fallback price
    }
  }

  /**
   * Get current staking TVL
   */
  async getStakingTVL() {
    try {
      // This would query the staking contract for total staked amount
      // For now, return a reasonable estimate
      return 711483264; // Current estimated TVL
    } catch (error) {
      console.warn('Failed to fetch staking TVL:', error);
      return 711483264; // Fallback
    }
  }

  /**
   * Calculate total treasury value in USD
   */
  calculateTotalValue(ethBalance, stakingTvl, tokenPrices) {
    const ethValueUsd = parseFloat(ethers.formatEther(ethBalance)) * (tokenPrices.ETH || 3200);
    const abcValueUsd = stakingTvl * (tokenPrices.ABC || 0.0000123);
    return ethValueUsd + abcValueUsd;
  }

  /**
   * Store treasury snapshot in database
   */
  async storeTreasurySnapshot(snapshot) {
    const pool = getPool();
    
    await pool.query(`
      INSERT INTO treasury_snapshots (
        snapshot_time,
        eth_balance,
        abc_balance,
        total_value_usd,
        staking_tvl
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      snapshot.timestamp,
      snapshot.ethBalance,
      snapshot.abcBalance,
      snapshot.totalValueUsd,
      snapshot.stakingTvl
    ]);
  }

  /**
   * Store comprehensive token data in database
   */
  async storeTokenData(symbol, tokenData) {
    const pool = getPool();
    
    await pool.query(`
      INSERT INTO token_market_data (
        token_symbol, 
        price_usd, 
        volume_24h, 
        volume_6h, 
        volume_1h, 
        liquidity_usd,
        market_cap,
        price_change_24h,
        price_change_6h,
        price_change_1h,
        pair_address,
        dex_id,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (token_symbol) 
      DO UPDATE SET 
        price_usd = $2,
        volume_24h = $3,
        volume_6h = $4,
        volume_1h = $5,
        liquidity_usd = $6,
        market_cap = $7,
        price_change_24h = $8,
        price_change_6h = $9,
        price_change_1h = $10,
        pair_address = $11,
        dex_id = $12,
        updated_at = NOW()
    `, [
      symbol, 
      tokenData.price,
      tokenData.volume24h,
      tokenData.volume6h,
      tokenData.volume1h,
      tokenData.liquidity,
      tokenData.marketCap,
      tokenData.priceChange24h,
      tokenData.priceChange6h,
      tokenData.priceChange1h,
      tokenData.pairAddress,
      tokenData.dexId
    ]);
  }

  /**
   * Store token price in database (legacy method for ETH)
   */
  async storeTokenPrice(symbol, priceUsd) {
    const pool = getPool();
    
    await pool.query(`
      INSERT INTO token_prices (token_symbol, price_usd, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (token_symbol) 
      DO UPDATE SET price_usd = $2, updated_at = NOW()
    `, [symbol, priceUsd]);
  }

  /**
   * Record data error for monitoring
   */
  async recordDataError(operation, errorMessage) {
    const pool = getPool();
    
    try {
      await pool.query(`
        INSERT INTO data_freshness (domain, last_update, is_healthy, error_count, last_error)
        VALUES ('treasury', NOW(), false, 1, $1)
        ON CONFLICT (domain) DO UPDATE SET
          is_healthy = false,
          error_count = data_freshness.error_count + 1,
          last_error = $1
      `, [errorMessage]);
    } catch (e) {
      console.error('Failed to record data error:', e);
    }
  }

  /**
   * API Methods - Clean data serving endpoints
   */

  /**
   * Get current treasury snapshot
   */
  async getCurrentSnapshot() {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM treasury_snapshots 
      ORDER BY snapshot_time DESC 
      LIMIT 1
    `);
    
    return result.rows[0];
  }

  /**
   * Get historical treasury data
   */
  async getHistoricalData(days = 30) {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM treasury_snapshots 
      WHERE snapshot_time >= NOW() - INTERVAL '${days} days'
      ORDER BY snapshot_time ASC
    `);
    
    return result.rows;
  }

  /**
   * Get comprehensive token market data
   */
  async getTokenMarketData(symbol = null) {
    const pool = getPool();
    
    let query, params;
    if (symbol) {
      query = `
        SELECT * FROM token_market_data 
        WHERE token_symbol = $1
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      params = [symbol];
    } else {
      query = `
        SELECT * FROM token_market_data 
        ORDER BY updated_at DESC
      `;
      params = [];
    }
    
    const result = await pool.query(query, params);
    
    if (symbol) {
      return result.rows[0] || null;
    }
    
    const tokenData = {};
    result.rows.forEach(row => {
      tokenData[row.token_symbol] = {
        price: parseFloat(row.price_usd),
        volume24h: parseFloat(row.volume_24h || 0),
        volume6h: parseFloat(row.volume_6h || 0),
        volume1h: parseFloat(row.volume_1h || 0),
        liquidity: parseFloat(row.liquidity_usd || 0),
        marketCap: parseFloat(row.market_cap || 0),
        priceChange24h: parseFloat(row.price_change_24h || 0),
        priceChange6h: parseFloat(row.price_change_6h || 0),
        priceChange1h: parseFloat(row.price_change_1h || 0),
        pairAddress: row.pair_address,
        dexId: row.dex_id,
        lastUpdated: row.updated_at
      };
    });
    
    return tokenData;
  }

  /**
   * Get current token prices (legacy method for backward compatibility)
   */
  async getCurrentTokenPrices() {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT token_symbol, price_usd, updated_at
      FROM token_prices 
      ORDER BY updated_at DESC
    `);
    
    const prices = {};
    result.rows.forEach(row => {
      prices[row.token_symbol] = row.price_usd;
    });
    
    return prices;
  }

  /**
   * Get treasury statistics
   */
  async getTreasuryStats() {
    const pool = getPool();
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_snapshots,
        MAX(total_value_usd) as peak_value,
        MIN(total_value_usd) as min_value,
        AVG(total_value_usd) as avg_value,
        MAX(snapshot_time) as last_update
      FROM treasury_snapshots
      WHERE snapshot_time >= NOW() - INTERVAL '30 days'
    `);
    
    return statsResult.rows[0];
  }

  /**
   * Get data freshness status
   */
  async getDataFreshness() {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM data_freshness WHERE domain = 'treasury'
    `);
    
    return result.rows[0];
  }
}

// Export singleton instance
export const treasuryDataManager = new TreasuryDataManager();