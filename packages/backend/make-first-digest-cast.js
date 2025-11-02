#!/usr/bin/env node

/**
 * Make First Digest Cast - Deploy the commit digest bot!
 * 
 * This script triggers the very first weekly digest cast for @abc-dao-dev
 * after the user's approval: "go ahead and have it make that first cast"
 */

import { WeeklyDigestCron } from './src/jobs/weekly-digest-cron.js';
import { initializeDatabase } from './src/services/database.js';

async function makeFirstCast() {
  console.log('🔥 MAKING FIRST DIGEST CAST 🔥');
  console.log('═══════════════════════════════');
  console.log('Creating the inaugural weekly digest for @abc-dao-dev');
  console.log(`Time: ${new Date().toISOString()}`);
  
  try {
    console.log('\n🔧 Initializing database connection...');
    await initializeDatabase();
    
    const cron = new WeeklyDigestCron();
    
    console.log('\n📊 Generating weekly digest...');
    const result = await cron.triggerManual();
    
    if (result && result.castHash) {
      console.log('\n🎉 SUCCESS! First digest cast completed!');
      console.log('═══════════════════════════════════════');
      console.log(`Cast Hash: ${result.castHash}`);
      console.log(`Cast URL: ${result.castUrl}`);
      console.log(`Content Length: ${result.content.length} characters`);
      console.log(`Analytics Period: ${result.analytics.period.start.toISOString().split('T')[0]} to ${result.analytics.period.end.toISOString().split('T')[0]}`);
      console.log(`Total Commits: ${result.analytics.totalCommits}`);
      console.log(`Contributors: ${result.analytics.contributorRankings.length}`);
      console.log(`Total Rewards: ${result.analytics.rewardDistribution.totalRewards.toLocaleString()} $ABC`);
    } else {
      console.log('\n📝 Digest generated but no cast made (preview mode)');
      console.log('Result:', result);
    }
    
    console.log('\n🚀 @abc-dao-dev digest bot is now LIVE!');
    console.log('Next automated digest: Every Friday at 5:00 PM UTC');
    
    return result;
    
  } catch (error) {
    console.error('\n💥 FIRST CAST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  makeFirstCast()
    .then(() => {
      console.log('\n🎊 DIGEST BOT DEPLOYMENT COMPLETE! 🎊');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💀 Deployment failed:', error.message);
      process.exit(1);
    });
}

export { makeFirstCast };
export default makeFirstCast;