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
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}