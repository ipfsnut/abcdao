#!/usr/bin/env node

/**
 * Daily Reward Batch Script
 * 
 * This script processes the bot's Farcaster casts from the last 24 hours,
 * extracts reward announcements, and prepares them for contract update.
 * 
 * Usage:
 *   node src/scripts/daily-reward-batch.js
 *   
 * Or via Railway CLI:
 *   railway run -- node src/scripts/daily-reward-batch.js
 */

import rewardProcessor from '../services/reward-processor.js';
import { initializeDatabase } from '../services/database.js';

async function main() {
  try {
    console.log('🚀 Starting Daily Reward Batch Job...');
    console.log('📅 Date:', new Date().toISOString().split('T')[0]);
    
    // Initialize database connection
    await initializeDatabase();
    console.log('✅ Database connected');
    
    // Process rewards from last 24 hours
    const batchResult = await rewardProcessor.processDailyRewards();
    
    if (batchResult.addresses.length === 0) {
      console.log('ℹ️ No new rewards to process - all done!');
      process.exit(0);
    }
    
    // Log the batch summary
    console.log('\n📊 BATCH SUMMARY:');
    console.log('================');
    console.log(`Recipients: ${batchResult.addresses.length}`);
    console.log(`Total $ABC: ${batchResult.totalAmount.toLocaleString()}`);
    console.log(`Casts processed: ${batchResult.totalProcessed}`);
    
    console.log('\n📋 REWARD DETAILS:');
    batchResult.addresses.forEach((address, i) => {
      console.log(`  ${address}: ${batchResult.amounts[i].toLocaleString()} $ABC`);
    });
    
    // TODO: Call smart contract here
    console.log('\n🔗 CONTRACT UPDATE NEEDED:');
    console.log('==========================');
    console.log('Call: rewardsContract.updateRewards(addresses, amounts)');
    console.log('Addresses:', JSON.stringify(batchResult.addresses, null, 2));
    console.log('Amounts:', JSON.stringify(batchResult.amounts, null, 2));
    
    // For now, just log what would be sent to contract
    console.log('\n⚠️  Smart contract integration not implemented yet');
    console.log('💡 Next step: Deploy Rewards Contract and add contract call here');
    
    console.log('\n✅ Daily batch job completed successfully!');
    
  } catch (error) {
    console.error('❌ Daily batch job failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Batch job interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Batch job terminated');
  process.exit(0);
});

// Run the batch job
main();