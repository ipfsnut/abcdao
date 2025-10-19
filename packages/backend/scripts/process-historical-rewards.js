import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { ethers } from 'ethers';
import { getPool } from '../src/services/database.js';
import dotenv from 'dotenv';

dotenv.config();

class HistoricalRewardsProcessor {
  constructor() {
    this.neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    this.botFid = process.env.NEYNAR_BOT_FID || '8573';
    
    // Web3 setup
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    this.botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, this.provider);
    
    // Contracts
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
      "function getContractStats() view returns (uint256, uint256, uint256, uint256)",
      "function getUserRewardInfo(address user) view returns (uint256, uint256, uint256, uint256)"
    ];
  }

  /**
   * Parse reward information from a Farcaster cast
   */
  parseRewardFromCast(castText) {
    // Enhanced patterns to catch various reward announcement formats
    const patterns = [
      /@(\w+)\s+(?:just\s+)?earned:?\s*([\d,]+)\s*\$ABC/i,
      /@(\w+)\s+(?:just\s+)?(?:pushed|committed|shipped).*earned:?\s*([\d,]+)\s*\$ABC/i,
      /💰\s*Earned:?\s*([\d,]+)\s*\$ABC.*@(\w+)/i,
      /@(\w+).*💰.*?([\d,]+)\s*\$ABC/i
    ];
    
    for (const pattern of patterns) {
      const match = castText.match(pattern);
      if (match) {
        // Handle different capture group orders
        let username, amount;
        if (match[1] && /^\w+$/.test(match[1])) {
          username = match[1];
          amount = match[2];
        } else {
          username = match[2];
          amount = match[1];
        }
        
        if (username && amount) {
          return {
            username: username.toLowerCase(),
            amount: parseInt(amount.replace(/,/g, ''))
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Fetch all bot casts with pagination
   */
  async fetchAllBotCasts() {
    console.log(`🔍 Fetching all casts from bot FID ${this.botFid}...`);
    
    let allCasts = [];
    let cursor = null;
    let pageCount = 0;
    
    do {
      try {
        console.log(`   Fetching page ${pageCount + 1}...`);
        
        const response = await this.neynar.fetchCastsByUser(parseInt(this.botFid), {
          limit: 100,
          cursor: cursor
        });
        
        if (response.casts && response.casts.length > 0) {
          allCasts = allCasts.concat(response.casts);
          cursor = response.next?.cursor;
          pageCount++;
          
          console.log(`   Found ${response.casts.length} casts (total: ${allCasts.length})`);
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          break;
        }
        
      } catch (error) {
        console.error(`   Error fetching page ${pageCount + 1}:`, error.message);
        break;
      }
      
    } while (cursor && pageCount < 50); // Safety limit
    
    console.log(`✅ Fetched ${allCasts.length} total casts from ${pageCount} pages`);
    return allCasts;
  }

  /**
   * Process all casts and extract reward data
   */
  async processHistoricalCasts() {
    console.log('🔄 Processing historical reward casts...\n');
    
    // Step 1: Fetch all bot casts
    const allCasts = await this.fetchAllBotCasts();
    
    if (allCasts.length === 0) {
      console.log('❌ No casts found');
      return { rewards: [], totalAmount: 0 };
    }
    
    // Step 2: Parse reward casts
    console.log('📋 Parsing reward announcements...');
    const rewardCasts = [];
    
    for (const cast of allCasts) {
      const reward = this.parseRewardFromCast(cast.text);
      if (reward) {
        rewardCasts.push({
          castHash: cast.hash,
          castText: cast.text,
          timestamp: cast.timestamp,
          username: reward.username,
          amount: reward.amount,
          castUrl: `https://warpcast.com/${cast.author.username}/${cast.hash.slice(0, 10)}`
        });
      }
    }
    
    console.log(`✅ Found ${rewardCasts.length} reward announcements out of ${allCasts.length} total casts`);
    
    // Step 3: Group and sum rewards by username
    console.log('📊 Aggregating rewards by user...');
    const rewardsByUser = {};
    let totalRewardAmount = 0;
    
    for (const cast of rewardCasts) {
      if (rewardsByUser[cast.username]) {
        rewardsByUser[cast.username].totalAmount += cast.amount;
        rewardsByUser[cast.username].castCount += 1;
        rewardsByUser[cast.username].casts.push(cast);
      } else {
        rewardsByUser[cast.username] = {
          username: cast.username,
          totalAmount: cast.amount,
          castCount: 1,
          casts: [cast]
        };
      }
      totalRewardAmount += cast.amount;
    }
    
    const userRewards = Object.values(rewardsByUser);
    
    console.log(`📈 Reward Summary:`);
    console.log(`   - Unique users: ${userRewards.length}`);
    console.log(`   - Total reward casts: ${rewardCasts.length}`);
    console.log(`   - Total reward amount: ${totalRewardAmount.toLocaleString()} $ABC`);
    
    // Display top recipients
    const topUsers = userRewards
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
    
    console.log(`\\n🏆 Top 10 Recipients:`);
    topUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. @${user.username}: ${user.totalAmount.toLocaleString()} $ABC (${user.castCount} commits)`);
    });
    
    return {
      rewards: userRewards,
      totalAmount: totalRewardAmount,
      castCount: rewardCasts.length
    };
  }

  /**
   * Map Farcaster usernames to wallet addresses
   */
  async mapUsernamesToWallets(userRewards) {
    console.log('\\n🔗 Mapping usernames to wallet addresses...');
    
    const pool = getPool();
    const mappedRewards = [];
    let mappedCount = 0;
    let totalMappedAmount = 0;
    
    for (const user of userRewards) {
      try {
        const result = await pool.query(
          'SELECT wallet_address, farcaster_username FROM users WHERE LOWER(farcaster_username) = $1 AND wallet_address IS NOT NULL',
          [user.username.toLowerCase()]
        );
        
        if (result.rows.length > 0) {
          const walletAddress = result.rows[0].wallet_address;
          mappedRewards.push({
            username: user.username,
            walletAddress: walletAddress,
            amount: user.totalAmount,
            castCount: user.castCount
          });
          mappedCount++;
          totalMappedAmount += user.totalAmount;
          
          console.log(`   ✅ @${user.username} → ${walletAddress} (${user.totalAmount.toLocaleString()} $ABC)`);
        } else {
          console.log(`   ⚠️ @${user.username}: No wallet found (${user.totalAmount.toLocaleString()} $ABC unmappable)`);
        }
      } catch (error) {
        console.error(`   ❌ Error mapping @${user.username}:`, error.message);
      }
    }
    
    console.log(`\\n📊 Mapping Results:`);
    console.log(`   - Users with wallets: ${mappedCount}/${userRewards.length}`);
    console.log(`   - Mappable rewards: ${totalMappedAmount.toLocaleString()} $ABC`);
    console.log(`   - Unmappable rewards: ${(userRewards.reduce((sum, u) => sum + u.totalAmount, 0) - totalMappedAmount).toLocaleString()} $ABC`);
    
    return {
      mappedRewards,
      totalMappedAmount,
      mappedCount
    };
  }

  /**
   * Transfer ABC tokens to rewards contract
   */
  async fundRewardsContract(totalAmount) {
    console.log(`\\n💰 Funding rewards contract with ${totalAmount.toLocaleString()} $ABC...`);
    
    try {
      const abcToken = new ethers.Contract(this.abcTokenAddress, this.abcTokenABI, this.botWallet);
      
      // Check bot wallet balance
      const botBalance = await abcToken.balanceOf(this.botWallet.address);
      const requiredAmount = ethers.parseEther(totalAmount.toString());
      
      console.log(`   Bot wallet balance: ${ethers.formatEther(botBalance)} $ABC`);
      console.log(`   Required amount: ${ethers.formatEther(requiredAmount)} $ABC`);
      
      if (botBalance < requiredAmount) {
        throw new Error(`Insufficient bot wallet balance. Need ${ethers.formatEther(requiredAmount - botBalance)} more $ABC`);
      }
      
      // Transfer to rewards contract
      console.log('   Executing transfer...');
      const transferTx = await abcToken.transfer(this.rewardsContractAddress, requiredAmount);
      
      console.log(`   Transaction sent: ${transferTx.hash}`);
      console.log('   Waiting for confirmation...');
      
      const receipt = await transferTx.wait();
      console.log(`   ✅ Transfer confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        txHash: transferTx.hash,
        amount: totalAmount
      };
      
    } catch (error) {
      console.error('   ❌ Transfer failed:', error.message);
      throw error;
    }
  }

  /**
   * Batch allocate rewards to smart contract
   */
  async allocateHistoricalRewards(mappedRewards) {
    console.log(`\\n📝 Allocating ${mappedRewards.length} historical rewards to smart contract...`);
    
    try {
      const rewardsContract = new ethers.Contract(
        this.rewardsContractAddress,
        this.rewardsContractABI,
        this.botWallet
      );
      
      // Prepare batch data (max 100 per batch to avoid gas limits)
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < mappedRewards.length; i += batchSize) {
        const batch = mappedRewards.slice(i, i + batchSize);
        const addresses = batch.map(r => r.walletAddress);
        const amounts = batch.map(r => ethers.parseEther(r.amount.toString()));
        
        batches.push({ addresses, amounts, users: batch });
      }
      
      console.log(`   Processing ${batches.length} batches of up to ${batchSize} allocations each...`);
      
      const results = [];
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        console.log(`   Batch ${i + 1}/${batches.length}: ${batch.addresses.length} allocations`);
        
        try {
          // Estimate gas
          const gasEstimate = await rewardsContract.allocateRewardsBatch.estimateGas(
            batch.addresses,
            batch.amounts
          );
          
          // Execute transaction
          const tx = await rewardsContract.allocateRewardsBatch(
            batch.addresses,
            batch.amounts,
            { gasLimit: gasEstimate + BigInt(100000) } // Add buffer
          );
          
          console.log(`     Transaction sent: ${tx.hash}`);
          
          const receipt = await tx.wait();
          console.log(`     ✅ Confirmed in block ${receipt.blockNumber}`);
          
          results.push({
            batchIndex: i,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            allocations: batch.users.length,
            success: true
          });
          
          // Add delay between batches
          if (i < batches.length - 1) {
            console.log('     Waiting 2 seconds before next batch...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          console.error(`     ❌ Batch ${i + 1} failed:`, error.message);
          results.push({
            batchIndex: i,
            error: error.message,
            success: false
          });
        }
      }
      
      const successfulBatches = results.filter(r => r.success).length;
      console.log(`\\n📊 Allocation Results:`);
      console.log(`   - Successful batches: ${successfulBatches}/${batches.length}`);
      console.log(`   - Total allocations: ${mappedRewards.length}`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Allocation process failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify allocations in contract
   */
  async verifyAllocations(mappedRewards) {
    console.log('\\n🔍 Verifying allocations in smart contract...');
    
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
      console.log(`   - Batches processed: ${batchCount.toString()}`);
      
      // Sample verification - check a few users
      console.log('\\n🧪 Sample User Verification:');
      const sampleUsers = mappedRewards.slice(0, 3);
      
      for (const user of sampleUsers) {
        try {
          const [userAllocated, userClaimed, userClaimable] = 
            await rewardsContract.getUserRewardInfo(user.walletAddress);
          
          const expectedAmount = ethers.parseEther(user.amount.toString());
          const allocated = ethers.formatEther(userAllocated);
          const claimable = ethers.formatEther(userClaimable);
          
          console.log(`   @${user.username}: ${allocated} $ABC allocated, ${claimable} $ABC claimable`);
          
          if (userAllocated.toString() === expectedAmount.toString()) {
            console.log('     ✅ Amount matches expected');
          } else {
            console.log('     ⚠️ Amount mismatch');
          }
        } catch (error) {
          console.log(`   ❌ Failed to verify @${user.username}:`, error.message);
        }
      }
      
      return {
        totalAllocated: ethers.formatEther(totalAllocated),
        contractBalance: ethers.formatEther(contractBalance),
        batchCount: batchCount.toString()
      };
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      console.log('🚀 ABC DAO Historical Rewards Processor');
      console.log('=====================================\\n');
      
      console.log('Configuration:');
      console.log(`- Bot FID: ${this.botFid}`);
      console.log(`- Bot Wallet: ${this.botWallet.address}`);
      console.log(`- ABC Token: ${this.abcTokenAddress}`);
      console.log(`- Rewards Contract: ${this.rewardsContractAddress}\\n`);
      
      // Step 1: Process historical casts
      const { rewards, totalAmount } = await this.processHistoricalCasts();
      
      if (rewards.length === 0) {
        console.log('No historical rewards found. Exiting.');
        return;
      }
      
      // Step 2: Map usernames to wallets
      const { mappedRewards, totalMappedAmount } = await this.mapUsernamesToWallets(rewards);
      
      if (mappedRewards.length === 0) {
        console.log('No users with wallet addresses found. Exiting.');
        return;
      }
      
      // Step 3: Fund rewards contract
      await this.fundRewardsContract(totalMappedAmount);
      
      // Step 4: Allocate rewards to contract
      await this.allocateHistoricalRewards(mappedRewards);
      
      // Step 5: Verify allocations
      await this.verifyAllocations(mappedRewards);
      
      console.log('\\n🎉 Historical rewards processing completed successfully!');
      console.log(`\\n📋 Summary:`);
      console.log(`- Processed ${rewards.length} users with historical rewards`);
      console.log(`- Allocated rewards for ${mappedRewards.length} users with wallets`);
      console.log(`- Total amount allocated: ${totalMappedAmount.toLocaleString()} $ABC`);
      console.log(`\\n✨ Users can now claim their historical rewards via the miniapp!`);
      
    } catch (error) {
      console.error('\\n❌ Process failed:', error);
    }
  }
}

// Run the processor
const processor = new HistoricalRewardsProcessor();
processor.run().then(() => {
  console.log('\\nProcess completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});