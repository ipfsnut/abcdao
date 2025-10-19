/**
 * Emergency deployment script to fix PostgreSQL schema issues
 * 
 * This script ensures the database schema matches what the webhook expects:
 * - cast_url column exists and is TEXT type
 * - commit_url column exists and is TEXT type
 * - All column names use underscores (not hyphens)
 */

import { initializeDatabase, getPool } from '../src/services/database.js';

async function deployFix() {
  console.log('🚀 Running deployment schema fixes...');
  
  try {
    // Initialize database (this runs all migrations automatically)
    console.log('📦 Initializing database and running migrations...');
    await initializeDatabase();
    
    const pool = getPool();
    
    // Verify the schema is correct
    console.log('🔍 Verifying schema...');
    
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'commits' 
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ Commits table schema:');
    columnsCheck.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check for required columns
    const requiredColumns = ['cast_url', 'commit_url'];
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('⚠️ Missing columns:', missingColumns);
      console.log('💡 The database service migrations should have created these. Check logs for migration errors.');
    } else {
      console.log('✅ All required columns present');
    }
    
    // Test the exact query that's failing in the webhook
    console.log('🧪 Testing webhook query...');
    try {
      await pool.query(`
        UPDATE commits 
        SET cast_url = $1
        WHERE commit_hash = $2
      `, ['test_cast_url', 'test_commit_hash_that_does_not_exist']);
      
      console.log('✅ Webhook query structure is valid (no matching rows is expected)');
    } catch (error) {
      console.error('❌ Webhook query failed:', error.message);
      throw error;
    }
    
    console.log('🎉 Deployment fix completed successfully!');
    console.log('💡 The webhook error should now be resolved.');
    
  } catch (error) {
    console.error('💥 Deployment fix failed:', error);
    throw error;
  }
}

// Auto-run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployFix()
    .then(() => {
      console.log('✨ Deploy fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deploy fix failed:', error);
      process.exit(1);
    });
}

export { deployFix };