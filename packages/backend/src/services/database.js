import pkg from 'pg';
const { Pool } = pkg;

let pool;

export async function initializeDatabase() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Test connection
  const client = await pool.connect();
  await client.query('SELECT NOW()');
  client.release();
  
  // Run migrations
  await runMigrations();
  
  // Validate schema after migrations
  await validateSchema();
}

export function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

// Force connection pool refresh (useful after schema changes)
export async function refreshConnectionPool() {
  if (pool) {
    console.log('🔄 Refreshing database connection pool...');
    await pool.end();
    pool = null;
  }
  await initializeDatabase();
  console.log('✅ Connection pool refreshed');
}

// Validate critical schema elements
export async function validateSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Validating database schema...');
    
    // Check critical columns exist
    const criticalChecks = [
      { table: 'commits', column: 'tags', expected: 'ARRAY' },
      { table: 'commits', column: 'priority', expected: 'character varying' },
      { table: 'commits', column: 'is_private', expected: 'boolean' },
      { table: 'users', column: 'notification_settings', expected: 'jsonb' },
      { table: 'users', column: 'is_active', expected: 'boolean' }
    ];
    
    const missingColumns = [];
    
    for (const check of criticalChecks) {
      const result = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [check.table, check.column]);
      
      if (result.rows.length === 0) {
        missingColumns.push(`${check.table}.${check.column}`);
      } else {
        const actualType = result.rows[0].data_type;
        if (!actualType.includes(check.expected.toLowerCase()) && !check.expected.includes(actualType)) {
          console.log(`⚠️ Type mismatch: ${check.table}.${check.column} is ${actualType}, expected ${check.expected}`);
        }
      }
    }
    
    // Check critical tables exist
    const criticalTables = ['users', 'commits', 'memberships', 'priority_usage', 'processed_casts'];
    const missingTables = [];
    
    for (const tableName of criticalTables) {
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [tableName]);
      
      if (result.rows.length === 0) {
        missingTables.push(tableName);
      }
    }
    
    if (missingColumns.length > 0 || missingTables.length > 0) {
      console.error('❌ Schema validation failed:');
      if (missingTables.length > 0) {
        console.error('  Missing tables:', missingTables.join(', '));
      }
      if (missingColumns.length > 0) {
        console.error('  Missing columns:', missingColumns.join(', '));
      }
      throw new Error('Critical schema elements missing. Run migrations.');
    }
    
    console.log('✅ Schema validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Schema validation error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Migration 1: Create users table
    const migration1 = 'create_users_table';
    const exists1 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration1]);
    
    if (exists1.rows.length === 0) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          farcaster_fid INTEGER UNIQUE NOT NULL,
          farcaster_username VARCHAR(255) NOT NULL,
          github_username VARCHAR(255) UNIQUE,
          github_id INTEGER UNIQUE,
          wallet_address VARCHAR(42),
          access_token TEXT,
          verified_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration1]);
      console.log('✅ Migration: Created users table');
    }
    
    // Migration 2: Create commits table
    const migration2 = 'create_commits_table';
    const exists2 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration2]);
    
    if (exists2.rows.length === 0) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS commits (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          commit_hash VARCHAR(40) UNIQUE NOT NULL,
          repository VARCHAR(255) NOT NULL,
          commit_message TEXT,
          commit_url TEXT,
          reward_amount DECIMAL(18,2),
          cast_url TEXT,
          processed_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration2]);
      console.log('✅ Migration: Created commits table');
    }
    
    // Migration 3: Create daily_stats table
    const migration3 = 'create_daily_stats_table';
    const exists3 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration3]);
    
    if (exists3.rows.length === 0) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS daily_stats (
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          commit_count INTEGER DEFAULT 0,
          total_rewards DECIMAL(18,2) DEFAULT 0,
          PRIMARY KEY (user_id, date)
        )
      `);
      
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration3]);
      console.log('✅ Migration: Created daily_stats table');
    }
    
    // Migration 4: Fix column names FIRST (before creating indexes)
    const migration4 = 'fix_column_names_hyphens_to_underscores';
    const exists4 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration4]);
    
    if (exists4.rows.length === 0) {
      console.log('🔧 Fixing column names: hyphens → underscores...');
      
      try {
        // Check if old columns exist and rename them
        const checkColumns = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name IN ('verified-at', 'created-at', 'farcaster-fid')
        `);
        
        for (const row of checkColumns.rows) {
          const oldName = row.column_name;
          const newName = oldName.replace(/-/g, '_');
          
          console.log(`  Renaming ${oldName} → ${newName}`);
          await client.query(`ALTER TABLE users RENAME COLUMN "${oldName}" TO ${newName}`);
        }
        
        // Also check commits table
        const checkCommitsColumns = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'commits' 
          AND column_name LIKE '%-%'
        `);
        
        for (const row of checkCommitsColumns.rows) {
          const oldName = row.column_name;
          const newName = oldName.replace(/-/g, '_');
          
          console.log(`  Renaming commits.${oldName} → ${newName}`);
          await client.query(`ALTER TABLE commits RENAME COLUMN "${oldName}" TO ${newName}`);
        }
        
        console.log('✅ Column names fixed');
      } catch (error) {
        console.log('ℹ️ Column rename skipped (probably already correct):', error.message);
      }
      
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration4]);
      console.log('✅ Migration: Fixed column names');
    }

    // Migration 4b: Create indexes (AFTER column names are fixed)
    const migration4b = 'create_indexes';
    const exists4b = await client.query('SELECT * FROM migrations WHERE name = $1', [migration4b]);
    
    if (exists4b.rows.length === 0) {
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_farcaster_fid ON users(farcaster_fid)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_github_username ON users(github_username)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_commits_user_id ON commits(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_commits_hash ON commits(commit_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date)');
      
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration4b]);
      console.log('✅ Migration: Created indexes');
    }

    // Migration 5: Add membership system
    const migration5 = 'add_membership_system';
    const exists5 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration5]);
    
    if (exists5.rows.length === 0) {
      // Add membership fields to users table
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS membership_status VARCHAR(20) DEFAULT 'free',
        ADD COLUMN IF NOT EXISTS membership_paid_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS membership_tx_hash VARCHAR(66),
        ADD COLUMN IF NOT EXISTS membership_amount DECIMAL(18,6),
        ADD COLUMN IF NOT EXISTS total_commits INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_rewards_earned DECIMAL(18,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_commit_at TIMESTAMP
      `);

      // Create memberships table for detailed tracking
      await client.query(`
        CREATE TABLE memberships (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          payment_tx_hash VARCHAR(66) UNIQUE NOT NULL,
          amount_eth DECIMAL(18,6) NOT NULL,
          paid_at TIMESTAMP DEFAULT NOW(),
          status VARCHAR(20) DEFAULT 'active',
          payment_method VARCHAR(50) DEFAULT 'ethereum',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create oauth_states table for GitHub OAuth flow
      await client.query(`
        CREATE TABLE oauth_states (
          id SERIAL PRIMARY KEY,
          state_token VARCHAR(255) UNIQUE NOT NULL,
          farcaster_fid INTEGER,
          farcaster_username VARCHAR(255),
          callback_url TEXT,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create payment_intents table for tracking payment flows
      await client.query(`
        CREATE TABLE payment_intents (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          amount_eth DECIMAL(18,6) NOT NULL,
          bot_address VARCHAR(42) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          tx_hash VARCHAR(66) UNIQUE,
          confirmed_at TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Add indexes for membership system
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_membership_status ON users(membership_status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_memberships_tx_hash ON memberships(payment_tx_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_oauth_states_token ON oauth_states(state_token)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_payment_intents_tx_hash ON payment_intents(tx_hash)');

      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration5]);
      console.log('✅ Migration: Added membership system');
    }

    // Migration 6: Add processed_casts table for reward batching
    const migration6 = 'add_processed_casts_table';
    const exists6 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration6]);
    
    if (exists6.rows.length === 0) {
      // Create processed_casts table to track which bot casts have been processed
      await client.query(`
        CREATE TABLE processed_casts (
          id SERIAL PRIMARY KEY,
          cast_hash VARCHAR(255) UNIQUE NOT NULL,
          processed_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Add index for fast lookups
      await client.query('CREATE INDEX IF NOT EXISTS idx_processed_casts_hash ON processed_casts(cast_hash)');

      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration6]);
      console.log('✅ Migration: Added processed_casts table');
    }

    // Migration 7: Fix users table schema (add missing columns for OAuth)
    const migration7 = 'fix_users_table_oauth_columns';
    const exists7 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration7]);
    
    if (exists7.rows.length === 0) {
      // Add missing columns for OAuth flow
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS github_id INTEGER UNIQUE,
        ADD COLUMN IF NOT EXISTS access_token TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
      `);

      // Add indexes for new columns
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id)');

      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration7]);
      console.log('✅ Migration: Added missing OAuth columns to users table');
    }

    // Migration 8: Ensure unique constraint on farcaster_fid exists
    const migration8 = 'ensure_farcaster_fid_unique_constraint';
    const exists8 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration8]);
    
    if (exists8.rows.length === 0) {
      try {
        // Check if constraint already exists
        const constraintCheck = await client.query(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'users' 
          AND constraint_type = 'UNIQUE' 
          AND constraint_name LIKE '%farcaster_fid%'
        `);
        
        if (constraintCheck.rows.length === 0) {
          // Add unique constraint if it doesn't exist
          await client.query('ALTER TABLE users ADD CONSTRAINT users_farcaster_fid_unique UNIQUE (farcaster_fid)');
          console.log('✅ Added unique constraint on farcaster_fid');
        } else {
          console.log('ℹ️ Unique constraint on farcaster_fid already exists');
        }
      } catch (error) {
        console.log('ℹ️ Unique constraint setup skipped (may already exist):', error.message);
      }

      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration8]);
      console.log('✅ Migration: Ensured farcaster_fid unique constraint');
    }

    // Migration 9: Add missing columns that caused webhook failures
    const migration9 = 'add_missing_webhook_columns';
    const exists9 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration9]);
    
    if (exists9.rows.length === 0) {
      // Add missing columns to commits table (for commit tags and priorities)
      await client.query(`
        ALTER TABLE commits 
        ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
        ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false
      `);

      // Add missing columns to users table (for notifications and status)
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
          "commit_casts": {"enabled": true, "tag_me": true, "include_repo_name": true, "include_commit_message": true, "max_message_length": 100},
          "daily_limit_casts": {"enabled": true, "tag_me": true, "custom_message": null},
          "welcome_casts": {"enabled": true, "tag_me": true, "custom_message": null},
          "privacy": {"show_github_username": true, "show_real_name": false}
        }'::jsonb,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `);

      // Create priority_usage table for tracking priority tag limits
      await client.query(`
        CREATE TABLE IF NOT EXISTS priority_usage (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          commit_hash VARCHAR(40) NOT NULL,
          tag_type VARCHAR(20) NOT NULL,
          used_at TIMESTAMP DEFAULT NOW(),
          week_start DATE NOT NULL,
          UNIQUE(user_id, commit_hash)
        )
      `);

      // Add indexes for new columns and table
      await client.query('CREATE INDEX IF NOT EXISTS idx_commits_tags ON commits USING GIN(tags)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_commits_priority ON commits(priority)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_priority_usage_user_week ON priority_usage(user_id, week_start)');

      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration9]);
      console.log('✅ Migration: Added missing webhook columns (tags, priority, notification_settings, is_active)');
    }

    // Migration 10: Add connection pool health check
    const migration10 = 'add_connection_health_monitoring';
    const exists10 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration10]);
    
    if (exists10.rows.length === 0) {
      // Create a simple health check table to detect schema drift
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_health (
          id SERIAL PRIMARY KEY,
          check_name VARCHAR(255) UNIQUE NOT NULL,
          expected_result TEXT NOT NULL,
          last_checked TIMESTAMP DEFAULT NOW(),
          status VARCHAR(20) DEFAULT 'unknown'
        )
      `);

      // Insert health checks for critical columns
      await client.query(`
        INSERT INTO schema_health (check_name, expected_result) VALUES
        ('commits_has_tags_column', 'true'),
        ('users_has_notification_settings', 'true'),
        ('priority_usage_table_exists', 'true')
        ON CONFLICT (check_name) DO NOTHING
      `);

      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration10]);
      console.log('✅ Migration: Added schema health monitoring');
    }

    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}