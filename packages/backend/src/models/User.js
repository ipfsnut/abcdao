import { getPool } from '../services/database.js';

export class User {
  static async findByFarcasterFid(fid) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE farcaster_fid = $1',
      [fid]
    );
    return result.rows[0] || null;
  }

  static async findByGithubUsername(username) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE github_username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(userData) {
    const pool = getPool();
    const {
      farcaster_fid,
      farcaster_username,
      github_username = null,
      github_id = null,
      wallet_address = null,
      access_token = null
    } = userData;

    const result = await pool.query(`
      INSERT INTO users (
        farcaster_fid, farcaster_username, github_username, 
        github_id, wallet_address, access_token
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [farcaster_fid, farcaster_username, github_username, github_id, wallet_address, access_token]);

    return result.rows[0];
  }

  static async updateGithubInfo(userId, githubData) {
    const pool = getPool();
    const { username, id, access_token } = githubData;

    const result = await pool.query(`
      UPDATE users 
      SET github_username = $2, github_id = $3, access_token = $4, 
          verified_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [userId, username, id, access_token]);

    return result.rows[0];
  }

  static async updateMembershipStatus(userId, membershipData) {
    const pool = getPool();
    const { tx_hash, amount, status = 'active' } = membershipData;

    const result = await pool.query(`
      UPDATE users 
      SET membership_status = $2, membership_paid_at = NOW(), 
          membership_tx_hash = $3, membership_amount = $4, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [userId, status, tx_hash, amount]);

    return result.rows[0];
  }

  static async incrementCommitStats(userId, rewardAmount) {
    const pool = getPool();
    
    const result = await pool.query(`
      UPDATE users 
      SET total_commits = total_commits + 1,
          total_rewards_earned = total_rewards_earned + $2,
          last_commit_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [userId, rewardAmount]);

    return result.rows[0];
  }

  static async getMembershipStats() {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN membership_status = 'active' THEN 1 END) as paid_members,
        SUM(CASE WHEN membership_status = 'active' THEN membership_amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `);

    return result.rows[0];
  }

  static async getActiveMembers(limit = 100, offset = 0) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        id, farcaster_fid, farcaster_username, github_username,
        membership_status, membership_paid_at, total_commits,
        total_rewards_earned, last_commit_at, created_at
      FROM users 
      WHERE membership_status = 'active'
      ORDER BY total_commits DESC, created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return result.rows;
  }

  static async searchUsers(query, limit = 20) {
    const pool = getPool();
    const searchTerm = `%${query}%`;
    
    const result = await pool.query(`
      SELECT 
        id, farcaster_fid, farcaster_username, github_username,
        membership_status, total_commits, total_rewards_earned
      FROM users 
      WHERE 
        farcaster_username ILIKE $1 OR 
        github_username ILIKE $1
      ORDER BY 
        CASE WHEN membership_status = 'active' THEN 0 ELSE 1 END,
        total_commits DESC
      LIMIT $2
    `, [searchTerm, limit]);

    return result.rows;
  }
}