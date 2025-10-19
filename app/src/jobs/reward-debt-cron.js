import cron from 'node-cron';
import { RewardDebtProcessor } from '../scripts/reward-debt-processor.js';

class RewardDebtCron {
  constructor() {
    this.processor = new RewardDebtProcessor();
    this.isRunning = false;
  }

  /**
   * Start the cron job to process reward debt every 12 hours
   */
  start() {
    console.log('⏰ Starting reward debt cron job (every 12 hours)...');
    
    // Run every 12 hours at minute 0 (12:00 AM and 12:00 PM)
    this.cronJob = cron.schedule('0 0,12 * * *', async () => {
      if (this.isRunning) {
        console.log('⚠️ Reward debt processing already running, skipping...');
        return;
      }

      this.isRunning = true;
      const timestamp = new Date().toISOString();
      
      try {
        console.log(`\n🕐 [${timestamp}] Starting scheduled reward debt processing...`);
        await this.processor.processRewardDebt();
        console.log(`✅ [${timestamp}] Scheduled reward debt processing completed\n`);
      } catch (error) {
        console.error(`❌ [${timestamp}] Scheduled reward debt processing failed:`, error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('✅ Reward debt cron job started');
    console.log('   - Runs every 12 hours at 12:00 AM and 12:00 PM UTC');
    console.log('   - Processes all outstanding reward debt');
    console.log('   - Allocates rewards to smart contract for claiming\n');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 Reward debt cron job stopped');
    }
  }

  /**
   * Run immediately (for testing)
   */
  async runNow() {
    console.log('🚀 Running reward debt processing immediately...\n');
    
    if (this.isRunning) {
      console.log('⚠️ Already running, please wait...');
      return;
    }

    this.isRunning = true;
    try {
      await this.processor.processRewardDebt();
      console.log('✅ Manual reward debt processing completed');
    } catch (error) {
      console.error('❌ Manual reward debt processing failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get next scheduled run times
   */
  getNextRuns() {
    const now = new Date();
    const next12 = new Date(now);
    const next24 = new Date(now);
    
    // Find next 12:00 AM or 12:00 PM
    if (now.getUTCHours() < 12) {
      next12.setUTCHours(12, 0, 0, 0);
      next24.setUTCDate(now.getUTCDate() + 1);
      next24.setUTCHours(0, 0, 0, 0);
    } else {
      next12.setUTCDate(now.getUTCDate() + 1);
      next12.setUTCHours(0, 0, 0, 0);
      next24.setUTCHours(12, 0, 0, 0);
    }

    return {
      next: next12,
      following: next24
    };
  }
}

export { RewardDebtCron };