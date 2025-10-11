import { initializeDatabase, getPool } from '../src/services/database.js';

async function runMigrations() {
  console.log('🗄️  Running database migrations...');
  
  try {
    // Initialize database connection first
    await initializeDatabase();
    const pool = getPool();
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        farcaster_fid INTEGER UNIQUE,
        farcaster_username VARCHAR(255),
        github_username VARCHAR(255),
        wallet_address VARCHAR(42),
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create commits table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        commit_hash VARCHAR(40) UNIQUE,
        repository VARCHAR(255),
        commit_message TEXT,
        reward_amount DECIMAL(18,6),
        cast_url VARCHAR(255),
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create daily_stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        user_id INTEGER,
        date DATE,
        commit_count INTEGER DEFAULT 0,
        total_rewards DECIMAL(18,6) DEFAULT 0,
        PRIMARY KEY (user_id, date),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_fid ON users(farcaster_fid);
      CREATE INDEX IF NOT EXISTS idx_users_github ON users(github_username);
      CREATE INDEX IF NOT EXISTS idx_commits_user ON commits(user_id);
      CREATE INDEX IF NOT EXISTS idx_commits_date ON commits(created_at);
      CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
    `);
    
    console.log('✅ Database migrations completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();