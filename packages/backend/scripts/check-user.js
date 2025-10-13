#!/usr/bin/env node

import { getPool, initializeDatabase } from '../src/services/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUser() {
  try {
    await initializeDatabase();
    const pool = getPool();
    
    console.log('🔍 Checking for user ipfsnut (FID 8573)...');
    
    const result = await pool.query(
      'SELECT * FROM users WHERE farcaster_fid = $1 OR github_username = $2',
      [8573, 'ipfsnut']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ User found:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();