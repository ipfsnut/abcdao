#!/usr/bin/env node
/**
 * Database utilities that use the same connection as the Railway app
 * This eliminates the multiple database issue by ensuring we always use
 * the same connection method as the running application.
 */

import { initializeDatabase, getPool } from '../src/services/database.js';

// Utility functions for common database operations
export async function runQuery(sql, params = []) {
  try {
    await initializeDatabase();
    const pool = getPool();
    const result = await pool.query(sql, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

export async function listUsers() {
  const result = await runQuery(`
    SELECT 
      farcaster_fid,
      farcaster_username,
      github_username,
      membership_status,
      membership_tx_hash,
      verified_at,
      created_at
    FROM users 
    ORDER BY farcaster_fid
  `);
  return result.rows;
}

export async function getUserByFid(fid) {
  const result = await runQuery('SELECT * FROM users WHERE farcaster_fid = $1', [fid]);
  return result.rows[0];
}

export async function createUser(userData) {
  const {
    farcaster_fid,
    farcaster_username,
    github_username = null,
    github_id = null,
    membership_status = 'free',
    membership_tx_hash = null,
    membership_amount = null,
    membership_paid_at = null
  } = userData;

  const result = await runQuery(`
    INSERT INTO users (
      farcaster_fid,
      farcaster_username,
      github_username,
      github_id,
      membership_status,
      membership_tx_hash,
      membership_amount,
      membership_paid_at,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    ON CONFLICT (farcaster_fid) DO UPDATE SET
      github_username = EXCLUDED.github_username,
      github_id = EXCLUDED.github_id,
      membership_status = EXCLUDED.membership_status,
      membership_tx_hash = EXCLUDED.membership_tx_hash,
      membership_amount = EXCLUDED.membership_amount,
      membership_paid_at = EXCLUDED.membership_paid_at,
      updated_at = NOW()
    RETURNING *
  `, [
    farcaster_fid,
    farcaster_username,
    github_username,
    github_id,
    membership_status,
    membership_tx_hash,
    membership_amount,
    membership_paid_at
  ]);

  return result.rows[0];
}

export async function addSchemaColumn(tableName, columnName, columnType, defaultValue = null) {
  const sql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnType}${defaultValue ? ` DEFAULT ${defaultValue}` : ''}`;
  await runQuery(sql);
  console.log(`✅ Added column ${columnName} to ${tableName}`);
}

export async function getTableSchema(tableName) {
  const result = await runQuery(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = $1 
    AND table_schema = 'public'
    ORDER BY ordinal_position
  `, [tableName]);
  return result.rows;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'list-users':
      const users = await listUsers();
      console.log('=== ALL USERS ===');
      users.forEach((user, i) => {
        console.log(`${i+1}. FID ${user.farcaster_fid} (@${user.farcaster_username})`);
        console.log(`   GitHub: ${user.github_username || 'not linked'}`);
        console.log(`   Status: ${user.membership_status}`);
        console.log(`   TX: ${user.membership_tx_hash || 'none'}`);
        console.log('');
      });
      break;
      
    case 'schema':
      const tableName = process.argv[3] || 'users';
      const schema = await getTableSchema(tableName);
      console.log(`=== ${tableName.toUpperCase()} TABLE SCHEMA ===`);
      schema.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type}${col.column_default ? ` (default: ${col.column_default})` : ''}`);
      });
      break;
      
    case 'query':
      const sql = process.argv[3];
      if (!sql) {
        console.log('Usage: node db-utils.js query "SELECT * FROM users LIMIT 5"');
        process.exit(1);
      }
      const result = await runQuery(sql);
      console.log('Query result:');
      console.table(result.rows);
      break;
      
    default:
      console.log('Available commands:');
      console.log('  list-users     - List all users');
      console.log('  schema [table] - Show table schema');
      console.log('  query "SQL"    - Run custom query');
      break;
  }
  
  process.exit(0);
}