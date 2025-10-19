#!/usr/bin/env node

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function reviewEthEarnings() {
  try {
    console.log('💰 Reviewing All-Time ETH Earnings...\n');

    const { initializeDatabase, getPool } = await import('./src/services/database.js');
    await initializeDatabase();
    const pool = getPool();

    // 1. Check Clanker rewards claims from database
    console.log('🎰 Clanker Rewards Claims History:');
    try {
      const clankerResult = await pool.query(`
        SELECT 
          id,
          claim_date,
          rewards_amount,
          transaction_hash,
          gas_used,
          gas_price
        FROM clanker_claims 
        ORDER BY claim_date DESC
      `);

      if (clankerResult.rows.length > 0) {
        let totalClankerEth = 0;
        console.log(`   Found ${clankerResult.rows.length} Clanker claims:`);
        
        clankerResult.rows.forEach((claim, index) => {
          const ethAmount = parseFloat(claim.rewards_amount);
          totalClankerEth += ethAmount;
          console.log(`   ${index + 1}. ${claim.claim_date.toISOString().split('T')[0]}: ${ethAmount} ETH (${claim.transaction_hash})`);
        });
        
        console.log(`   📊 Total Clanker ETH Earned: ${totalClankerEth.toFixed(6)} ETH\n`);
      } else {
        console.log('   ❌ No Clanker claims found in database\n');
      }
    } catch (error) {
      console.log(`   ❌ Error querying Clanker claims: ${error.message}\n`);
    }

    // 2. Check protocol wallet transaction history for ETH inflows
    console.log('🏦 Protocol Wallet ETH Transaction History:');
    const protocolWallet = '0xBE6525b767cA8D38d169C93C8120c0C0957388B8';
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    
    console.log(`   📍 Protocol Wallet: ${protocolWallet}`);
    
    // Get current balance
    const currentBalance = await provider.getBalance(protocolWallet);
    console.log(`   💳 Current ETH Balance: ${ethers.formatEther(currentBalance)} ETH`);

    // 3. Use Alchemy to get ETH transfer history
    console.log('\n📈 ETH Transfer History (via Alchemy):');
    try {
      // Get incoming ETH transfers
      const incomingTransfers = await provider.send('alchemy_getAssetTransfers', [{
        fromBlock: '0x0',
        toBlock: 'latest',
        toAddress: protocolWallet,
        category: ['external'], // ETH transfers only
        maxCount: '0x32', // 50 transfers
        excludeZeroValue: true
      }]);

      console.log(`   📥 Incoming ETH Transfers: ${incomingTransfers.transfers.length}`);
      let totalIncoming = 0;
      
      incomingTransfers.transfers.forEach((transfer, index) => {
        const ethAmount = parseFloat(transfer.value);
        totalIncoming += ethAmount;
        const date = new Date(parseInt(transfer.blockNum, 16) * 1000 * 13); // Rough timestamp
        console.log(`   ${index + 1}. ${transfer.from} → ${ethAmount} ETH (Block: ${parseInt(transfer.blockNum, 16)})`);
      });
      
      console.log(`   📊 Total Incoming ETH: ${totalIncoming.toFixed(6)} ETH`);

      // Get outgoing ETH transfers  
      const outgoingTransfers = await provider.send('alchemy_getAssetTransfers', [{
        fromBlock: '0x0',
        toBlock: 'latest',
        fromAddress: protocolWallet,
        category: ['external'],
        maxCount: '0x32',
        excludeZeroValue: true
      }]);

      console.log(`\n   📤 Outgoing ETH Transfers: ${outgoingTransfers.transfers.length}`);
      let totalOutgoing = 0;
      
      outgoingTransfers.transfers.forEach((transfer, index) => {
        const ethAmount = parseFloat(transfer.value);
        totalOutgoing += ethAmount;
        console.log(`   ${index + 1}. → ${transfer.to} ${ethAmount} ETH (Block: ${parseInt(transfer.blockNum, 16)})`);
      });
      
      console.log(`   📊 Total Outgoing ETH: ${totalOutgoing.toFixed(6)} ETH`);
      console.log(`   💎 Net ETH Flow: ${(totalIncoming - totalOutgoing).toFixed(6)} ETH`);

    } catch (alchemyError) {
      console.log(`   ❌ Alchemy transfer history failed: ${alchemyError.message}`);
    }

    // 4. Check for any membership payment records
    console.log('\n👥 Membership Payment Records:');
    try {
      const paymentResult = await pool.query(`
        SELECT 
          farcaster_username,
          wallet_address,
          membership_fee_paid,
          total_eth_contributed,
          created_at
        FROM users 
        WHERE membership_fee_paid = true
        ORDER BY created_at DESC
      `);

      if (paymentResult.rows.length > 0) {
        console.log(`   Found ${paymentResult.rows.length} paid members:`);
        paymentResult.rows.forEach((user, index) => {
          const ethContributed = parseFloat(user.total_eth_contributed || 0);
          console.log(`   ${index + 1}. ${user.farcaster_username}: ${ethContributed} ETH (${user.wallet_address})`);
        });
        
        const totalMembershipEth = paymentResult.rows.reduce((sum, user) => 
          sum + parseFloat(user.total_eth_contributed || 0), 0
        );
        console.log(`   📊 Total Membership ETH: ${totalMembershipEth.toFixed(6)} ETH`);
      } else {
        console.log(`   ❌ No paid memberships found`);
      }
    } catch (error) {
      console.log(`   ❌ Error querying membership payments: ${error.message}`);
    }

    // 5. Summary
    console.log('\n📋 ALL-TIME ETH EARNINGS SUMMARY:');
    console.log('   Sources:');
    console.log('   • Clanker Rewards Claims');
    console.log('   • Membership Fee Payments (0.002 ETH each)');
    console.log('   • Direct ETH transfers to protocol wallet');
    console.log('   • Token trading fees (if any)');
    console.log(`\n   💳 Current Protocol Balance: ${ethers.formatEther(currentBalance)} ETH`);

  } catch (error) {
    console.error('❌ Review failed:', error.message);
  }
}

reviewEthEarnings().catch(console.error);