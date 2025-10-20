import cron from 'node-cron';
import { ethers } from 'ethers';

/**
 * Production-Grade WETH Unwrap Cron Job
 * 
 * Features:
 * - Daily unwrapping at 11:00 PM UTC
 * - Comprehensive error handling with retries
 * - Gas price optimization
 * - Monitoring and alerting
 * - Database logging
 * - Graceful failure handling
 * - Configuration validation
 */
class WethUnwrapCron {
  constructor() {
    this.isRunning = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 30000; // 30 seconds
    this.lastSuccessTime = null;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
    
    // Configuration
    this.config = {
      rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      privateKey: process.env.BOT_WALLET_PRIVATE_KEY,
      wethAddress: '0x4200000000000000000000000000000000000006', // Base WETH
      minUnwrapThreshold: '0.001', // ETH minimum to unwrap
      maxGasPrice: '50', // Gwei maximum
      gasLimit: '50000', // Gas limit for unwrap transaction
      cronSchedule: '0 23 * * *', // 11:00 PM UTC daily
      timezone: 'UTC'
    };
    
    // Contract ABI
    this.wethAbi = [
      "function balanceOf(address) view returns (uint256)",
      "function withdraw(uint256) external",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)"
    ];
    
    // Note: Initialize should be called separately for async setup
  }

  /**
   * Initialize the cron job with validation
   */
  async initialize() {
    try {
      this.validateConfiguration();
      this.setupProvider();
      await this.setupWallet();
      console.log('✅ WETH Unwrap Cron initialized successfully');
    } catch (error) {
      console.error('❌ WETH Unwrap Cron initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate all required configuration
   */
  validateConfiguration() {
    const required = [
      { key: 'privateKey', env: 'BOT_WALLET_PRIVATE_KEY' },
    ];

    const missing = required.filter(item => !this.config[item.key] && !process.env[item.env]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.map(m => m.env).join(', ')}`);
    }

    // Validate private key format
    if (!this.config.privateKey.startsWith('0x') || this.config.privateKey.length !== 66) {
      throw new Error('Invalid private key format');
    }

    console.log('✅ Configuration validation passed');
  }

  /**
   * Setup blockchain provider with retry logic
   */
  setupProvider() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      console.log(`✅ Provider connected: ${this.config.rpcUrl}`);
    } catch (error) {
      throw new Error(`Failed to setup provider: ${error.message}`);
    }
  }

  /**
   * Setup wallet and verify connection
   */
  async setupWallet() {
    try {
      this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
      
      // Verify wallet can connect
      const balance = await this.provider.getBalance(this.wallet.address);
      console.log(`✅ Wallet connected: ${this.wallet.address}`);
      console.log(`   ETH Balance: ${ethers.formatEther(balance)} ETH`);
      
      // Setup WETH contract
      this.wethContract = new ethers.Contract(
        this.config.wethAddress, 
        this.wethAbi, 
        this.wallet
      );
      
    } catch (error) {
      throw new Error(`Failed to setup wallet: ${error.message}`);
    }
  }

  /**
   * Start the cron job
   */
  start() {
    console.log('⏰ Starting WETH unwrap cron job...');
    
    this.cronJob = cron.schedule(this.config.cronSchedule, async () => {
      await this.executeWithRetry();
    }, {
      timezone: this.config.timezone,
      runOnInit: false
    });

    console.log('✅ WETH unwrap cron job started');
    console.log(`   - Schedule: ${this.config.cronSchedule} (${this.config.timezone})`);
    console.log(`   - Next run: ${this.getNextRunTime()}`);
    console.log(`   - Min threshold: ${this.config.minUnwrapThreshold} ETH`);
    console.log(`   - Max gas price: ${this.config.maxGasPrice} Gwei\n`);
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 WETH unwrap cron job stopped');
    }
  }

  /**
   * Execute unwrap with retry logic
   */
  async executeWithRetry() {
    if (this.isRunning) {
      console.log('⚠️ WETH unwrap already running, skipping...');
      return;
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.isRunning = true;
        this.retryCount = attempt - 1;
        
        console.log(`\n🔄 WETH Unwrap Attempt ${attempt}/${this.maxRetries}`);
        console.log(`   Time: ${new Date().toISOString()}`);
        
        await this.processWethUnwrap();
        
        // Success!
        this.lastSuccessTime = new Date();
        this.consecutiveFailures = 0;
        console.log('✅ WETH unwrap completed successfully');
        return;
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ Retrying in ${this.retryDelay / 1000} seconds...`);
          await this.sleep(this.retryDelay);
        } else {
          // All retries failed
          this.consecutiveFailures++;
          console.error(`❌ All ${this.maxRetries} attempts failed`);
          
          // Alert if too many consecutive failures
          if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
            await this.sendAlert(`WETH unwrap has failed ${this.consecutiveFailures} times in a row`);
          }
        }
      } finally {
        this.isRunning = false;
      }
    }
  }

  /**
   * Main unwrap processing logic
   */
  async processWethUnwrap() {
    console.log('🔄 Starting WETH unwrap process...');
    
    // Step 1: Check WETH balance
    const balanceInfo = await this.checkWethBalance();
    
    if (!balanceInfo.shouldUnwrap) {
      console.log(`✅ No significant WETH to unwrap (${balanceInfo.formatted} < ${this.config.minUnwrapThreshold} ETH)`);
      return;
    }
    
    // Step 2: Check gas prices
    await this.validateGasPrices();
    
    // Step 3: Execute unwrap
    const unwrapResult = await this.executeUnwrap(balanceInfo);
    
    // Step 4: Record transaction
    await this.recordTransaction(unwrapResult);
    
    // Step 5: Send notifications (if significant)
    await this.sendNotifications(unwrapResult);
    
    console.log('✅ WETH unwrap process completed');
    return unwrapResult;
  }

  /**
   * Check WETH balance with validation
   */
  async checkWethBalance() {
    try {
      console.log(`🔍 Checking WETH balance for ${this.wallet.address}...`);
      
      const wethBalance = await this.wethContract.balanceOf(this.wallet.address);
      const formatted = ethers.formatEther(wethBalance);
      const threshold = ethers.parseEther(this.config.minUnwrapThreshold);
      
      console.log(`💰 WETH Balance: ${formatted} WETH`);
      
      return {
        balance: wethBalance,
        formatted: formatted,
        shouldUnwrap: wethBalance > threshold,
        threshold: this.config.minUnwrapThreshold
      };
      
    } catch (error) {
      throw new Error(`Failed to check WETH balance: ${error.message}`);
    }
  }

  /**
   * Validate current gas prices
   */
  async validateGasPrices() {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPriceGwei = parseFloat(ethers.formatUnits(feeData.gasPrice || 0n, 'gwei'));
      
      console.log(`⛽ Current gas price: ${gasPriceGwei.toFixed(2)} Gwei`);
      
      if (gasPriceGwei > parseFloat(this.config.maxGasPrice)) {
        throw new Error(`Gas price too high: ${gasPriceGwei} > ${this.config.maxGasPrice} Gwei`);
      }
      
      return feeData;
    } catch (error) {
      throw new Error(`Gas price validation failed: ${error.message}`);
    }
  }

  /**
   * Execute the WETH unwrap transaction
   */
  async executeUnwrap(balanceInfo) {
    try {
      console.log(`🔄 Unwrapping ${balanceInfo.formatted} WETH...`);
      
      // Get balances before
      const ethBefore = await this.provider.getBalance(this.wallet.address);
      
      // Estimate gas
      const gasEstimate = await this.wethContract.withdraw.estimateGas(balanceInfo.balance);
      const gasLimit = gasEstimate + (gasEstimate / 10n); // Add 10% buffer
      
      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
      
      // Execute transaction
      const tx = await this.wethContract.withdraw(balanceInfo.balance, {
        gasLimit: gasLimit
      });
      
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }
      
      // Get balances after
      const ethAfter = await this.provider.getBalance(this.wallet.address);
      const ethGained = ethAfter - ethBefore + (receipt.gasUsed * receipt.gasPrice);
      
      const result = {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasCost: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
        wethUnwrapped: balanceInfo.formatted,
        ethGained: ethers.formatEther(ethGained),
        ethBefore: ethers.formatEther(ethBefore),
        ethAfter: ethers.formatEther(ethAfter),
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`💰 Unwrapped: ${result.wethUnwrapped} WETH → ${result.ethGained} ETH`);
      
      return result;
      
    } catch (error) {
      throw new Error(`Unwrap execution failed: ${error.message}`);
    }
  }

  /**
   * Record transaction in database
   */
  async recordTransaction(result) {
    try {
      const response = await fetch(
        `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/weth-unwraps/record`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: this.wallet.address,
            transactionHash: result.transactionHash,
            wethAmount: result.wethUnwrapped,
            ethReceived: result.ethGained,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed,
            unwrapDate: result.timestamp,
            ethBalanceBefore: result.ethBefore,
            ethBalanceAfter: result.ethAfter,
            triggeredBy: 'daily-cleanup'
          })
        }
      );
      
      if (response.ok) {
        console.log('✅ Transaction recorded in database');
      } else {
        console.warn(`⚠️ Failed to record transaction: ${response.status}`);
      }
    } catch (error) {
      console.warn(`⚠️ Database recording failed: ${error.message}`);
      // Don't throw - this shouldn't break the unwrap process
    }
  }

  /**
   * Send notifications for significant unwraps
   */
  async sendNotifications(result) {
    try {
      // Only notify for significant amounts (> 0.01 ETH)
      if (parseFloat(result.wethUnwrapped) < 0.01) {
        console.log('💰 Small amount unwrapped, skipping notifications');
        return;
      }

      // Send Farcaster notification if configured
      await this.sendFarcasterNotification(result);
      
    } catch (error) {
      console.warn(`⚠️ Notification failed: ${error.message}`);
      // Don't throw - notifications shouldn't break the process
    }
  }

  /**
   * Send Farcaster notification
   */
  async sendFarcasterNotification(result) {
    try {
      const signerUuid = process.env.ABC_DEV_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;
      if (!process.env.NEYNAR_API_KEY || !signerUuid) {
        console.log('⚠️ Farcaster not configured, skipping notification');
        return;
      }

      const { NeynarAPIClient, Configuration } = await import('@neynar/nodejs-sdk');
      const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
      const neynar = new NeynarAPIClient(config);

      const castText = `🔄 DAILY WETH CLEANUP\n\n` +
        `💰 Unwrapped: ${result.wethUnwrapped} WETH → ETH\n` +
        `🤖 Automated treasury maintenance\n` +
        `📊 Keeping rewards liquid for stakers\n\n` +
        `🔗 basescan.org/tx/${result.transactionHash}\n\n` +
        `#ABCDAO #TreasuryAutomation`;

      const cast = await neynar.publishCast(signerUuid, castText);
      console.log(`✅ Farcaster notification sent: ${cast.cast.hash}`);
      
    } catch (error) {
      console.warn(`⚠️ Farcaster notification failed: ${error.message}`);
    }
  }

  /**
   * Send critical alerts
   */
  async sendAlert(message) {
    try {
      console.error(`🚨 ALERT: ${message}`);
      
      // Could integrate with Discord, Slack, email, etc.
      // For now, just log prominently
      console.error('🚨'.repeat(20));
      console.error(`WETH UNWRAP ALERT: ${message}`);
      console.error(`Time: ${new Date().toISOString()}`);
      console.error(`Consecutive failures: ${this.consecutiveFailures}`);
      console.error(`Last success: ${this.lastSuccessTime || 'Never'}`);
      console.error('🚨'.repeat(20));
      
    } catch (error) {
      console.error('Failed to send alert:', error.message);
    }
  }

  /**
   * Run unwrap immediately (for testing/manual triggers)
   */
  async runNow() {
    console.log('🚀 Running WETH unwrap manually...');
    
    if (this.isRunning) {
      throw new Error('Unwrap already running');
    }

    try {
      this.isRunning = true;
      const result = await this.processWethUnwrap();
      console.log('✅ Manual unwrap completed');
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      isRunning: this.isRunning,
      lastSuccess: this.lastSuccessTime,
      consecutiveFailures: this.consecutiveFailures,
      nextRun: this.getNextRunTime(),
      configuration: {
        schedule: this.config.cronSchedule,
        threshold: this.config.minUnwrapThreshold,
        maxGasPrice: this.config.maxGasPrice
      }
    };
  }

  /**
   * Get next run time
   */
  getNextRunTime() {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(23, 0, 0, 0); // 11:00 PM UTC
    
    if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    
    return next.toISOString();
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export { WethUnwrapCron };