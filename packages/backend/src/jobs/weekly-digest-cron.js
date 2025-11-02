import cron from 'node-cron';
import { CommitDigestService } from '../services/commit-digest-service.js';
import { DigestAnalytics } from '../services/digest-analytics.js';
import { DigestFormatter } from '../services/digest-formatter.js';

/**
 * Weekly Digest Cron Job
 * 
 * Automatically generates and posts weekly development digests via @abc-dao-dev bot
 * - Analyzes the previous week's commit activity
 * - Generates formatted digest content
 * - Posts to Farcaster via @abc-dao-dev account
 * - Records digest metrics in database
 * 
 * Schedule: Fridays at 5:00 PM UTC (before weekend)
 */
class WeeklyDigestCron {
  constructor() {
    this.digestService = new CommitDigestService();
    this.analytics = new DigestAnalytics();
    this.formatter = new DigestFormatter();
    this.isRunning = false;
    
    // Configuration
    this.minCommitsThreshold = parseInt(process.env.DIGEST_MIN_COMMITS) || 1;
    this.schedulePattern = process.env.DIGEST_SCHEDULE || '0 17 * * 5'; // Fridays 5 PM UTC
    this.enabled = process.env.DIGEST_ENABLED !== 'false';
  }

  /**
   * Generate and post weekly digest
   */
  async generateWeeklyDigest() {
    if (this.isRunning) {
      console.log('⚠️ Weekly digest generation already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('🔄 Starting weekly digest generation...');
      
      // Calculate previous week's date range (Monday to Sunday)
      const now = new Date();
      const endDate = new Date(now);
      
      // Get the previous Friday (or today if it's Friday and after 5 PM)
      const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
      const hour = now.getHours();
      
      // If it's Friday after 5 PM UTC, use this week's data
      // Otherwise, use last week's data
      if (dayOfWeek === 5 && hour >= 17) {
        // Use current week (Monday to now)
        const daysToMonday = (dayOfWeek + 6) % 7; // Days since Monday
        const startDate = new Date(now.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Use previous complete week (Monday to Sunday)
        const daysToLastSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
        endDate.setTime(now.getTime() - daysToLastSunday * 24 * 60 * 60 * 1000);
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
      }
      
      const startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      
      console.log(`📊 Analyzing week: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      // Generate analytics for the week
      const analytics = await this.analytics.analyzeWeeklyActivity(startDate, endDate);
      
      // Check if there's enough activity to warrant a digest
      if (analytics.totalCommits < this.minCommitsThreshold) {
        console.log(`📭 Insufficient activity for digest: ${analytics.totalCommits} commits (minimum: ${this.minCommitsThreshold})`);
        
        // Optionally post a simple "quiet week" message for very low activity
        if (analytics.totalCommits === 0) {
          const quietWeekMessage = this.formatter.formatSimpleSummary(analytics);
          await this.postDigest(quietWeekMessage, 'quiet-week');
          
          // Record minimal digest
          await this.digestService.recordDigestPost({
            digestType: 'weekly-quiet',
            periodStart: startDate,
            periodEnd: endDate,
            castHash: null,
            castUrl: null,
            totalCommits: 0,
            totalRewards: 0,
            uniqueContributors: 0,
            repositoriesInvolved: [],
            topContributors: [],
            activityMetrics: { type: 'quiet-week' }
          });
        }
        
        return;
      }
      
      // Generate digest content
      console.log(`📝 Generating digest for ${analytics.totalCommits} commits across ${analytics.repositoryBreakdown.length} repositories`);
      
      let digestContent;
      if (analytics.totalCommits <= 5) {
        // Use simple format for low activity
        digestContent = this.formatter.formatSimpleSummary(analytics);
      } else {
        // Use full digest format
        digestContent = this.formatter.formatWeeklyDigest(analytics);
      }
      
      // Validate content length
      if (digestContent.length > this.formatter.maxCastLength) {
        console.log('⚠️ Digest exceeds character limit, truncating...');
        const preview = this.formatter.previewDigest(analytics, 'weekly');
        digestContent = preview.content;
      }
      
      console.log(`📏 Digest length: ${digestContent.length} characters`);
      
      // Post digest via @abc-dao-dev
      const castResult = await this.postDigest(digestContent);
      
      if (!castResult.success) {
        throw new Error(`Failed to post digest: ${castResult.error}`);
      }
      
      // Record digest in database
      const digestRecord = await this.digestService.recordDigestPost({
        digestType: 'weekly',
        periodStart: startDate,
        periodEnd: endDate,
        castHash: castResult.castHash,
        castUrl: castResult.castUrl,
        totalCommits: analytics.totalCommits,
        totalRewards: analytics.rewardDistribution.totalRewards,
        uniqueContributors: analytics.contributorRankings.length,
        repositoriesInvolved: analytics.repositoryBreakdown.map(repo => repo.repository),
        topContributors: analytics.contributorRankings.slice(0, 5),
        activityMetrics: {
          developmentTrends: analytics.developmentTrends,
          communityGrowth: analytics.communityGrowth,
          rewardDistribution: analytics.rewardDistribution
        }
      });
      
      console.log(`✅ Weekly digest posted successfully!`);
      console.log(`📊 Cast: ${castResult.castUrl}`);
      console.log(`💾 Database record: ${digestRecord}`);
      
    } catch (error) {
      console.error('❌ Weekly digest generation failed:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Don't throw - allow other crons to continue
      // Could implement alerting here for production
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Post digest content via @abc-dao-dev bot
   */
  async postDigest(content, type = 'weekly') {
    const devSignerUuid = process.env.ABC_DEV_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;
    
    if (!devSignerUuid) {
      throw new Error('ABC_DEV_SIGNER_UUID not configured - cannot post digest');
    }

    if (!process.env.NEYNAR_API_KEY) {
      throw new Error('NEYNAR_API_KEY not configured - cannot post digest');
    }

    try {
      console.log(`📢 Posting ${type} digest from @abc-dao-dev (signer: ${devSignerUuid.substring(0, 8)}...)`);
      
      // Initialize Neynar client
      const { NeynarAPIClient } = await import('@neynar/nodejs-sdk');
      const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
      
      // Post cast
      const result = await neynar.publishCast(devSignerUuid, content);
      
      const castHash = result?.cast?.hash || result?.hash || 'unknown';
      const castUrl = `https://warpcast.com/abc-dao-dev/${castHash.substring(0, 10)}`;
      
      console.log(`✅ Digest posted successfully: ${castHash}`);
      
      return {
        success: true,
        castHash,
        castUrl,
        result
      };
      
    } catch (error) {
      console.error('❌ Failed to post digest cast:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Manual trigger for testing and admin use
   */
  async triggerManual() {
    console.log('🔧 Manual digest trigger requested...');
    await this.generateWeeklyDigest();
  }

  /**
   * Preview digest without posting
   */
  async previewDigest() {
    try {
      console.log('👁️ Generating digest preview...');
      
      // Calculate current week's date range
      const now = new Date();
      const endDate = new Date(now);
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Generate analytics
      const analytics = await this.analytics.analyzeWeeklyActivity(startDate, endDate);
      
      if (analytics.totalCommits === 0) {
        const quietMessage = this.formatter.formatSimpleSummary(analytics);
        return {
          content: quietMessage,
          analytics,
          type: 'quiet-week'
        };
      }
      
      // Generate preview
      const preview = this.formatter.previewDigest(analytics, 'weekly');
      
      return {
        content: preview.content,
        analytics,
        preview,
        type: 'weekly'
      };
      
    } catch (error) {
      console.error('❌ Preview generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get next scheduled run time
   */
  getNextRunTime() {
    if (!this.enabled) {
      return 'Disabled';
    }
    
    // Calculate next Friday 5 PM UTC
    const now = new Date();
    const nextFriday = new Date(now);
    
    // Find next Friday
    const daysUntilFriday = (5 - now.getDay() + 7) % 7;
    if (daysUntilFriday === 0 && now.getHours() >= 17) {
      // It's Friday after 5 PM, next run is next Friday
      nextFriday.setDate(now.getDate() + 7);
    } else {
      nextFriday.setDate(now.getDate() + (daysUntilFriday || 7));
    }
    
    nextFriday.setHours(17, 0, 0, 0); // 5 PM UTC
    
    return nextFriday.toISOString();
  }

  /**
   * Start the cron scheduler
   */
  startScheduler() {
    if (!this.enabled) {
      console.log('⏸️ Weekly digest cron is disabled (DIGEST_ENABLED=false)');
      return;
    }

    console.log(`⏰ Starting weekly digest cron job with schedule: ${this.schedulePattern}`);
    console.log(`📅 Next run: ${this.getNextRunTime()}`);
    console.log(`📊 Minimum commits threshold: ${this.minCommitsThreshold}`);
    
    const task = cron.schedule(this.schedulePattern, () => {
      this.generateWeeklyDigest();
    }, {
      scheduled: true,
      timezone: "UTC"
    });
    
    // Store reference for potential shutdown
    this.cronTask = task;
    
    console.log('✅ Weekly digest cron job scheduled successfully');
    
    return task;
  }

  /**
   * Stop the cron scheduler
   */
  stopScheduler() {
    if (this.cronTask) {
      this.cronTask.stop();
      console.log('⏹️ Weekly digest cron job stopped');
    }
  }

  /**
   * Get digest statistics
   */
  async getDigestStats() {
    try {
      const stats = await this.digestService.getDigestStats();
      return {
        ...stats,
        nextRun: this.getNextRunTime(),
        enabled: this.enabled,
        schedule: this.schedulePattern,
        minCommits: this.minCommitsThreshold,
        isRunning: this.isRunning
      };
    } catch (error) {
      console.error('❌ Failed to get digest stats:', error.message);
      throw error;
    }
  }
}

export { WeeklyDigestCron };
export default WeeklyDigestCron;