import { getPool, initializeDatabase } from './src/services/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkStructure() {
  try {
    await initializeDatabase();
    const pool = getPool();
    
    // Get table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'commits'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Commits Table Structure:');
    console.log('─'.repeat(40));
    structure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Get sample data
    const sample = await pool.query(`
      SELECT * FROM commits ORDER BY created_at DESC LIMIT 3
    `);
    
    console.log('\n📝 Sample Commits:');
    console.log('─'.repeat(40));
    sample.rows.forEach((commit, i) => {
      console.log(`${i + 1}. Commit ID: ${commit.id}`);
      Object.keys(commit).forEach(key => {
        if (key !== 'id') {
          console.log(`   ${key}: ${commit[key]}`);
        }
      });
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStructure();