import rewardProcessor from './src/services/reward-processor.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRewardsContract() {
  try {
    console.log('🧪 Testing ABC Rewards Contract Integration\n');
    
    // Test 1: Check contract stats
    console.log('1. Checking contract statistics...');
    const stats = await rewardProcessor.getContractStats();
    if (stats) {
      console.log('   ✅ Contract stats retrieved:');
      console.log('   - Total Allocated:', stats.totalAllocated, 'ABC');
      console.log('   - Total Claimed:', stats.totalClaimed, 'ABC');
      console.log('   - Contract Balance:', stats.contractBalance, 'ABC');
      console.log('   - Batch Count:', stats.batchCount);
    } else {
      console.log('   ❌ Failed to get contract stats');
    }
    
    // Test 2: Check bot authorization
    console.log('\n2. Checking bot authorization...');
    const isAuthorized = await rewardProcessor.isBotAuthorized();
    console.log('   Bot authorized:', isAuthorized ? '✅ Yes' : '❌ No');
    
    if (!isAuthorized) {
      console.log('   ⚠️ Bot needs to be authorized before allocating rewards');
      console.log('   Run: cast send', process.env.ABC_REWARDS_CONTRACT_ADDRESS, '"setAuthorized(address,bool)"', rewardProcessor.botWallet.address, 'true --rpc-url base --private-key <DEPLOYER_PRIVATE_KEY>');
    }
    
    // Test 3: Test reward allocation (if authorized)
    if (isAuthorized) {
      console.log('\n3. Testing reward allocation...');
      try {
        const testAddresses = ['0x3427b4716B90C11F9971e43999a48A47Cf5B571E']; // Deployer address
        const testAmounts = [100000]; // 100k ABC
        
        console.log('   Allocating test rewards...');
        const result = await rewardProcessor.allocateRewardsToContract(testAddresses, testAmounts);
        console.log('   ✅ Allocation successful!');
        console.log('   Transaction:', result.txHash);
        
      } catch (error) {
        console.log('   ❌ Allocation failed:', error.message);
      }
    }
    
    // Test 4: Test cast processing simulation
    console.log('\n4. Testing cast processing (simulation)...');
    
    // Mock a reward cast
    const mockRewardCast = {
      castHash: 'test-cast-' + Date.now(),
      castText: '@epicdylan just earned 250,000 $ABC for their latest commit!',
      username: 'epicdylan',
      amount: 250000
    };
    
    const parsed = rewardProcessor.parseRewardFromCast(mockRewardCast.castText);
    if (parsed) {
      console.log('   ✅ Cast parsing works:');
      console.log('   - Username:', parsed.username);
      console.log('   - Amount:', parsed.amount, 'ABC');
    } else {
      console.log('   ❌ Cast parsing failed');
    }
    
    console.log('\n🎉 Contract integration test complete!');
    console.log('\nNext steps:');
    console.log('1. Authorize bot if not already done');
    console.log('2. Fund contract with ABC tokens');
    console.log('3. Test frontend claiming interface');
    console.log('4. Deploy to production with ABC_REWARDS_CONTRACT_ADDRESS set');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testRewardsContract();

