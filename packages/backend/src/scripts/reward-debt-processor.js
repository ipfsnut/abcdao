import { ethers } from 'ethers';
import { initializeDatabase, getPool } from '../services/database.js';
import dotenv from 'dotenv';

dotenv.config();

class RewardDebtProcessor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, this.provider);
    
    this.abcTokenAddress = process.env.ABC_TOKEN_ADDRESS || '0x5c0872b790bb73e2b3a9778db6e7704095624b07';
    this.rewardsContractAddress = process.env.ABC_REWARDS_CONTRACT_ADDRESS;
    
    this.rewardsContractABI = [
      "function allocateRewardsBatch(address[] calldata users, uint256[] calldata amounts) external",
      "function getContractStats() view returns (uint256, uint256, uint256, uint256)",
      "function getUserRewardInfo(address user) view returns (uint256, uint256, uint256, uint256)"
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
        u.wallet_address,
        COALESCE(SUM(CASE WHEN c.reward_status = 'pending' THEN c.reward_amount ELSE 0 END), 0) as pending_rewards,
        COALESCE(SUM(c.reward_amount), 0) as total_earned
      FROM users u
      LEFT JOIN commits c ON u.id = c.user_id
      WHERE u.wallet_address IS NOT NULL
        AND u.membership_status != 'free'
      GROUP BY u.id, u.farcaster_username, u.wallet_address
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
  async announceRewardTransfer(rewardDebt, totalDebt, contractTxHash) {
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
      
      const castText = `💰 REWARD TRANSFER COMPLETE!\n\n${totalDebt.toLocaleString()} $ABC rewards now CLAIMABLE!\n\n🎯 ${rewardDebt.length} developers can now claim:\n${userList}${moreUsers}\n\n🔗 Transaction: basescan.org/tx/${contractTxHash}\n\n✅ Connect wallet at abc.epicdylan.com to claim your rewards!\n\n#ABCDAO #AlwaysBeCoding`;

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
      
      // Announce the reward transfer on Farcaster
      await this.announceRewardTransfer(rewardDebt, totalDebt, tx.hash);
      
      // Log results
      console.log('🎉 Reward Debt Processing Complete!');
      console.log('===================================');
      rewardDebt.forEach(r => {
        console.log(`✓ @${r.username}: ${r.debtAmount.toLocaleString()} $ABC allocated`);
      });
      
      console.log(`\n💫 Total: ${totalDebt.toLocaleString()} $ABC now claimable by users`);
      
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