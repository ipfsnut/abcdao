import express from 'express';
import commitTagParser from '../services/commit-tags.js';

const router = express.Router();

// Get supported commit tags documentation
router.get('/tags', (req, res) => {
  try {
    const supportedTags = commitTagParser.getSupportedTags();
    const helpText = commitTagParser.getHelpText();
    
    res.json({
      status: 'success',
      tags: supportedTags,
      help: helpText,
      examples: [
        {
          commit: 'fix: update database schema #silent',
          description: 'Fix with no cast announcement'
        },
        {
          commit: 'feat: add user profiles #milestone',
          description: 'Feature marked as milestone achievement'
        },
        {
          commit: 'experiment: try new algorithm #experiment #private',
          description: 'Experimental work kept private'
        },
        {
          commit: 'taking a break for a few days #devoff',
          description: 'Disable dev status temporarily'
        },
        {
          commit: 'back to coding! #devon',
          description: 'Re-enable dev status'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get tag documentation',
      error: error.message
    });
  }
});

// Parse a commit message (for testing)
router.post('/parse', (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Commit message required'
      });
    }
    
    const parsed = commitTagParser.parseCommitMessage(message);
    
    res.json({
      status: 'success',
      parsed
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to parse commit message',
      error: error.message
    });
  }
});

// Get user's dev status
router.get('/dev-status/:farcaster_username', async (req, res) => {
  try {
    const { farcaster_username } = req.params;
    const { getPool } = await import('../services/database.js');
    const pool = getPool();
    
    const result = await pool.query(
      'SELECT farcaster_username, is_active, updated_at FROM users WHERE farcaster_username = $1',
      [farcaster_username]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    const user = result.rows[0];
    
    res.json({
      status: 'success',
      user: {
        username: user.farcaster_username,
        isActive: user.is_active,
        lastUpdated: user.updated_at
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get dev status',
      error: error.message
    });
  }
});

export default router;