import { getPool, initializeDatabase } from './src/services/database.js';
import { farcasterService } from './src/services/farcaster.js';
import dotenv from 'dotenv';

dotenv.config();

async function welcomeAllContributors() {
  try {
    await initializeDatabase();
    const pool = getPool();
    
    console.log('🎉 Manually triggering welcome casts for all contributors');
    console.log('═'.repeat(60));
    
    // Get all paid members
    const contributors = await pool.query(`
      SELECT 
        farcaster_fid,
        farcaster_username, 
        github_username,
        membership_paid_at,
        created_at
      FROM users 
      WHERE membership_status = 'paid'
      ORDER BY membership_paid_at ASC
    `);
    
    if (contributors.rows.length === 0) {
      console.log('❌ No paid contributors found');
      return;
    }
    
    console.log(`Found ${contributors.rows.length} paid contributors:\n`);
    
    // Show all contributors first
    contributors.rows.forEach((contributor, i) => {
      const joinDate = new Date(contributor.membership_paid_at).toLocaleDateString();
      console.log(`${i + 1}. @${contributor.farcaster_username} (GitHub: ${contributor.github_username}) - Joined: ${joinDate}`);
    });
    
    console.log('\n🚀 Posting welcome casts in sequence...\n');
    
    // Post welcome casts for each contributor with delay
    for (let i = 0; i < contributors.rows.length; i++) {
      const contributor = contributors.rows[i];
      
      try {
        console.log(`📢 Posting welcome cast for @${contributor.farcaster_username}...`);
        
        await farcasterService.announceNewContributor(
          contributor.github_username, 
          contributor.farcaster_username
        );
        
        console.log(`   ✅ Welcome cast posted for @${contributor.farcaster_username}`);
        
        // Add delay between casts to avoid rate limiting
        if (i < contributors.rows.length - 1) {
          console.log(`   ⏳ Waiting 3 seconds before next cast...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.error(`   ❌ Failed to post welcome cast for @${contributor.farcaster_username}:`, error.message);
      }
    }
    
    console.log('\n🎉 All welcome casts completed!');
    console.log(`📊 Total casts posted: ${contributors.rows.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error posting welcome casts:', error.message);
    process.exit(1);
  }
}

welcomeAllContributors();