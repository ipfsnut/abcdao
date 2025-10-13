import { ethers } from 'ethers';
import { getPool } from '../src/services/database.js';
import dotenv from 'dotenv';

dotenv.config();

class TestHistoricalRewardsProcessor {
  constructor() {
    // Web3 setup
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, this.provider);
    
    // Contract addresses
    this.abcTokenAddress = process.env.ABC_TOKEN_ADDRESS || '0x5c0872b790bb73e2b3a9778db6e7704095624b07';
    this.rewardsContractAddress = process.env.ABC_REWARDS_CONTRACT_ADDRESS;
    
    // ABIs
    this.abcTokenABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address account) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)"
    ];
    
    this.rewardsContractABI = [
      "function allocateRewardsBatch(address[] calldata users, uint256[] calldata amounts) external",
      "function allocateReward(address user, uint256 amount) external",
      "function getContractStats() view returns (uint256, uint256, uint256, uint256)",
      "function getUserRewardInfo(address user) view returns (uint256, uint256, uint256, uint256)"
    ];
  }

  /**
   * Generate test reward data
   */
  generateTestRewards() {
    console.log('🧪 Generating test historical reward data...\n');
    
    const testRewards = [
      { username: 'epicdylan', amount: 500000 },  // 500k ABC
      { username: 'testuser1', amount: 250000 },  // 250k ABC
      { username: 'testuser2', amount: 100000 },  // 100k ABC
      { username: 'ipfsnut', amount: 750000 },    // 750k ABC (should map to epicdylan)
    ];
    
    const totalAmount = testRewards.reduce((sum, reward) => sum + reward.amount, 0);
    
    console.log('📋 Test Reward Data:');
    testRewards.forEach(reward => {
      console.log(`   @${reward.username}: ${reward.amount.toLocaleString()} $ABC`);
    });
    console.log(`   Total: ${totalAmount.toLocaleString()} $ABC\n`);
    
    return { rewards: testRewards, totalAmount };
  }

  /**
   * Map usernames to wallet addresses from database
   */
  async mapUsernamesToWallets(userRewards) {
    console.log('🔗 Mapping test usernames to wallet addresses...\n');
    
    const pool = getPool();
    const mappedRewards = [];
    let totalMappedAmount = 0;
    
    for (const user of userRewards) {
      try {
        // Try exact match first
        let result = await pool.query(
          'SELECT wallet_address, farcaster_username FROM users WHERE LOWER(farcaster_username) = $1 AND wallet_address IS NOT NULL',
          [user.username.toLowerCase()]
        );
        
        // If no exact match and username is 'ipfsnut', try mapping to 'epicdylan'
        if (result.rows.length === 0 && user.username.toLowerCase() === 'ipfsnut') {
          console.log('   🔄 Mapping ipfsnut → epicdylan...');
          result = await pool.query(
            'SELECT wallet_address, farcaster_username FROM users WHERE LOWER(farcaster_username) = $1 AND wallet_address IS NOT NULL',
            ['epicdylan']
          );
        }
        
        if (result.rows.length > 0) {
          const walletAddress = result.rows[0].wallet_address;
          
          // Check if this wallet already has rewards allocated
          const existingReward = mappedRewards.find(r => r.walletAddress === walletAddress);
          if (existingReward) {
            // Sum the amounts
            existingReward.amount += user.amount;
            console.log(`   ✅ @${user.username} → ${walletAddress} (combined: ${existingReward.amount.toLocaleString()} $ABC)`);
          } else {
            mappedRewards.push({
              username: user.username,
              walletAddress: walletAddress,
              amount: user.amount
            });
            console.log(`   ✅ @${user.username} → ${walletAddress} (${user.amount.toLocaleString()} $ABC)`);
          }
          
          totalMappedAmount += user.amount;
        } else {
          console.log(`   ⚠️ @${user.username}: No wallet found (${user.amount.toLocaleString()} $ABC unmappable)`);
        }
      } catch (error) {
        console.error(`   ❌ Error mapping @${user.username}:`, error.message);
      }
    }
    
    console.log(`\n📊 Mapping Results:`);
    console.log(`   - Mappable addresses: ${mappedRewards.length}`);
    console.log(`   - Total mappable amount: ${totalMappedAmount.toLocaleString()} $ABC\n`);
    
    return { mappedRewards, totalMappedAmount };
  }

  /**
   * Check if we need to fund the contract
   */
  async checkContractBalance(requiredAmount) {
    console.log('💰 Checking rewards contract balance...\n');
    
    try {
      const abcToken = new ethers.Contract(this.abcTokenAddress, this.abcTokenABI, this.provider);
      const contractBalance = await abcToken.balanceOf(this.rewardsContractAddress);
      const required = ethers.parseEther(requiredAmount.toString());
      
      console.log(`   Contract balance: ${ethers.formatEther(contractBalance)} $ABC`);
      console.log(`   Required amount: ${ethers.formatEther(required)} $ABC`);
      
      if (contractBalance >= required) {
        console.log('   ✅ Contract has sufficient balance\n');
        return true;
      } else {
        console.log('   ⚠️ Contract needs funding\n');
        return false;
      }
    } catch (error) {
      console.error('   ❌ Error checking balance:', error.message);
      return false;
    }
  }

  /**
   * Allocate test rewards to smart contract
   */
  async allocateTestRewards(mappedRewards) {
    console.log('📝 Allocating test rewards to smart contract...\n');
    
    try {
      const rewardsContract = new ethers.Contract(
        this.rewardsContractAddress,
        this.rewardsContractABI,
        this.botWallet
      );
      
      // Prepare data for single allocations (easier for testing)
      console.log('   Processing individual allocations...');
      
      for (let i = 0; i < mappedRewards.length; i++) {
        const reward = mappedRewards[i];
        
        console.log(`   Allocation ${i + 1}/${mappedRewards.length}: @${reward.username} → ${reward.amount.toLocaleString()} $ABC`);
        
        try {
          const amount = ethers.parseEther(reward.amount.toString());
          
          // Execute allocation
          const tx = await rewardsContract.allocateReward(reward.walletAddress, amount);
          console.log(`     Transaction sent: ${tx.hash}`);
          
          const receipt = await tx.wait();
          console.log(`     ✅ Confirmed in block ${receipt.blockNumber}`);
          
          // Add small delay between transactions
          if (i < mappedRewards.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          console.error(`     ❌ Allocation failed:`, error.message);
        }
      }
      
      console.log('\n✅ All allocations completed!');
      
    } catch (error) {
      console.error('❌ Allocation process failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify the allocations
   */
  async verifyAllocations(mappedRewards) {
    console.log('\n🔍 Verifying allocations...\n');
    
    try {
      const rewardsContract = new ethers.Contract(
        this.rewardsContractAddress,
        this.rewardsContractABI,
        this.provider
      );
      
      // Check contract stats
      const [totalAllocated, totalClaimed, contractBalance, batchCount] = 
        await rewardsContract.getContractStats();
      
      console.log('📊 Contract Statistics:');
      console.log(`   - Total allocated: ${ethers.formatEther(totalAllocated)} $ABC`);
      console.log(`   - Total claimed: ${ethers.formatEther(totalClaimed)} $ABC`);
      console.log(`   - Contract balance: ${ethers.formatEther(contractBalance)} $ABC`);
      console.log(`   - Batches processed: ${batchCount.toString()}\n`);
      
      // Check each user
      console.log('👥 User Verification:');
      for (const reward of mappedRewards) {
        try {
          const [allocated, claimed, claimable] = 
            await rewardsContract.getUserRewardInfo(reward.walletAddress);
          
          console.log(`   @${reward.username} (${reward.walletAddress.slice(0, 6)}...${reward.walletAddress.slice(-4)}):`);
          console.log(`     - Allocated: ${ethers.formatEther(allocated)} $ABC`);
          console.log(`     - Claimable: ${ethers.formatEther(claimable)} $ABC`);
          
          if (ethers.formatEther(claimable) === reward.amount.toString()) {
            console.log('     ✅ Amount correct\n');
          } else {
            console.log('     ⚠️ Amount mismatch\n');
          }
        } catch (error) {
          console.log(`     ❌ Verification failed: ${error.message}\n`);
        }
      }
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
    }
  }

  /**
   * Main execution
   */
  async run() {
    try {
      console.log('🧪 ABC DAO Test Historical Rewards Processor');
      console.log('==========================================\n');
      
      console.log('Configuration:');
      console.log(`- Bot Wallet: ${this.botWallet.address}`);
      console.log(`- ABC Token: ${this.abcTokenAddress}`);
      console.log(`- Rewards Contract: ${this.rewardsContractAddress}\n`);
      
      // Step 1: Generate test data
      const { rewards, totalAmount } = this.generateTestRewards();
      
      // Step 2: Map to wallet addresses
      const { mappedRewards, totalMappedAmount } = await this.mapUsernamesToWallets(rewards);
      
      if (mappedRewards.length === 0) {
        console.log('❌ No users with wallet addresses found. Please ensure users have linked wallets.');
        return;
      }
      
      // Step 3: Check contract balance
      const hasSufficientBalance = await this.checkContractBalance(totalMappedAmount);
      
      // Step 4: Allocate rewards
      await this.allocateTestRewards(mappedRewards);
      
      // Step 5: Verify allocations
      await this.verifyAllocations(mappedRewards);
      
      console.log('🎉 Test historical rewards processing completed!\n');
      console.log('📋 Summary:');
      console.log(`- Processed ${rewards.length} test reward entries`);
      console.log(`- Allocated rewards for ${mappedRewards.length} users`);
      console.log(`- Total allocated: ${totalMappedAmount.toLocaleString()} $ABC`);
      console.log('\n✨ Users can now claim their rewards via the miniapp at http://localhost:3001');
      
    } catch (error) {
      console.error('\n❌ Test process failed:', error);
    }
  }
}

// Run the test processor
const processor = new TestHistoricalRewardsProcessor();
processor.run().then(() => {
  console.log('\nTest completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});