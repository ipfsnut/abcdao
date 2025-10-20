import cron from 'node-cron';
import { ethers } from 'ethers';
import { getPool } from '../services/database.js';

/**
 * ABC Token Statistics Cron Job
 * 
 * Automatically posts daily statistics about:
 * - Protocol wallet $ABC token balance
 * - Total $ABC tokens claimed as rewards by developers
 * - Protocol treasury status
 */
class ABCTokenStatsCron {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.protocolWalletAddress = process.env.PROTOCOL_WALLET_ADDRESS || process.env.BOT_WALLET_ADDRESS || '0xBE6525b767cA8D38d169C93C8120c0C0957388B8';
    this.abcTokenAddress = process.env.ABC_TOKEN_ADDRESS || '0x5c0872b790bb73e2b3a9778db6e7704095624b07';
    this.rewardsContractAddress = process.env.ABC_REWARDS_CONTRACT_ADDRESS || '0x03CD0F799B4C04DbC22bFAAd35A3F36751F3446c';
    this.isRunning = false;
    
    // ABC Token ABI for balance queries
    this.abcTokenABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
      'function totalSupply() view returns (uint256)'
    ];
    
    // Rewards contract ABI for statistics
    this.rewardsContractABI = [
      'function getContractStats() view returns (uint256, uint256, uint256, uint256)',
      'function getTotalRewardsClaimed() view returns (uint256)'
    ];
    
    this.abcContract = new ethers.Contract(
      this.abcTokenAddress,
      this.abcTokenABI,
      this.provider
    );
    
    if (this.rewardsContractAddress) {
      this.rewardsContract = new ethers.Contract(
        this.rewardsContractAddress,
        this.rewardsContractABI,
        this.provider
      );
    }
  }

  /**
   * Start the cron job to post ABC token statistics
   * Runs daily at a configurable time (default: 2:00 PM UTC)
   */
  start() {
    console.log('📊 Starting ABC Token Statistics cron job...');
    
    // Run daily at 2:00 PM UTC (customize as needed)
    this.cronJob = cron.schedule('0 14 * * *', async () => {
      if (this.isRunning) {
        console.log('⚠️ ABC token stats job already running, skipping...');
        return;
      }

      this.isRunning = true;
      const timestamp = new Date().toISOString();
      
      try {
        console.log(`\n📊 [${timestamp}] Starting daily ABC token statistics update...`);
        await this.processABCTokenStats();
        console.log(`✅ [${timestamp}] Daily ABC token statistics completed\n`);
      } catch (error) {
        console.error(`❌ [${timestamp}] ABC token statistics failed:`, error);
      } finally {
        this.isRunning = false;
      }
    }, {
      timezone: 'UTC'
    });

    console.log('✅ ABC Token Statistics cron job started');
    console.log('   - Runs daily at 2:00 PM UTC');
    console.log('   - Posts protocol wallet ABC balance');
    console.log('   - Posts total ABC tokens claimed as rewards');
    console.log('   - Provides treasury transparency\n');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 ABC Token Statistics cron job stopped');
    }
  }

  /**
   * Get protocol wallet ABC token balance
   */
  async getProtocolABCBalance() {
    try {
      console.log(`🔍 Checking protocol wallet ABC balance: ${this.protocolWalletAddress}`);
      
      const balance = await this.abcContract.balanceOf(this.protocolWalletAddress);
      const decimals = await this.abcContract.decimals();
      const balanceFormatted = ethers.formatUnits(balance, decimals);
      
      console.log(`💰 Protocol wallet ABC balance: ${balanceFormatted} ABC`);
      
      return {
        raw: balance,
        formatted: balanceFormatted,
        decimals: decimals
      };
      
    } catch (error) {
      console.error('❌ Error fetching protocol ABC balance:', error.message);
      throw error;
    }
  }

  /**
   * Get total ABC tokens claimed as rewards from database
   */
  async getTotalClaimedRewards() {
    try {
      console.log('🔍 Calculating total ABC tokens claimed as developer rewards...');
      
      const pool = getPool();
      
      // Get total claimed rewards from database
      const result = await pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN commits.reward_status = 'claimed' THEN commits.reward_amount ELSE 0 END), 0) as total_claimed_rewards,
          COALESCE(SUM(CASE WHEN commits.reward_status = 'claimable' THEN commits.reward_amount ELSE 0 END), 0) as total_allocated_rewards,
          COALESCE(SUM(CASE WHEN commits.reward_status = 'pending' THEN commits.reward_amount ELSE 0 END), 0) as total_pending_rewards,
          COUNT(DISTINCT CASE WHEN commits.reward_status IN ('claimed', 'claimable') THEN users.id END) as unique_developers_rewarded,
          COUNT(CASE WHEN commits.reward_status IN ('claimed', 'claimable', 'pending') AND commits.reward_amount > 0 THEN 1 END) as total_reward_commits
        FROM commits
        JOIN users ON commits.user_id = users.id
        WHERE commits.reward_amount > 0
      `);
      
      const stats = result.rows[0];
      
      console.log(`💎 Total claimed rewards: ${stats.total_claimed_rewards} ABC`);
      console.log(`🔄 Total allocated rewards: ${stats.total_allocated_rewards} ABC`);
      console.log(`⏳ Total pending rewards: ${stats.total_pending_rewards} ABC`);
      console.log(`👨‍💻 Unique developers rewarded: ${stats.unique_developers_rewarded}`);
      console.log(`📝 Total reward-earning commits: ${stats.total_reward_commits}`);
      
      return {
        totalClaimed: parseFloat(stats.total_claimed_rewards),
        totalAllocated: parseFloat(stats.total_allocated_rewards),
        totalPending: parseFloat(stats.total_pending_rewards),
        uniqueDevelopers: parseInt(stats.unique_developers_rewarded),
        totalCommits: parseInt(stats.total_reward_commits),
        totalDistributed: parseFloat(stats.total_claimed_rewards) + parseFloat(stats.total_allocated_rewards)
      };
      
    } catch (error) {
      console.error('❌ Error fetching reward statistics:', error.message);
      throw error;
    }
  }

  /**
   * Get additional treasury context
   */
  async getTreasuryContext() {
    try {
      // Get ABC token total supply for context
      const totalSupply = await this.abcContract.totalSupply();
      const decimals = await this.abcContract.decimals();
      const totalSupplyFormatted = ethers.formatUnits(totalSupply, decimals);
      
      return {
        totalSupply: totalSupplyFormatted,
        decimals: decimals
      };
      
    } catch (error) {
      console.warn('⚠️ Could not fetch treasury context:', error.message);
      return {
        totalSupply: '100000000000', // 100B fallback
        decimals: 18
      };
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
   * Create the statistics cast message
   */
  async createStatsCastMessage(protocolBalance, rewardStats, treasuryContext) {
    const protocolBalanceFormatted = this.formatNumber(protocolBalance.formatted);
    const totalDistributedFormatted = this.formatNumber(rewardStats.totalDistributed);
    const totalSupplyFormatted = this.formatNumber(treasuryContext.totalSupply);
    
    // Calculate percentages
    const protocolPercentage = ((parseFloat(protocolBalance.formatted) / parseFloat(treasuryContext.totalSupply)) * 100).toFixed(2);
    const distributedPercentage = ((rewardStats.totalDistributed / parseFloat(treasuryContext.totalSupply)) * 100).toFixed(2);
    
    const castText = `📊 DAILY $ABC TOKEN STATS

🏦 Protocol Treasury: ${protocolBalanceFormatted} ABC (${protocolPercentage}%)
🎁 Dev Rewards Distributed: ${totalDistributedFormatted} ABC (${distributedPercentage}%)
👨‍💻 Developers Rewarded: ${rewardStats.uniqueDevelopers}
📝 Reward-Earning Commits: ${rewardStats.totalCommits}

📈 Total Supply: ${totalSupplyFormatted} ABC
🔗 Treasury: ${this.protocolWalletAddress.slice(0,6)}...${this.protocolWalletAddress.slice(-4)}

#ABCDAO #Transparency #DeveloperRewards`;

    return castText;
  }

  /**
   * Post the statistics to Farcaster
   */
  async postStatsCast(castText) {
    try {
      const devSignerUuid = process.env.ABC_DEV_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;
      if (!process.env.NEYNAR_API_KEY || !devSignerUuid) {
        console.log('⚠️ Farcaster credentials not configured, skipping cast');
        return null;
      }

      const { NeynarAPIClient } = await import('@neynar/nodejs-sdk');
      const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

      console.log(`📢 Posting ABC token stats from @abc-dao-dev (signer: ${devSignerUuid})`);
      const cast = await neynar.publishCast(devSignerUuid, castText);
      console.log(`✅ Stats cast published: ${cast.cast.hash}`);
      
      return {
        castHash: cast.cast.hash,
        castUrl: `https://warpcast.com/${cast.cast.author.username}/${cast.cast.hash}`
      };
      
    } catch (error) {
      console.error('❌ Failed to post stats cast:', error.message);
      // Don't throw - posting failure shouldn't break the process
      return null;
    }
  }

  /**
   * Record the stats update in database for tracking
   */
  async recordStatsUpdate(protocolBalance, rewardStats, castResult) {
    try {
      const pool = getPool();
      
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS abc_token_stats_updates (
          id SERIAL PRIMARY KEY,
          update_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          protocol_balance DECIMAL(30, 6) NOT NULL,
          total_claimed_rewards DECIMAL(30, 6) NOT NULL,
          total_allocated_rewards DECIMAL(30, 6) NOT NULL,
          total_pending_rewards DECIMAL(30, 6) NOT NULL,
          unique_developers INTEGER NOT NULL,
          total_commits INTEGER NOT NULL,
          cast_hash VARCHAR(66),
          cast_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Insert the stats record
      const result = await pool.query(`
        INSERT INTO abc_token_stats_updates (
          protocol_balance, 
          total_claimed_rewards, 
          total_allocated_rewards,
          total_pending_rewards,
          unique_developers,
          total_commits,
          cast_hash,
          cast_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        parseFloat(protocolBalance.formatted),
        rewardStats.totalClaimed,
        rewardStats.totalAllocated,
        rewardStats.totalPending,
        rewardStats.uniqueDevelopers,
        rewardStats.totalCommits,
        castResult?.castHash || null,
        castResult?.castUrl || null
      ]);

      console.log(`📝 Stats update recorded in database`);
      return result.rows[0];
      
    } catch (error) {
      console.warn(`⚠️ Error recording stats update:`, error.message);
      // Don't throw - recording failure shouldn't break the process
    }
  }

  /**
   * Main ABC token statistics processing function
   */
  async processABCTokenStats() {
    try {
      console.log('📊 ABC DAO Token Statistics Processor');
      console.log('===================================\n');
      
      console.log('📋 Configuration:');
      console.log(`- Protocol Wallet: ${this.protocolWalletAddress}`);
      console.log(`- ABC Token: ${this.abcTokenAddress}`);
      console.log(`- Rewards Contract: ${this.rewardsContractAddress || 'Not configured'}`);
      console.log(`- Network: Base Mainnet\n`);
      
      // 1. Get protocol wallet ABC balance
      const protocolBalance = await this.getProtocolABCBalance();
      
      // 2. Get total claimed rewards statistics
      const rewardStats = await this.getTotalClaimedRewards();
      
      // 3. Get treasury context (total supply, etc.)
      const treasuryContext = await this.getTreasuryContext();
      
      // 4. Create the cast message
      const castText = await this.createStatsCastMessage(protocolBalance, rewardStats, treasuryContext);
      
      console.log('\n📢 Cast Message Preview:');
      console.log('========================');
      console.log(castText);
      console.log('========================\n');
      
      // 5. Post to Farcaster
      const castResult = await this.postStatsCast(castText);
      
      // 6. Record the update
      await this.recordStatsUpdate(protocolBalance, rewardStats, castResult);
      
      console.log('\n🎉 ABC Token Stats Update Complete!');
      console.log('==================================');
      console.log(`✓ Protocol Balance: ${this.formatNumber(protocolBalance.formatted)} ABC`);
      console.log(`✓ Rewards Distributed: ${this.formatNumber(rewardStats.totalDistributed)} ABC`);
      console.log(`✓ Developers Rewarded: ${rewardStats.uniqueDevelopers}`);
      if (castResult) {
        console.log(`✓ Cast Published: ${castResult.castHash}`);
      }
      
    } catch (error) {
      console.error('❌ ABC token stats processing failed:', error);
      throw error;
    }
  }

  /**
   * Run stats update immediately (for testing)
   */
  async runNow() {
    console.log('🚀 Running ABC token stats update immediately...\n');
    
    if (this.isRunning) {
      console.log('⚠️ Already running, please wait...');
      return;
    }

    this.isRunning = true;
    try {
      await this.processABCTokenStats();
      console.log('✅ Manual ABC token stats update completed');
    } catch (error) {
      console.error('❌ Manual ABC token stats update failed:', error);
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
    
    // Set to 14:00 UTC today (2:00 PM)
    nextRun.setUTCHours(14, 0, 0, 0);
    
    // If we've already passed 14:00 today, schedule for tomorrow
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
    
    if (!this.abcTokenAddress) {
      issues.push('ABC_TOKEN_ADDRESS environment variable not set');
    }
    
    if (!this.protocolWalletAddress) {
      issues.push('PROTOCOL_WALLET_ADDRESS environment variable not set');
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

export { ABCTokenStatsCron };