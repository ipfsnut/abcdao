/**
 * Bot Following Cron Job
 * 
 * Automated daily job to follow new ABC DAO members on Farcaster
 * Runs daily at 3:00 PM UTC to discover and follow new members
 */

import cron from 'node-cron';
import { botFollowingService } from '../services/bot-following-service.js';
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { getPool } from '../services/database.js';

// Schedule: Daily at 3:00 PM UTC (different from other automation jobs)
const CRON_SCHEDULE = '0 15 * * *';

let isRunning = false;
let cronJob = null;

/**
 * Record the following run in database for tracking
 */
async function recordFollowingRun(stats, error = null) {
  try {
    const pool = await getPool();
    
    // Create following_runs table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bot_following_runs (
        id SERIAL PRIMARY KEY,
        run_at TIMESTAMP DEFAULT NOW(),
        new_members_found INTEGER DEFAULT 0,
        retryable_follows INTEGER DEFAULT 0,
        total_followed INTEGER DEFAULT 0,
        total_errors INTEGER DEFAULT 0,
        duration_ms INTEGER,
        error_message TEXT,
        status VARCHAR(20) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    const query = `
      INSERT INTO bot_following_runs (
        new_members_found, retryable_follows, total_followed, 
        total_errors, duration_ms, error_message, status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const status = error ? 'failed' : 'success';
    const duration = stats?.duration ? parseFloat(stats.duration.replace('s', '')) * 1000 : null;
    
    const result = await pool.query(query, [
      stats?.newMembersFound || 0,
      stats?.retryableFollows || 0,
      stats?.totalFollowed || 0,
      stats?.totalErrors || 0,
      duration,
      error?.message || null,
      status
    ]);
    
    console.log('📝 Bot following run recorded:', result.rows[0]);
    return result.rows[0];
  } catch (dbError) {
    console.error('❌ Failed to record bot following run:', dbError);
  }
}

/**
 * Post Farcaster announcement about following activity
 */
async function announceFollowingActivity(stats) {
  try {
    if (!process.env.NEYNAR_API_KEY || !process.env.ABC_DEV_SIGNER_UUID) {
      console.log('⚠️ Skipping Farcaster announcement - credentials not configured');
      return;
    }
    
    // Only announce if we actually followed someone
    if (stats.totalFollowed === 0) {
      console.log('📢 No new follows - skipping announcement');
      return;
    }
    
    const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    const signerUuid = process.env.ABC_DEV_SIGNER_UUID;
    
    const message = `🤝 BOT FOLLOWING UPDATE\\n\\n` +
      `✅ Followed ${stats.totalFollowed} new ABC DAO members\\n` +
      `🔍 Found ${stats.newMembersFound} new members with Farcaster\\n` +
      `🔄 Retried ${stats.retryableFollows} previous attempts\\n\\n` +
      `Building stronger connections in the ABC community! 🚀\\n\\n` +
      `#ABCDAO #Farcaster #Community`;
    
    const response = await client.publishCast(signerUuid, message);
    console.log('📢 Bot following announcement posted:', response.cast.hash);
    
    return response.cast;
  } catch (error) {
    console.error('❌ Failed to announce bot following activity:', error);
  }
}

/**
 * Main bot following execution function
 */
async function executeBotFollowing() {
  if (isRunning) {
    console.log('⏳ Bot following process already running, skipping...');
    return;
  }
  
  isRunning = true;
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting scheduled bot following process...');
    
    // Execute the following process
    const stats = await botFollowingService.executeFollowingProcess();
    
    if (stats.success) {
      console.log('✅ Bot following process completed successfully:', stats);
      
      // Record successful run
      await recordFollowingRun(stats);
      
      // Announce activity if there were new follows
      if (stats.totalFollowed > 0) {
        await announceFollowingActivity(stats);
      }
    } else {
      console.error('❌ Bot following process failed:', stats);
      await recordFollowingRun(stats, new Error(stats.error || 'Unknown error'));
    }
    
  } catch (error) {
    console.error('❌ Bot following cron job failed:', error);
    
    // Record failed run
    await recordFollowingRun({}, error);
    
  } finally {
    isRunning = false;
    const duration = Date.now() - startTime;
    console.log(`⏰ Bot following process finished in ${(duration / 1000).toFixed(1)}s`);
  }
}

/**
 * Start the bot following cron job
 */
export function startBotFollowingCron() {
  if (cronJob) {
    console.log('⚠️ Bot following cron job already running');
    return;
  }
  
  console.log(`🕒 Scheduling bot following cron job: ${CRON_SCHEDULE} (Daily at 3:00 PM UTC)`);
  
  cronJob = cron.schedule(CRON_SCHEDULE, async () => {
    console.log('⏰ Bot following cron job triggered');
    await executeBotFollowing();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('✅ Bot following cron job started');
}

/**
 * Stop the bot following cron job
 */
export function stopBotFollowingCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob.destroy();
    cronJob = null;
    console.log('🛑 Bot following cron job stopped');
  }
}

/**
 * Get next scheduled run time
 */
export function getBotFollowingSchedule() {
  return {
    schedule: CRON_SCHEDULE,
    description: 'Daily at 3:00 PM UTC',
    isRunning: !!cronJob,
    currentlyExecuting: isRunning,
    nextRun: cronJob ? 'Next run calculated by cron' : null
  };
}

/**
 * Manual trigger (for testing and admin use)
 */
export async function triggerBotFollowing() {
  console.log('🔧 Manual bot following trigger requested');
  await executeBotFollowing();
}

// Export for manual testing
export { executeBotFollowing };