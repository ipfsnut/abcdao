import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function testRewardAllocation() {
  try {
    console.log('🧪 Simple Rewards Contract Test\n');
    
    // Configuration
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    const rewardsContractAddress = process.env.ABC_REWARDS_CONTRACT_ADDRESS;
    
    console.log('Configuration:');
    console.log(`- Bot Wallet: ${botWallet.address}`);
    console.log(`- Rewards Contract: ${rewardsContractAddress}\n`);
    
    // Contract ABI (minimal)
    const rewardsContractABI = [
      "function allocateReward(address user, uint256 amount) external",
      "function getContractStats() view returns (uint256, uint256, uint256, uint256)",
      "function getUserRewardInfo(address user) view returns (uint256, uint256, uint256, uint256)"
    ];
    
    const rewardsContract = new ethers.Contract(
      rewardsContractAddress,
      rewardsContractABI,
      botWallet
    );
    
    // Test data - using deployer address as test user
    const testUserAddress = '0x3427b4716B90C11F9971e43999a48A47Cf5B571E'; // Deployer
    const testAmount = ethers.parseEther('100000'); // 100k ABC
    
    console.log('📝 Testing reward allocation...');
    console.log(`- Test user: ${testUserAddress}`);
    console.log(`- Amount: ${ethers.formatEther(testAmount)} $ABC\n`);
    
    // Check initial state
    console.log('📊 Initial Contract Stats:');
    const [initialTotal, initialClaimed, initialBalance, initialBatches] = 
      await rewardsContract.getContractStats();
    console.log(`- Total allocated: ${ethers.formatEther(initialTotal)} $ABC`);
    console.log(`- Contract balance: ${ethers.formatEther(initialBalance)} $ABC\n`);
    
    // Allocate reward
    console.log('⚡ Allocating reward...');
    const tx = await rewardsContract.allocateReward(testUserAddress, testAmount);
    console.log(`Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Confirmed in block ${receipt.blockNumber}\n`);
    
    // Check final state
    console.log('📊 Final Contract Stats:');
    const [finalTotal, finalClaimed, finalBalance, finalBatches] = 
      await rewardsContract.getContractStats();
    console.log(`- Total allocated: ${ethers.formatEther(finalTotal)} $ABC`);
    console.log(`- Contract balance: ${ethers.formatEther(finalBalance)} $ABC\n`);
    
    // Check user rewards
    console.log('👤 User Reward Info:');
    const [userTotal, userClaimed, userClaimable, userLastUpdated] = 
      await rewardsContract.getUserRewardInfo(testUserAddress);
    console.log(`- Total allocated: ${ethers.formatEther(userTotal)} $ABC`);
    console.log(`- Claimed: ${ethers.formatEther(userClaimed)} $ABC`);
    console.log(`- Available to claim: ${ethers.formatEther(userClaimable)} $ABC\n`);
    
    console.log('🎉 Test successful!');
    console.log(`\n📋 Result: Allocated ${ethers.formatEther(testAmount)} $ABC to test user`);
    console.log('✨ The user can now claim this reward via the frontend!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Not authorized')) {
      console.log('\n💡 Solution: The bot needs to be authorized first.');
      console.log('Run the authorization script or use cast to authorize the bot.');
    }
  }
}

testRewardAllocation();