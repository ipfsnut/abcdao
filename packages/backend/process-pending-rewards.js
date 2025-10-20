/**
 * Process pending rewards for ABC DAO users
 * Moves rewards from 'pending' to 'claimable' by sending them to the smart contract
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const CONTRACTS = {
  ABC_REWARDS: '0x03CD0F799B4C04DbC22bFAAd35A3F36751F3446c'
};

const REWARDS_ABI = [
  "function allocateRewardsBatch(address[] calldata users, uint256[] calldata amounts) external",
  "function getClaimableAmount(address user) view returns (uint256)",
  "function getUserRewardInfo(address user) view returns (uint256, uint256, uint256, uint256)"
];

async function processPendingRewards() {
  console.log('🤖 ABC DAO Pending Rewards Processor');
  console.log('=====================================');

  // Setup blockchain connection
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
  
  console.log(`📡 Connected to Base via: ${process.env.BASE_RPC_URL}`);
  console.log(`👤 Protocol wallet: ${wallet.address}`);
  
  // Get pending rewards from backend API
  console.log('\n🔍 Fetching pending rewards from backend...');
  
  try {
    // Your user's wallet address (checksummed)
    const userWallet = '0x18A85ad341b2D6A2bd67fbb104B4827B922a2A3c';
    
    // Fetch current reward status
    const response = await fetch('https://abcdao-production.up.railway.app/api/rewards/user/8573');
    const rewardsData = await response.json();
    
    console.log('📊 Current Status:');
    console.log(`   Pending: ${rewardsData.summary.totalPending.toLocaleString()} $ABC`);
    console.log(`   Claimable: ${rewardsData.summary.totalClaimable.toLocaleString()} $ABC`);
    
    if (rewardsData.summary.totalPending === 0) {
      console.log('✅ No pending rewards to process!');
      return;
    }
    
    // Connect to rewards contract
    const rewardsContract = new ethers.Contract(CONTRACTS.ABC_REWARDS, REWARDS_ABI, wallet);
    
    // Check current on-chain allocation
    console.log('\n⛓️ Checking current on-chain allocation...');
    const currentClaimable = await rewardsContract.getClaimableAmount(userWallet);
    const currentTokens = parseFloat(ethers.formatUnits(currentClaimable, 18));
    console.log(`   Current claimable: ${currentTokens.toLocaleString()} $ABC`);
    
    // Calculate amount to allocate (pending rewards)
    const pendingAmount = rewardsData.summary.totalPending;
    const allocationAmount = ethers.parseUnits(pendingAmount.toString(), 18);
    
    console.log(`\n💸 Allocating ${pendingAmount.toLocaleString()} $ABC to contract...`);
    
    // Execute batch allocation for single user
    const tx = await rewardsContract.allocateRewardsBatch(
      [userWallet], 
      [allocationAmount]
    );
    
    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Verify the allocation worked
    console.log('\n🔍 Verifying allocation...');
    const newClaimable = await rewardsContract.getClaimableAmount(userWallet);
    const newTokens = parseFloat(ethers.formatUnits(newClaimable, 18));
    const increase = newTokens - currentTokens;
    
    console.log(`   New claimable: ${newTokens.toLocaleString()} $ABC`);
    console.log(`   Increase: ${increase.toLocaleString()} $ABC`);
    
    if (Math.abs(increase - pendingAmount) < 1) {
      console.log('✅ Allocation successful!');
      
      // Update the backend (would need to call the proper endpoint to mark as claimable)
      console.log('\n📝 Backend database will be updated by the next sync...');
      console.log('💎 Your rewards are now claimable on the frontend!');
      
    } else {
      console.log('⚠️ Allocation amount mismatch!');
    }
    
  } catch (error) {
    console.error('❌ Process failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  processPendingRewards().catch(console.error);
}

export { processPendingRewards };