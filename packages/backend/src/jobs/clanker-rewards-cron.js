import cron from 'node-cron';
import { ethers } from 'ethers';

class ClankerRewardsCron {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.protocolWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, this.provider);
    this.isRunning = false;
    
    // Clanker configuration - these would need to be set based on actual Clanker contract
    this.clankerContractAddress = process.env.CLANKER_CONTRACT_ADDRESS;
    this.clankerRewardsAbi = [
      "function checkRewards(address account) view returns (uint256)",
      "function claimRewards() external returns (bool)",
      "function getLastClaimTime(address account) view returns (uint256)"
    ];
    
    // WETH configuration for auto-unwrapping after claims
    this.wethAddress = '0x4200000000000000000000000000000000000006'; // Base WETH
    this.wethAbi = [
      "function balanceOf(address) view returns (uint256)",
      "function withdraw(uint256) external",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)"
    ];
  }

  /**
   * Start the cron job to check and claim Clanker rewards daily at 11:30 PM UTC
   * This runs 30 minutes before the nightly leaderboard to ensure completion
   */
  start() {
    console.log('⏰ Starting Clanker rewards cron job...');
    
    // Run daily at 11:30 PM UTC (30 minutes before nightly leaderboard)
    this.cronJob = cron.schedule('30 23 * * *', async () => {
      if (this.isRunning) {
        console.log('⚠️ Clanker rewards job already running, skipping...');
        return;
      }

      this.isRunning = true;
      const timestamp = new Date().toISOString();
      
      try {
        console.log(`\n🪙 [${timestamp}] Starting daily Clanker rewards check...`);
        await this.processClankerRewards();
        console.log(`✅ [${timestamp}] Daily Clanker rewards check completed\n`);
      } catch (error) {
        console.error(`❌ [${timestamp}] Clanker rewards check failed:`, error);
      } finally {
        this.isRunning = false;
      }
    }, {
      timezone: 'UTC'
    });

    console.log('✅ Clanker rewards cron job started');
    console.log('   - Runs daily at 11:30 PM UTC');
    console.log('   - Checks and claims accumulated Clanker rewards');
    console.log('   - Auto-unwraps any WETH received from claims');
    console.log('   - Executes before nightly leaderboard job\n');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 Clanker rewards cron job stopped');
    }
  }

  /**
   * Check if there are claimable Clanker rewards (via RPC)
   */
  async checkClaimableRewards() {
    if (!this.clankerContractAddress) {
      console.log('⚠️ Clanker contract address not configured, skipping check');
      return null;
    }

    try {
      console.log(`🔍 Checking rewards via RPC for wallet: ${this.protocolWallet.address}`);
      
      // Use RPC calls instead of direct contract interaction for balance checks
      const clankerContract = new ethers.Contract(
        this.clankerContractAddress,
        this.clankerRewardsAbi,
        this.provider
      );
      
      // Check pending rewards via RPC
      const pendingRewards = await clankerContract.checkRewards(this.protocolWallet.address);
      const lastClaimTime = await clankerContract.getLastClaimTime(this.protocolWallet.address);
      
      const rewardsEth = ethers.formatEther(pendingRewards);
      const lastClaimDate = lastClaimTime > 0 ? new Date(Number(lastClaimTime) * 1000) : null;
      
      console.log(`💰 Pending rewards (via RPC): ${rewardsEth} ETH`);
      console.log(`📅 Last claim: ${lastClaimDate ? lastClaimDate.toISOString() : 'Never'}`);
      
      // Only claim if there are meaningful rewards (> 0.001 ETH)
      const minClaimThreshold = ethers.parseEther('0.001');
      const shouldClaim = pendingRewards > minClaimThreshold;
      
      return {
        pendingRewards,
        rewardsEth,
        lastClaimTime,
        lastClaimDate,
        shouldClaim,
        minThreshold: ethers.formatEther(minClaimThreshold)
      };
      
    } catch (error) {
      console.error('❌ Error checking Clanker rewards via RPC:', error.message);
      throw error;
    }
  }

  /**
   * Claim available Clanker rewards
   */
  async claimRewards(rewardsInfo) {
    if (!rewardsInfo.shouldClaim) {
      console.log(`⚠️ Rewards below threshold (${rewardsInfo.minThreshold} ETH), skipping claim`);
      return null;
    }

    try {
      const clankerContract = new ethers.Contract(
        this.clankerContractAddress,
        this.clankerRewardsAbi,
        this.protocolWallet
      );

      console.log(`🚀 Claiming ${rewardsInfo.rewardsEth} ETH rewards...`);
      
      // Estimate gas
      const gasEstimate = await clankerContract.claimRewards.estimateGas();
      const gasLimit = gasEstimate + (gasEstimate / 10n); // Add 10% buffer
      
      // Execute claim transaction
      const tx = await clankerContract.claimRewards({
        gasLimit: gasLimit
      });
      
      console.log(`📤 Claim transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Claim transaction confirmed in block ${receipt.blockNumber}`);
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        rewardsClaimed: rewardsInfo.rewardsEth
      };
      
    } catch (error) {
      console.error('❌ Error claiming Clanker rewards:', error.message);
      throw error;
    }
  }

  /**
   * Announce successful claim on Farcaster
   */
  async announceClaim(claimResult) {
    try {
      if (!process.env.NEYNAR_API_KEY || !process.env.NEYNAR_SIGNER_UUID) {
        console.log('⚠️ Farcaster credentials not configured, skipping announcement');
        return;
      }

      const { NeynarAPIClient, Configuration } = await import('@neynar/nodejs-sdk');
      const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
      const neynar = new NeynarAPIClient(config);

      const castText = `🪙 CLANKER REWARDS CLAIMED!\n\n` +
        `💰 Amount: ${claimResult.rewardsClaimed} ETH\n` +
        `🤖 Auto-claimed by ABC DAO bot\n\n` +
        `🔗 Transaction: basescan.org/tx/${claimResult.transactionHash}\n\n` +
        `#ABCDAO #ClankerRewards #AutomatedClaiming`;

      const cast = await neynar.publishCast(process.env.NEYNAR_SIGNER_UUID, castText);
      console.log(`✅ Claim announced: ${cast.cast.hash}`);
      
      return cast.cast.hash;
      
    } catch (error) {
      console.error('❌ Failed to announce claim:', error.message);
      // Don't throw - announcement failure shouldn't break the process
    }
  }

  /**
   * Record claim in database for tracking
   */
  async recordClaim(rewardsInfo, claimResult) {
    try {
      const recordResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/clanker-claims/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: this.protocolWallet.address,
          transactionHash: claimResult.transactionHash,
          rewardsAmount: claimResult.rewardsClaimed,
          blockNumber: claimResult.blockNumber,
          gasUsed: claimResult.gasUsed,
          claimDate: new Date().toISOString(),
          lastClaimBefore: rewardsInfo.lastClaimDate?.toISOString() || null
        })
      });
      
      if (recordResponse.ok) {
        console.log(`✅ Claim recorded in database`);
      } else {
        console.warn(`⚠️ Failed to record claim in database: ${recordResponse.status}`);
      }
    } catch (recordError) {
      console.warn(`⚠️ Error recording claim:`, recordError.message);
    }
  }

  /**
   * Main Clanker rewards processing function
   */
  async processClankerRewards() {
    try {
      console.log('🪙 ABC DAO Clanker Rewards Processor');
      console.log('==================================\n');
      
      console.log('📋 Configuration:');
      console.log(`- Wallet: ${this.protocolWallet.address}`);
      console.log(`- Clanker Contract: ${this.clankerContractAddress || 'Not configured'}`);
      console.log(`- Network: Base Mainnet\n`);
      
      // Check for claimable rewards
      const rewardsInfo = await this.checkClaimableRewards();
      
      if (!rewardsInfo) {
        console.log('✅ Clanker rewards check skipped (not configured)');
        return;
      }
      
      if (!rewardsInfo.shouldClaim) {
        console.log(`✅ No significant rewards to claim (${rewardsInfo.rewardsEth} ETH < ${rewardsInfo.minThreshold} ETH)`);
        return;
      }
      
      // Claim the rewards
      const claimResult = await this.claimRewards(rewardsInfo);
      
      if (!claimResult) {
        console.log('✅ No rewards were claimed');
        return;
      }
      
      // Record the claim
      await this.recordClaim(rewardsInfo, claimResult);
      
      // IMMEDIATELY check and unwrap any WETH received from the claim
      console.log('\n🔄 Checking for WETH to unwrap after successful claim...');
      await this.checkAndUnwrapWeth();
      
      // Announce on social media
      await this.announceClaim(claimResult);
      
      console.log('\n🎉 Clanker Rewards Claim Complete!');
      console.log('==================================');
      console.log(`✓ Claimed: ${claimResult.rewardsClaimed} ETH`);
      console.log(`✓ Transaction: ${claimResult.transactionHash}`);
      console.log(`✓ Gas Used: ${claimResult.gasUsed}`);
      
    } catch (error) {
      console.error('❌ Clanker rewards processing failed:', error);
      throw error;
    }
  }

  /**
   * Run rewards check and claim immediately (for testing)
   */
  async runNow() {
    console.log('🚀 Running Clanker rewards check immediately...\n');
    
    if (this.isRunning) {
      console.log('⚠️ Already running, please wait...');
      return;
    }

    this.isRunning = true;
    try {
      await this.processClankerRewards();
      console.log('✅ Manual Clanker rewards check completed');
    } catch (error) {
      console.error('❌ Manual Clanker rewards check failed:', error);
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
    
    // Set to 23:30 UTC today
    nextRun.setUTCHours(23, 30, 0, 0);
    
    // If we've already passed 23:30 today, schedule for tomorrow
    if (now.getTime() > nextRun.getTime()) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }
    
    return nextRun;
  }

  /**
   * Check configuration and provide setup guidance
   */
  validateConfiguration() {
    const issues = [];
    
    if (!this.clankerContractAddress) {
      issues.push('CLANKER_CONTRACT_ADDRESS environment variable not set');
    }
    
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

  /**
   * Check WETH balance and unwrap if needed
   * This runs immediately after successful Clanker claims
   */
  async checkAndUnwrapWeth() {
    try {
      console.log('🔍 Checking WETH balance after claim...');
      
      // Use contract instance for reliable balance check (same pattern as existing code)
      const wethContract = new ethers.Contract(this.wethAddress, this.wethAbi, this.provider);
      
      const wethAmount = await wethContract.balanceOf(this.protocolWallet.address);
      const wethBalanceEth = ethers.formatEther(wethAmount);
      
      console.log(`💰 Current WETH balance: ${wethBalanceEth} WETH`);
      
      // Set minimum threshold to avoid gas waste on tiny amounts
      const minUnwrapThreshold = ethers.parseEther('0.001'); // 0.001 ETH minimum
      
      if (wethAmount <= minUnwrapThreshold) {
        console.log(`⚠️ WETH balance below threshold (${ethers.formatEther(minUnwrapThreshold)} ETH), skipping unwrap`);
        return;
      }
      
      // Unwrap the WETH
      await this.unwrapWeth(wethAmount, wethBalanceEth);
      
    } catch (error) {
      console.error('❌ Error checking/unwrapping WETH:', error.message);
      // Don't throw - WETH unwrap failure shouldn't break the claim process
    }
  }

  /**
   * Unwrap WETH to native ETH
   */
  async unwrapWeth(wethAmount, wethBalanceEth) {
    try {
      const wethContract = new ethers.Contract(this.wethAddress, this.wethAbi, this.protocolWallet);

      console.log(`🔄 Unwrapping ${wethBalanceEth} WETH to native ETH...`);
      
      // Get ETH balance before unwrapping (via RPC)
      const ethBalanceBefore = await this.provider.getBalance(this.protocolWallet.address);
      
      // Estimate gas for withdrawal
      const gasEstimate = await wethContract.withdraw.estimateGas(wethAmount);
      const gasLimit = gasEstimate + (gasEstimate / 10n); // Add 10% buffer
      
      // Execute withdrawal
      const tx = await wethContract.withdraw(wethAmount, {
        gasLimit: gasLimit
      });
      
      console.log(`📤 WETH unwrap transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ WETH unwrap confirmed in block ${receipt.blockNumber}`);
      
      // Get ETH balance after unwrapping (via RPC)
      const ethBalanceAfter = await this.provider.getBalance(this.protocolWallet.address);
      const ethGained = ethBalanceAfter - ethBalanceBefore + receipt.gasUsed * receipt.gasPrice;
      
      const unwrapResult = {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        wethUnwrapped: wethBalanceEth,
        ethGained: ethers.formatEther(ethGained),
        ethBalanceBefore: ethers.formatEther(ethBalanceBefore),
        ethBalanceAfter: ethers.formatEther(ethBalanceAfter)
      };
      
      // Record the unwrap
      await this.recordWethUnwrap(unwrapResult);
      
      // Announce if significant amount
      if (parseFloat(wethBalanceEth) >= 0.01) {
        await this.announceWethUnwrap(unwrapResult);
      }
      
      console.log(`✅ WETH unwrap complete: ${wethBalanceEth} WETH → ${unwrapResult.ethGained} ETH`);
      
    } catch (error) {
      console.error('❌ Error unwrapping WETH:', error.message);
      throw error;
    }
  }

  /**
   * Record WETH unwrap in database
   */
  async recordWethUnwrap(unwrapResult) {
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
          ethBalanceAfter: unwrapResult.ethBalanceAfter,
          triggeredBy: 'clanker-claim' // Mark this as triggered by Clanker claim
        })
      });
      
      if (recordResponse.ok) {
        console.log(`✅ WETH unwrap recorded in database`);
      } else {
        console.warn(`⚠️ Failed to record WETH unwrap: ${recordResponse.status}`);
      }
    } catch (recordError) {
      console.warn(`⚠️ Error recording WETH unwrap:`, recordError.message);
    }
  }

  /**
   * Announce WETH unwrap on Farcaster (for significant amounts)
   */
  async announceWethUnwrap(unwrapResult) {
    try {
      if (!process.env.NEYNAR_API_KEY || !process.env.NEYNAR_SIGNER_UUID) {
        console.log('⚠️ Farcaster credentials not configured, skipping WETH unwrap announcement');
        return;
      }

      const { NeynarAPIClient, Configuration } = await import('@neynar/nodejs-sdk');
      const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
      const neynar = new NeynarAPIClient(config);

      const castText = `🔄 AUTO WETH UNWRAP!

💰 Amount: ${unwrapResult.wethUnwrapped} WETH → ETH
🤖 Triggered after Clanker claim  
📈 Keeping treasury liquid

🔗 Unwrap: basescan.org/tx/${unwrapResult.transactionHash}

#ABCDAO #WETHUnwrap #AutoTreasury`;

      const cast = await neynar.publishCast(process.env.NEYNAR_SIGNER_UUID, castText);
      console.log(`✅ WETH unwrap announced: ${cast.cast.hash}`);
      
    } catch (error) {
      console.error('❌ Failed to announce WETH unwrap:', error.message);
      // Don't throw - announcement failure shouldn't break the process
    }
  }
}

export { ClankerRewardsCron };