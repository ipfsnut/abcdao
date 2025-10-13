import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { getPool } from './database.js';

class RewardProcessor {
  constructor() {
    this.neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    this.botFid = process.env.NEYNAR_BOT_FID || '8573'; // Default to your FID for now
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
   * Process last 24 hours of reward casts and prepare for contract update
   * @returns {Object} - Batch reward data ready for contract
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
      
      console.log(`✅ Daily reward processing complete:`);
      console.log(`   - ${addresses.length} unique recipients`);
      console.log(`   - ${totalAmount.toLocaleString()} total $ABC to distribute`);
      console.log(`   - ${newCasts.length} casts processed`);
      
      return {
        addresses,
        amounts,
        totalProcessed: newCasts.length,
        totalAmount
      };
      
    } catch (error) {
      console.error('❌ Daily reward processing failed:', error);
      throw error;
    }
  }
}

export default new RewardProcessor();