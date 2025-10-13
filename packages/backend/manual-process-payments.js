import { getPool, initializeDatabase } from './src/services/database.js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function manualProcessPayments() {
  try {
    await initializeDatabase();
    const pool = getPool();
    
    // Payment 5: 0x5bcedff331d060ecaa6e57d1ea3f1c6e2eebd9ac58d910d59df82679dc4e0db9
    // From: 0xdc5de54c65d8593d47bee3551bf15f2f969e0d82
    
    // Payment 6: 0x1ade46c0c9acdeceb0117598e1b8c8549a87d97c26b3e20151eabbb3ee5b8262  
    // From: 0x0aadd2e08f1bf4be8b82ca6e402b7b76b3db76e9
    
    const paymentsToProcess = [
      {
        txHash: '0x5bcedff331d060ecaa6e57d1ea3f1c6e2eebd9ac58d910d59df82679dc4e0db9',
        fromAddress: '0xdc5de54c65d8593d47bee3551bf15f2f969e0d82',
        amount: '0.002000',
        blockNum: '0x2315345'
      },
      {
        txHash: '0x1ade46c0c9acdeceb0117598e1b8c8549a87d97c26b3e20151eabbb3ee5b8262',
        fromAddress: '0x0aadd2e08f1bf4be8b82ca6e402b7b76b3db76e9',
        amount: '0.002000', 
        blockNum: '0x231562f'
      }
    ];
    
    console.log('🔧 Manual Payment Processing:');
    console.log('═'.repeat(50));
    
    // First, let's get the transaction data to find the FID
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    
    for (let i = 0; i < paymentsToProcess.length; i++) {
      const payment = paymentsToProcess[i];
      console.log(`\n💸 Processing Payment ${i + 1}:`);
      console.log(`   TX: ${payment.txHash}`);
      console.log(`   From: ${payment.fromAddress}`);
      console.log(`   Amount: ${payment.amount} ETH`);
      
      try {
        // Get transaction details to extract FID from data field
        const tx = await provider.getTransaction(payment.txHash);
        
        if (!tx) {
          console.log(`   ❌ Transaction not found`);
          continue;
        }
        
        console.log(`   📦 Block: ${tx.blockNumber}`);
        
        // Decode the data field to get FID
        let fid = null;
        if (tx.data && tx.data !== '0x') {
          try {
            const decoded = Buffer.from(tx.data.slice(2), 'hex').toString();
            console.log(`   📝 Data: ${decoded}`);
            
            const fidMatch = decoded.match(/ABC_DAO_MEMBERSHIP_FID:(\d+)/);
            if (fidMatch) {
              fid = parseInt(fidMatch[1]);
              console.log(`   🎯 Found FID: ${fid}`);
            }
          } catch (decodeError) {
            console.log(`   ⚠️ Couldn't decode data as text`);
          }
        }
        
        if (!fid) {
          console.log(`   ❌ No FID found in transaction data`);
          continue;
        }
        
        // Find user with this FID
        const userResult = await pool.query(
          'SELECT id, farcaster_username, github_username, membership_status FROM users WHERE farcaster_fid = $1',
          [fid]
        );
        
        if (userResult.rows.length === 0) {
          console.log(`   ❌ User with FID ${fid} not found in database`);
          continue;
        }
        
        const user = userResult.rows[0];
        console.log(`   👤 Found user: @${user.farcaster_username} (GitHub: ${user.github_username || 'none'})`);
        console.log(`   📊 Current status: ${user.membership_status || 'free'}`);
        
        if (user.membership_status === 'paid') {
          console.log(`   ℹ️ User already marked as paid - skipping`);
          continue;
        }
        
        // Update user membership status
        await pool.query(`
          UPDATE users 
          SET 
            membership_status = 'paid',
            membership_paid_at = NOW(),
            membership_tx_hash = $1,
            membership_amount = $2,
            updated_at = NOW()
          WHERE farcaster_fid = $3
        `, [payment.txHash, payment.amount, fid]);
        
        // Insert membership record
        await pool.query(`
          INSERT INTO memberships (user_id, payment_tx_hash, amount_eth, paid_at, status, payment_method)
          VALUES ($1, $2, $3, NOW(), 'active', 'ethereum')
          ON CONFLICT (payment_tx_hash) DO NOTHING
        `, [user.id, payment.txHash, payment.amount]);
        
        console.log(`   ✅ Membership activated for @${user.farcaster_username}`);
        console.log(`   💰 Payment: ${payment.amount} ETH`);
        console.log(`   🔗 TX: ${payment.txHash}`);
        
      } catch (error) {
        console.error(`   ❌ Error processing payment: ${error.message}`);
      }
    }
    
    // Final status check
    console.log('\n📊 Final Status Check:');
    console.log('─'.repeat(30));
    
    const finalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN membership_status = 'paid' THEN 1 END) as paid_users,
        COUNT(CASE WHEN membership_status = 'free' OR membership_status IS NULL THEN 1 END) as free_users
      FROM users
    `);
    
    const stats = finalStats.rows[0];
    console.log(`📊 Total Users: ${stats.total_users}`);
    console.log(`💰 Paid Members: ${stats.paid_users}`);
    console.log(`🆓 Free Members: ${stats.free_users}`);
    
    // Show all paid users
    const paidUsers = await pool.query(`
      SELECT 
        farcaster_username,
        github_username,
        membership_paid_at,
        membership_amount,
        membership_tx_hash
      FROM users 
      WHERE membership_status = 'paid'
      ORDER BY membership_paid_at DESC
    `);
    
    console.log('\n💳 Paid Members:');
    paidUsers.rows.forEach((user, i) => {
      const date = new Date(user.membership_paid_at).toLocaleDateString();
      console.log(`${i + 1}. @${user.farcaster_username} (${user.github_username}) - ${date} - ${user.membership_amount} ETH`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error processing payments:', error.message);
    process.exit(1);
  }
}

manualProcessPayments();