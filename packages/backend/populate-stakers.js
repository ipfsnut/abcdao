#!/usr/bin/env node

/**
 * Populate Staker Positions Script
 * 
 * This script discovers current stakers from the blockchain and populates
 * the staker_positions table so the leaderboard will work.
 * 
 * Usage:
 * node populate-stakers.js [command]
 * 
 * Commands:
 * - discover: Find stakers from blockchain (default)
 * - known: Add known wallet addresses 
 * - api: Use API endpoints to populate
 * - status: Check current database status
 */

import { ethers } from 'ethers';
import { getPool, initializeDatabase } from './src/services/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class StakerPopulator {
  constructor() {
    this.stakingContractAddress = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    
    // Staking contract ABI for getting stake info
    this.stakingABI = [
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
      },
      // Staking events for discovery
      {
        "type": "event",
        "name": "Staked",
        "inputs": [
          {"name": "user", "type": "address", "indexed": true},
          {"name": "amount", "type": "uint256", "indexed": false}
        ]
      }
    ];
    
    this.contract = new ethers.Contract(this.stakingContractAddress, this.stakingABI, this.provider);
  }

  async checkCurrentStatus() {
    console.log('📊 Checking current database status...\n');
    
    const pool = getPool();
    
    // Check existing staker records
    const existingResult = await pool.query(`
      SELECT COUNT(*) as count, 
             SUM(staked_amount) as total_staked,
             MAX(updated_at) as last_update
      FROM staker_positions 
      WHERE is_active = true AND staked_amount > 0
    `);
    
    const existing = existingResult.rows[0];
    
    console.log('🏦 Database Status:');
    console.log(`   Active Stakers: ${existing.count}`);
    console.log(`   Total Staked in DB: ${parseFloat(existing.total_staked || 0).toFixed(2)} ABC`);
    console.log(`   Last Update: ${existing.last_update || 'Never'}\n`);
    
    // Check blockchain total
    try {
      const totalStaked = await this.contract.totalStaked();
      const totalStakedFormatted = parseFloat(ethers.formatEther(totalStaked));
      
      console.log('⛓️  Blockchain Status:');
      console.log(`   Total Staked on Chain: ${totalStakedFormatted.toFixed(2)} ABC`);
      console.log(`   Contract Address: ${this.stakingContractAddress}\n`);
      
      const difference = totalStakedFormatted - parseFloat(existing.total_staked || 0);
      if (difference > 0) {
        console.log(`⚠️  Missing staker data: ${difference.toFixed(2)} ABC not tracked in database\n`);
        return { needsPopulation: true, totalStaked: totalStakedFormatted, dbStaked: parseFloat(existing.total_staked || 0) };
      } else {
        console.log('✅ Database appears to be in sync with blockchain\n');
        return { needsPopulation: false, totalStaked: totalStakedFormatted, dbStaked: parseFloat(existing.total_staked || 0) };
      }
    } catch (error) {
      console.error('❌ Error checking blockchain status:', error.message);
      return { needsPopulation: true, error: error.message };
    }
  }

  async addKnownWallets() {
    console.log('👥 Adding known wallet addresses as stakers...\n');
    
    const knownWallets = [
      process.env.PROTOCOL_WALLET_ADDRESS || '0xBE6525b767cA8D38d169C93C8120c0C0957388B8',
      '0x3427b4716B90C11F9971e43999a48A47Cf5B571E', // Another known address
      // Add more known addresses here if you have them
    ].filter(Boolean);
    
    console.log(`Checking ${knownWallets.length} known wallet addresses...\n`);
    
    let addedCount = 0;
    
    for (const address of knownWallets) {
      try {
        const added = await this.addStakerIfActive(address);
        if (added) addedCount++;
      } catch (error) {
        console.warn(`⚠️  Error checking ${address}:`, error.message);
      }
    }
    
    console.log(`\n✅ Added ${addedCount} stakers from known addresses`);
    return addedCount;
  }

  async discoverFromEvents() {
    console.log('🔍 Discovering stakers from blockchain events...\n');
    
    try {
      // Get recent Staked events (last 10000 blocks to avoid rate limits)
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);
      
      console.log(`Scanning blocks ${fromBlock} to ${currentBlock} for Staked events...`);
      
      const filter = this.contract.filters.Staked();
      const events = await this.contract.queryFilter(filter, fromBlock, currentBlock);
      
      console.log(`Found ${events.length} Staked events\n`);
      
      // Get unique staker addresses
      const uniqueStakers = [...new Set(events.map(event => event.args.user))];
      console.log(`Unique staker addresses found: ${uniqueStakers.length}\n`);
      
      let addedCount = 0;
      
      for (const address of uniqueStakers) {
        try {
          const added = await this.addStakerIfActive(address);
          if (added) addedCount++;
        } catch (error) {
          console.warn(`⚠️  Error checking ${address}:`, error.message);
        }
      }
      
      console.log(`\n✅ Added ${addedCount} stakers from event discovery`);
      return addedCount;
      
    } catch (error) {
      console.error('❌ Error discovering from events:', error.message);
      console.log('Falling back to known wallet method...\n');
      return await this.addKnownWallets();
    }
  }

  async addStakerIfActive(address) {
    try {
      // Get current stake info from contract
      const stakeInfo = await this.contract.getStakeInfo(address);
      const stakedAmount = parseFloat(ethers.formatEther(stakeInfo[0]));
      
      // Only add if they have a stake > 0
      if (stakedAmount <= 0) {
        return false;
      }
      
      const totalEthEarned = parseFloat(ethers.formatEther(stakeInfo[2]));
      const pendingEth = parseFloat(ethers.formatEther(stakeInfo[3]));
      const lastStakeTime = stakeInfo[1] > 0 ? new Date(Number(stakeInfo[1]) * 1000) : null;
      
      console.log(`📈 Found active staker: ${address.slice(0,8)}... (${stakedAmount.toFixed(2)} ABC)`);
      
      // Insert or update in database
      const pool = getPool();
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
      
      return true;
      
    } catch (error) {
      console.warn(`Failed to check staker ${address}:`, error.message);
      return false;
    }
  }

  async populateViaAPI() {
    console.log('🌐 Using API endpoints to populate stakers...\n');
    
    try {
      // First try to trigger the staking data manager update
      const backendUrl = process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app';
      
      console.log('Triggering staking data manager refresh...');
      const response = await fetch(`${backendUrl}/api/system-health/refresh-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ Triggered system refresh');
      } else {
        console.log('⚠️  System refresh failed, proceeding with direct method');
      }
      
      // Fall back to direct blockchain discovery
      return await this.discoverFromEvents();
      
    } catch (error) {
      console.error('❌ API method failed:', error.message);
      console.log('Falling back to blockchain discovery...\n');
      return await this.discoverFromEvents();
    }
  }
}

async function main() {
  const command = process.argv[2] || 'discover';
  
  console.log('🚀 ABC DAO Staker Population Script');
  console.log('===================================\n');
  
  // Initialize database
  try {
    await initializeDatabase();
    console.log('✅ Database initialized\n');
  } catch (dbError) {
    console.error('❌ Database initialization failed:', dbError.message);
    process.exit(1);
  }
  
  const populator = new StakerPopulator();
  
  try {
    switch (command) {
      case 'status':
        await populator.checkCurrentStatus();
        break;
        
      case 'known':
        const statusBefore = await populator.checkCurrentStatus();
        if (statusBefore.needsPopulation) {
          await populator.addKnownWallets();
          await populator.checkCurrentStatus();
        }
        break;
        
      case 'discover':
        const statusBefore2 = await populator.checkCurrentStatus();
        if (statusBefore2.needsPopulation) {
          await populator.discoverFromEvents();
          await populator.checkCurrentStatus();
        }
        break;
        
      case 'api':
        const statusBefore3 = await populator.checkCurrentStatus();
        if (statusBefore3.needsPopulation) {
          await populator.populateViaAPI();
          await populator.checkCurrentStatus();
        }
        break;
        
      default:
        console.log('❌ Unknown command. Available commands:');
        console.log('   status   - Check current database status');
        console.log('   known    - Add known wallet addresses');
        console.log('   discover - Discover stakers from blockchain events (default)');
        console.log('   api      - Use API endpoints to populate');
        process.exit(1);
    }
    
    console.log('\n🎉 Population script completed!');
    console.log('Check the leaderboard at /staking/leaderboard to see results.');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Script interrupted');
  process.exit(0);
});

main();