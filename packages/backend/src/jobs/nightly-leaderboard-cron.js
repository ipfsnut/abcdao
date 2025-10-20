import cron from 'node-cron';
import { generateCustomLeaderboard } from '../../generate-custom-leaderboard.js';
import { FarcasterLeaderboardService } from '../services/farcaster-leaderboard.js';

class NightlyLeaderboardJob {
  constructor() {
    this.isRunning = false;
  }

  start() {
    console.log('⏰ Starting nightly leaderboard job...');
    
    // Run every night at 11:59 PM UTC
    cron.schedule('59 23 * * *', async () => {
      if (this.isRunning) {
        console.log('⚠️  Leaderboard job already running, skipping...');
        return;
      }
      
      this.isRunning = true;
      
      try {
        console.log('🌙 Starting nightly leaderboard generation...');
        
        const { filepath, leaderboard } = await generateCustomLeaderboard();
        
        // Auto-cast to Farcaster if configured
        if (process.env.NEYNAR_API_KEY && process.env.NEYNAR_SIGNER_UUID) {
          try {
            console.log('📡 Auto-casting leaderboard to Farcaster...');
            
            const farcasterService = new FarcasterLeaderboardService();
            const castResult = await farcasterService.castLeaderboard(filepath, leaderboard);
            
            console.log(`✅ Leaderboard cast posted: ${castResult.castUrl}`);
            
          } catch (castError) {
            console.error('⚠️  Auto-cast failed, but leaderboard generated:', castError.message);
            
            // Try fallback simple cast without image
            try {
              console.log('🔄 Attempting fallback simple cast...');
              const farcasterService = new FarcasterLeaderboardService();
              await farcasterService.castSimpleLeaderboard(leaderboard);
              console.log('✅ Fallback cast posted successfully');
            } catch (fallbackError) {
              console.error('❌ Fallback cast also failed:', fallbackError.message);
            }
          }
        } else {
          console.log('⚠️  Farcaster credentials not configured, skipping auto-cast');
        }
        
        console.log('✅ Nightly leaderboard job completed successfully');
        
      } catch (error) {
        console.error('❌ Nightly leaderboard job failed:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      timezone: 'UTC'
    });
    
    console.log('✅ Nightly leaderboard cron job started (11:59 PM UTC daily)');
  }
  
  // Manual trigger for testing
  async runNow(shouldCast = false) {
    console.log('🚀 Manually triggering leaderboard generation...');
    
    try {
      const result = await generateCustomLeaderboard();
      
      // Optionally cast to Farcaster
      const devSignerUuid = process.env.ABC_DEV_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;
      if (shouldCast && process.env.NEYNAR_API_KEY && devSignerUuid) {
        console.log('📡 Manual casting to Farcaster...');
        
        try {
          const farcasterService = new FarcasterLeaderboardService();
          const castResult = await farcasterService.castLeaderboard(result.filepath, result.leaderboard);
          
          result.castUrl = castResult.castUrl;
          result.castHash = castResult.castHash;
          
          console.log(`✅ Manual cast posted: ${castResult.castUrl}`);
        } catch (castError) {
          console.error('⚠️  Manual cast failed:', castError.message);
          result.castError = castError.message;
        }
      }
      
      console.log('✅ Manual leaderboard generation completed');
      return result;
    } catch (error) {
      console.error('❌ Manual leaderboard generation failed:', error);
      throw error;
    }
  }
}

export { NightlyLeaderboardJob };