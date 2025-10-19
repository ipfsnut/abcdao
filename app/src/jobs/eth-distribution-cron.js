import cron from 'node-cron';
import { ethers } from 'ethers';

class EthDistributionCron {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.protocolWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, this.provider);
    this.isRunning = false;
    
    // Distribution addresses
    this.stakingContract = process.env.STAKING_CONTRACT_ADDRESS;
    
    // Configuration
    this.minBalanceThreshold = ethers.parseEther('0.01'); // Only distribute if > 0.01 ETH
    this.gasReserve = ethers.parseEther('0.005'); // Keep 0.005 ETH for gas
    this.stakingPercentage = 25; // 25% to staking contract only
  }

  /**
   * Start the cron job to check for ETH distribution daily
   */
  start() {
    console.log('⏰ Starting ETH distribution cron job (daily at 12:00 PM UTC)...');
    
    // Run daily at 12:00 PM UTC
    this.cronJob = cron.schedule('0 12 * * *', async () => {
      if (this.isRunning) {
        console.log('⚠️ ETH distribution already running, skipping...');
        return;
      }

      this.isRunning = true;
      const timestamp = new Date().toISOString();
      
      try {
        console.log(`\n🕐 [${timestamp}] Starting scheduled ETH distribution...`);
        await this.processEthDistribution();
        console.log(`✅ [${timestamp}] Scheduled ETH distribution completed\n`);
      } catch (error) {
        console.error(`❌ [${timestamp}] Scheduled ETH distribution failed:`, error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('✅ ETH distribution cron job started');
    console.log('   - Runs daily at 12:00 PM UTC');
    console.log('   - Distributes 25% to staking contract');
    console.log('   - Keeps 75% + gas reserves in protocol wallet\n');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 ETH distribution cron job stopped');
    }
  }

  /**
   * Get current protocol wallet balance and calculate distribution amounts
   */
  async calculateDistribution() {
    const balance = await this.provider.getBalance(this.protocolWallet.address);
    const availableBalance = balance - this.gasReserve;
    
    console.log(`💰 Protocol wallet balance: ${ethers.formatEther(balance)} ETH`);
    console.log(`⛽ Gas reserve: ${ethers.formatEther(this.gasReserve)} ETH`);
    console.log(`📊 Available for distribution: ${ethers.formatEther(availableBalance)} ETH`);
    
    if (balance < this.minBalanceThreshold) {
      console.log(`⚠️ Balance below threshold (${ethers.formatEther(this.minBalanceThreshold)} ETH), skipping distribution`);
      return null;
    }
    
    if (availableBalance <= 0) {
      console.log('⚠️ No ETH available for distribution after gas reserves');
      return null;
    }
    
    // Calculate percentage amounts (convert to basis points for BigInt compatibility)
    const basisPoints = Math.floor(this.stakingPercentage * 100); // 25% = 2500 basis points
    const amountToStaking = (availableBalance * BigInt(basisPoints)) / BigInt(10000);
    const remaining = balance - amountToStaking;
    
    return {
      totalBalance: balance,
      availableBalance,
      amountToStaking,
      remaining,
      stakingPercent: this.stakingPercentage,
      remainingPercent: 100 - this.stakingPercentage
    };
  }

  /**
   * Execute ETH distribution transactions
   */
  async executeDistribution(distribution) {
    const transactions = [];
    
    console.log('\n🚀 Executing ETH distribution...');
    console.log(`📤 Sending ${ethers.formatEther(distribution.amountToStaking)} ETH to staking contract...`);
    
    try {
      // Send to staking contract
      const stakingTx = await this.protocolWallet.sendTransaction({
        to: this.stakingContract,
        value: distribution.amountToStaking,
        gasLimit: 50000 // Basic transfer
      });
      
      console.log(`✅ Staking transaction sent: ${stakingTx.hash}`);
      transactions.push({ type: 'staking', tx: stakingTx });
      
      // Wait for confirmation
      await stakingTx.wait();
      console.log(`✅ Staking transaction confirmed`);
      
      // Record distribution in database
      try {
        const recordResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/distributions/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionHash: stakingTx.hash,
            ethAmount: parseFloat(ethers.formatEther(distribution.amountToStaking)),
            totalStaked: 711483264, // Would ideally get from staking contract
            stakersCount: 15 // Would ideally track this
          })
        });
        
        if (recordResponse.ok) {
          console.log(`✅ Distribution recorded in database`);
        } else {
          console.warn(`⚠️ Failed to record distribution in database`);
        }
      } catch (recordError) {
        console.warn(`⚠️ Error recording distribution:`, recordError.message);
      }
      
    } catch (error) {
      console.error('❌ Staking transaction failed:', error.message);
      throw error;
    }
    
    return transactions;
  }

  /**
   * Announce distribution on Farcaster
   */
  async announceDistribution(distribution, transactions) {
    try {
      if (!process.env.NEYNAR_API_KEY || !process.env.NEYNAR_SIGNER_UUID) {
        console.log('⚠️ Farcaster credentials not configured, skipping announcement');
        return;
      }

      const { NeynarAPIClient, Configuration } = await import('@neynar/nodejs-sdk');
      const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
      const neynar = new NeynarAPIClient(config);

      const totalDistributed = distribution.amountToStaking;
      const stakingTxHash = transactions.find(t => t.type === 'staking')?.tx.hash;

      const castText = `💰 ETH DISTRIBUTION COMPLETE!\\n\\n` +
        `📊 Distributed: ${ethers.formatEther(totalDistributed)} ETH\\n` +
        `🏦 ${distribution.stakingPercent}% → Staking Contract\\n` +
        `🤖 ${distribution.remainingPercent}% → Protocol Operations\\n\\n` +
        `🔗 Staking: basescan.org/tx/${stakingTxHash}\\n\\n` +
        `#ABCDAO #AutomatedETHDistribution`;

      const cast = await neynar.publishCast(process.env.NEYNAR_SIGNER_UUID, castText);
      console.log(`✅ Distribution announced: ${cast.cast.hash}`);
      
    } catch (error) {
      console.error('❌ Failed to announce distribution:', error.message);
      // Don't throw - announcement failure shouldn't break the process
    }
  }

  /**
   * Main distribution process
   */
  async processEthDistribution() {
    try {
      console.log('🤖 ABC DAO ETH Distribution Processor');
      console.log('====================================\\n');
      
      // Validate configuration
      if (!this.stakingContract) {
        throw new Error('STAKING_CONTRACT_ADDRESS not configured');
      }
      
      console.log('📋 Distribution Configuration:');
      console.log(`- Protocol Wallet: ${this.protocolWallet.address}`);
      console.log(`- Staking Contract: ${this.stakingContract}`);
      console.log(`- Distribution: ${this.stakingPercentage}%/${100 - this.stakingPercentage}%\\n`);
      
      // Calculate distribution
      const distribution = await this.calculateDistribution();
      
      if (!distribution) {
        console.log('✅ No distribution needed at this time');
        return;
      }
      
      console.log('\\n📊 Distribution Plan:');
      console.log(`- ${distribution.stakingPercent}% to Staking: ${ethers.formatEther(distribution.amountToStaking)} ETH`);
      console.log(`- ${distribution.remainingPercent}% remaining: ${ethers.formatEther(distribution.remaining)} ETH`);
      
      // Execute transactions
      const transactions = await this.executeDistribution(distribution);
      
      // Announce on social media
      await this.announceDistribution(distribution, transactions);
      
      console.log('\\n🎉 ETH Distribution Complete!');
      console.log('================================');
      console.log(`✓ Staking: ${ethers.formatEther(distribution.amountToStaking)} ETH`);
      console.log(`✓ Remaining: ${ethers.formatEther(distribution.remaining)} ETH`);
      
    } catch (error) {
      console.error('❌ ETH distribution processing failed:', error);
      throw error;
    }
  }

  /**
   * Run distribution immediately (for testing)
   */
  async runNow() {
    console.log('🚀 Running ETH distribution immediately...\\n');
    
    if (this.isRunning) {
      console.log('⚠️ Already running, please wait...');
      return;
    }

    this.isRunning = true;
    try {
      await this.processEthDistribution();
      console.log('✅ Manual ETH distribution completed');
    } catch (error) {
      console.error('❌ Manual ETH distribution failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get next scheduled run times
   */
  getNextRuns() {
    const now = new Date();
    const nextDaily = new Date(now);
    const followingDaily = new Date(now);
    
    // Find next daily run at 12:00 PM UTC
    const currentHour = now.getUTCHours();
    
    if (currentHour >= 12) {
      // If it's already past 12 PM today, schedule for tomorrow
      nextDaily.setUTCDate(nextDaily.getUTCDate() + 1);
    }
    nextDaily.setUTCHours(12, 0, 0, 0);
    
    // Following run is 24 hours later
    followingDaily.setTime(nextDaily.getTime() + (24 * 60 * 60 * 1000));

    return {
      next: nextDaily,
      following: followingDaily
    };
  }
}

export { EthDistributionCron };