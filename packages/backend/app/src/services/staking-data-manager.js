import { ethers } from 'ethers';
import { getPool } from './database.js';

/**
 * Staking Data Manager
 * 
 * Responsible for all staking contract data and APY calculations.
 * Implements the systematic data architecture pattern with proactive data collection.
 * 
 * Core Responsibilities:
 * 1. Knowing what staking data is needed
 * 2. Fetching data proactively on schedules  
 * 3. Storing data in optimized database structures
 * 4. Serving data through clean APIs
 * 5. Maintaining data freshness and consistency
 */
export class StakingDataManager {
  constructor() {
    this.stakingContractAddress = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.updateInterval = 2 * 60 * 1000; // 2 minutes
    this.apyCalculationInterval = 10 * 60 * 1000; // 10 minutes for APY calculations
    this.isInitialized = false;
    
    // Staking contract ABI (from contracts.ts)
    this.stakingABI = [
      {
        "type": "function",
        "name": "getStakeInfo",
        "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
        "outputs": [
          {"name": "amount", "type": "uint256", "internalType": "uint256"},
          {"name": "lastStakeTime", "type": "uint256", "internalType": "uint256"},
          {"name": "totalEthEarned", "type": "uint256", "internalType": "uint256"},
          {"name": "pendingEth", "type": "uint256", "internalType": "uint256"}
        ],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "pendingRewards",
        "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "totalStaked",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "totalRewardsDistributed",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "getUnbondingInfo",
        "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
        "outputs": [{
          "name": "", 
          "type": "tuple[]", 
          "internalType": "struct EmarkStakingV2.UnbondingInfo[]",
          "components": [
            {"name": "amount", "type": "uint256", "internalType": "uint256"},
            {"name": "releaseTime", "type": "uint256", "internalType": "uint256"}
          ]
        }],
        "stateMutability": "view"
      }
    ];
    
    this.stakingContract = new ethers.Contract(
      this.stakingContractAddress,
      this.stakingABI,
      this.provider
    );
  }

  /**
   * Initialize the Staking Data Manager
   * Sets up periodic updates and performs initial data fetch
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('Staking Data Manager already initialized');
      return;
    }

    console.log('⚡ Initializing Staking Data Manager...');

    try {
      // Start periodic updates
      setInterval(() => this.updateStakingData(), this.updateInterval);
      setInterval(() => this.calculateAPY(), this.apyCalculationInterval);
      setInterval(() => this.updateStakerPositions(), 3 * 60 * 1000); // 3 minutes
      
      // Initial data fetch
      await this.updateStakingData();
      await this.calculateAPY();
      await this.updateStakerPositions();
      
      this.isInitialized = true;
      console.log('✅ Staking Data Manager initialized successfully');
      console.log(`   - Staking updates every ${this.updateInterval / 60000} minutes`);
      console.log(`   - APY calculations every ${this.apyCalculationInterval / 60000} minutes`);
      console.log(`   - Staker position updates every 3 minutes`);

    } catch (error) {
      console.error('❌ Failed to initialize Staking Data Manager:', error);
      throw error;
    }
  }

  /**
   * Update staking data proactively
   * Fetches current staking metrics and stores snapshot
   */
  async updateStakingData() {
    try {
      console.log('⚡ Updating staking data...');
      
      // Fetch current staking metrics
      const totalStaked = await this.stakingContract.totalStaked();
      const totalRewardsDistributed = await this.stakingContract.totalRewardsDistributed();
      const rewardsPoolBalance = await this.getRewardsPoolBalance();
      const totalStakers = await this.getTotalStakers();
      const currentAPY = await this.getCurrentAPY();
      
      // Store snapshot
      await this.storeStakingSnapshot({
        totalStaked: ethers.formatEther(totalStaked),
        totalStakers,
        rewardsPoolBalance,
        totalRewardsDistributed: ethers.formatEther(totalRewardsDistributed),
        currentAPY,
        timestamp: new Date()
      });

      console.log(`✅ Staking data updated - Total staked: ${ethers.formatEther(totalStaked)} ABC`);
      
      // Update data freshness
      await this.updateDataFreshness('staking', true);
      
    } catch (error) {
      console.error('❌ Error updating staking data:', error);
      await this.recordDataError('staking_update', error.message);
    }
  }

  /**
   * Calculate APY for different time periods
   */
  async calculateAPY() {
    try {
      console.log('📊 Calculating APY...');
      
      const periods = ['24h', '7d', '30d'];
      
      for (const period of periods) {
        const apy = await this.calculateAPYForPeriod(period);
        
        await this.storeAPYCalculation({
          period,
          rewardsDistributed: apy.rewardsDistributed,
          averageStaked: apy.averageStaked,
          calculatedAPY: apy.apy,
          calculationDetails: apy.calculationDetails,
          timestamp: new Date()
        });
      }
      
      console.log('✅ APY calculations completed');
      
    } catch (error) {
      console.error('❌ Error calculating APY:', error);
      await this.recordDataError('apy_calculation', error.message);
    }
  }

  /**
   * Calculate APY for a specific time period
   * Fixed: Now converts both ETH rewards and ABC staked to USD for proper ratio calculation
   */
  async calculateAPYForPeriod(period) {
    const hoursBack = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const pool = getPool();
    
    // Get average staked amount over period (in ABC tokens)
    const avgStakedResult = await pool.query(`
      SELECT AVG(total_staked) as average
      FROM staking_snapshots 
      WHERE snapshot_time >= NOW() - INTERVAL '${hoursBack} hours'
    `);
    
    // Get rewards distributed in period with ETH prices
    const rewardsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(eth_amount), 0) as total_eth_rewards,
        AVG(eth_price_usd) as avg_eth_price
      FROM eth_distributions 
      WHERE created_at >= NOW() - INTERVAL '${hoursBack} hours'
        AND status = 'completed'
        AND eth_price_usd IS NOT NULL
    `);
    
    // Get average ABC price during the period from token market data
    const abcPriceResult = await pool.query(`
      SELECT AVG(price_usd) as avg_abc_price
      FROM token_market_data 
      WHERE token_symbol = 'ABC' 
        AND updated_at >= NOW() - INTERVAL '${hoursBack} hours'
    `);
    
    // Fallback to most recent ABC price if no data in period
    let avgABCPrice = parseFloat(abcPriceResult.rows[0]?.avg_abc_price);
    if (!avgABCPrice) {
      const recentABCPrice = await pool.query(`
        SELECT price_usd 
        FROM token_market_data 
        WHERE token_symbol = 'ABC' 
        ORDER BY updated_at DESC 
        LIMIT 1
      `);
      avgABCPrice = parseFloat(recentABCPrice.rows[0]?.price_usd) || 0;
    }
    
    const averageStaked = parseFloat(avgStakedResult.rows[0]?.average) || 0;
    const totalETHRewards = parseFloat(rewardsResult.rows[0]?.total_eth_rewards) || 0;
    const avgETHPrice = parseFloat(rewardsResult.rows[0]?.avg_eth_price) || 0;
    
    // Calculate returns in USD terms (fixing the unit mismatch bug)
    if (averageStaked === 0 || avgABCPrice === 0) {
      console.log(`📊 APY calculation (${period}): No staking data or ABC price - returning 0%`);
      return { 
        rewardsDistributed: 0, 
        averageStaked: 0, 
        apy: 0,
        calculationDetails: {
          averageStaked,
          totalETHRewards,
          avgETHPrice,
          avgABCPrice,
          rewardsUSD: 0,
          stakedUSD: 0
        }
      };
    }
    
    const rewardsUSD = totalETHRewards * avgETHPrice;
    const stakedUSD = averageStaked * avgABCPrice;
    
    // Calculate actual annualized return based on real on-chain events
    const periodicReturn = rewardsUSD / stakedUSD;
    const hoursPerYear = 8760;
    const annualizationFactor = hoursPerYear / hoursBack;
    
    // Simple linear extrapolation - if this period had X return, 
    // what would a full year of similar activity yield?
    const apy = periodicReturn * annualizationFactor * 100;
    
    console.log(`📊 APY calculation (${period}): ${totalETHRewards.toFixed(4)} ETH ($${rewardsUSD.toFixed(2)}) / ${averageStaked.toFixed(0)} ABC ($${stakedUSD.toFixed(2)}) = ${apy.toFixed(2)}% APY`);
    console.log(`   Details: ETH@$${avgETHPrice} | ABC@$${avgABCPrice} | Period: ${hoursBack}h | Annualization: ${annualizationFactor.toFixed(1)}x`);
    
    return {
      rewardsDistributed: totalETHRewards, // Keep in ETH for display
      averageStaked,
      apy: Math.max(0, apy), // Ensure non-negative
      calculationDetails: {
        totalETHRewards,
        avgETHPrice,
        avgABCPrice,
        rewardsUSD,
        stakedUSD,
        periodicReturn,
        annualizationFactor,
        hoursBack,
        calculationMethod: 'simple_linear_extrapolation'
      }
    };
  }

  /**
   * Update individual staker positions
   */
  async updateStakerPositions() {
    try {
      console.log('👥 Updating staker positions...');
      
      // Get all active stakers from database
      const pool = getPool();
      const stakersResult = await pool.query(`
        SELECT DISTINCT wallet_address 
        FROM staker_positions 
        WHERE is_active = true
      `);
      
      let updatedCount = 0;
      
      for (const staker of stakersResult.rows) {
        try {
          await this.updateSingleStakerPosition(staker.wallet_address);
          updatedCount++;
        } catch (error) {
          console.warn(`Failed to update staker ${staker.wallet_address}:`, error.message);
        }
      }
      
      console.log(`✅ Updated ${updatedCount} staker positions`);
      
    } catch (error) {
      console.error('❌ Error updating staker positions:', error);
      await this.recordDataError('staker_positions_update', error.message);
    }
  }

  /**
   * Update a single staker's position
   */
  async updateSingleStakerPosition(walletAddress) {
    try {
      // Get stake info from contract
      const stakeInfo = await this.stakingContract.getStakeInfo(walletAddress);
      const pendingRewards = await this.stakingContract.pendingRewards(walletAddress);
      
      // Update database
      const pool = getPool();
      await pool.query(`
        INSERT INTO staker_positions (
          wallet_address,
          staked_amount,
          rewards_earned,
          pending_rewards,
          last_stake_time,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (wallet_address) DO UPDATE SET
          staked_amount = $2,
          rewards_earned = $3,
          pending_rewards = $4,
          last_stake_time = CASE 
            WHEN $5 > staker_positions.last_stake_time OR staker_positions.last_stake_time IS NULL 
            THEN $5 
            ELSE staker_positions.last_stake_time 
          END,
          updated_at = NOW(),
          is_active = CASE WHEN $2 > 0 THEN true ELSE false END
      `, [
        walletAddress,
        ethers.formatEther(stakeInfo[0]), // amount
        ethers.formatEther(stakeInfo[2]), // totalEthEarned
        ethers.formatEther(pendingRewards), // pendingRewards
        stakeInfo[1] > 0 ? new Date(Number(stakeInfo[1]) * 1000) : null // lastStakeTime
      ]);
      
    } catch (error) {
      // Don't log errors for addresses that haven't staked - this is normal
      if (!error.message.includes('execution reverted')) {
        throw error;
      }
    }
  }

  /**
   * Get current rewards pool balance (ETH balance of staking contract)
   */
  async getRewardsPoolBalance() {
    try {
      const balance = await this.provider.getBalance(this.stakingContractAddress);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.warn('Failed to fetch rewards pool balance:', error);
      return 0;
    }
  }

  /**
   * Get total number of stakers
   */
  async getTotalStakers() {
    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM staker_positions 
        WHERE staked_amount > 0 AND is_active = true
      `);
      return parseInt(result.rows[0]?.count) || 0;
    } catch (error) {
      console.warn('Failed to get total stakers count:', error);
      return 0;
    }
  }

  /**
   * Get current APY (30-day calculation)
   */
  async getCurrentAPY() {
    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT calculated_apy 
        FROM apy_calculations 
        WHERE calculation_period = '30d' 
        ORDER BY calculation_time DESC 
        LIMIT 1
      `);
      return parseFloat(result.rows[0]?.calculated_apy) || 0;
    } catch (error) {
      console.warn('Failed to get current APY:', error);
      return 0;
    }
  }

  /**
   * Store staking snapshot in database
   */
  async storeStakingSnapshot(snapshot) {
    const pool = getPool();
    
    await pool.query(`
      INSERT INTO staking_snapshots (
        total_staked,
        total_stakers,
        rewards_pool_balance,
        total_rewards_distributed,
        current_apy,
        snapshot_time
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      snapshot.totalStaked,
      snapshot.totalStakers,
      snapshot.rewardsPoolBalance,
      snapshot.totalRewardsDistributed,
      snapshot.currentAPY,
      snapshot.timestamp
    ]);
  }

  /**
   * Store APY calculation in database
   * Enhanced: Now includes calculation details for transparency and debugging
   */
  async storeAPYCalculation(calculation) {
    const pool = getPool();
    
    try {
      // First, try to add the calculation_details column if it doesn't exist
      await pool.query(`
        ALTER TABLE apy_calculations 
        ADD COLUMN IF NOT EXISTS calculation_details JSONB
      `);
    } catch (error) {
      // Column might already exist, continue
      console.log('APY calculations table column check:', error.message);
    }
    
    await pool.query(`
      INSERT INTO apy_calculations (
        calculation_period,
        rewards_distributed,
        average_staked,
        calculated_apy,
        calculation_details,
        calculation_time
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      calculation.period,
      calculation.rewardsDistributed,
      calculation.averageStaked,
      calculation.calculatedAPY,
      JSON.stringify(calculation.calculationDetails || {}),
      calculation.timestamp
    ]);
  }

  /**
   * Update data freshness tracking
   */
  async updateDataFreshness(domain, isHealthy) {
    const pool = getPool();
    
    await pool.query(`
      INSERT INTO data_freshness (domain, last_update, is_healthy, error_count, last_error)
      VALUES ($1, NOW(), $2, 0, NULL)
      ON CONFLICT (domain) DO UPDATE SET
        last_update = NOW(),
        is_healthy = $2,
        error_count = CASE WHEN $2 THEN 0 ELSE data_freshness.error_count END,
        last_error = CASE WHEN $2 THEN NULL ELSE data_freshness.last_error END
    `, [domain, isHealthy]);
  }

  /**
   * Record data error for monitoring
   */
  async recordDataError(operation, errorMessage) {
    const pool = getPool();
    
    try {
      await pool.query(`
        INSERT INTO data_freshness (domain, last_update, is_healthy, error_count, last_error)
        VALUES ('staking', NOW(), false, 1, $1)
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
   * Get current staking overview
   */
  async getStakingOverview() {
    const pool = getPool();
    
    const snapshot = await pool.query(`
      SELECT * FROM staking_snapshots 
      ORDER BY snapshot_time DESC 
      LIMIT 1
    `);
    
    const apyData = await pool.query(`
      SELECT DISTINCT ON (calculation_period) 
        calculation_period, calculated_apy, calculation_time
      FROM apy_calculations 
      WHERE calculation_time >= NOW() - INTERVAL '1 hour'
      ORDER BY calculation_period, calculation_time DESC
    `);
    
    return {
      currentSnapshot: snapshot.rows[0],
      apyBreakdown: apyData.rows
    };
  }

  /**
   * Get historical staking data
   */
  async getHistoricalData(days = 30) {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM staking_snapshots 
      WHERE snapshot_time >= NOW() - INTERVAL '${days} days'
      ORDER BY snapshot_time ASC
    `);
    
    return result.rows;
  }

  /**
   * Get staking position for specific wallet
   */
  async getStakerPosition(walletAddress) {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM staker_positions 
      WHERE wallet_address = $1
    `, [walletAddress.toLowerCase()]);
    
    return result.rows[0];
  }

  /**
   * Get APY historical data
   */
  async getAPYHistory(period = '30d', days = 30) {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM apy_calculations 
      WHERE calculation_period = $1 
        AND calculation_time >= NOW() - INTERVAL '${days} days'
      ORDER BY calculation_time ASC
    `, [period]);
    
    return result.rows;
  }

  /**
   * Get data freshness status
   */
  async getDataFreshness() {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM data_freshness WHERE domain = 'staking'
    `);
    
    return result.rows[0];
  }

  /**
   * Get staking overview with current metrics and APY breakdown
   */
  async getStakingOverview() {
    const pool = getPool();
    
    // Get latest staking snapshot
    const snapshotResult = await pool.query(`
      SELECT * FROM staking_snapshots 
      ORDER BY snapshot_time DESC 
      LIMIT 1
    `);
    
    // Get APY breakdown for different periods
    const apyResult = await pool.query(`
      SELECT DISTINCT ON (calculation_period) 
        calculation_period,
        calculated_apy,
        rewards_distributed,
        average_staked,
        calculation_time
      FROM apy_calculations 
      ORDER BY calculation_period, calculation_time DESC
    `);
    
    return {
      currentSnapshot: snapshotResult.rows[0] || null,
      apyBreakdown: apyResult.rows || []
    };
  }

  /**
   * Get current staking snapshot
   */
  async getCurrentSnapshot() {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM staking_snapshots 
      ORDER BY snapshot_time DESC 
      LIMIT 1
    `);
    
    return result.rows[0] || null;
  }

  /**
   * Get staking history for a time period
   */
  async getStakingHistory(days = 30) {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM staking_snapshots 
      WHERE snapshot_time >= NOW() - INTERVAL '${days} days'
      ORDER BY snapshot_time ASC
    `);
    
    return result.rows;
  }

  /**
   * Get staker position for a specific wallet
   */
  async getStakerPosition(walletAddress) {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM staker_positions 
      WHERE wallet_address = $1
    `, [walletAddress.toLowerCase()]);
    
    return result.rows[0] || null;
  }

  /**
   * Get top stakers leaderboard
   */
  async getTopStakers(limit = 20) {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        wallet_address,
        staked_amount,
        rewards_earned,
        pending_rewards,
        last_stake_time,
        updated_at
      FROM staker_positions 
      WHERE is_active = true AND staked_amount > 0
      ORDER BY staked_amount DESC 
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }
}

// Export singleton instance
export const stakingDataManager = new StakingDataManager();