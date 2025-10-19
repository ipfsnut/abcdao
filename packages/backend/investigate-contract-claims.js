#!/usr/bin/env node

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function investigateContractClaims() {
  try {
    console.log('🔍 Investigating Contract Claims Discrepancy...\n');

    const currentContract = '0x03CD0F799B4C04DbC22bFAAd35A3F36751F3446c';
    const oldContract = '0x6f0A63404C6C8CAb2e0f92bf112F4293F9f92E15';
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    
    const { initializeDatabase, getPool } = await import('./src/services/database.js');
    await initializeDatabase();
    const pool = getPool();

    console.log(`🆕 Current Contract: ${currentContract}`);
    console.log(`🗂️ Old Contract: ${oldContract}\n`);

    // 1. Check what the database actually says about claims
    console.log('📊 Database Claims Reality Check:');
    try {
      const dbClaimsResult = await pool.query(`
        SELECT 
          u.farcaster_username,
          u.wallet_address,
          COUNT(c.id) as total_commits,
          SUM(CASE WHEN c.reward_status = 'pending' THEN c.reward_amount ELSE 0 END) as pending_rewards,
          SUM(CASE WHEN c.reward_status = 'claimable' THEN c.reward_amount ELSE 0 END) as claimable_rewards,
          SUM(CASE WHEN c.reward_status = 'claimed' THEN c.reward_amount ELSE 0 END) as claimed_rewards,
          SUM(c.reward_amount) as total_rewards
        FROM users u 
        LEFT JOIN commits c ON u.id = c.user_id 
        WHERE c.reward_amount IS NOT NULL
        GROUP BY u.id, u.farcaster_username, u.wallet_address
        ORDER BY total_rewards DESC
        LIMIT 10
      `);

      console.log(`   Found ${dbClaimsResult.rows.length} users with rewards:`);
      let totalDbClaimed = 0;
      let totalDbClaimable = 0;
      let totalDbPending = 0;

      dbClaimsResult.rows.forEach((user, index) => {
        const claimed = parseFloat(user.claimed_rewards || 0);
        const claimable = parseFloat(user.claimable_rewards || 0);
        const pending = parseFloat(user.pending_rewards || 0);
        const total = parseFloat(user.total_rewards || 0);
        
        totalDbClaimed += claimed;
        totalDbClaimable += claimable;
        totalDbPending += pending;

        console.log(`   ${index + 1}. ${user.farcaster_username}:`);
        console.log(`      Address: ${user.wallet_address}`);
        console.log(`      Claimed: ${claimed.toLocaleString()} $ABC`);
        console.log(`      Claimable: ${claimable.toLocaleString()} $ABC`);
        console.log(`      Pending: ${pending.toLocaleString()} $ABC`);
        console.log(`      Total: ${total.toLocaleString()} $ABC\n`);
      });

      console.log(`   📊 Database Totals:`);
      console.log(`      Total Claimed: ${totalDbClaimed.toLocaleString()} $ABC`);
      console.log(`      Total Claimable: ${totalDbClaimable.toLocaleString()} $ABC`);
      console.log(`      Total Pending: ${totalDbPending.toLocaleString()} $ABC\n`);

    } catch (error) {
      console.log(`   ❌ Database query failed: ${error.message}\n`);
    }

    // 2. Check both contracts in detail
    const rewardsABI = [
      "function getContractStats() external view returns (uint256, uint256, uint256, uint256)",
      "function getUserRewardInfo(address user) view returns (uint256, uint256, uint256, uint256)"
    ];

    console.log('🔍 Current Contract Deep Dive:');
    const currentContractInstance = new ethers.Contract(currentContract, rewardsABI, provider);
    
    try {
      const [allocated, claimed, balance, batches] = await currentContractInstance.getContractStats();
      console.log(`   Allocated: ${ethers.formatEther(allocated)} $ABC`);
      console.log(`   Claimed: ${ethers.formatEther(claimed)} $ABC`);
      console.log(`   Balance: ${ethers.formatEther(balance)} $ABC`);
      console.log(`   Batches: ${batches.toString()}`);

      // Check when this contract was created
      const creationBlock = await findContractCreationBlock(provider, currentContract);
      if (creationBlock) {
        const block = await provider.getBlock(creationBlock);
        const creationDate = new Date(block.timestamp * 1000);
        console.log(`   Created: Block ${creationBlock} (${creationDate.toISOString()})`);
      }
    } catch (error) {
      console.log(`   ❌ Current contract query failed: ${error.message}`);
    }

    console.log('\n🗂️ Old Contract Deep Dive:');
    const oldContractInstance = new ethers.Contract(oldContract, rewardsABI, provider);
    
    try {
      const [allocated, claimed, balance, batches] = await oldContractInstance.getContractStats();
      console.log(`   Allocated: ${ethers.formatEther(allocated)} $ABC`);
      console.log(`   Claimed: ${ethers.formatEther(claimed)} $ABC`);
      console.log(`   Balance: ${ethers.formatEther(balance)} $ABC`);
      console.log(`   Batches: ${batches.toString()}`);

      const creationBlock = await findContractCreationBlock(provider, oldContract);
      if (creationBlock) {
        const block = await provider.getBlock(creationBlock);
        const creationDate = new Date(block.timestamp * 1000);
        console.log(`   Created: Block ${creationBlock} (${creationDate.toISOString()})`);
      }
    } catch (error) {
      console.log(`   ❌ Old contract query failed: ${error.message}`);
    }

    // 3. Check if the "1000 $ABC claimed" is from test transactions
    console.log('\n🧪 Investigating the 1000 $ABC Claims:');
    
    // Check specific users from the current contract
    const testAddresses = [
      '0x18a85ad341b2d6a2bd67fbb104b4827b922a2a3c', // epicdylan
      '0xBE6525b767cA8D38d169C93C8120c0C0957388B8', // protocol wallet
      '0x0000000000000000000000000000000000000000'  // zero address (common test)
    ];

    console.log(`   Checking specific addresses on current contract:`);
    
    for (const address of testAddresses) {
      try {
        const [allocated, claimed, available, lastClaim] = await currentContractInstance.getUserRewardInfo(address);
        if (parseFloat(ethers.formatEther(allocated)) > 0 || parseFloat(ethers.formatEther(claimed)) > 0) {
          console.log(`   📍 ${address}:`);
          console.log(`      Allocated: ${ethers.formatEther(allocated)} $ABC`);
          console.log(`      Claimed: ${ethers.formatEther(claimed)} $ABC`);
          console.log(`      Available: ${ethers.formatEther(available)} $ABC`);
          console.log(`      Last Claim: ${lastClaim.toString()}`);
        }
      } catch (error) {
        console.log(`   ❌ Address ${address} check failed: ${error.message}`);
      }
    }

    console.log('\n🎯 Analysis:');
    console.log('   If the contract shows 1000 $ABC claimed but database shows 0,');
    console.log('   this could mean:');
    console.log('   1. This is a test/development contract');
    console.log('   2. Claims happened outside the database tracking');
    console.log('   3. The contract was pre-loaded with test data');
    console.log('   4. We need to identify the ACTUAL production contract');

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
}

// Helper function to find contract creation block
async function findContractCreationBlock(provider, contractAddress) {
  try {
    const currentBlock = await provider.getBlockNumber();
    let low = 1;
    let high = currentBlock;
    let creationBlock = null;

    // Binary search for creation block
    while (low <= high && high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      const code = await provider.getCode(contractAddress, mid);
      
      if (code === '0x') {
        low = mid + 1;
      } else {
        creationBlock = mid;
        high = mid - 1;
      }
    }

    return creationBlock;
  } catch (error) {
    return null;
  }
}

investigateContractClaims().catch(console.error);