#!/usr/bin/env node

/**
 * Quick staker check - directly query a few specific addresses to see if they have stakes
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function quickCheck() {
  console.log('🔍 Quick Staker Check\n');
  
  const stakingContractAddress = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
  
  const stakingABI = [
    {
      "type": "function",
      "name": "getStakeInfo",
      "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
      "outputs": [
        {"name": "amount", "type": "uint256", "internalType": "uint256"},
        {"name": "lastStakeTime", "type": "uint256", "internalType": "uint256"},
        {"name": "totalEthEarned", "type": "uint256", "internalType": "uint256"},
        {"name": "pendingEth", "type": "uint256", "internalType": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalStaked",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    }
  ];
  
  const contract = new ethers.Contract(stakingContractAddress, stakingABI, provider);
  
  // Check total staked first
  console.log('📊 Contract Overview:');
  const totalStaked = await contract.totalStaked();
  console.log(`   Total Staked: ${ethers.formatEther(totalStaked)} ABC`);
  console.log(`   Contract: ${stakingContractAddress}\n`);
  
  // Test addresses that might have stakes
  const testAddresses = [
    '0xBE6525b767cA8D38d169C93C8120c0C0957388B8', // Protocol wallet
    '0x3427b4716B90C11F9971e43999a48A47Cf5B571E', // Known address
    '0x48d87be38677ad764203b5516900691cbd8c7042', // From the dev account verification
    '0xcbdf56a98106f32980da6052a5663c48bc6154a1', // From the custody address
    // Add a few random addresses that might be staking
    '0x742d35Cc6635C0532925a3b8A2Cd24B4E4f3Ffca',
    '0x1111111254eeb25477b68fb85ed929f73a960582'
  ];
  
  console.log('🔍 Checking Test Addresses:');
  
  let foundStakers = [];
  
  for (const address of testAddresses) {
    try {
      const stakeInfo = await contract.getStakeInfo(address);
      const stakedAmount = parseFloat(ethers.formatEther(stakeInfo[0]));
      const totalEthEarned = parseFloat(ethers.formatEther(stakeInfo[2]));
      const pendingEth = parseFloat(ethers.formatEther(stakeInfo[3]));
      
      console.log(`   ${address}: ${stakedAmount.toFixed(2)} ABC staked`);
      
      if (stakedAmount > 0) {
        foundStakers.push({
          address,
          stakedAmount,
          totalEthEarned,
          pendingEth,
          lastStakeTime: stakeInfo[1] > 0 ? new Date(Number(stakeInfo[1]) * 1000) : null
        });
      }
      
    } catch (error) {
      console.log(`   ${address}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n🎯 Found ${foundStakers.length} active stakers:`);
  foundStakers.forEach(staker => {
    console.log(`   ${staker.address}: ${staker.stakedAmount.toFixed(2)} ABC (${staker.totalEthEarned.toFixed(4)} ETH earned)`);
  });
  
  if (foundStakers.length === 0) {
    console.log('\n🤔 No individual stakers found, but total staked is not zero.');
    console.log('This suggests either:');
    console.log('   1. The staking data is aggregated differently');
    console.log('   2. Different contract method needed');
    console.log('   3. Staking mechanism works differently than expected');
  }
}

quickCheck().catch(console.error);