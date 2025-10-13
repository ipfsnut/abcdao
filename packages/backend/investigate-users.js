import { getPool, initializeDatabase } from './src/services/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function investigateUsers() {
  try {
    await initializeDatabase();
    const pool = getPool();
    
    // Get detailed user information
    const detailedUsers = await pool.query(`
      SELECT 
        id,
        farcaster_fid,
        farcaster_username, 
        github_username,
        github_id,
        membership_status,
        membership_paid_at,
        membership_amount,
        membership_tx_hash,
        access_token IS NOT NULL as has_access_token,
        verified_at,
        created_at,
        updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log('🔍 Detailed User Investigation:');
    console.log('═'.repeat(60));
    
    detailedUsers.rows.forEach((user, i) => {
      console.log(`\n👤 User ${i + 1}: ID=${user.id}`);
      console.log(`   FID: ${user.farcaster_fid}`);
      console.log(`   Farcaster: @${user.farcaster_username}`);
      console.log(`   GitHub: ${user.github_username || 'NOT_LINKED'} (ID: ${user.github_id || 'N/A'})`);
      console.log(`   Status: ${user.membership_status || 'free'}`);
      console.log(`   Paid: ${user.membership_paid_at ? new Date(user.membership_paid_at).toLocaleString() : 'NO'}`);
      console.log(`   Amount: ${user.membership_amount || 'N/A'} ETH`);
      console.log(`   TX Hash: ${user.membership_tx_hash || 'N/A'}`);
      console.log(`   Has Token: ${user.has_access_token ? 'YES' : 'NO'}`);
      console.log(`   Verified: ${user.verified_at ? new Date(user.verified_at).toLocaleString() : 'NO'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(user.updated_at).toLocaleString()}`);
      
      // Determine if this looks like a test/fake account
      const isFake = !user.github_username || 
                    !user.verified_at || 
                    (user.membership_status === 'free' && !user.membership_paid_at);
      
      if (isFake) {
        console.log(`   🚨 POTENTIALLY FAKE: Missing GitHub link or payment`);
      } else {
        console.log(`   ✅ LEGITIMATE: Has GitHub and/or payment`);
      }
    });
    
    // Check for duplicates
    console.log('\n🔄 Checking for duplicates...');
    
    // Check for duplicate FIDs
    const fidDuplicates = await pool.query(`
      SELECT farcaster_fid, COUNT(*) as count
      FROM users 
      GROUP BY farcaster_fid 
      HAVING COUNT(*) > 1
    `);
    
    if (fidDuplicates.rows.length > 0) {
      console.log('⚠️ Duplicate FIDs found:');
      fidDuplicates.rows.forEach(dup => {
        console.log(`   FID ${dup.farcaster_fid}: ${dup.count} accounts`);
      });
    }
    
    // Check for duplicate GitHub users
    const githubDuplicates = await pool.query(`
      SELECT github_username, COUNT(*) as count
      FROM users 
      WHERE github_username IS NOT NULL
      GROUP BY github_username 
      HAVING COUNT(*) > 1
    `);
    
    if (githubDuplicates.rows.length > 0) {
      console.log('⚠️ Duplicate GitHub accounts found:');
      githubDuplicates.rows.forEach(dup => {
        console.log(`   GitHub ${dup.github_username}: ${dup.count} accounts`);
      });
    }
    
    // Recommend cleanup actions
    console.log('\n🧹 Cleanup Recommendations:');
    console.log('─'.repeat(40));
    
    const freeUnverified = detailedUsers.rows.filter(user => 
      user.membership_status === 'free' && !user.verified_at
    );
    
    const freeWithoutGithub = detailedUsers.rows.filter(user => 
      user.membership_status === 'free' && !user.github_username
    );
    
    console.log(`📊 Free & unverified accounts: ${freeUnverified.length}`);
    console.log(`📊 Free & no GitHub linked: ${freeWithoutGithub.length}`);
    
    if (freeUnverified.length > 0) {
      console.log('\n❌ SAFE TO DELETE (Free & Unverified):');
      freeUnverified.forEach(user => {
        console.log(`   - ID:${user.id} FID:${user.farcaster_fid} @${user.farcaster_username} (No verification, no payment)`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error investigating users:', error.message);
    process.exit(1);
  }
}

investigateUsers();