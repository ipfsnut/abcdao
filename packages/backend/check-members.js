import { getPool, initializeDatabase } from './src/services/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkMembership() {
  try {
    // Initialize database connection first
    await initializeDatabase();
    const pool = getPool();
    
    // Get total users
    const totalUsersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = totalUsersResult.rows[0].total;
    
    // Get paid members
    const paidMembersResult = await pool.query(`
      SELECT COUNT(*) as paid_count FROM users 
      WHERE membership_status = 'paid' OR membership_status = 'active'
    `);
    const paidMembers = paidMembersResult.rows[0].paid_count;
    
    // Get free members
    const freeMembers = totalUsers - paidMembers;
    
    // Get recent members (last 7 days)
    const recentMembersResult = await pool.query(`
      SELECT COUNT(*) as recent_count FROM users 
      WHERE membership_paid_at >= NOW() - INTERVAL '7 days'
    `);
    const recentMembers = recentMembersResult.rows[0].recent_count;
    
    // Get all user details to see everything
    const allUserDetails = await pool.query(`
      SELECT 
        farcaster_fid,
        farcaster_username, 
        github_username, 
        membership_paid_at,
        membership_amount,
        membership_status,
        created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    // Also get recent member details
    const recentMemberDetails = await pool.query(`
      SELECT 
        farcaster_username, 
        github_username, 
        membership_paid_at,
        membership_amount
      FROM users 
      WHERE membership_paid_at IS NOT NULL 
      ORDER BY membership_paid_at DESC 
      LIMIT 10
    `);
    
    console.log('🔍 ABC DAO Membership Stats:');
    console.log('═'.repeat(40));
    console.log(`📊 Total Users: ${totalUsers}`);
    console.log(`💰 Paid Members: ${paidMembers}`);
    console.log(`🆓 Free Members: ${freeMembers}`);
    console.log(`🚀 New Members (7 days): ${recentMembers}`);
    console.log('');
    
    // Show ALL users first
    if (allUserDetails.rows.length > 0) {
      console.log('👥 All Users:');
      console.log('─'.repeat(40));
      allUserDetails.rows.forEach((user, i) => {
        const createdDate = new Date(user.created_at).toLocaleDateString();
        const paidDate = user.membership_paid_at ? new Date(user.membership_paid_at).toLocaleDateString() : 'N/A';
        console.log(`${i + 1}. FID:${user.farcaster_fid} @${user.farcaster_username} (${user.github_username || 'no-github'}) - Status:${user.membership_status || 'free'} - Created:${createdDate} - Paid:${paidDate}`);
      });
      console.log('');
    }
    
    if (recentMemberDetails.rows.length > 0) {
      console.log('🕒 Paid Members Only:');
      console.log('─'.repeat(40));
      recentMemberDetails.rows.forEach((member, i) => {
        const date = new Date(member.membership_paid_at).toLocaleDateString();
        console.log(`${i + 1}. @${member.farcaster_username} (${member.github_username}) - ${date} - ${member.membership_amount} ETH`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking membership:', error.message);
    process.exit(1);
  }
}

checkMembership();