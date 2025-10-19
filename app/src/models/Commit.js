import { getPool } from '../services/database.js';

export class Commit {
  static async create(commitData) {
    const pool = getPool();
    const {
      user_id,
      commit_hash,
      repository,
      commit_message,
      commit_url,
      reward_amount,
      cast_url = null
    } = commitData;

    const result = await pool.query(`
      INSERT INTO commits (
        user_id, commit_hash, repository, commit_message, 
        commit_url, reward_amount, cast_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [user_id, commit_hash, repository, commit_message, commit_url, reward_amount, cast_url]);

    return result.rows[0];
  }

  static async findByHash(commitHash) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM commits WHERE commit_hash = $1',
      [commitHash]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT * FROM commits 
      WHERE user_id = $1
      ORDER BY processed_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return result.rows;
  }

  static async updateCastUrl(id, castUrl) {
    const pool = getPool();
    const result = await pool.query(`
      UPDATE commits 
      SET cast_url = $2
      WHERE id = $1
      RETURNING *
    `, [id, castUrl]);

    return result.rows[0];
  }

  static async getUserCommitStats(userId, days = 30) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_commits,
        SUM(reward_amount) as total_rewards,
        COUNT(CASE WHEN processed_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_commits,
        SUM(CASE WHEN processed_at >= NOW() - INTERVAL '${days} days' THEN reward_amount ELSE 0 END) as recent_rewards,
        COUNT(DISTINCT repository) as unique_repos,
        MAX(processed_at) as last_commit_at
      FROM commits 
      WHERE user_id = $1
    `, [userId]);

    return result.rows[0];
  }

  static async getDailyCommitCounts(days = 30) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        DATE(processed_at) as date,
        COUNT(*) as commit_count,
        COUNT(DISTINCT user_id) as active_users,
        SUM(reward_amount) as total_rewards,
        COUNT(DISTINCT repository) as unique_repos
      FROM commits 
      WHERE processed_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(processed_at)
      ORDER BY date DESC
    `);

    return result.rows;
  }

  static async getTopRepositories(limit = 20, days = 30) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        repository,
        COUNT(*) as commit_count,
        COUNT(DISTINCT user_id) as contributor_count,
        SUM(reward_amount) as total_rewards,
        MAX(processed_at) as last_commit_at
      FROM commits 
      WHERE processed_at >= NOW() - INTERVAL '${days} days'
      GROUP BY repository
      ORDER BY commit_count DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  static async getTopContributors(limit = 20, days = 30) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        c.user_id,
        u.farcaster_username,
        u.github_username,
        COUNT(*) as commit_count,
        SUM(c.reward_amount) as total_rewards,
        COUNT(DISTINCT c.repository) as repo_count,
        MAX(c.processed_at) as last_commit_at
      FROM commits c
      JOIN users u ON c.user_id = u.id
      WHERE c.processed_at >= NOW() - INTERVAL '${days} days'
        AND u.membership_status = 'active'
      GROUP BY c.user_id, u.farcaster_username, u.github_username
      ORDER BY commit_count DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  static async getRecentCommits(limit = 100) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        c.*,
        u.farcaster_username,
        u.github_username
      FROM commits c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.processed_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  static async getCommitsByRepository(repository, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        c.*,
        u.farcaster_username,
        u.github_username
      FROM commits c
      JOIN users u ON c.user_id = u.id
      WHERE c.repository = $1
      ORDER BY c.processed_at DESC
      LIMIT $2 OFFSET $3
    `, [repository, limit, offset]);

    return result.rows;
  }

  static async getSystemStats() {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_commits,
        COUNT(DISTINCT user_id) as unique_contributors,
        COUNT(DISTINCT repository) as unique_repositories,
        SUM(reward_amount) as total_rewards_distributed,
        COUNT(CASE WHEN processed_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as commits_24h,
        COUNT(CASE WHEN processed_at >= NOW() - INTERVAL '7 days' THEN 1 END) as commits_7d,
        COUNT(CASE WHEN processed_at >= NOW() - INTERVAL '30 days' THEN 1 END) as commits_30d
      FROM commits
    `);

    return result.rows[0];
  }
}