#!/usr/bin/env node

/**
 * Database Migration: Add Wallet History Tracking
 * 
 * Creates tables and fields needed for user-controlled wallet management:
 * - user_wallet_history table for audit trail
 * - legacy_wallets field for multiple wallet support
 * - indexes for efficient lookups
 */

import { initializeDatabase, getPool } from '../services/database.js';

async function addWalletHistoryMigration() {
  console.log('📋 Adding Wallet History Tracking Migration');
  console.log('=' * 45);
  
  try {
    await initializeDatabase();
    const pool = getPool();
    
    // Check if migration already applied
    const migrationCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_wallet_history'
      ) as table_exists
    `);
    
    if (migrationCheck.rows[0].table_exists) {
      console.log('✅ Wallet history migration already applied');
      return;
    }
    
    console.log('🔄 Applying wallet history migration...');
    
    // Create wallet history table
    await pool.query(`
      CREATE TABLE user_wallet_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_address VARCHAR(42) NOT NULL,
        wallet_type VARCHAR(20) NOT NULL, -- 'primary', 'staking', 'nft', 'legacy'
        valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
        valid_until TIMESTAMP NULL,
        migration_reason TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Created user_wallet_history table');
    
    // Add legacy_wallets column to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS legacy_wallets JSONB DEFAULT '[]'
    `);
    
    console.log('✅ Added legacy_wallets column to users table');
    
    // Create indexes for efficient lookups
    await pool.query(`
      CREATE INDEX idx_wallet_history_user_id ON user_wallet_history(user_id);
      CREATE INDEX idx_wallet_history_wallet_address ON user_wallet_history(wallet_address);
      CREATE INDEX idx_wallet_history_wallet_type ON user_wallet_history(wallet_type);
      CREATE INDEX idx_wallet_history_valid_from ON user_wallet_history(valid_from DESC);
    `);
    
    console.log('✅ Created wallet history indexes');
    
    // Populate initial history records for existing users
    console.log('🔄 Populating initial wallet history...');
    
    const existingUsers = await pool.query(`
      SELECT 
        id, 
        wallet_address, 
        wallet_address_primary, 
        created_at,
        updated_at
      FROM users 
      WHERE wallet_address IS NOT NULL OR wallet_address_primary IS NOT NULL
    `);
    
    let recordsCreated = 0;
    
    for (const user of existingUsers.rows) {
      // Create history record for legacy wallet if exists
      if (user.wallet_address) {
        await pool.query(`
          INSERT INTO user_wallet_history (
            user_id, 
            wallet_address, 
            wallet_type, 
            valid_from, 
            migration_reason,
            metadata
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          user.id,
          user.wallet_address,
          'legacy',
          user.created_at || new Date(),
          'migration_initial_legacy',
          JSON.stringify({ original_field: 'wallet_address' })
        ]);
        recordsCreated++;
      }
      
      // Create history record for primary wallet if exists and different from legacy
      if (user.wallet_address_primary && 
          user.wallet_address_primary.toLowerCase() !== user.wallet_address?.toLowerCase()) {
        await pool.query(`
          INSERT INTO user_wallet_history (
            user_id, 
            wallet_address, 
            wallet_type, 
            valid_from, 
            migration_reason,
            metadata
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          user.id,
          user.wallet_address_primary,
          'primary',
          user.updated_at || user.created_at || new Date(),
          'migration_initial_primary',
          JSON.stringify({ original_field: 'wallet_address_primary' })
        ]);
        recordsCreated++;
      }
    }
    
    console.log(`✅ Created ${recordsCreated} initial wallet history records`);
    
    // Add migration record
    await pool.query(`
      INSERT INTO migrations (name, applied_at) 
      VALUES ('add_wallet_history_tracking', NOW())
    `);
    
    console.log('✅ Migration completed successfully');
    
    // Summary
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log('====================');
    console.log('✅ user_wallet_history table created');
    console.log('✅ legacy_wallets column added to users');
    console.log('✅ Indexes created for efficient lookups');
    console.log(`✅ ${recordsCreated} historical records populated`);
    console.log('✅ Migration recorded in migrations table');
    
    // Show table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_wallet_history'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 user_wallet_history table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addWalletHistoryMigration()
    .then(() => {
      console.log('\n🎉 Wallet history migration completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export { addWalletHistoryMigration };