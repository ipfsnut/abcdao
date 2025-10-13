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
}

export function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
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
        CREATE TABLE users (
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
        CREATE TABLE commits (
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
        CREATE TABLE daily_stats (
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
    
    // Migration 4: Create indexes
    const migration4 = 'create_indexes';
    const exists4 = await client.query('SELECT * FROM migrations WHERE name = $1', [migration4]);
    
    if (exists4.rows.length === 0) {
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_farcaster_fid ON users(farcaster_fid)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_github_username ON users(github_username)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_commits_user_id ON commits(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_commits_hash ON commits(commit_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date)');
      
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration4]);
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
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}