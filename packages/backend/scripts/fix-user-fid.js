#!/usr/bin/env node

import { getPool, initializeDatabase } from '../src/services/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixUserFid() {
  try {
    await initializeDatabase();
    const pool = getPool();
    
    console.log('🔧 Updating user FID from 12345 to 8573...');
    
    const result = await pool.query(`
      UPDATE users 
      SET farcaster_fid = $1, updated_at = NOW()
      WHERE github_username = $2
      RETURNING *
    `, [8573, 'ipfsnut']);
    
    if (result.rows.length > 0) {
      console.log('✅ User updated successfully:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ User not found for update');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUserFid();