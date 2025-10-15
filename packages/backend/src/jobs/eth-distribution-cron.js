import cron from 'node-cron';
import { ethers } from 'ethers';

class EthDistributionCron {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.protocolWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, this.provider);
    this.isRunning = false;
    
    // Distribution addresses
    this.stakingContract = process.env.STAKING_CONTRACT_ADDRESS;
    this.treasuryAddress = '0x18A85ad341b2D6A2bd67fbb104B4827B922a2A3c';
    
    // Configuration
    this.minBalanceThreshold = ethers.parseEther('0.01'); // Only distribute if > 0.01 ETH
    this.gasReserve = ethers.parseEther('0.005'); // Keep 0.005 ETH for gas
    this.distributionPercentage = 25; // 25% to each destination
  }

  /**
   * Start the cron job to check for ETH distribution every 6 hours
   */
  start() {
    console.log('⏰ Starting ETH distribution cron job (every 6 hours)...');
    
    // Run every 6 hours at minute 0
    this.cronJob = cron.schedule('0 */6 * * *', async () => {
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
    console.log('   - Runs every 6 hours');
    console.log('   - Distributes 25% to staking contract');
    console.log('   - Distributes 25% to treasury address');
    console.log('   - Keeps 50% + gas reserves in protocol wallet\n');
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
    const basisPoints = Math.floor(this.distributionPercentage * 100); // 0.25% = 25 basis points
    const amountToStaking = (availableBalance * BigInt(basisPoints)) / BigInt(10000);
    const amountToTreasury = (availableBalance * BigInt(basisPoints)) / BigInt(10000);
    const remaining = balance - amountToStaking - amountToTreasury;
    
    return {
      totalBalance: balance,
      availableBalance,
      amountToStaking,
      amountToTreasury,
      remaining,
      stakingPercent: this.distributionPercentage,
      treasuryPercent: this.distributionPercentage,
      remainingPercent: 100 - (this.distributionPercentage * 2)
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
      
    } catch (error) {
      console.error('❌ Staking transaction failed:', error.message);
      throw error;
    }
    
    console.log(`📤 Sending ${ethers.formatEther(distribution.amountToTreasury)} ETH to treasury...`);
    
    try {
      // Send to treasury
      const treasuryTx = await this.protocolWallet.sendTransaction({
        to: this.treasuryAddress,
        value: distribution.amountToTreasury,
        gasLimit: 50000 // Basic transfer
      });
      
      console.log(`✅ Treasury transaction sent: ${treasuryTx.hash}`);
      transactions.push({ type: 'treasury', tx: treasuryTx });
      
      // Wait for confirmation
      await treasuryTx.wait();
      console.log(`✅ Treasury transaction confirmed`);
      
    } catch (error) {
      console.error('❌ Treasury transaction failed:', error.message);
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

      const totalDistributed = distribution.amountToStaking + distribution.amountToTreasury;
      const stakingTxHash = transactions.find(t => t.type === 'staking')?.tx.hash;
      const treasuryTxHash = transactions.find(t => t.type === 'treasury')?.tx.hash;

      const castText = `💰 ETH DISTRIBUTION COMPLETE!\\n\\n` +
        `📊 Distributed: ${ethers.formatEther(totalDistributed)} ETH\\n` +
        `🏦 ${distribution.stakingPercent}% → Staking Contract\\n` +
        `🏛️ ${distribution.treasuryPercent}% → Treasury\\n` +
        `🤖 ${distribution.remainingPercent}% → Protocol Operations\\n\\n` +
        `🔗 Staking: basescan.org/tx/${stakingTxHash}\\n` +
        `🔗 Treasury: basescan.org/tx/${treasuryTxHash}\\n\\n` +
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
      console.log(`- Treasury Address: ${this.treasuryAddress}`);
      console.log(`- Distribution: ${this.distributionPercentage}%/${this.distributionPercentage}%/${100 - (this.distributionPercentage * 2)}%\\n`);
      
      // Calculate distribution
      const distribution = await this.calculateDistribution();
      
      if (!distribution) {
        console.log('✅ No distribution needed at this time');
        return;
      }
      
      console.log('\\n📊 Distribution Plan:');
      console.log(`- ${distribution.stakingPercent}% to Staking: ${ethers.formatEther(distribution.amountToStaking)} ETH`);
      console.log(`- ${distribution.treasuryPercent}% to Treasury: ${ethers.formatEther(distribution.amountToTreasury)} ETH`);
      console.log(`- ${distribution.remainingPercent}% remaining: ${ethers.formatEther(distribution.remaining)} ETH`);
      
      // Execute transactions
      const transactions = await this.executeDistribution(distribution);
      
      // Announce on social media
      await this.announceDistribution(distribution, transactions);
      
      console.log('\\n🎉 ETH Distribution Complete!');
      console.log('================================');
      console.log(`✓ Staking: ${ethers.formatEther(distribution.amountToStaking)} ETH`);
      console.log(`✓ Treasury: ${ethers.formatEther(distribution.amountToTreasury)} ETH`);
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
    const next6h = new Date(now);
    const next12h = new Date(now);
    
    // Find next 6-hour interval (0, 6, 12, 18)
    const currentHour = now.getUTCHours();
    const nextHour = Math.ceil((currentHour + 1) / 6) * 6;
    
    next6h.setUTCHours(nextHour % 24, 0, 0, 0);
    if (nextHour >= 24) {
      next6h.setUTCDate(next6h.getUTCDate() + 1);
    }
    
    next12h.setTime(next6h.getTime() + (6 * 60 * 60 * 1000));

    return {
      next: next6h,
      following: next12h
    };
  }
}

export { EthDistributionCron };