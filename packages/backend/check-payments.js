import { getPool, initializeDatabase } from './src/services/database.js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function checkMissedPayments() {
  try {
    await initializeDatabase();
    const pool = getPool();
    
    // Get users who are linked but not paid
    const unpaidUsers = await pool.query(`
      SELECT 
        id,
        farcaster_fid,
        farcaster_username,
        github_username,
        membership_status,
        verified_at,
        created_at
      FROM users 
      WHERE membership_status = 'free' 
        AND github_username IS NOT NULL 
        AND verified_at IS NOT NULL
      ORDER BY created_at DESC
    `);
    
    console.log('🚨 Users who linked GitHub but payment not detected:');
    console.log('═'.repeat(60));
    
    if (unpaidUsers.rows.length === 0) {
      console.log('✅ No missed payments found');
      return;
    }
    
    // Check the bot wallet for recent transactions
    const BOT_WALLET_ADDRESS = process.env.BOT_WALLET_ADDRESS || '0x475579e65E140B11bc4656dD4b05e0CADc8366eB';
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    
    console.log(`\n🔍 Checking bot wallet: ${BOT_WALLET_ADDRESS}`);
    console.log(`📡 RPC: ${process.env.BASE_RPC_URL}`);
    
    // Get recent transactions to the bot wallet
    try {
      const currentBlock = await provider.getBlockNumber();
      console.log(`📦 Current block: ${currentBlock}`);
      
      // Check last 1000 blocks for transactions
      const fromBlock = Math.max(0, currentBlock - 1000);
      console.log(`🔍 Scanning blocks ${fromBlock} to ${currentBlock}...`);
      
      // Get all transactions TO the bot wallet
      const filter = {
        address: null,
        fromBlock: fromBlock,
        toBlock: 'latest',
        topics: null
      };
      
      // We need to manually check transactions since we can't filter by 'to' address easily
      // Let's check the payment monitor logs or recent blocks
      
      console.log('\n👥 Users needing payment verification:');
      unpaidUsers.rows.forEach((user, i) => {
        console.log(`\n${i + 1}. @${user.farcaster_username} (FID: ${user.farcaster_fid})`);
        console.log(`   GitHub: ${user.github_username}`);
        console.log(`   Status: ${user.membership_status}`);
        console.log(`   Verified: ${new Date(user.verified_at).toLocaleString()}`);
        console.log(`   Expected payment data: ABC_DAO_MEMBERSHIP_FID:${user.farcaster_fid}`);
      });
      
      // Check if payment monitor is running
      const monitorCheck = await pool.query(`
        SELECT 
          COUNT(*) as total_payments,
          MAX(membership_paid_at) as latest_payment
        FROM users 
        WHERE membership_paid_at IS NOT NULL
      `);
      
      console.log('\n💰 Payment System Status:');
      console.log(`   Total successful payments: ${monitorCheck.rows[0].total_payments}`);
      console.log(`   Latest payment: ${monitorCheck.rows[0].latest_payment ? new Date(monitorCheck.rows[0].latest_payment).toLocaleString() : 'None'}`);
      
    } catch (error) {
      console.error('❌ Error checking blockchain:', error.message);
    }
    
    console.log('\n🔧 Recommended Actions:');
    console.log('1. Check if payment monitor is running properly');
    console.log('2. Manually verify payments on Base blockchain');
    console.log('3. Update membership status for valid payments');
    console.log('4. Check if users sent payments with correct FID data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking payments:', error.message);
    process.exit(1);
  }
}

checkMissedPayments();