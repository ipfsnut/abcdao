import { initializeDatabase } from './src/services/database.js';
import { NightlyLeaderboardJob } from './src/jobs/nightly-leaderboard-cron.js';

async function testLeaderboardJob() {
  console.log('🧪 Testing leaderboard job...\n');
  
  await initializeDatabase();
  
  const job = new NightlyLeaderboardJob();
  
  try {
    const result = await job.runNow();
    console.log('✅ Test completed successfully!');
    console.log(`📸 Generated: ${result.filepath}`);
    console.log(`👥 Featured ${result.leaderboard.length} developers`);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testLeaderboardJob();