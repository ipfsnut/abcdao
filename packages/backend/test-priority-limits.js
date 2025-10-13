import priorityLimits from './src/services/priority-limits.js';

async function testPriorityLimits() {
  console.log('🧪 Testing priority limits functionality...\n');
  
  const testUserId = 1; // Test user ID
  const testCommitHash = 'test-commit-' + Date.now();
  
  try {
    // Test 1: Check initial limits
    console.log('1. Checking initial priority limits');
    const initialCheck = await priorityLimits.checkPriorityLimit(testUserId);
    console.log('✅ Initial limits:', {
      canUse: initialCheck.canUse,
      used: initialCheck.used,
      remaining: initialCheck.remaining,
      limit: initialCheck.limit
    });
    
    // Test 2: Record priority usage
    console.log('\n2. Recording priority tag usage');
    const recordResult = await priorityLimits.recordPriorityUsage(testUserId, testCommitHash, 'priority');
    console.log(recordResult ? '✅ Usage recorded successfully' : '❌ Failed to record usage');
    
    // Test 3: Check limits after usage
    console.log('\n3. Checking limits after usage');
    const afterCheck = await priorityLimits.checkPriorityLimit(testUserId);
    console.log('✅ Limits after usage:', {
      canUse: afterCheck.canUse,
      used: afterCheck.used,
      remaining: afterCheck.remaining,
      limit: afterCheck.limit
    });
    
    // Test 4: Get user stats
    console.log('\n4. Getting user priority stats');
    const userStats = await priorityLimits.getUserPriorityStats(testUserId);
    console.log('✅ User stats:', userStats);
    
    // Test 5: Simulate hitting the limit
    console.log('\n5. Simulating weekly limit (adding 4 more uses)');
    for (let i = 1; i <= 4; i++) {
      const commitHash = `test-limit-${Date.now()}-${i}`;
      const tagType = i % 2 === 0 ? 'milestone' : 'priority';
      await priorityLimits.recordPriorityUsage(testUserId, commitHash, tagType);
      console.log(`   Added usage ${i}/4 (${tagType})`);
    }
    
    // Test 6: Check if limit is reached
    console.log('\n6. Checking if limit is reached');
    const limitCheck = await priorityLimits.checkPriorityLimit(testUserId);
    console.log('✅ Final limits:', {
      canUse: limitCheck.canUse,
      used: limitCheck.used,
      remaining: limitCheck.remaining,
      limit: limitCheck.limit
    });
    
    if (!limitCheck.canUse && limitCheck.used >= limitCheck.limit) {
      console.log('🎉 Weekly limit system working correctly!');
    } else {
      console.log('⚠️ Weekly limit system may have issues');
    }
    
    console.log('\n🎉 All priority limit tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testPriorityLimits();