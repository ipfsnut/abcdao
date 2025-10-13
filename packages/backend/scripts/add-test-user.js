#!/usr/bin/env node

import { getPool, initializeDatabase } from '../src/services/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function addTestUser() {
  try {
    console.log('🔗 Initializing database...');
    await initializeDatabase();
    
    console.log('🔗 Getting database pool...');
    const pool = getPool();
    
    // Add ipfsnut as test user
    const result = await pool.query(`
      INSERT INTO users (
        farcaster_fid, 
        farcaster_username, 
        github_username, 
        verified_at,
        created_at
      ) VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (farcaster_fid) DO UPDATE SET
        github_username = EXCLUDED.github_username,
        verified_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `, [8573, 'ipfsnut', 'ipfsnut']);
    
    console.log('✅ Test user added/updated successfully:');
    console.log(result.rows[0]);
    
    // Verify the user was added
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE farcaster_fid = $1',
      [8573]
    );
    
    console.log('\n🔍 Verification - User in database:');
    console.log(checkResult.rows[0]);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding test user:', error);
    process.exit(1);
  }
}

addTestUser();