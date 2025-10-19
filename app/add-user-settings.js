import { getPool, initializeDatabase } from './src/services/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function addUserSettings() {
  try {
    await initializeDatabase();
    const pool = getPool();
    
    console.log('🔧 Adding user notification settings to database...');
    console.log('═'.repeat(50));
    
    // Add notification_settings column with default preferences
    const defaultSettings = {
      commit_casts: {
        enabled: true,
        tag_me: true,
        include_repo_name: true,
        include_commit_message: true,
        max_message_length: 100
      },
      daily_limit_casts: {
        enabled: true,
        tag_me: true,
        custom_message: null
      },
      welcome_casts: {
        enabled: true,
        tag_me: true,
        custom_message: null
      },
      privacy: {
        show_github_username: true,
        show_real_name: false
      }
    };
    
    // Check if column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'notification_settings'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('ℹ️  notification_settings column already exists');
    } else {
      console.log('➕ Adding notification_settings column...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN notification_settings JSONB DEFAULT '${JSON.stringify(defaultSettings)}'
      `);
      console.log('✅ Column added successfully');
    }
    
    // Update existing users with default settings if they don't have any
    console.log('🔄 Updating existing users with default settings...');
    
    const updateResult = await pool.query(`
      UPDATE users 
      SET notification_settings = $1 
      WHERE notification_settings IS NULL
    `, [JSON.stringify(defaultSettings)]);
    
    console.log(`✅ Updated ${updateResult.rowCount} users with default settings`);
    
    // Show current users and their settings
    const usersResult = await pool.query(`
      SELECT 
        farcaster_username,
        github_username,
        notification_settings
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log('\n👥 Current Users and Settings:');
    console.log('─'.repeat(50));
    
    usersResult.rows.forEach((user, i) => {
      console.log(`${i + 1}. @${user.farcaster_username} (${user.github_username})`);
      if (user.notification_settings) {
        const settings = user.notification_settings;
        console.log(`   Commit casts: ${settings.commit_casts?.enabled ? 'ON' : 'OFF'} (tag: ${settings.commit_casts?.tag_me ? 'YES' : 'NO'})`);
        console.log(`   Daily limit casts: ${settings.daily_limit_casts?.enabled ? 'ON' : 'OFF'} (tag: ${settings.daily_limit_casts?.tag_me ? 'YES' : 'NO'})`);
        console.log(`   Welcome casts: ${settings.welcome_casts?.enabled ? 'ON' : 'OFF'} (tag: ${settings.welcome_casts?.tag_me ? 'YES' : 'NO'})`);
      } else {
        console.log(`   No settings found`);
      }
      console.log('');
    });
    
    console.log('🎉 User settings system initialized!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding user settings:', error.message);
    process.exit(1);
  }
}

addUserSettings();