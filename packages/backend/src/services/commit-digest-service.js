import { getPool } from './database.js';

/**
 * CommitDigestService - Handles storing and retrieving commit data for digest analysis
 * Phase 1: Database Foundation
 */
class CommitDigestService {
  constructor() {
    this.pool = null;
  }

  async initialize() {
    if (!this.pool) {
      this.pool = getPool();
    }
  }

  /**
   * Store commit data for digest analysis
   * Called from webhook after successful commit processing
   */
  async storeCommitData(commitData) {
    await this.initialize();
    
    const {
      repository,
      commitHash,
      authorFid,
      authorUsername,
      authorGithubUsername,
      commitMessage,
      commitUrl,
      rewardAmount = 0,
      commitTags = {},
      priorityLevel = 'normal',
      isPrivate = false
    } = commitData;

    try {
      const query = `
        INSERT INTO commit_digest_data (
          repository,
          commit_hash,
          author_fid,
          author_username,
          author_github_username,
          commit_message,
          commit_url,
          reward_amount,
          commit_tags,
          priority_level,
          is_private,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (commit_hash) DO UPDATE SET
          repository = EXCLUDED.repository,
          author_fid = EXCLUDED.author_fid,
          author_username = EXCLUDED.author_username,
          author_github_username = EXCLUDED.author_github_username,
          commit_message = EXCLUDED.commit_message,
          commit_url = EXCLUDED.commit_url,
          reward_amount = EXCLUDED.reward_amount,
          commit_tags = EXCLUDED.commit_tags,
          priority_level = EXCLUDED.priority_level,
          is_private = EXCLUDED.is_private
      `;

      const values = [
        repository,
        commitHash,
        authorFid,
        authorUsername,
        authorGithubUsername,
        commitMessage,
        commitUrl,
        rewardAmount,
        JSON.stringify(commitTags),
        priorityLevel,
        isPrivate
      ];

      const result = await this.pool.query(query, values);
      
      console.log(`✅ Stored commit data for digest: ${commitHash.substring(0, 8)} in ${repository}`);
      return result.rowCount > 0;
      
    } catch (error) {
      console.error('❌ Failed to store commit data for digest:', error.message);
      console.error('Commit data:', { repository, commitHash: commitHash?.substring(0, 8) });
      // Don't throw - digest storage failure shouldn't break commit processing
      return false;
    }
  }

  /**
   * Get commits for a specific date range
   * Used for digest generation
   */
  async getCommitsByDateRange(startDate, endDate) {
    await this.initialize();
    
    try {
      const query = `
        SELECT 
          id,
          repository,
          commit_hash,
          author_fid,
          author_username,
          author_github_username,
          commit_message,
          commit_url,
          reward_amount,
          commit_tags,
          priority_level,
          is_private,
          created_at
        FROM commit_digest_data
        WHERE created_at >= $1 AND created_at <= $2
        ORDER BY created_at DESC
      `;

      const result = await this.pool.query(query, [startDate, endDate]);
      
      console.log(`📊 Retrieved ${result.rows.length} commits for digest analysis (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);
      
      return result.rows.map(row => ({
        ...row,
        commit_tags: typeof row.commit_tags === 'string' ? JSON.parse(row.commit_tags) : row.commit_tags
      }));
      
    } catch (error) {
      console.error('❌ Failed to retrieve commits for date range:', error.message);
      throw error;
    }
  }

  /**
   * Get repository activity breakdown
   * Groups commits by repository with totals
   */
  async getRepositoryActivity(startDate, endDate) {
    await this.initialize();
    
    try {
      const query = `
        SELECT 
          repository,
          COUNT(*) as commit_count,
          SUM(reward_amount) as total_rewards,
          COUNT(DISTINCT author_fid) as unique_contributors,
          array_agg(DISTINCT author_username) FILTER (WHERE author_username IS NOT NULL) as contributors
        FROM commit_digest_data
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY repository
        ORDER BY commit_count DESC, total_rewards DESC
      `;

      const result = await this.pool.query(query, [startDate, endDate]);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Failed to get repository activity:', error.message);
      throw error;
    }
  }

  /**
   * Get top contributors for a date range
   * Ranked by commit count and reward amounts
   */
  async getTopContributors(startDate, endDate, limit = 10) {
    await this.initialize();
    
    try {
      const query = `
        SELECT 
          author_fid,
          author_username,
          author_github_username,
          COUNT(*) as commit_count,
          SUM(reward_amount) as total_rewards,
          array_agg(DISTINCT repository) as repositories,
          MIN(created_at) as first_commit,
          MAX(created_at) as latest_commit
        FROM commit_digest_data
        WHERE created_at >= $1 AND created_at <= $2
          AND author_fid IS NOT NULL
        GROUP BY author_fid, author_username, author_github_username
        ORDER BY commit_count DESC, total_rewards DESC
        LIMIT $3
      `;

      const result = await this.pool.query(query, [startDate, endDate, limit]);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Failed to get top contributors:', error.message);
      throw error;
    }
  }

  /**
   * Record a published digest post
   * Stores digest metadata and metrics
   */
  async recordDigestPost(digestData) {
    await this.initialize();
    
    const {
      digestType,
      periodStart,
      periodEnd,
      castHash,
      castUrl,
      totalCommits,
      totalRewards,
      uniqueContributors,
      repositoriesInvolved,
      topContributors,
      activityMetrics
    } = digestData;

    try {
      const query = `
        INSERT INTO digest_posts (
          digest_type,
          period_start,
          period_end,
          cast_hash,
          cast_url,
          total_commits,
          total_rewards,
          unique_contributors,
          repositories_involved,
          top_contributors,
          activity_metrics,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING id
      `;

      const values = [
        digestType,
        periodStart,
        periodEnd,
        castHash,
        castUrl,
        totalCommits,
        totalRewards,
        uniqueContributors,
        repositoriesInvolved,
        JSON.stringify(topContributors),
        JSON.stringify(activityMetrics)
      ];

      const result = await this.pool.query(query, values);
      
      console.log(`✅ Recorded ${digestType} digest post: ${castHash?.substring(0, 8)}`);
      return result.rows[0].id;
      
    } catch (error) {
      console.error('❌ Failed to record digest post:', error.message);
      throw error;
    }
  }

  /**
   * Get digest history
   * Returns previous digest posts for admin review
   */
  async getDigestHistory(limit = 20) {
    await this.initialize();
    
    try {
      const query = `
        SELECT 
          id,
          digest_type,
          period_start,
          period_end,
          cast_hash,
          cast_url,
          total_commits,
          total_rewards,
          unique_contributors,
          repositories_involved,
          top_contributors,
          activity_metrics,
          created_at
        FROM digest_posts
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const result = await this.pool.query(query, [limit]);
      
      return result.rows.map(row => ({
        ...row,
        top_contributors: typeof row.top_contributors === 'string' ? JSON.parse(row.top_contributors) : row.top_contributors,
        activity_metrics: typeof row.activity_metrics === 'string' ? JSON.parse(row.activity_metrics) : row.activity_metrics
      }));
      
    } catch (error) {
      console.error('❌ Failed to get digest history:', error.message);
      throw error;
    }
  }

  /**
   * Mark commits as processed for digest
   * Prevents duplicate processing in future digests
   */
  async markCommitsProcessed(commitIds) {
    await this.initialize();
    
    if (!commitIds || commitIds.length === 0) {
      return 0;
    }

    try {
      const query = `
        UPDATE commit_digest_data 
        SET processed_for_digest = true
        WHERE id = ANY($1::int[])
      `;

      const result = await this.pool.query(query, [commitIds]);
      
      console.log(`✅ Marked ${result.rowCount} commits as processed for digest`);
      return result.rowCount;
      
    } catch (error) {
      console.error('❌ Failed to mark commits as processed:', error.message);
      throw error;
    }
  }

  /**
   * Get digest statistics
   * Summary metrics for admin dashboard
   */
  async getDigestStats() {
    await this.initialize();
    
    try {
      const [commitsResult, digestsResult] = await Promise.all([
        this.pool.query(`
          SELECT 
            COUNT(*) as total_commits,
            COUNT(DISTINCT repository) as unique_repositories,
            COUNT(DISTINCT author_fid) as unique_contributors,
            SUM(reward_amount) as total_rewards,
            MAX(created_at) as latest_commit
          FROM commit_digest_data
        `),
        this.pool.query(`
          SELECT 
            COUNT(*) as total_digests,
            COUNT(*) FILTER (WHERE digest_type = 'weekly') as weekly_digests,
            COUNT(*) FILTER (WHERE digest_type = 'monthly') as monthly_digests,
            MAX(created_at) as latest_digest
          FROM digest_posts
        `)
      ]);

      return {
        commits: commitsResult.rows[0],
        digests: digestsResult.rows[0]
      };
      
    } catch (error) {
      console.error('❌ Failed to get digest statistics:', error.message);
      throw error;
    }
  }

  /**
   * Extract GitHub username from repository URL or commit URL
   * Helper method for data enrichment
   */
  extractGithubUsername(repository, commitUrl) {
    try {
      // Try to extract from repository name first (format: "username/repo")
      if (repository && repository.includes('/')) {
        const parts = repository.split('/');
        if (parts.length >= 2) {
          return parts[0];
        }
      }

      // Try to extract from commit URL
      if (commitUrl) {
        const urlMatch = commitUrl.match(/github\.com\/([^\/]+)/);
        if (urlMatch) {
          return urlMatch[1];
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to extract GitHub username:', error.message);
      return null;
    }
  }
}

export { CommitDigestService };
export default CommitDigestService;