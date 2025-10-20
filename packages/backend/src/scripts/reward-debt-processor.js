import { ethers } from 'ethers';
import { initializeDatabase, getPool } from '../services/database.js';
import dotenv from 'dotenv';

dotenv.config();

class RewardDebtProcessor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, this.provider);
    
    this.abcTokenAddress = process.env.ABC_TOKEN_ADDRESS || '0x5c0872b790bb73e2b3a9778db6e7704095624b07';
    this.rewardsContractAddress = process.env.ABC_REWARDS_CONTRACT_ADDRESS || '0x03CD0F799B4C04DbC22bFAAd35A3F36751F3446c';
    this.protocolWalletAddress = process.env.PROTOCOL_WALLET_ADDRESS || '0xBE6525b767cA8D38d169C93C8120c0C0957388B8';
    
    this.rewardsContractABI = [
      "function allocateRewardsBatch(address[] calldata users, uint256[] calldata amounts) external",
      "function getContractStats() view returns (uint256, uint256, uint256, uint256)",
      "function getUserRewardInfo(address user) view returns (uint256, uint256, uint256, uint256)"
    ];
    
    this.abcTokenABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)',
      'function decimals() view returns (uint8)'
    ];
  }

  /**
   * Get all users with unclaimed rewards (rewards not yet on contract)
   */
  async getUnclaimedRewards() {
    console.log('🔍 Fetching unclaimed rewards from database...');
    
    const pool = getPool();
    
    // Get all users with PENDING rewards (not yet sent to contract)
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.farcaster_username,
        u.wallet_address_primary as wallet_address,
        COALESCE(SUM(CASE WHEN c.reward_status = 'pending' THEN c.reward_amount ELSE 0 END), 0) as pending_rewards,
        COALESCE(SUM(c.reward_amount), 0) as total_earned
      FROM users u
      LEFT JOIN commits c ON u.id = c.user_id
      WHERE u.wallet_address_primary IS NOT NULL
        AND u.membership_status != 'free'
      GROUP BY u.id, u.farcaster_username, u.wallet_address_primary
      HAVING COALESCE(SUM(CASE WHEN c.reward_status = 'pending' THEN c.reward_amount ELSE 0 END), 0) > 0
      ORDER BY pending_rewards DESC
    `);

    console.log(`📊 Found ${result.rows.length} users with pending rewards`);
    
    return result.rows.map(user => ({
      userId: user.user_id,
      username: user.farcaster_username,
      walletAddress: user.wallet_address,
      pendingRewards: parseFloat(user.pending_rewards),
      totalEarned: parseFloat(user.total_earned)
    }));
  }

  /**
   * Check what rewards are already allocated on-chain for each user
   */
  async getOnChainAllocations(userWallets) {
    console.log('⛓️ Checking on-chain allocations...');
    
    const rewardsContract = new ethers.Contract(
      this.rewardsContractAddress,
      this.rewardsContractABI,
      this.provider
    );

    const allocations = new Map();
    
    for (const wallet of userWallets) {
      try {
        const [totalAllocated] = await rewardsContract.getUserRewardInfo(wallet);
        allocations.set(wallet, parseFloat(ethers.formatEther(totalAllocated)));
      } catch (error) {
        console.log(`⚠️ Error checking ${wallet}:`, error.message);
        allocations.set(wallet, 0);
      }
    }
    
    return allocations;
  }

  /**
   * Calculate reward debt (pending rewards to be allocated)
   */
  async calculateRewardDebt() {
    console.log('💰 Calculating pending rewards...\n');
    
    const users = await this.getUnclaimedRewards();
    if (users.length === 0) {
      console.log('✅ No users with pending rewards found');
      return [];
    }
    
    const rewardDebt = [];
    
    console.log('📋 Pending Rewards Analysis:');
    console.log('============================');
    
    for (const user of users) {
      const pendingAmount = user.pendingRewards;
      
      console.log(`@${user.username}:`);
      console.log(`  Pending: ${pendingAmount.toLocaleString()} $ABC`);
      console.log(`  Total Earned: ${user.totalEarned.toLocaleString()} $ABC\n`);
      
      if (pendingAmount > 0) {
        rewardDebt.push({
          userId: user.userId,
          username: user.username,
          walletAddress: user.walletAddress,
          debtAmount: pendingAmount
        });
      }
    }
    
    return rewardDebt;
  }

  /**
   * Mark pending rewards as claimable after successful contract allocation
   * Now includes contract verification to ensure sync
   */
  async markRewardsAsClaimable(rewardDebt, contractTxHash) {
    console.log('📝 Updating database with claimable status...');
    
    const pool = getPool();
    
    for (const user of rewardDebt) {
      try {
        // First verify the contract actually has the allocated amount
        let contractVerified = false;
        if (user.walletAddress) {
          contractVerified = await this.verifyContractAllocation(user.walletAddress, user.debtAmount);
        }
        
        if (contractVerified) {
          // Update all pending rewards for this user to claimable
          const updateResult = await pool.query(`
            UPDATE commits 
            SET 
              reward_status = 'claimable',
              contract_tx_hash = $1,
              transferred_at = NOW()
            WHERE user_id = $2 
              AND reward_status = 'pending'
              AND reward_amount IS NOT NULL
          `, [contractTxHash, user.userId]);
          
          console.log(`  ✓ @${user.username}: ${updateResult.rowCount} rewards marked as claimable (contract verified)`);
        } else {
          console.log(`  ⚠️ @${user.username}: Contract verification failed, keeping rewards as pending`);
        }
        
      } catch (error) {
        console.error(`  ❌ Failed to update rewards for @${user.username}:`, error.message);
      }
    }
    
    console.log('✅ Database update completed\n');
  }

  /**
   * Verify that the contract actually has the expected allocation for a user
   */
  async verifyContractAllocation(walletAddress, expectedAmount) {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
      const rewardsContract = new ethers.Contract(
        process.env.ABC_REWARDS_CONTRACT_ADDRESS || '0x03CD0F799B4C04DbC22bFAAd35A3F36751F3446c',
        ['function getClaimableAmount(address user) view returns (uint256)'],
        provider
      );
      
      const claimableWei = await rewardsContract.getClaimableAmount(walletAddress);
      const claimableAmount = parseFloat(ethers.formatEther(claimableWei));
      
      // Allow some tolerance for rounding differences
      const tolerance = expectedAmount * 0.01; // 1% tolerance
      const verified = Math.abs(claimableAmount - expectedAmount) <= tolerance;
      
      console.log(`    Contract check: Expected ${expectedAmount.toLocaleString()}, Got ${claimableAmount.toLocaleString()} (${verified ? 'PASS' : 'FAIL'})`);
      
      return verified;
    } catch (error) {
      console.warn(`    Contract verification failed:`, error.message);
      return false; // Conservative approach - don't mark as claimable if we can't verify
    }
  }

  /**
   * Announce reward transfer on Farcaster
   */
  async announceRewardTransfer(rewardDebt, totalDebt, contractTxHash, refillResult = null) {
    console.log('📢 Posting reward transfer announcement...');
    
    try {
      const devSignerUuid = process.env.ABC_DEV_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;
      if (!process.env.NEYNAR_API_KEY || !devSignerUuid) {
        console.log('⚠️ Farcaster or ABC_DEV_SIGNER_UUID not configured, skipping announcement');
        return;
      }

      // Initialize Neynar client
      const { NeynarAPIClient } = await import('@neynar/nodejs-sdk');
      const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

      // Create announcement message
      const userList = rewardDebt.slice(0, 5).map(r => `@${r.username}`).join(' ');
      const moreUsers = rewardDebt.length > 5 ? ` +${rewardDebt.length - 5} more` : '';
      
      // Add refill info if auto-refill occurred
      const refillInfo = refillResult ? 
        `\n\n🏦 Auto-refilled: ${refillResult.refillAmount.toLocaleString()} $ABC transferred to contract` : '';
      
      const castText = `💰 REWARD TRANSFER COMPLETE!\n\n${totalDebt.toLocaleString()} $ABC rewards now CLAIMABLE!\n\n🎯 ${rewardDebt.length} developers can now claim:\n${userList}${moreUsers}${refillInfo}\n\n🔗 Transaction: basescan.org/tx/${contractTxHash}\n\n✅ Connect wallet at abc.epicdylan.com to claim your rewards!\n\n#ABCDAO #AlwaysBeCoding`;

      // Post cast
      console.log(`📢 Posting reward debt announcement from @abc-dao-dev (signer: ${devSignerUuid})`);
      const cast = await neynar.publishCast(
        devSignerUuid,
        castText
      );

      console.log(`✅ Reward transfer announced: ${cast.cast.hash}`);
      return cast.cast.hash;

    } catch (error) {
      console.error('❌ Failed to announce reward transfer:', error.message);
      // Don't throw - announcement failure shouldn't break the process
    }
  }

  /**
   * Check contract ABC balance and auto-refill if needed
   */
  async ensureSufficientContractBalance(requiredAmount) {
    console.log('🔍 Checking contract balance for auto-refill...');
    
    const abcToken = new ethers.Contract(this.abcTokenAddress, this.abcTokenABI, this.provider);
    
    // Check current contract balance
    const contractBalance = await abcToken.balanceOf(this.rewardsContractAddress);
    const contractTokens = parseFloat(ethers.formatUnits(contractBalance, 18));
    
    console.log(`   Contract Balance: ${contractTokens.toLocaleString()} $ABC`);
    console.log(`   Required Amount: ${requiredAmount.toLocaleString()} $ABC`);
    
    if (contractTokens >= requiredAmount) {
      console.log('✅ Sufficient contract balance, no refill needed\n');
      return;
    }
    
    // Calculate smart refill amount
    const shortfall = requiredAmount - contractTokens;
    const bufferMonths = 2; // 2-month runway buffer
    const bufferAmount = requiredAmount * bufferMonths; // Estimate based on current batch
    let refillAmount = Math.max(shortfall, bufferAmount);
    
    console.log(`💡 Smart Refill Calculation:`);
    console.log(`   Shortfall: ${shortfall.toLocaleString()} $ABC`);
    console.log(`   Buffer (${bufferMonths} months): ${bufferAmount.toLocaleString()} $ABC`);
    console.log(`   Refill Amount: ${refillAmount.toLocaleString()} $ABC`);
    
    // Check protocol wallet balance
    const protocolBalance = await abcToken.balanceOf(this.protocolWalletAddress);
    const protocolTokens = parseFloat(ethers.formatUnits(protocolBalance, 18));
    const safetyReserve = 100_000_000; // Keep 100M ABC in protocol wallet
    
    console.log(`   Protocol Balance: ${protocolTokens.toLocaleString()} $ABC`);
    console.log(`   Safety Reserve: ${safetyReserve.toLocaleString()} $ABC`);
    
    if (protocolTokens - refillAmount < safetyReserve) {
      const maxTransfer = protocolTokens - safetyReserve;
      if (maxTransfer < shortfall) {
        throw new Error(`Insufficient protocol wallet balance. Need ${shortfall.toLocaleString()} ABC but only ${maxTransfer.toLocaleString()} ABC available above safety reserve.`);
      }
      console.log(`⚠️ Reducing refill to maintain safety reserve: ${maxTransfer.toLocaleString()} $ABC`);
      refillAmount = maxTransfer;
    }
    
    // Execute the transfer
    console.log(`\n💸 Transferring ${refillAmount.toLocaleString()} $ABC from protocol wallet to rewards contract...`);
    
    const abcTokenWithSigner = new ethers.Contract(this.abcTokenAddress, this.abcTokenABI, this.botWallet);
    const transferAmount = ethers.parseUnits(refillAmount.toString(), 18);
    
    const tx = await abcTokenWithSigner.transfer(this.rewardsContractAddress, transferAmount);
    console.log(`⏳ Transfer transaction: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Transfer confirmed in block ${receipt.blockNumber}`);
    
    // Verify the transfer
    const newContractBalance = await abcToken.balanceOf(this.rewardsContractAddress);
    const newContractTokens = parseFloat(ethers.formatUnits(newContractBalance, 18));
    
    console.log(`📊 New contract balance: ${newContractTokens.toLocaleString()} $ABC`);
    console.log(`🎯 Contract now has ${Math.floor(newContractTokens / requiredAmount)}x the required amount\n`);
    
    return { refillAmount, txHash: tx.hash };
  }

  /**
   * Process and allocate reward debt to smart contract
   */
  async processRewardDebt() {
    try {
      console.log('🤖 ABC DAO Reward Debt Processor');
      console.log('==================================\n');
      
      // Initialize database connection
      await initializeDatabase();
      
      const rewardDebt = await this.calculateRewardDebt();
      
      if (rewardDebt.length === 0) {
        console.log('✅ No reward debt to process. All rewards are up to date!');
        return;
      }

      console.log(`🎯 Processing reward debt for ${rewardDebt.length} users...\n`);
      
      // Prepare batch data
      const addresses = rewardDebt.map(r => r.walletAddress);
      const amounts = rewardDebt.map(r => ethers.parseEther(r.debtAmount.toString()));
      const totalDebt = rewardDebt.reduce((sum, r) => sum + r.debtAmount, 0);
      
      console.log(`💸 Total debt to allocate: ${totalDebt.toLocaleString()} $ABC\n`);
      
      // Smart auto-refill: Ensure contract has sufficient balance
      const refillResult = await this.ensureSufficientContractBalance(totalDebt);
      
      // Execute batch allocation
      const rewardsContract = new ethers.Contract(
        this.rewardsContractAddress,
        this.rewardsContractABI,
        this.botWallet
      );
      
      console.log('📝 Executing batch allocation...');
      const tx = await rewardsContract.allocateRewardsBatch(addresses, amounts);
      console.log(`Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Confirmed in block ${receipt.blockNumber}\n`);
      
      // Mark pending rewards as claimable in database
      await this.markRewardsAsClaimable(rewardDebt, tx.hash);
      
      // Enhanced announcement including refill info
      await this.announceRewardTransfer(rewardDebt, totalDebt, tx.hash, refillResult);
      
      // Log results
      console.log('🎉 Reward Debt Processing Complete!');
      console.log('===================================');
      rewardDebt.forEach(r => {
        console.log(`✓ @${r.username}: ${r.debtAmount.toLocaleString()} $ABC allocated`);
      });
      
      console.log(`\n💫 Total: ${totalDebt.toLocaleString()} $ABC now claimable by users`);
      
      if (refillResult) {
        console.log(`🏦 Auto-refilled: ${refillResult.refillAmount.toLocaleString()} $ABC transferred to contract`);
      }
      
    } catch (error) {
      console.error('❌ Reward debt processing failed:', error);
      throw error;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const processor = new RewardDebtProcessor();
  
  // Initialize database first
  initializeDatabase().then(() => {
    return processor.processRewardDebt();
  }).then(() => {
    console.log('\n✨ Process completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { RewardDebtProcessor };