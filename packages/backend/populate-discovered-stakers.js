#!/usr/bin/env node

/**
 * Populate Discovered Stakers
 * 
 * Add the stakers we found from transaction history to the database
 */

import { ethers } from 'ethers';
import { getPool, initializeDatabase } from './src/services/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function populateDiscoveredStakers() {
  console.log('🎯 Populating Discovered Stakers');
  console.log('================================\n');
  
  // Initialize database
  await initializeDatabase();
  console.log('✅ Database initialized\n');
  
  // Discovered staker addresses from transaction history
  const discoveredStakers = [
    '0x18A85ad341b2D6A2bd67fbb104B4827B922a2A3c',
    '0x7E02c2dA4910531B7D6E8b6bDaFb69d13C71dB1d', 
    '0xB6754E53Ce15dF43269F59f21C9c235F1f673d67',
    '0xbF7dBd0313C9C185292feaF528a977BB7954062C',
    '0xC2771d8De241fCc2304d4c0e4574b1F41B388527',
    '0xc634E11751d3c154bf23D2965ef76C41B832C156'
  ];
  
  console.log(`🔍 Checking ${discoveredStakers.length} discovered staker addresses...\n`);
  
  // Set up contract
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
    }
  ];
  
  const contract = new ethers.Contract(stakingContractAddress, stakingABI, provider);
  const pool = getPool();
  
  let addedCount = 0;
  let totalStaked = 0;
  
  for (const address of discoveredStakers) {
    try {
      console.log(`Checking ${address}...`);
      
      // Get current stake info from contract
      const stakeInfo = await contract.getStakeInfo(address);
      const stakedAmount = parseFloat(ethers.formatEther(stakeInfo[0]));
      const totalEthEarned = parseFloat(ethers.formatEther(stakeInfo[2]));
      const pendingEth = parseFloat(ethers.formatEther(stakeInfo[3]));
      const lastStakeTime = stakeInfo[1] > 0 ? new Date(Number(stakeInfo[1]) * 1000) : null;
      
      if (stakedAmount > 0) {
        console.log(`  ✅ Active staker: ${stakedAmount.toFixed(2)} ABC staked, ${totalEthEarned.toFixed(4)} ETH earned`);
        
        // Insert into database
        await pool.query(`
          INSERT INTO staker_positions (
            wallet_address,
            staked_amount,
            rewards_earned,
            pending_rewards,
            last_stake_time,
            is_active,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (wallet_address) 
          DO UPDATE SET
            staked_amount = $2,
            rewards_earned = $3,
            pending_rewards = $4,
            last_stake_time = $5,
            is_active = $6,
            updated_at = NOW()
        `, [
          address,
          stakedAmount,
          totalEthEarned,
          pendingEth,
          lastStakeTime,
          true
        ]);
        
        addedCount++;
        totalStaked += stakedAmount;
      } else {
        console.log(`  ❌ No stake found`);
      }
      
    } catch (error) {
      console.log(`  ⚠️  Error checking ${address}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`   Active stakers added: ${addedCount}`);
  console.log(`   Total staked amount: ${totalStaked.toFixed(2)} ABC`);
  
  // Check final database status
  const finalResult = await pool.query(`
    SELECT COUNT(*) as count, 
           SUM(staked_amount) as total_staked
    FROM staker_positions 
    WHERE is_active = true AND staked_amount > 0
  `);
  
  const final = finalResult.rows[0];
  console.log(`\n🏦 Final Database Status:`);
  console.log(`   Total active stakers: ${final.count}`);
  console.log(`   Total staked in DB: ${parseFloat(final.total_staked || 0).toFixed(2)} ABC`);
  
  console.log(`\n🎉 Done! Check the leaderboard at /staking/leaderboard`);
}

populateDiscoveredStakers().catch(console.error);