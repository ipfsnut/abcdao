import express from 'express';
import { ActionProcessorFactory } from '../services/action-processor.js';
import { StakingActionProcessor } from '../services/staking-action-processor.js';
import { CommitActionProcessor } from '../services/commit-action-processor.js';
import { RealtimeBroadcastManager } from '../services/realtime-broadcast.js';
import { getVerificationService } from '../services/blockchain-verification.js';

const router = express.Router();

// Register action processors
ActionProcessorFactory.register('stake', StakingActionProcessor);
ActionProcessorFactory.register('unstake', StakingActionProcessor);
ActionProcessorFactory.register('claim', StakingActionProcessor);
ActionProcessorFactory.register('commit', CommitActionProcessor);

/**
 * Process any user action
 * POST /api/user-actions/process
 */
router.post('/process', async (req, res) => {
  try {
    const { type, userWallet, data, txHash } = req.body;

    // Validate required fields
    if (!type || !userWallet || !data) {
      return res.status(400).json({
        error: 'Missing required fields: type, userWallet, data'
      });
    }

    // Validate action type
    const validTypes = ActionProcessorFactory.getRegisteredTypes();
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid action type. Valid types: ${validTypes.join(', ')}`
      });
    }

    // Process the action
    const result = await ActionProcessorFactory.process({
      type,
      userWallet,
      data,
      txHash
    });

    res.json({
      success: true,
      actionId: result.actionId,
      data: result.data
    });

  } catch (error) {
    console.error('Action processing error:', error);
    res.status(500).json({
      error: 'Failed to process action',
      details: error.message
    });
  }
});

/**
 * Process staking action (stake/unstake/claim)
 * POST /api/user-actions/staking
 */
router.post('/staking', async (req, res) => {
  try {
    const { action, userWallet, amount, txHash } = req.body;

    if (!action || !userWallet || !amount || !txHash) {
      return res.status(400).json({
        error: 'Missing required fields: action, userWallet, amount, txHash'
      });
    }

    if (!['stake', 'unstake', 'claim'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid staking action. Must be: stake, unstake, or claim'
      });
    }

    const result = await ActionProcessorFactory.process({
      type: action,
      userWallet,
      data: { amount: parseFloat(amount) },
      txHash
    });

    res.json({
      success: true,
      actionId: result.actionId,
      userPosition: result.data.userPosition,
      globalMetrics: result.data.globalMetrics,
      apyData: result.data.apyData
    });

  } catch (error) {
    console.error('Staking action error:', error);
    res.status(500).json({
      error: 'Failed to process staking action',
      details: error.message
    });
  }
});

/**
 * Process commit action
 * POST /api/user-actions/commit
 */
router.post('/commit', async (req, res) => {
  try {
    const {
      commitHash,
      userWallet,
      repository,
      commitMessage,
      githubUsername,
      commitUrl,
      tags = [],
      priority = 'normal'
    } = req.body;

    if (!commitHash || !userWallet || !repository || !commitMessage || !githubUsername) {
      return res.status(400).json({
        error: 'Missing required fields: commitHash, userWallet, repository, commitMessage, githubUsername'
      });
    }

    const processor = new CommitActionProcessor();
    const result = await processor.processCommit({
      commitHash,
      authorWallet: userWallet,
      repository,
      commitMessage,
      githubUsername,
      commitUrl,
      tags,
      priority
    });

    res.json({
      success: true,
      actionId: result.actionId,
      commit: result.data.commit,
      user: result.data.user,
      rewardAmount: result.data.rewardAmount,
      leaderboard: result.data.leaderboard
    });

  } catch (error) {
    console.error('Commit action error:', error);
    res.status(500).json({
      error: 'Failed to process commit action',
      details: error.message
    });
  }
});

/**
 * Get user's action history
 * GET /api/user-actions/history/:userWallet
 */
router.get('/history/:userWallet', async (req, res) => {
  try {
    const { userWallet } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const pool = req.app.get('pool');
    const result = await pool.query(`
      SELECT 
        ua.*,
        CASE 
          WHEN ua.blockchain_verified = true THEN 'verified'
          WHEN ua.tx_hash IS NOT NULL THEN 'pending_verification'
          ELSE 'completed'
        END as verification_status
      FROM user_actions ua
      WHERE ua.user_wallet = $1
      ORDER BY ua.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userWallet, limit, offset]);

    res.json({
      actions: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Action history error:', error);
    res.status(500).json({
      error: 'Failed to get action history',
      details: error.message
    });
  }
});

/**
 * Get action details by ID
 * GET /api/user-actions/:actionId
 */
router.get('/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;

    const pool = req.app.get('pool');
    const result = await pool.query(`
      SELECT 
        ua.*,
        vq.status as verification_status,
        vq.attempts as verification_attempts,
        vq.error_message as verification_error
      FROM user_actions ua
      LEFT JOIN verification_queue vq ON ua.id = vq.action_id
      WHERE ua.id = $1
    `, [actionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Action not found'
      });
    }

    res.json({
      action: result.rows[0]
    });

  } catch (error) {
    console.error('Action details error:', error);
    res.status(500).json({
      error: 'Failed to get action details',
      details: error.message
    });
  }
});

/**
 * Get current staking overview (optimized for real-time updates)
 * GET /api/user-actions/staking/overview
 */
router.get('/staking/overview', async (req, res) => {
  try {
    const processor = new StakingActionProcessor();
    const overview = await processor.getStakingOverview();

    res.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('Staking overview error:', error);
    res.status(500).json({
      error: 'Failed to get staking overview',
      details: error.message
    });
  }
});

/**
 * Get user's staking position
 * GET /api/user-actions/staking/position/:userWallet
 */
router.get('/staking/position/:userWallet', async (req, res) => {
  try {
    const { userWallet } = req.params;
    const processor = new StakingActionProcessor();
    const position = await processor.getUserPosition(userWallet);

    res.json({
      success: true,
      position: position
    });

  } catch (error) {
    console.error('Staking position error:', error);
    res.status(500).json({
      error: 'Failed to get staking position',
      details: error.message
    });
  }
});

/**
 * Get user's recent commits
 * GET /api/user-actions/commits/:userWallet
 */
router.get('/commits/:userWallet', async (req, res) => {
  try {
    const { userWallet } = req.params;
    const { limit = 20 } = req.query;
    
    const processor = new CommitActionProcessor();
    const commits = await processor.getUserCommits(userWallet, parseInt(limit));

    res.json({
      success: true,
      commits: commits
    });

  } catch (error) {
    console.error('User commits error:', error);
    res.status(500).json({
      error: 'Failed to get user commits',
      details: error.message
    });
  }
});

/**
 * Check user's daily commit limit
 * GET /api/user-actions/commits/daily-limit/:userWallet
 */
router.get('/commits/daily-limit/:userWallet', async (req, res) => {
  try {
    const { userWallet } = req.params;
    
    const processor = new CommitActionProcessor();
    const limitInfo = await processor.checkDailyLimit(userWallet);

    res.json({
      success: true,
      dailyLimit: limitInfo
    });

  } catch (error) {
    console.error('Daily limit check error:', error);
    res.status(500).json({
      error: 'Failed to check daily limit',
      details: error.message
    });
  }
});

/**
 * Get real-time connection statistics
 * GET /api/user-actions/realtime/stats
 */
router.get('/realtime/stats', (req, res) => {
  try {
    const broadcaster = RealtimeBroadcastManager.getInstance();
    const stats = broadcaster.getStats();

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Realtime stats error:', error);
    res.status(500).json({
      error: 'Failed to get realtime stats',
      details: error.message
    });
  }
});

/**
 * Send test message to all connected clients
 * POST /api/user-actions/realtime/test
 */
router.post('/realtime/test', async (req, res) => {
  try {
    const { message = 'Test message from server' } = req.body;
    
    const broadcaster = RealtimeBroadcastManager.getInstance();
    const result = await broadcaster.sendTestMessage(message);

    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed
    });

  } catch (error) {
    console.error('Test message error:', error);
    res.status(500).json({
      error: 'Failed to send test message',
      details: error.message
    });
  }
});

/**
 * Get verification service statistics
 * GET /api/user-actions/verification/stats
 */
router.get('/verification/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const verificationService = getVerificationService();
    const stats = await verificationService.getVerificationStats(parseInt(days));

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Verification stats error:', error);
    res.status(500).json({
      error: 'Failed to get verification stats',
      details: error.message
    });
  }
});

/**
 * Get failed verifications
 * GET /api/user-actions/verification/failed
 */
router.get('/verification/failed', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const verificationService = getVerificationService();
    const failed = await verificationService.getFailedVerifications(parseInt(limit));

    res.json({
      success: true,
      failedVerifications: failed
    });

  } catch (error) {
    console.error('Failed verifications error:', error);
    res.status(500).json({
      error: 'Failed to get failed verifications',
      details: error.message
    });
  }
});

/**
 * Retry a failed verification
 * POST /api/user-actions/verification/retry/:verificationId
 */
router.post('/verification/retry/:verificationId', async (req, res) => {
  try {
    const { verificationId } = req.params;
    
    const verificationService = getVerificationService();
    await verificationService.retryVerification(parseInt(verificationId));

    res.json({
      success: true,
      message: 'Verification retry scheduled'
    });

  } catch (error) {
    console.error('Verification retry error:', error);
    res.status(500).json({
      error: 'Failed to retry verification',
      details: error.message
    });
  }
});

export default router;