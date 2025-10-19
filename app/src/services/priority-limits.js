/**
 * Priority Tag Limits Service
 * 
 * Manages weekly limits for priority and milestone tags to prevent abuse.
 * Each user can use priority/milestone tags on up to 5 commits per week.
 */

import { getPool } from './database.js';

class PriorityLimitsService {
  constructor() {
    this.WEEKLY_LIMIT = 5; // Max priority/milestone commits per week
  }

  /**
   * Check if user can use priority tags (priority or milestone)
   * @param {number} userId - User ID
   * @returns {Promise<{canUse: boolean, used: number, remaining: number, resetDate: string}>}
   */
  async checkPriorityLimit(userId) {
    try {
      const pool = getPool();
      
      // Get start of current week (Monday)
      const now = new Date();
      const mondayOfThisWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
      mondayOfThisWeek.setDate(now.getDate() + daysToMonday);
      mondayOfThisWeek.setHours(0, 0, 0, 0);

      // Calculate next Monday (reset date)
      const nextMonday = new Date(mondayOfThisWeek);
      nextMonday.setDate(mondayOfThisWeek.getDate() + 7);

      // Count priority/milestone commits this week
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM commits 
        WHERE user_id = $1 
          AND created_at >= $2 
          AND (priority = 'high' OR priority = 'milestone')
      `, [userId, mondayOfThisWeek.toISOString()]);

      const used = parseInt(result.rows[0].count) || 0;
      const remaining = Math.max(0, this.WEEKLY_LIMIT - used);
      const canUse = remaining > 0;

      return {
        canUse,
        used,
        remaining,
        limit: this.WEEKLY_LIMIT,
        resetDate: nextMonday.toISOString(),
        weekStart: mondayOfThisWeek.toISOString()
      };
    } catch (error) {
      console.error('Error checking priority limit:', error);
      // Fail open - allow usage if we can't check
      return {
        canUse: true,
        used: 0,
        remaining: this.WEEKLY_LIMIT,
        limit: this.WEEKLY_LIMIT,
        resetDate: new Date().toISOString(),
        weekStart: new Date().toISOString()
      };
    }
  }

  /**
   * Record usage of a priority tag
   * @param {number} userId - User ID
   * @param {string} commitHash - Commit hash
   * @param {string} tagType - 'priority' or 'milestone'
   * @returns {Promise<boolean>} Success
   */
  async recordPriorityUsage(userId, commitHash, tagType) {
    try {
      const pool = getPool();
      
      // Insert or update usage record
      await pool.query(`
        INSERT INTO priority_tag_usage (user_id, commit_hash, tag_type, used_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, commit_hash) DO UPDATE SET
          tag_type = EXCLUDED.tag_type,
          used_at = NOW()
      `, [userId, commitHash, tagType]);

      return true;
    } catch (error) {
      console.error('Error recording priority usage:', error);
      return false;
    }
  }

  /**
   * Get user's priority tag usage stats
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Usage statistics
   */
  async getUserPriorityStats(userId) {
    try {
      const pool = getPool();
      
      // Get current week limits
      const currentWeek = await this.checkPriorityLimit(userId);
      
      // Get all-time usage
      const allTimeResult = await pool.query(`
        SELECT 
          COUNT(*) as total_used,
          COUNT(CASE WHEN tag_type = 'priority' THEN 1 END) as priority_count,
          COUNT(CASE WHEN tag_type = 'milestone' THEN 1 END) as milestone_count
        FROM priority_tag_usage 
        WHERE user_id = $1
      `, [userId]);

      const allTimeStats = allTimeResult.rows[0] || {
        total_used: 0,
        priority_count: 0,
        milestone_count: 0
      };

      return {
        currentWeek,
        allTime: {
          totalUsed: parseInt(allTimeStats.total_used) || 0,
          priorityCount: parseInt(allTimeStats.priority_count) || 0,
          milestoneCount: parseInt(allTimeStats.milestone_count) || 0
        }
      };
    } catch (error) {
      console.error('Error getting priority stats:', error);
      return {
        currentWeek: await this.checkPriorityLimit(userId),
        allTime: { totalUsed: 0, priorityCount: 0, milestoneCount: 0 }
      };
    }
  }

  /**
   * Clean up old usage records (older than 8 weeks)
   * @returns {Promise<number>} Number of records cleaned up
   */
  async cleanupOldRecords() {
    try {
      const pool = getPool();
      
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56); // 8 weeks

      const result = await pool.query(`
        DELETE FROM priority_tag_usage 
        WHERE used_at < $1
      `, [eightWeeksAgo.toISOString()]);

      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up old records:', error);
      return 0;
    }
  }
}

export default new PriorityLimitsService();