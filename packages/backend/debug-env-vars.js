#!/usr/bin/env node
/**
 * Debug script to test environment variables and subgraph connectivity
 */

async function debugEnvironment() {
  console.log('🔍 Debug: Environment Variables and Subgraph\n');
  
  // Test environment variables
  console.log('Environment Variables:');
  console.log(`SUBGRAPH_URL: ${process.env.SUBGRAPH_URL || 'NOT SET'}`);
  console.log(`USE_SUBGRAPH: ${process.env.USE_SUBGRAPH || 'NOT SET'}`);
  
  // Test subgraph connectivity
  if (process.env.SUBGRAPH_URL) {
    console.log('\nTesting subgraph connectivity...');
    try {
      const response = await fetch(process.env.SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '{ stakers(first: 1) { id address currentStake isActive } }'
        })
      });
      
      const data = await response.json();
      console.log('✅ Subgraph Response:', JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.log('❌ Subgraph Error:', error.message);
    }
  }
  
  // Test staking service
  console.log('\nTesting staking service...');
  try {
    // Import and test staking service
    const { stakingService } = await import('./src/services/staking-service.js');
    
    console.log('Subgraph available:', await stakingService.isSubgraphAvailable());
    
    const overview = await stakingService.getStakingOverview();
    console.log('Staking overview:', {
      totalStakers: overview.totalStakers,
      totalStaked: overview.totalStaked
    });
    
  } catch (error) {
    console.log('❌ Staking Service Error:', error.message);
  }
}

debugEnvironment().catch(console.error);