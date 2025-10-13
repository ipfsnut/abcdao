import { initializeDatabase } from './src/services/database.js';
import { NightlyLeaderboardJob } from './src/jobs/nightly-leaderboard-cron.js';

async function testLeaderboardJob() {
  console.log('🧪 Testing leaderboard job...\n');
  
  await initializeDatabase();
  
  const job = new NightlyLeaderboardJob();
  
  try {
    // Test with auto-casting enabled (will skip cast if no credentials)
    const result = await job.runNow(true);
    console.log('✅ Test completed successfully!');
    console.log(`📸 Generated: ${result.filepath}`);
    console.log(`👥 Featured ${result.leaderboard.length} developers`);
    
    if (result.castUrl) {
      console.log(`🔗 Cast URL: ${result.castUrl}`);
    } else {
      console.log('⚠️  No Farcaster credentials configured, casting skipped');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testLeaderboardJob();