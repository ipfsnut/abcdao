import { getPool } from '../services/database.js';
import crypto from 'crypto';

export class OAuthState {
  static async create(oauthData) {
    const pool = getPool();
    const {
      farcaster_fid,
      farcaster_username,
      callback_url,
      expires_in_minutes = 30
    } = oauthData;

    // Generate secure random state token
    const state_token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + expires_in_minutes * 60 * 1000);

    const result = await pool.query(`
      INSERT INTO oauth_states (
        state_token, farcaster_fid, farcaster_username, 
        callback_url, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [state_token, farcaster_fid, farcaster_username, callback_url, expires_at]);

    return result.rows[0];
  }

  static async findByToken(token) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM oauth_states WHERE state_token = $1 AND expires_at > NOW()',
      [token]
    );
    return result.rows[0] || null;
  }

  static async consume(token) {
    const pool = getPool();
    
    // Get the state and delete it in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const selectResult = await client.query(
        'SELECT * FROM oauth_states WHERE state_token = $1 AND expires_at > NOW()',
        [token]
      );
      
      if (selectResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      await client.query(
        'DELETE FROM oauth_states WHERE state_token = $1',
        [token]
      );
      
      await client.query('COMMIT');
      return selectResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async cleanupExpired() {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM oauth_states WHERE expires_at <= NOW()'
    );
    return result.rowCount;
  }

  static async getActiveStates() {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) as active_count,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as recent_count
      FROM oauth_states 
      WHERE expires_at > NOW()
    `);
    return result.rows[0];
  }
}