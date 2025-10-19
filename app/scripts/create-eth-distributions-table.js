import { initializeDatabase, getPool } from '../src/services/database.js';

async function createEthDistributionsTable() {
  try {
    await initializeDatabase();
    const pool = getPool();

    console.log('Creating eth_distributions table...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS eth_distributions (
        id SERIAL PRIMARY KEY,
        transaction_hash VARCHAR(66) UNIQUE NOT NULL,
        block_number BIGINT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        eth_amount DECIMAL(18, 6) NOT NULL,
        total_staked_at_time DECIMAL(18, 0) NOT NULL,
        stakers_count INTEGER NOT NULL DEFAULT 0,
        eth_price_usd DECIMAL(10, 2) NOT NULL,
        calculated_apy DECIMAL(8, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_eth_distributions_timestamp ON eth_distributions(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_eth_distributions_tx_hash ON eth_distributions(transaction_hash);
    `;

    await pool.query(createTableQuery);

    console.log('✅ eth_distributions table created successfully');

    // Add sample data for testing if none exists
    const countResult = await pool.query('SELECT COUNT(*) FROM eth_distributions');
    const count = parseInt(countResult.rows[0].count);

    if (count === 0) {
      console.log('Adding sample distribution data...');
      
      // Add the manual ETH transfer we just did as the first distribution
      await pool.query(`
        INSERT INTO eth_distributions (
          transaction_hash,
          block_number,
          timestamp,
          eth_amount,
          total_staked_at_time,
          stakers_count,
          eth_price_usd,
          calculated_apy
        ) VALUES (
          '0x09e5af1125fe87ba1ed7843a1d22378f477127a7a6e7c1c6d0dd7e9b26796a8a',
          36926916,
          NOW() - INTERVAL '1 hour',
          0.01,
          711483264,
          15,
          3200,
          5.2
        )
      `);

      console.log('✅ Sample distribution data added');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createEthDistributionsTable();