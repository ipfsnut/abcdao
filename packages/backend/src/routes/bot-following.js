/**
 * Bot Following Routes
 * 
 * API endpoints for managing the bot's following automation
 * - Manual trigger following process
 * - View following statistics
 * - Get list of followed users
 */

import express from 'express';
import { botFollowingService } from '../services/bot-following-service.js';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * GET /api/bot-following/stats
 * Get bot following statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await botFollowingService.getStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get bot following stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bot-following/history
 * Get history of bot follows with pagination
 */
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status; // Filter by status
    
    const pool = await getPool();
    
    let query = `
      SELECT 
        bf.target_fid,
        bf.target_username,
        bf.follow_status,
        bf.followed_at,
        bf.retry_count,
        bf.error_message,
        bf.created_at,
        u.github_username,
        u.display_name
      FROM bot_follows bf
      LEFT JOIN users u ON bf.target_fid = u.farcaster_fid
    `;
    
    const params = [];
    
    if (status) {
      query += ` WHERE bf.follow_status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY bf.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM bot_follows bf`;
    const countParams = [];
    
    if (status) {
      countQuery += ` WHERE bf.follow_status = $1`;
      countParams.push(status);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      follows: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrevious: page > 1
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get bot following history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/bot-following/trigger
 * Manually trigger the bot following process
 * Requires admin authentication
 */
router.post('/trigger', async (req, res) => {
  try {
    // Admin authentication check
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    console.log('🔧 Manual bot following trigger requested');
    const result = await botFollowingService.executeFollowingProcess();
    
    res.json({
      success: true,
      message: 'Bot following process executed',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to trigger bot following:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bot-following/members-to-follow
 * Preview which members would be followed next
 */
router.get('/members-to-follow', async (req, res) => {
  try {
    await botFollowingService.initialize();
    const members = await botFollowingService.findMembersToFollow();
    const retryable = await botFollowingService.findRetryableFollows();
    
    res.json({
      success: true,
      newMembers: members,
      retryableFollows: retryable,
      summary: {
        newMembersCount: members.length,
        retryableCount: retryable.length,
        totalToProcss: members.length + retryable.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get members to follow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/bot-following/:fid
 * Manually unfollow a user and update tracking
 * Requires admin authentication
 */
router.delete('/:fid', async (req, res) => {
  try {
    // Admin authentication check
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const fid = parseInt(req.params.fid);
    
    if (!fid || fid <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid FID'
      });
    }
    
    // TODO: Implement unfollow functionality via Neynar API
    // For now, just update the database status
    const pool = await getPool();
    const query = `
      UPDATE bot_follows 
      SET 
        follow_status = 'unfollowed',
        updated_at = NOW()
      WHERE target_fid = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [fid]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'FID not found in follows'
      });
    }
    
    res.json({
      success: true,
      message: `Marked FID ${fid} as unfollowed`,
      follow: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to unfollow user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;