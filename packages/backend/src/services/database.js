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

    // Migration 10: Wallet-First Identity Architecture
    const migration10 = 'wallet_first_identity_architecture';
    const exists10 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration10]);
    
    if (exists10.rows.length === 0) {
      console.log('🔄 Applying wallet-first identity migration...');
      
      // Read and execute the wallet-first migration SQL
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const migrationPath = path.join(__dirname, '../../migrations/wallet-first-schema-migration.sql');
      
      try {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by sections and execute
        const sections = migrationSQL.split('-- ============================================================================');
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i].trim();
          if (section && !section.startsWith('--') && section.length > 10) {
            try {
              // Split individual statements and execute
              const statements = section.split(';').filter(stmt => stmt.trim().length > 0);
              
              for (const statement of statements) {
                const trimmedStmt = statement.trim();
                if (trimmedStmt && !trimmedStmt.startsWith('--')) {
                  await client.query(trimmedStmt);
                }
              }
              
              console.log(`✅ Wallet-first migration section ${i + 1} completed`);
            } catch (sectionError) {
              console.log(`⚠️ Section ${i + 1} partially applied:`, sectionError.message);
            }
          }
        }
        
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration10]);
        console.log('✅ Migration: Wallet-first identity architecture applied');
        
      } catch (fileError) {
        console.log('⚠️ Wallet-first migration file not found, applying inline...');
        
        // Inline critical wallet-first changes if file not found
        try {
          // Add wallet-first columns
          await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS wallet_address_primary VARCHAR(42) UNIQUE,
            ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS entry_context VARCHAR(20) DEFAULT 'farcaster',
            ADD COLUMN IF NOT EXISTS can_earn_rewards BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS membership_status VARCHAR(20) DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS membership_paid_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS membership_tx_hash VARCHAR(66),
            ADD COLUMN IF NOT EXISTS total_abc_earned DECIMAL(18,6) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS reputation_score DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS reputation_tier VARCHAR(20) DEFAULT 'Bronze',
            ADD COLUMN IF NOT EXISTS voting_power DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS quality_score_avg DECIMAL(4,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS repositories_proposed INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS governance_votes_cast INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS discord_id VARCHAR(100)
          `);
          
          // Make farcaster_fid optional
          await client.query('ALTER TABLE users ALTER COLUMN farcaster_fid DROP NOT NULL');
          
          // Backfill existing users
          await client.query(`
            UPDATE users 
            SET 
              wallet_address_primary = wallet_address,
              onboarding_step = CASE 
                WHEN github_username IS NOT NULL AND wallet_address IS NOT NULL THEN 2
                WHEN wallet_address IS NOT NULL THEN 1
                ELSE 0
              END,
              can_earn_rewards = (github_username IS NOT NULL AND wallet_address IS NOT NULL),
              display_name = COALESCE(farcaster_username, github_username, 'User-' || id),
              membership_status = CASE 
                WHEN wallet_address IS NOT NULL THEN 'active'
                ELSE 'pending'
              END,
              total_abc_earned = COALESCE(total_rewards_earned, 0),
              reputation_score = COALESCE(total_rewards_earned * 10, 0)
            WHERE wallet_address_primary IS NULL
          `);
          
          // Add wallet lookup indexes
          await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_primary ON users(wallet_address_primary) WHERE wallet_address_primary IS NOT NULL');
          await client.query('CREATE INDEX IF NOT EXISTS idx_users_can_earn_rewards ON users(can_earn_rewards) WHERE can_earn_rewards = TRUE');
          
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration10]);
          console.log('✅ Migration: Wallet-first identity (inline version) applied');
          
        } catch (inlineError) {
          console.log('⚠️ Inline wallet-first migration failed:', inlineError.message);
          throw inlineError;
        }
      }
    }

    // Migration 11: Add connection pool health check
    const migration11 = 'add_connection_health_monitoring';
    const exists11 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration11]);
    
    if (exists11.rows.length === 0) {
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

      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration11]);
      console.log('✅ Migration: Added schema health monitoring');
    }

    // Migration 12: Add repository registration system
    const migration12 = 'add_repository_registration_system';
    const exists12 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration12]);
    
    if (exists12.rows.length === 0) {
      // Create registered_repositories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS registered_repositories (
          id SERIAL PRIMARY KEY,
          repository_name VARCHAR(255) NOT NULL, -- format: "owner/repo"
          repository_url TEXT NOT NULL,
          registered_by_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          registration_type VARCHAR(20) NOT NULL, -- 'member' or 'partner'
          webhook_configured BOOLEAN DEFAULT false,
          webhook_secret VARCHAR(255),
          reward_multiplier DECIMAL(3,2) DEFAULT 1.0,
          payment_tx_hash VARCHAR(66), -- for partner registrations
          payment_amount DECIMAL(18,2), -- $ABC amount paid
          status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'inactive'
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP, -- for partner registrations
          UNIQUE(repository_name)
        )
      `);

      // Create repository_permissions table to track user repo access
      await client.query(`
        CREATE TABLE IF NOT EXISTS repository_permissions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          repository_name VARCHAR(255) NOT NULL,
          permission_level VARCHAR(20) NOT NULL, -- 'admin', 'write', 'read'
          verified_at TIMESTAMP,
          last_checked TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, repository_name)
        )
      `);

      // Create partner_applications table
      await client.query(`
        CREATE TABLE IF NOT EXISTS partner_applications (
          id SERIAL PRIMARY KEY,
          organization_name VARCHAR(255) NOT NULL,
          contact_email VARCHAR(255) NOT NULL,
          repository_name VARCHAR(255) NOT NULL,
          repository_url TEXT NOT NULL,
          description TEXT,
          requested_multiplier DECIMAL(3,2) DEFAULT 2.0,
          payment_tx_hash VARCHAR(66),
          payment_verified BOOLEAN DEFAULT false,
          status VARCHAR(20) DEFAULT 'submitted', -- 'submitted', 'approved', 'rejected', 'active'
          submitted_by_user_id INTEGER REFERENCES users(id),
          reviewed_by_user_id INTEGER REFERENCES users(id),
          review_notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Add indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_registered_repos_type ON registered_repositories(registration_type)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_registered_repos_status ON registered_repositories(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_repo_permissions_user ON repository_permissions(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON partner_applications(status)');

      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration12]);
      console.log('✅ Migration: Added repository registration system');
    }

    // Migration 13: Add payment recovery system
    const migration13 = 'add_payment_recovery_system';
    const exists13 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration13]);
    
    if (exists13.rows.length === 0) {
      // Create payment_recoveries table for orphaned payments
      await client.query(`
        CREATE TABLE IF NOT EXISTS payment_recoveries (
          id SERIAL PRIMARY KEY,
          transaction_hash VARCHAR(66) UNIQUE NOT NULL,
          from_address VARCHAR(42) NOT NULL,
          amount_eth DECIMAL(18,6) NOT NULL,
          block_number INTEGER NOT NULL,
          status VARCHAR(20) DEFAULT 'pending_review', -- 'pending_review', 'matched', 'processed', 'ignored'
          matched_user_id INTEGER REFERENCES users(id),
          processed_by_user_id INTEGER REFERENCES users(id),
          admin_notes TEXT,
          detected_at TIMESTAMP DEFAULT NOW(),
          processed_at TIMESTAMP
        )
      `);

      // Add indexes for payment recovery system
      await client.query('CREATE INDEX IF NOT EXISTS idx_payment_recoveries_status ON payment_recoveries(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_payment_recoveries_tx_hash ON payment_recoveries(transaction_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_payment_recoveries_from_address ON payment_recoveries(from_address)');

      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration13]);
      console.log('✅ Migration: Added payment recovery system');
    }

    // Migration 14: Treasury Data Management Schema
    const migration14 = 'treasury_data_management_schema';
    const exists14 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration14]);
    
    if (exists14.rows.length === 0) {
      console.log('🔄 Creating treasury data management schema...');
      
      // Create treasury_snapshots table for historical treasury tracking
      await client.query(`
        CREATE TABLE IF NOT EXISTS treasury_snapshots (
          id SERIAL PRIMARY KEY,
          snapshot_time TIMESTAMP NOT NULL DEFAULT NOW(),
          eth_balance DECIMAL(18,6) NOT NULL,
          abc_balance DECIMAL(18,6) NOT NULL,
          total_value_usd DECIMAL(18,2) NOT NULL,
          staking_tvl DECIMAL(18,6) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create token_prices table for systematic price management
      await client.query(`
        CREATE TABLE IF NOT EXISTS token_prices (
          id SERIAL PRIMARY KEY,
          token_symbol VARCHAR(10) NOT NULL UNIQUE,
          price_usd DECIMAL(18,8) NOT NULL,
          market_cap DECIMAL(18,2),
          volume_24h DECIMAL(18,2),
          price_change_24h DECIMAL(8,4),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create data_freshness table for monitoring data manager health
      await client.query(`
        CREATE TABLE IF NOT EXISTS data_freshness (
          domain VARCHAR(50) PRIMARY KEY,
          last_update TIMESTAMP NOT NULL DEFAULT NOW(),
          update_frequency_seconds INTEGER NOT NULL DEFAULT 300,
          is_healthy BOOLEAN DEFAULT true,
          error_count INTEGER DEFAULT 0,
          last_error TEXT
        )
      `);

      // Add indexes for performance
      await client.query('CREATE INDEX IF NOT EXISTS idx_treasury_snapshots_time ON treasury_snapshots(snapshot_time DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_token_prices_symbol ON token_prices(token_symbol)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_token_prices_updated ON token_prices(updated_at DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_data_freshness_domain ON data_freshness(domain)');

      // Initialize data_freshness for treasury domain
      await client.query(`
        INSERT INTO data_freshness (domain, update_frequency_seconds) 
        VALUES ('treasury', 300)
        ON CONFLICT (domain) DO NOTHING
      `);

      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration14]);
      console.log('✅ Migration: Created treasury data management schema');
      console.log('   - treasury_snapshots: Historical treasury value tracking');
      console.log('   - token_prices: Systematic price data management');
      console.log('   - data_freshness: Data manager health monitoring');
    }

    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}