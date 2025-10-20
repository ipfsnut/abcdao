/**
 * Bot Following Service
 * 
 * Automated service to follow ABC DAO members on Farcaster
 * - Discovers new members with Farcaster profiles
 * - Follows them using Neynar API
 * - Tracks follows to avoid duplicates
 * - Handles errors and retries
 */

import { getPool } from './database.js';
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

class BotFollowingService {
  constructor() {
    this.client = null;
    this.signerUuid = null;
    this.pool = null;
    this.initialized = false;
    
    // Configuration
    this.maxRetries = 3;
    this.batchSize = 10; // Follow users in batches
    this.retryDelay = 5000; // 5 seconds between retries
  }

  async initialize() {
    if (this.initialized) return;
    
    // Initialize database
    const { initializeDatabase } = await import('./database.js');
    await initializeDatabase();
    
    // Initialize database pool
    this.pool = await getPool();
    
    // Initialize Neynar client
    if (!process.env.NEYNAR_API_KEY) {
      console.warn('⚠️ NEYNAR_API_KEY not configured - Bot following disabled');
      return;
    }

    this.client = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    this.signerUuid = process.env.ABC_DEV_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;

    if (!this.signerUuid) {
      console.warn('⚠️ Signer UUID not configured - Bot cannot follow users');
      return;
    }

    console.log('✅ Bot Following Service initialized');
    this.initialized = true;
  }

  /**
   * Find ABC DAO members who have Farcaster profiles but haven't been followed yet
   */
  async findMembersToFollow() {
    const query = `
      SELECT 
        u.farcaster_fid,
        u.farcaster_username,
        u.github_username,
        u.display_name
      FROM users u
      LEFT JOIN bot_follows bf ON u.farcaster_fid = bf.target_fid
      WHERE 
        u.farcaster_fid IS NOT NULL 
        AND u.farcaster_fid > 0
        AND u.membership_status = 'paid'
        AND u.is_active = true
        AND bf.target_fid IS NULL  -- Not already followed
      ORDER BY u.created_at DESC
      LIMIT 50
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Find previously failed follows that can be retried
   */
  async findRetryableFollows() {
    const query = `
      SELECT 
        bf.target_fid,
        bf.target_username,
        bf.retry_count,
        bf.error_message
      FROM bot_follows bf
      WHERE 
        bf.follow_status = 'failed'
        AND bf.retry_count < $1
        AND bf.last_attempt_at < NOW() - INTERVAL '1 hour'  -- Wait 1 hour between retries
      ORDER BY bf.last_attempt_at ASC
      LIMIT 20
    `;
    
    const result = await this.pool.query(query, [this.maxRetries]);
    return result.rows;
  }

  /**
   * Record a follow attempt in the database
   */
  async recordFollowAttempt(fid, username, status, errorMessage = null) {
    const query = `
      INSERT INTO bot_follows (target_fid, target_username, follow_status, error_message)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (target_fid) 
      DO UPDATE SET
        follow_status = $3,
        error_message = $4,
        retry_count = CASE 
          WHEN $3 = 'failed' THEN bot_follows.retry_count + 1 
          ELSE bot_follows.retry_count 
        END,
        last_attempt_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [fid, username, status, errorMessage]);
    return result.rows[0];
  }

  /**
   * Follow a single user on Farcaster
   */
  async followUser(fid, username) {
    if (!this.client || !this.signerUuid) {
      throw new Error('Neynar client not properly configured');
    }

    try {
      console.log(`🔗 Attempting to follow FID ${fid} (@${username})...`);
      
      // Use Neynar SDK to follow the user
      const response = await this.client.followUser(this.signerUuid, fid);
      
      console.log(`✅ Successfully followed @${username} (FID: ${fid})`);
      
      // Record successful follow
      await this.recordFollowAttempt(fid, username, 'active');
      
      return {
        success: true,
        fid,
        username,
        response
      };
      
    } catch (error) {
      console.error(`❌ Failed to follow @${username} (FID: ${fid}):`, error.message);
      
      // Record failed follow
      await this.recordFollowAttempt(fid, username, 'failed', error.message);
      
      return {
        success: false,
        fid,
        username,
        error: error.message
      };
    }
  }

  /**
   * Follow multiple users in batch with rate limiting
   */
  async followUsersBatch(users) {
    const results = [];
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      try {
        const result = await this.followUser(user.farcaster_fid, user.farcaster_username);
        results.push(result);
        
        // Rate limiting: wait between follows
        if (i < users.length - 1) {
          await this.sleep(2000); // 2 second delay between follows
        }
        
      } catch (error) {
        console.error(`❌ Batch follow error for ${user.farcaster_username}:`, error.message);
        results.push({
          success: false,
          fid: user.farcaster_fid,
          username: user.farcaster_username,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Main execution function - follow new members and retry failed follows
   */
  async executeFollowingProcess() {
    await this.initialize();
    
    if (!this.client || !this.signerUuid) {
      console.warn('⚠️ Bot following skipped - Neynar not configured');
      return { success: false, message: 'Neynar not configured' };
    }

    const startTime = Date.now();
    let totalFollowed = 0;
    let totalErrors = 0;
    
    try {
      console.log('🚀 Starting bot following process...');
      
      // Step 1: Follow new members
      console.log('📋 Finding new members to follow...');
      const newMembers = await this.findMembersToFollow();
      
      if (newMembers.length > 0) {
        console.log(`📝 Found ${newMembers.length} new members to follow`);
        
        // Process in batches
        for (let i = 0; i < newMembers.length; i += this.batchSize) {
          const batch = newMembers.slice(i, i + this.batchSize);
          console.log(`🔄 Processing batch ${Math.floor(i / this.batchSize) + 1} (${batch.length} users)`);
          
          const batchResults = await this.followUsersBatch(batch);
          
          // Count results
          batchResults.forEach(result => {
            if (result.success) {
              totalFollowed++;
            } else {
              totalErrors++;
            }
          });
          
          // Delay between batches
          if (i + this.batchSize < newMembers.length) {
            console.log('⏳ Waiting before next batch...');
            await this.sleep(5000); // 5 second delay between batches
          }
        }
      } else {
        console.log('✅ No new members to follow');
      }
      
      // Step 2: Retry failed follows
      console.log('🔄 Checking for retryable failed follows...');
      const retryableFollows = await this.findRetryableFollows();
      
      if (retryableFollows.length > 0) {
        console.log(`🔁 Found ${retryableFollows.length} follows to retry`);
        
        const retryResults = await this.followUsersBatch(
          retryableFollows.map(follow => ({
            farcaster_fid: follow.target_fid,
            farcaster_username: follow.target_username
          }))
        );
        
        // Count retry results
        retryResults.forEach(result => {
          if (result.success) {
            totalFollowed++;
          } else {
            totalErrors++;
          }
        });
      } else {
        console.log('✅ No failed follows to retry');
      }
      
      const duration = Date.now() - startTime;
      
      const summary = {
        success: true,
        newMembersFound: newMembers.length,
        retryableFollows: retryableFollows.length,
        totalFollowed,
        totalErrors,
        duration: `${(duration / 1000).toFixed(1)}s`
      };
      
      console.log('🎉 Bot following process completed:', summary);
      return summary;
      
    } catch (error) {
      console.error('❌ Bot following process failed:', error);
      return {
        success: false,
        error: error.message,
        totalFollowed,
        totalErrors
      };
    }
  }

  /**
   * Get following statistics
   */
  async getStats() {
    await this.initialize();
    
    const query = `
      SELECT 
        follow_status,
        COUNT(*) as count,
        MAX(followed_at) as last_followed
      FROM bot_follows
      GROUP BY follow_status
      ORDER BY follow_status
    `;
    
    const result = await this.pool.query(query);
    
    const stats = {
      total: 0,
      active: 0,
      failed: 0,
      pending: 0,
      unfollowed: 0
    };
    
    result.rows.forEach(row => {
      stats[row.follow_status] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });
    
    return stats;
  }

  /**
   * Helper function for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const botFollowingService = new BotFollowingService();
export default botFollowingService;