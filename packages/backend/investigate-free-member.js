import { getPool, initializeDatabase } from './src/services/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function investigateFreeMember() {
  try {
    await initializeDatabase();
    const pool = getPool();
    
    console.log('🚨 Investigating "free" member @indefatigable');
    console.log('═'.repeat(50));
    
    // Get the user details
    const userResult = await pool.query(`
      SELECT * FROM users 
      WHERE farcaster_username = 'indefatigable' OR github_username = 'rbpollock'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 User Record:');
    console.log('─'.repeat(30));
    Object.keys(user).forEach(key => {
      console.log(`   ${key}: ${user[key]}`);
    });
    
    console.log('\n🔍 Analysis:');
    console.log('─'.repeat(20));
    console.log(`   Has GitHub: ${user.github_username ? 'YES' : 'NO'}`);
    console.log(`   Verified: ${user.verified_at ? 'YES' : 'NO'}`);
    console.log(`   Membership Status: ${user.membership_status || 'NULL'}`);
    console.log(`   Payment TX: ${user.membership_tx_hash || 'NONE'}`);
    console.log(`   Payment Date: ${user.membership_paid_at || 'NEVER'}`);
    console.log(`   Payment Amount: ${user.membership_amount || 'N/A'} ETH`);
    
    // Check if this violates our "payment first" rule
    if (user.github_username && !user.membership_tx_hash) {
      console.log('\n🚨 VIOLATION DETECTED:');
      console.log('   This user linked GitHub WITHOUT paying first!');
      console.log('   This should be impossible with our current system.');
    }
    
    // Check when this user was created
    console.log(`\n📅 Created: ${user.created_at || 'Unknown'}`);
    console.log(`📅 Updated: ${user.updated_at || 'Unknown'}`);
    
    // Get all users for context
    const allUsers = await pool.query(`
      SELECT 
        farcaster_username,
        github_username, 
        membership_status,
        membership_paid_at,
        created_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log('\n👥 All Users for Context:');
    console.log('─'.repeat(40));
    allUsers.rows.forEach((u, i) => {
      const status = u.membership_status || 'free';
      const paid = u.membership_paid_at ? '✅' : '❌';
      console.log(`${i+1}. @${u.farcaster_username} (${u.github_username || 'no-github'}) - ${status} ${paid}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error investigating:', error.message);
    process.exit(1);
  }
}

investigateFreeMember();