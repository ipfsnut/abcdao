import { getPool } from '../services/database.js';

export class Membership {
  static async create(membershipData) {
    const pool = getPool();
    const {
      user_id,
      payment_tx_hash,
      amount_eth,
      status = 'active',
      payment_method = 'ethereum'
    } = membershipData;

    const result = await pool.query(`
      INSERT INTO memberships (
        user_id, payment_tx_hash, amount_eth, status, payment_method
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, payment_tx_hash, amount_eth, status, payment_method]);

    return result.rows[0];
  }

  static async findByTxHash(txHash) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM memberships WHERE payment_tx_hash = $1',
      [txHash]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM memberships WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const pool = getPool();
    const result = await pool.query(`
      UPDATE memberships 
      SET status = $2
      WHERE id = $1
      RETURNING *
    `, [id, status]);

    return result.rows[0];
  }

  static async getRevenueStats(days = 30) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_memberships,
        SUM(amount_eth) as total_revenue_eth,
        AVG(amount_eth) as avg_payment_eth,
        COUNT(CASE WHEN paid_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_memberships,
        SUM(CASE WHEN paid_at >= NOW() - INTERVAL '${days} days' THEN amount_eth ELSE 0 END) as recent_revenue_eth
      FROM memberships 
      WHERE status = 'active'
    `);

    return result.rows[0];
  }

  static async getDailyRevenue(days = 30) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        DATE(paid_at) as date,
        COUNT(*) as membership_count,
        SUM(amount_eth) as revenue_eth
      FROM memberships 
      WHERE 
        status = 'active' AND 
        paid_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(paid_at)
      ORDER BY date DESC
    `);

    return result.rows;
  }

  static async getRecentMemberships(limit = 50) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        m.*, 
        u.farcaster_username, 
        u.github_username
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      WHERE m.status = 'active'
      ORDER BY m.paid_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }
}