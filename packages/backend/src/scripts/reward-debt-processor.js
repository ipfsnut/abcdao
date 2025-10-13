import { ethers } from 'ethers';
import { getPool } from '../services/database.js';
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
    
    // Get all users with commits but check what's already on-chain
    const result = await pool.query(`
      SELECT 
        u.farcaster_username,
        u.wallet_address,
        COALESCE(SUM(c.reward_amount), 0) as total_earned
      FROM users u
      LEFT JOIN commits c ON u.id = c.user_id
      WHERE u.wallet_address IS NOT NULL
        AND u.membership_status != 'free'
      GROUP BY u.id, u.farcaster_username, u.wallet_address
      HAVING COALESCE(SUM(c.reward_amount), 0) > 0
      ORDER BY total_earned DESC
    `);

    console.log(`📊 Found ${result.rows.length} users with earned rewards`);
    
    return result.rows.map(user => ({
      username: user.farcaster_username,
      walletAddress: user.wallet_address,
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
   * Calculate reward debt (earned - already allocated)
   */
  async calculateRewardDebt() {
    console.log('💰 Calculating reward debt...\n');
    
    const users = await this.getUnclaimedRewards();
    if (users.length === 0) {
      console.log('✅ No users with rewards found');
      return [];
    }

    const wallets = users.map(u => u.walletAddress);
    const onChainAllocations = await this.getOnChainAllocations(wallets);
    
    const rewardDebt = [];
    
    console.log('📋 Reward Debt Analysis:');
    console.log('=========================');
    
    for (const user of users) {
      const earned = user.totalEarned;
      const allocated = onChainAllocations.get(user.walletAddress) || 0;
      const debt = earned - allocated;
      
      console.log(`@${user.username}:`);
      console.log(`  Earned: ${earned.toLocaleString()} $ABC`);
      console.log(`  Allocated: ${allocated.toLocaleString()} $ABC`);
      console.log(`  Debt: ${debt.toLocaleString()} $ABC\n`);
      
      if (debt > 0) {
        rewardDebt.push({
          username: user.username,
          walletAddress: user.walletAddress,
          debtAmount: debt
        });
      }
    }
    
    return rewardDebt;
  }

  /**
   * Process and allocate reward debt to smart contract
   */
  async processRewardDebt() {
    try {
      console.log('🤖 ABC DAO Reward Debt Processor');
      console.log('==================================\n');
      
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
  processor.processRewardDebt().then(() => {
    console.log('\n✨ Process completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { RewardDebtProcessor };