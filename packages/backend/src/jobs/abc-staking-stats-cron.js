import cron from 'node-cron';
import { ethers } from 'ethers';
import { getPool } from '../services/database.js';

/**
 * ABC Staking Statistics Cron Job
 * 
 * Automatically posts daily statistics about:
 * - Total $ABC tokens staked
 * - Current staking APY
 * - Number of active stakers
 * - ETH rewards distributed
 * - Staking pool metrics
 */
class ABCStakingStatsCron {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.stakingContractAddress = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
    this.abcTokenAddress = process.env.ABC_TOKEN_ADDRESS || '0x5c0872b790bb73e2b3a9778db6e7704095624b07';
    this.isRunning = false;
    
    // Staking Contract ABI
    this.stakingABI = [
      'function totalStaked() view returns (uint256)',
      'function totalRewardsDistributed() view returns (uint256)'
    ];
    
    // ABC Token ABI
    this.abcTokenABI = [
      'function totalSupply() view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];
    
    this.stakingContract = new ethers.Contract(
      this.stakingContractAddress,
      this.stakingABI,
      this.provider
    );
    
    this.abcContract = new ethers.Contract(
      this.abcTokenAddress,
      this.abcTokenABI,
      this.provider
    );
  }

  /**
   * Start the cron job to post ABC staking statistics
   * Runs daily at a different time than token stats (default: 10:00 AM UTC)
   */
  start() {
    console.log('🔒 Starting ABC Staking Statistics cron job...');
    
    // Run daily at 10:00 AM UTC (different from token stats at 2:00 PM)
    this.cronJob = cron.schedule('0 10 * * *', async () => {
      if (this.isRunning) {
        console.log('⚠️ ABC staking stats job already running, skipping...');
        return;
      }

      this.isRunning = true;
      const timestamp = new Date().toISOString();
      
      try {
        console.log(`\n🔒 [${timestamp}] Starting daily ABC staking statistics update...`);
        await this.processABCStakingStats();
        console.log(`✅ [${timestamp}] Daily ABC staking statistics completed\n`);
      } catch (error) {
        console.error(`❌ [${timestamp}] ABC staking statistics failed:`, error);
      } finally {
        this.isRunning = false;
      }
    }, {
      timezone: 'UTC'
    });

    console.log('✅ ABC Staking Statistics cron job started');
    console.log('   - Runs daily at 10:00 AM UTC');
    console.log('   - Posts total staked ABC tokens');
    console.log('   - Posts APY and rewards information');
    console.log('   - Provides staking transparency\n');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 ABC Staking Statistics cron job stopped');
    }
  }

  /**
   * Get current staking data from blockchain
   */
  async getBlockchainStakingData() {
    try {
      console.log('🔗 Fetching blockchain staking data...');
      
      const [totalStaked, totalRewardsDistributed, totalSupply] = await Promise.all([
        this.stakingContract.totalStaked(),
        this.stakingContract.totalRewardsDistributed(),
        this.abcContract.totalSupply()
      ]);
      
      const stakingData = {
        totalStaked: ethers.formatEther(totalStaked),
        totalRewardsDistributed: ethers.formatEther(totalRewardsDistributed),
        totalSupply: ethers.formatEther(totalSupply),
        stakingRatio: (parseFloat(ethers.formatEther(totalStaked)) / parseFloat(ethers.formatEther(totalSupply))) * 100
      };
      
      console.log(`📊 Total Staked: ${this.formatNumber(stakingData.totalStaked)} ABC`);
      console.log(`🎁 Total Rewards: ${parseFloat(stakingData.totalRewardsDistributed).toFixed(4)} ETH`);
      console.log(`🔒 Staking Ratio: ${stakingData.stakingRatio.toFixed(2)}%`);
      
      return stakingData;
      
    } catch (error) {
      console.error('❌ Error fetching blockchain staking data:', error.message);
      throw error;
    }
  }

  /**
   * Get staking metrics from database
   */
  async getDatabaseStakingMetrics() {
    try {
      console.log('📁 Fetching database staking metrics...');
      
      const pool = getPool();
      
      // Get latest staking snapshot
      const snapshotResult = await pool.query(`
        SELECT * FROM staking_snapshots 
        ORDER BY snapshot_time DESC 
        LIMIT 1
      `);
      
      let dbMetrics = {
        currentAPY: 0,
        rewardsPoolBalance: 0,
        totalStakers: 0,
        lastUpdate: null
      };
      
      if (snapshotResult.rows.length > 0) {
        const latest = snapshotResult.rows[0];
        dbMetrics = {
          currentAPY: parseFloat(latest.current_apy || 0),
          rewardsPoolBalance: parseFloat(latest.rewards_pool_balance || 0),
          totalStakers: parseInt(latest.total_stakers || 0),
          lastUpdate: latest.snapshot_time
        };
      }
      
      // Get unique stakers from user actions
      const stakersResult = await pool.query(`
        SELECT COUNT(DISTINCT user_wallet) as unique_stakers
        FROM user_actions 
        WHERE action_type = 'stake'
      `);
      
      const uniqueStakers = parseInt(stakersResult.rows[0]?.unique_stakers || 0);
      
      // Get staking activity stats
      const activityResult = await pool.query(`
        SELECT 
          COUNT(CASE WHEN action_type = 'stake' THEN 1 END) as total_stakes,
          COUNT(CASE WHEN action_type = 'unstake' THEN 1 END) as total_unstakes,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_activity
        FROM user_actions 
        WHERE action_type IN ('stake', 'unstake')
      `);
      
      const activityStats = activityResult.rows[0] || {
        total_stakes: 0,
        total_unstakes: 0,
        recent_activity: 0
      };
      
      console.log(`📈 Current APY: ${dbMetrics.currentAPY.toFixed(2)}%`);
      console.log(`💰 Rewards Pool: ${dbMetrics.rewardsPoolBalance.toFixed(6)} ETH`);
      console.log(`👥 Unique Stakers: ${uniqueStakers}`);
      console.log(`📊 Stake Actions: ${activityStats.total_stakes}, Unstake: ${activityStats.total_unstakes}`);
      
      return {
        ...dbMetrics,
        uniqueStakers,
        activityStats: {
          totalStakes: parseInt(activityStats.total_stakes),
          totalUnstakes: parseInt(activityStats.total_unstakes),
          recentActivity: parseInt(activityStats.recent_activity)
        }
      };
      
    } catch (error) {
      console.error('❌ Error fetching database staking metrics:', error.message);
      throw error;
    }
  }

  /**
   * Format numbers for human readability
   */
  formatNumber(num) {
    const number = parseFloat(num);
    
    if (number >= 1e9) {
      return (number / 1e9).toFixed(2) + 'B';
    } else if (number >= 1e6) {
      return (number / 1e6).toFixed(2) + 'M';
    } else if (number >= 1e3) {
      return (number / 1e3).toFixed(2) + 'K';
    } else {
      return number.toFixed(2);
    }
  }

  /**
   * Create the staking statistics cast message
   */
  createStakingStatsCastMessage(blockchainData, dbMetrics) {
    const totalStakedFormatted = this.formatNumber(blockchainData.totalStaked);
    const rewardsDistributedFormatted = parseFloat(blockchainData.totalRewardsDistributed).toFixed(3);
    const stakingRatio = blockchainData.stakingRatio.toFixed(1);
    const currentAPY = dbMetrics.currentAPY > 0 ? dbMetrics.currentAPY.toFixed(1) : 'TBD';
    
    // Calculate estimated daily rewards (if APY > 0)
    let dailyRewardsText = '';
    if (dbMetrics.currentAPY > 0) {
      const dailyAPY = dbMetrics.currentAPY / 365;
      const dailyRewards = (parseFloat(blockchainData.totalStaked) * dailyAPY / 100);
      dailyRewardsText = `\n🌟 Est. Daily Rewards: ${this.formatNumber(dailyRewards)} ABC`;
    }
    
    const castText = `🔒 DAILY $ABC STAKING UPDATE

📊 Total Staked: ${totalStakedFormatted} ABC (${stakingRatio}%)
📈 Current APY: ${currentAPY}%
🎁 Total ETH Distributed: ${rewardsDistributedFormatted} ETH
💰 Active Rewards Pool: ${dbMetrics.rewardsPoolBalance.toFixed(4)} ETH${dailyRewardsText}

👥 Stakers: ${dbMetrics.uniqueStakers || 'Growing'}
📈 Stake your $ABC at abc.epicdylan.com/staking

#ABCDAO #Staking #PassiveIncome #DeFi`;

    return castText;
  }

  /**
   * Post the staking statistics to Farcaster
   */
  async postStakingStatsCast(castText) {
    try {
      const devSignerUuid = process.env.ABC_DEV_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;
      if (!process.env.NEYNAR_API_KEY || !devSignerUuid) {
        console.log('⚠️ Farcaster credentials not configured, skipping cast');
        return null;
      }

      const { NeynarAPIClient } = await import('@neynar/nodejs-sdk');
      const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

      console.log(`📢 Posting ABC staking stats from @abc-dao-dev (signer: ${devSignerUuid})`);
      const cast = await neynar.publishCast(devSignerUuid, castText);
      console.log(`✅ Staking stats cast published: ${cast.cast.hash}`);
      
      return {
        castHash: cast.cast.hash,
        castUrl: `https://warpcast.com/${cast.cast.author.username}/${cast.cast.hash}`
      };
      
    } catch (error) {
      console.error('❌ Failed to post staking stats cast:', error.message);
      // Don't throw - posting failure shouldn't break the process
      return null;
    }
  }

  /**
   * Record the staking stats update in database for tracking
   */
  async recordStakingStatsUpdate(blockchainData, dbMetrics, castResult) {
    try {
      const pool = getPool();
      
      // Create table if it doesn't exist
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
        parseFloat(blockchainData.totalStaked),
        blockchainData.stakingRatio,
        dbMetrics.currentAPY,
        parseFloat(blockchainData.totalRewardsDistributed),
        dbMetrics.rewardsPoolBalance,
        dbMetrics.uniqueStakers || 0,
        dbMetrics.activityStats?.totalStakes || 0,
        dbMetrics.activityStats?.totalUnstakes || 0,
        castResult?.castHash || null,
        castResult?.castUrl || null
      ]);

      console.log(`📝 Staking stats update recorded in database`);
      return result.rows[0];
      
    } catch (error) {
      console.warn(`⚠️ Error recording staking stats update:`, error.message);
      // Don't throw - recording failure shouldn't break the process
    }
  }

  /**
   * Main ABC staking statistics processing function
   */
  async processABCStakingStats() {
    try {
      console.log('🔒 ABC DAO Staking Statistics Processor');
      console.log('=====================================\n');
      
      console.log('📋 Configuration:');
      console.log(`- Staking Contract: ${this.stakingContractAddress}`);
      console.log(`- ABC Token: ${this.abcTokenAddress}`);
      console.log(`- Network: Base Mainnet\n`);
      
      // 1. Get blockchain staking data
      const blockchainData = await this.getBlockchainStakingData();
      
      // 2. Get database metrics
      const dbMetrics = await this.getDatabaseStakingMetrics();
      
      // 3. Create the cast message
      const castText = this.createStakingStatsCastMessage(blockchainData, dbMetrics);
      
      console.log('\n📢 Cast Message Preview:');
      console.log('========================');
      console.log(castText);
      console.log('========================\n');
      
      // 4. Post to Farcaster
      const castResult = await this.postStakingStatsCast(castText);
      
      // 5. Record the update
      await this.recordStakingStatsUpdate(blockchainData, dbMetrics, castResult);
      
      console.log('\n🎉 ABC Staking Stats Update Complete!');
      console.log('====================================');
      console.log(`✓ Total Staked: ${this.formatNumber(blockchainData.totalStaked)} ABC`);
      console.log(`✓ Staking Ratio: ${blockchainData.stakingRatio.toFixed(2)}%`);
      console.log(`✓ Current APY: ${dbMetrics.currentAPY.toFixed(2)}%`);
      if (castResult) {
        console.log(`✓ Cast Published: ${castResult.castHash}`);
      }
      
    } catch (error) {
      console.error('❌ ABC staking stats processing failed:', error);
      throw error;
    }
  }

  /**
   * Run staking stats update immediately (for testing)
   */
  async runNow() {
    console.log('🚀 Running ABC staking stats update immediately...\n');
    
    if (this.isRunning) {
      console.log('⚠️ Already running, please wait...');
      return;
    }

    this.isRunning = true;
    try {
      await this.processABCStakingStats();
      console.log('✅ Manual ABC staking stats update completed');
    } catch (error) {
      console.error('❌ Manual ABC staking stats update failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get next scheduled run time
   */
  getNextRun() {
    const now = new Date();
    const nextRun = new Date(now);
    
    // Set to 10:00 UTC today (10:00 AM)
    nextRun.setUTCHours(10, 0, 0, 0);
    
    // If we've already passed 10:00 today, schedule for tomorrow
    if (now.getTime() > nextRun.getTime()) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }
    
    return nextRun;
  }

  /**
   * Validate configuration
   */
  validateConfiguration() {
    const issues = [];
    
    if (!this.stakingContractAddress) {
      issues.push('STAKING_CONTRACT_ADDRESS environment variable not set');
    }
    
    if (!this.abcTokenAddress) {
      issues.push('ABC_TOKEN_ADDRESS environment variable not set');
    }
    
    if (!process.env.BASE_RPC_URL) {
      issues.push('BASE_RPC_URL environment variable not set (using default)');
    }
    
    if (!process.env.NEYNAR_API_KEY) {
      issues.push('NEYNAR_API_KEY not set (cast posting will be skipped)');
    }
    
    if (issues.length > 0) {
      console.log('⚠️ Configuration Issues:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
    }
    
    return issues.length === 0;
  }
}

export { ABCStakingStatsCron };