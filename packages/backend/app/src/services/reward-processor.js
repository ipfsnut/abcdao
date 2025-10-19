import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { ethers } from 'ethers';
import { getPool } from './database.js';

// Conditional social media import
let socialMedia = null;
(async () => {
  try {
    const socialMediaModule = await import('./social-media.js');
    socialMedia = socialMediaModule.default;
    console.log('✅ Social media service loaded');
  } catch (error) {
    console.warn('⚠️ Social media service not available:', error.message);
  }
})();

class RewardProcessor {
  constructor() {
    this.neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    this.botFid = process.env.NEYNAR_BOT_FID || '8573'; // Default to your FID for now
    
    // Initialize Web3 provider and contract
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    this.botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, this.provider);
    
    // ABCRewards contract ABI (minimal)
    this.rewardsContractABI = [
      "function allocateRewardsBatch(address[] calldata users, uint256[] calldata amounts) external",
      "function allocateReward(address user, uint256 amount) external",
      "function getContractStats() external view returns (uint256, uint256, uint256, uint256)",
      "function authorized(address) external view returns (bool)",
      "function setAuthorized(address account, bool _authorized) external"
    ];
  }

  /**
   * Parse reward information from a Farcaster cast
   * @param {string} castText - The text content of the cast
   * @returns {Object|null} - Parsed reward data or null if not a reward cast
   */
  parseRewardFromCast(castText) {
    // Pattern to match: "@username earned 250,000 $ABC"
    const rewardPattern = /@(\w+)\s+(?:just\s+)?earned:?\s*([\d,]+)\s*\$ABC/i;
    const match = castText.match(rewardPattern);
    
    if (!match) return null;
    
    return {
      username: match[1],
      amount: parseInt(match[2].replace(/,/g, ''))
    };
  }

  /**
   * Get bot's casts from the last 24 hours
   * @returns {Array} - Array of casts with reward announcements
   */
  async getBotCastsLast24Hours() {
    try {
      console.log(`🔍 Fetching casts from bot FID ${this.botFid} for last 24 hours...`);
      
      // Get recent casts from the bot
      const response = await this.neynar.fetchCastsByUser(parseInt(this.botFid), {
        limit: 100 // Should cover more than a day's worth
      });
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Filter to last 24 hours and parse reward casts
      const rewardCasts = response.casts
        .filter(cast => new Date(cast.timestamp) > oneDayAgo)
        .map(cast => {
          const reward = this.parseRewardFromCast(cast.text);
          if (!reward) return null;
          
          return {
            castHash: cast.hash,
            castText: cast.text,
            timestamp: cast.timestamp,
            username: reward.username,
            amount: reward.amount
          };
        })
        .filter(Boolean);
      
      console.log(`✅ Found ${rewardCasts.length} reward casts in last 24 hours`);
      return rewardCasts;
      
    } catch (error) {
      console.error('❌ Error fetching bot casts:', error);
      throw error;
    }
  }

  /**
   * Map Farcaster usernames to wallet addresses
   * @param {Array} rewardCasts - Array of reward cast data
   * @returns {Array} - Array with wallet addresses added
   */
  async mapUsernamesToAddresses(rewardCasts) {
    const pool = getPool();
    
    const usernamesWithRewards = [];
    
    for (const cast of rewardCasts) {
      try {
        // Look up wallet address for this username
        const userResult = await pool.query(
          'SELECT wallet_address FROM users WHERE farcaster_username = $1 AND wallet_address IS NOT NULL',
          [cast.username]
        );
        
        if (userResult.rows.length > 0) {
          usernamesWithRewards.push({
            ...cast,
            walletAddress: userResult.rows[0].wallet_address
          });
          console.log(`✅ Mapped @${cast.username} → ${userResult.rows[0].wallet_address} (${cast.amount.toLocaleString()} $ABC)`);
        } else {
          console.log(`⚠️ No wallet found for @${cast.username} - skipping ${cast.amount.toLocaleString()} $ABC`);
        }
      } catch (error) {
        console.error(`❌ Error mapping username ${cast.username}:`, error);
      }
    }
    
    return usernamesWithRewards;
  }

  /**
   * Check if a cast has already been processed
   * @param {string} castHash - The hash of the cast
   * @returns {boolean} - True if already processed
   */
  async isCastProcessed(castHash) {
    const pool = getPool();
    
    try {
      const result = await pool.query(
        'SELECT id FROM processed_casts WHERE cast_hash = $1',
        [castHash]
      );
      return result.rows.length > 0;
    } catch (error) {
      // Table might not exist yet, that's ok
      console.log('⚠️ processed_casts table not found, assuming cast is new');
      return false;
    }
  }

  /**
   * Mark a cast as processed
   * @param {string} castHash - The hash of the cast
   */
  async markCastProcessed(castHash) {
    const pool = getPool();
    
    try {
      await pool.query(
        'INSERT INTO processed_casts (cast_hash, processed_at) VALUES ($1, NOW()) ON CONFLICT (cast_hash) DO NOTHING',
        [castHash]
      );
    } catch (error) {
      console.log('⚠️ Could not mark cast as processed:', error.message);
    }
  }

  /**
   * Get rewards contract instance
   * @returns {ethers.Contract} - Rewards contract instance
   */
  getRewardsContract() {
    if (!process.env.ABC_REWARDS_CONTRACT_ADDRESS) {
      throw new Error('ABC_REWARDS_CONTRACT_ADDRESS not set in environment');
    }
    
    return new ethers.Contract(
      process.env.ABC_REWARDS_CONTRACT_ADDRESS,
      this.rewardsContractABI,
      this.botWallet
    );
  }

  /**
   * Allocate rewards to users via smart contract
   * @param {Array} addresses - Array of wallet addresses
   * @param {Array} amounts - Array of reward amounts (in ABC tokens, not wei)
   * @returns {Object} - Transaction result
   */
  async allocateRewardsToContract(addresses, amounts) {
    try {
      const contract = this.getRewardsContract();
      
      // Convert amounts to wei (18 decimals)
      const amountsInWei = amounts.map(amount => ethers.parseEther(amount.toString()));
      
      console.log(`🔄 Allocating rewards to contract...`);
      console.log(`   - Recipients: ${addresses.length}`);
      console.log(`   - Total ABC: ${amounts.reduce((sum, amount) => sum + amount, 0).toLocaleString()}`);
      
      // Estimate gas first
      const gasEstimate = await contract.allocateRewardsBatch.estimateGas(addresses, amountsInWei);
      console.log(`   - Estimated gas: ${gasEstimate.toString()}`);
      
      // Execute transaction
      const tx = await contract.allocateRewardsBatch(addresses, amountsInWei, {
        gasLimit: gasEstimate + BigInt(50000) // Add buffer
      });
      
      console.log(`🚀 Transaction sent: ${tx.hash}`);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      
      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        success: true
      };
      
    } catch (error) {
      console.error('❌ Smart contract allocation failed:', error);
      throw error;
    }
  }

  /**
   * Check if bot is authorized to allocate rewards
   * @returns {boolean} - True if authorized
   */
  async isBotAuthorized() {
    try {
      const contract = this.getRewardsContract();
      return await contract.authorized(this.botWallet.address);
    } catch (error) {
      console.error('Error checking authorization:', error);
      return false;
    }
  }

  /**
   * Get contract stats
   * @returns {Object} - Contract statistics
   */
  async getContractStats() {
    try {
      const contract = this.getRewardsContract();
      const [totalAllocated, totalClaimed, contractBalance, batchCount] = await contract.getContractStats();
      
      return {
        totalAllocated: ethers.formatEther(totalAllocated),
        totalClaimed: ethers.formatEther(totalClaimed),
        contractBalance: ethers.formatEther(contractBalance),
        batchCount: batchCount.toString()
      };
    } catch (error) {
      console.error('Error getting contract stats:', error);
      return null;
    }
  }

  /**
   * Process last 24 hours of reward casts and update smart contract
   * @returns {Object} - Processing results including transaction info
   */
  async processDailyRewards() {
    try {
      console.log('🔄 Starting daily reward processing...');
      
      // 1. Get bot's reward casts from last 24 hours
      const rewardCasts = await this.getBotCastsLast24Hours();
      
      if (rewardCasts.length === 0) {
        console.log('ℹ️ No reward casts found in last 24 hours');
        return { addresses: [], amounts: [], totalProcessed: 0 };
      }
      
      // 2. Filter out already processed casts
      const newCasts = [];
      for (const cast of rewardCasts) {
        const isProcessed = await this.isCastProcessed(cast.castHash);
        if (!isProcessed) {
          newCasts.push(cast);
        }
      }
      
      if (newCasts.length === 0) {
        console.log('ℹ️ All reward casts already processed');
        return { addresses: [], amounts: [], totalProcessed: 0 };
      }
      
      console.log(`🔄 Processing ${newCasts.length} new reward casts`);
      
      // 3. Map usernames to wallet addresses
      const rewardsWithAddresses = await this.mapUsernamesToAddresses(newCasts);
      
      // 4. Group by address (in case same user has multiple rewards)
      const rewardsByAddress = {};
      for (const reward of rewardsWithAddresses) {
        if (rewardsByAddress[reward.walletAddress]) {
          rewardsByAddress[reward.walletAddress] += reward.amount;
        } else {
          rewardsByAddress[reward.walletAddress] = reward.amount;
        }
      }
      
      // 5. Prepare arrays for contract call
      const addresses = Object.keys(rewardsByAddress);
      const amounts = Object.values(rewardsByAddress);
      
      // 6. Mark all casts as processed
      for (const cast of newCasts) {
        await this.markCastProcessed(cast.castHash);
      }
      
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
      
      // 7. Update smart contract with batch rewards
      let contractResult = null;
      if (addresses.length > 0) {
        console.log('🔄 Updating smart contract...');
        
        // Check if bot is authorized
        const isAuthorized = await this.isBotAuthorized();
        if (!isAuthorized) {
          console.error('❌ Bot is not authorized to allocate rewards on contract');
          throw new Error('Bot not authorized for contract operations');
        }
        
        contractResult = await this.allocateRewardsToContract(addresses, amounts);
      }
      
      console.log(`✅ Daily reward processing complete:`);
      console.log(`   - ${addresses.length} unique recipients`);
      console.log(`   - ${totalAmount.toLocaleString()} total $ABC allocated`);
      console.log(`   - ${newCasts.length} casts processed`);
      if (contractResult) {
        console.log(`   - Contract updated: ${contractResult.txHash}`);
      }

      // Announce individual rewards on social media
      if (socialMedia) {
        for (const reward of rewardsWithAddresses) {
          try {
            await socialMedia.announceCommitReward(
              reward.username,
              reward.amount,
              reward.castText,
              'ABC DAO' // You might want to extract repo name from castText
            );
          } catch (error) {
            console.warn(`Failed to announce reward for @${reward.username}:`, error.message);
          }
        }
      } else {
        console.log('⚠️ Social media service not available - skipping announcements');
      }
      
      return {
        addresses,
        amounts,
        totalProcessed: newCasts.length,
        totalAmount,
        contractTransaction: contractResult
      };
      
    } catch (error) {
      console.error('❌ Daily reward processing failed:', error);
      throw error;
    }
  }
}

export default new RewardProcessor();