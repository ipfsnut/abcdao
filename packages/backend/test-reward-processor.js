#!/usr/bin/env node

import rewardProcessor from './src/services/reward-processor.js';
import { initializeDatabase } from './src/services/database.js';

async function testRewardProcessor() {
  try {
    console.log('🧪 Testing Reward Processor...');
    
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    // Test cast parsing
    const testCasts = [
      "🚀 New commit!\n\n@ipfsnut just pushed to abc-dao:\n\n\"Fix database migrations\"\n\n💰 Earned: 250,000 $ABC\n\n📱 Want rewards? Add our miniapp",
      "🚀 @testuser earned 150,000 $ABC for commit abc123",
      "🚀 @alice just earned: 75,500 $ABC",
      "Regular cast with no rewards",
      "🚀 @bob earned 1,000,000 $ABC for amazing work!"
    ];
    
    console.log('\n📝 Testing cast parsing...');
    testCasts.forEach((castText, i) => {
      const parsed = rewardProcessor.parseRewardFromCast(castText);
      console.log(`Cast ${i + 1}: ${parsed ? `@${parsed.username} → ${parsed.amount.toLocaleString()} $ABC` : 'No reward found'}`);
    });
    
    // Test daily processing (this will try to fetch real casts)
    console.log('\n🔄 Testing daily reward processing...');
    const result = await rewardProcessor.processDailyRewards();
    
    console.log(`✅ Processing complete:`);
    console.log(`   - ${result.addresses.length} recipients`);
    console.log(`   - ${result.totalAmount?.toLocaleString() || 0} total $ABC`);
    console.log(`   - ${result.totalProcessed} casts processed`);
    
    if (result.addresses.length > 0) {
      console.log('\n📊 Recipients:');
      result.addresses.forEach((address, i) => {
        console.log(`   ${address}: ${result.amounts[i].toLocaleString()} $ABC`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRewardProcessor();