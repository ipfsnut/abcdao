import cron from 'node-cron';
import { ethers } from 'ethers';

class WethUnwrapCron {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.protocolWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, this.provider);
    this.isRunning = false;
    
    // Base WETH contract address
    this.wethAddress = '0x4200000000000000000000000000000000000006';
    this.wethAbi = [
      "function balanceOf(address) view returns (uint256)",
      "function withdraw(uint256) external",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)"
    ];
  }

  /**
   * Start the cron jobs to check and unwrap WETH
   * - Daily at 11:00 PM for general cleanup
   * - Event-driven after Clanker claims (handled by abc-rewards-cron)
   */
  start() {
    console.log('⏰ Starting WETH unwrap cron job...');
    
    // Daily check at 11:00 PM UTC - ensures any accumulated WETH gets unwrapped
    this.dailyCronJob = cron.schedule('0 23 * * *', async () => {
      if (this.isRunning) {
        console.log('⚠️ WETH unwrap job already running, skipping daily check...');
        return;
      }

      this.isRunning = true;
      const timestamp = new Date().toISOString();
      
      try {
        console.log(`\n🔄 [${timestamp}] Starting daily WETH unwrap check...`);
        await this.processWethUnwrap('daily-cleanup');
        console.log(`✅ [${timestamp}] Daily WETH unwrap check completed\n`);
      } catch (error) {
        console.error(`❌ [${timestamp}] Daily WETH unwrap check failed:`, error);
      } finally {
        this.isRunning = false;
      }
    }, {
      timezone: 'UTC'
    });

    console.log('✅ WETH unwrap cron job started');
    console.log('   - Runs daily at 11:00 PM UTC');
    console.log('   - Also triggers automatically after Clanker claims');
    console.log('   - Automatically unwraps WETH to native ETH');
    console.log('   - Keeps treasury liquid for staking rewards\n');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.dailyCronJob) {
      this.dailyCronJob.stop();
      console.log('🛑 WETH unwrap cron job stopped');
    }
  }

  /**
   * Check current WETH balance
   */
  async checkWethBalance() {
    try {
      const wethContract = new ethers.Contract(this.wethAddress, this.wethAbi, this.provider);
      
      console.log(`🔍 Checking WETH balance for: ${this.protocolWallet.address}`);
      
      const wethBalance = await wethContract.balanceOf(this.protocolWallet.address);
      const wethBalanceEth = ethers.formatEther(wethBalance);
      
      console.log(`💰 Current WETH balance: ${wethBalanceEth} WETH`);
      
      // Set minimum threshold to avoid gas waste on tiny amounts
      const minUnwrapThreshold = ethers.parseEther('0.001'); // 0.001 ETH minimum
      const shouldUnwrap = wethBalance > minUnwrapThreshold;
      
      return {
        wethBalance,
        wethBalanceEth,
        shouldUnwrap,
        minThreshold: ethers.formatEther(minUnwrapThreshold)
      };
      
    } catch (error) {
      console.error('❌ Error checking WETH balance:', error.message);
      throw error;
    }
  }

  /**
   * Unwrap WETH to native ETH
   */
  async unwrapWeth(balanceInfo) {
    if (!balanceInfo.shouldUnwrap) {
      console.log(`⚠️ WETH balance below threshold (${balanceInfo.minThreshold} ETH), skipping unwrap`);
      return null;
    }

    try {
      const wethContract = new ethers.Contract(this.wethAddress, this.wethAbi, this.protocolWallet);

      console.log(`🔄 Unwrapping ${balanceInfo.wethBalanceEth} WETH to native ETH...`);
      
      // Get ETH balance before unwrapping
      const ethBalanceBefore = await this.provider.getBalance(this.protocolWallet.address);
      
      // Estimate gas for withdrawal
      const gasEstimate = await wethContract.withdraw.estimateGas(balanceInfo.wethBalance);
      const gasLimit = gasEstimate + (gasEstimate / 10n); // Add 10% buffer
      
      // Execute withdrawal
      const tx = await wethContract.withdraw(balanceInfo.wethBalance, {
        gasLimit: gasLimit
      });
      
      console.log(`📤 Unwrap transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Unwrap transaction confirmed in block ${receipt.blockNumber}`);
      
      // Get ETH balance after unwrapping
      const ethBalanceAfter = await this.provider.getBalance(this.protocolWallet.address);
      const ethGained = ethBalanceAfter - ethBalanceBefore + receipt.gasUsed * receipt.gasPrice;
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        wethUnwrapped: balanceInfo.wethBalanceEth,
        ethGained: ethers.formatEther(ethGained),
        ethBalanceBefore: ethers.formatEther(ethBalanceBefore),
        ethBalanceAfter: ethers.formatEther(ethBalanceAfter)
      };
      
    } catch (error) {
      console.error('❌ Error unwrapping WETH:', error.message);
      throw error;
    }
  }

  /**
   * Announce successful unwrap on Farcaster (optional)
   */
  async announceUnwrap(unwrapResult) {
    try {
      const devSignerUuid = process.env.ABC_DEV_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;
      if (!process.env.NEYNAR_API_KEY || !devSignerUuid) {
        console.log('⚠️ Farcaster or ABC_DEV_SIGNER_UUID not configured, skipping announcement');
        return;
      }

      // Only announce significant unwraps (> 0.01 ETH) to avoid spam
      if (parseFloat(unwrapResult.wethUnwrapped) < 0.01) {
        console.log('💰 Unwrap amount small, skipping announcement');
        return;
      }

      const { NeynarAPIClient, Configuration } = await import('@neynar/nodejs-sdk');
      const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
      const neynar = new NeynarAPIClient(config);

      const castText = `🔄 WETH AUTO-UNWRAPPED!\n\n` +
        `💰 Amount: ${unwrapResult.wethUnwrapped} WETH → ETH\n` +
        `🤖 Auto-processed by ABC DAO bot\n` +
        `📈 Keeping treasury liquid for rewards\n\n` +
        `🔗 Transaction: basescan.org/tx/${unwrapResult.transactionHash}\n\n` +
        `#ABCDAO #WETHUnwrap #AutomatedTreasury`;

      console.log(`📢 Posting WETH unwrap from @abc-dao-dev (signer: ${devSignerUuid})`);
      const cast = await neynar.publishCast(devSignerUuid, castText);
      console.log(`✅ Unwrap announced: ${cast.cast.hash}`);
      
      return cast.cast.hash;
      
    } catch (error) {
      console.error('❌ Failed to announce unwrap:', error.message);
      // Don't throw - announcement failure shouldn't break the process
    }
  }

  /**
   * Record unwrap transaction in database for tracking
   */
  async recordUnwrap(balanceInfo, unwrapResult) {
    try {
      const recordResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/weth-unwraps/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: this.protocolWallet.address,
          transactionHash: unwrapResult.transactionHash,
          wethAmount: unwrapResult.wethUnwrapped,
          ethReceived: unwrapResult.ethGained,
          blockNumber: unwrapResult.blockNumber,
          gasUsed: unwrapResult.gasUsed,
          unwrapDate: new Date().toISOString(),
          ethBalanceBefore: unwrapResult.ethBalanceBefore,
          ethBalanceAfter: unwrapResult.ethBalanceAfter
        })
      });
      
      if (recordResponse.ok) {
        console.log(`✅ Unwrap recorded in database`);
      } else {
        console.warn(`⚠️ Failed to record unwrap in database: ${recordResponse.status}`);
      }
    } catch (recordError) {
      console.warn(`⚠️ Error recording unwrap:`, recordError.message);
    }
  }

  /**
   * Main WETH unwrapping processing function
   * @param {string} triggeredBy - Source of the trigger (e.g., 'daily-cleanup', 'clanker-claim')
   */
  async processWethUnwrap(triggeredBy = 'manual') {
    try {
      console.log('🔄 ABC DAO WETH Unwrap Processor');
      console.log('===============================\n');
      
      console.log('📋 Configuration:');
      console.log(`- Wallet: ${this.protocolWallet.address}`);
      console.log(`- WETH Contract: ${this.wethAddress}`);
      console.log(`- Network: Base Mainnet\n`);
      
      // Check WETH balance
      const balanceInfo = await this.checkWethBalance();
      
      if (!balanceInfo.shouldUnwrap) {
        console.log(`✅ No significant WETH to unwrap (${balanceInfo.wethBalanceEth} ETH < ${balanceInfo.minThreshold} ETH)`);
        return;
      }
      
      // Unwrap the WETH
      const unwrapResult = await this.unwrapWeth(balanceInfo);
      
      if (!unwrapResult) {
        console.log('✅ No WETH was unwrapped');
        return;
      }
      
      // Record the unwrap (if API endpoint exists)
      await this.recordUnwrap(balanceInfo, unwrapResult);
      
      // Announce on social media (for significant amounts)
      await this.announceUnwrap(unwrapResult);
      
      console.log('\n🎉 WETH Unwrap Complete!');
      console.log('========================');
      console.log(`✓ Unwrapped: ${unwrapResult.wethUnwrapped} WETH`);
      console.log(`✓ ETH Gained: ${unwrapResult.ethGained} ETH`);
      console.log(`✓ Transaction: ${unwrapResult.transactionHash}`);
      console.log(`✓ Gas Used: ${unwrapResult.gasUsed}`);
      
    } catch (error) {
      console.error('❌ WETH unwrap processing failed:', error);
      throw error;
    }
  }

  /**
   * Run unwrap check immediately (for testing)
   */
  async runNow() {
    console.log('🚀 Running WETH unwrap check immediately...\n');
    
    if (this.isRunning) {
      console.log('⚠️ Already running, please wait...');
      return;
    }

    this.isRunning = true;
    try {
      await this.processWethUnwrap();
      console.log('✅ Manual WETH unwrap check completed');
    } catch (error) {
      console.error('❌ Manual WETH unwrap check failed:', error);
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
    const nextRuns = [];
    
    // Calculate next 3 run times (every 2 hours)
    for (let i = 1; i <= 3; i++) {
      const nextRun = new Date(now);
      const currentHour = now.getUTCHours();
      const nextHour = Math.ceil(currentHour / 2) * 2 + (i - 1) * 2;
      
      if (nextHour >= 24) {
        nextRun.setUTCDate(nextRun.getUTCDate() + Math.floor(nextHour / 24));
        nextRun.setUTCHours(nextHour % 24, 0, 0, 0);
      } else {
        nextRun.setUTCHours(nextHour, 0, 0, 0);
      }
      
      nextRuns.push(nextRun);
    }
    
    return nextRuns;
  }

  /**
   * Check configuration and provide setup guidance
   */
  validateConfiguration() {
    const issues = [];
    
    if (!process.env.BOT_WALLET_PRIVATE_KEY) {
      issues.push('BOT_WALLET_PRIVATE_KEY environment variable not set');
    }
    
    if (!process.env.BASE_RPC_URL) {
      issues.push('BASE_RPC_URL environment variable not set (using default)');
    }
    
    if (issues.length > 0) {
      console.log('⚠️ Configuration Issues:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
    }
    
    return issues.length === 0;
  }
}

export { WethUnwrapCron };