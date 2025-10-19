import { getPool } from '../services/database.js';

export class PaymentIntent {
  static async create(paymentData) {
    const pool = getPool();
    const {
      user_id,
      amount_eth,
      bot_address,
      expires_in_minutes = 60
    } = paymentData;

    const expires_at = new Date(Date.now() + expires_in_minutes * 60 * 1000);

    const result = await pool.query(`
      INSERT INTO payment_intents (
        user_id, amount_eth, bot_address, expires_at
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [user_id, amount_eth, bot_address, expires_at]);

    return result.rows[0];
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM payment_intents WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByTxHash(txHash) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM payment_intents WHERE tx_hash = $1',
      [txHash]
    );
    return result.rows[0] || null;
  }

  static async findPendingByUser(userId) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT * FROM payment_intents 
      WHERE user_id = $1 AND status = 'pending' AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);
    return result.rows[0] || null;
  }

  static async updateTxHash(id, txHash) {
    const pool = getPool();
    const result = await pool.query(`
      UPDATE payment_intents 
      SET tx_hash = $2, status = 'submitted'
      WHERE id = $1
      RETURNING *
    `, [id, txHash]);

    return result.rows[0];
  }

  static async confirmPayment(txHash) {
    const pool = getPool();
    const result = await pool.query(`
      UPDATE payment_intents 
      SET status = 'confirmed', confirmed_at = NOW()
      WHERE tx_hash = $1
      RETURNING *
    `, [txHash]);

    return result.rows[0];
  }

  static async expireIntent(id) {
    const pool = getPool();
    const result = await pool.query(`
      UPDATE payment_intents 
      SET status = 'expired'
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }

  static async getPendingPayments() {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        pi.*,
        u.farcaster_username,
        u.github_username
      FROM payment_intents pi
      JOIN users u ON pi.user_id = u.id
      WHERE pi.status IN ('pending', 'submitted') AND pi.expires_at > NOW()
      ORDER BY pi.created_at ASC
    `);

    return result.rows;
  }

  static async cleanupExpired() {
    const pool = getPool();
    const result = await pool.query(`
      UPDATE payment_intents 
      SET status = 'expired'
      WHERE status = 'pending' AND expires_at <= NOW()
    `);
    return result.rowCount;
  }

  static async getPaymentStats(days = 30) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_intents,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
        SUM(CASE WHEN status = 'confirmed' THEN amount_eth ELSE 0 END) as confirmed_amount_eth,
        AVG(CASE WHEN status = 'confirmed' THEN 
          EXTRACT(EPOCH FROM (confirmed_at - created_at))/60 
        END) as avg_confirmation_minutes
      FROM payment_intents 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `);

    return result.rows[0];
  }
}