import express from 'express';
import crypto from 'crypto';
import { Webhooks } from '@octokit/webhooks';
import dotenv from 'dotenv';
import { getPool } from '../services/database.js';
import { addRewardJob } from '../services/queue.js';
import farcasterService from '../services/farcaster.js';

// Ensure dotenv is loaded
dotenv.config();

const router = express.Router();

// Initialize GitHub webhooks handler
const webhooks = process.env.GITHUB_WEBHOOK_SECRET ? new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET
}) : null;

// Middleware to verify GitHub webhook signature
function verifyGitHubSignature(req, res, next) {
  if (!webhooks) {
    return res.status(503).json({ error: 'Webhooks not configured' });
  }
  
  const signature = req.get('X-Hub-Signature-256');
  const payload = JSON.stringify(req.body);
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex');
  
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
}

// GitHub webhook endpoint
router.post('/github', verifyGitHubSignature, async (req, res) => {
  const event = req.get('X-GitHub-Event');
  const payload = req.body;
  
  try {
    if (event === 'push') {
      await handlePushEvent(payload);
    } else if (event === 'pull_request') {
      await handlePullRequestEvent(payload);
    }
    
    res.status(200).json({ status: 'received' });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handlePushEvent(payload) {
  const { repository, pusher, commits } = payload;
  
  // Debug logging to see what GitHub sends
  console.log('🔍 DEBUG: Webhook payload received:');
  console.log('Repository:', repository?.name, repository?.full_name);
  console.log('Pusher:', JSON.stringify(pusher, null, 2));
  console.log('Commits:', commits?.length, 'commits');
  
  // Skip if no commits or if it's a private repo
  if (!commits || commits.length === 0 || repository.private) {
    console.log('⚠️ Skipping: No commits or private repo');
    return;
  }
  
  const pool = getPool();
  
  // Try multiple fields for GitHub username
  const githubUsername = pusher?.name || pusher?.login || pusher?.username;
  console.log('🔍 Looking for user with GitHub username:', githubUsername);
  
  // Look up user by GitHub username
  const userResult = await pool.query(
    'SELECT * FROM users WHERE github_username = $1 AND verified_at IS NOT NULL',
    [githubUsername]
  );
  
  if (userResult.rows.length === 0) {
    console.log(`⚠️ Push from unregistered user: ${githubUsername}`);
    return;
  }
  
  const user = userResult.rows[0];
  
  // Process each commit
  for (const commit of commits) {
    await processCommit(user, repository, commit);
  }
}

async function processCommit(user, repository, commit) {
  const pool = getPool();
  
  try {
    // Check if commit already processed
    const existingCommit = await pool.query(
      'SELECT id FROM commits WHERE commit_hash = $1',
      [commit.id]
    );
    
    if (existingCommit.rows.length > 0) {
      console.log(`⚠️ Commit ${commit.id} already processed`);
      return;
    }
    
    // Check daily limit (10 commits per day)
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = await pool.query(`
      SELECT commit_count FROM daily_stats 
      WHERE user_id = $1 AND date = $2
    `, [user.id, today]);
    
    const currentCount = dailyStats.rows[0]?.commit_count || 0;
    
    if (currentCount >= 10) {
      console.log(`⚠️ Daily limit reached for user ${user.farcaster_username}`);
      return;
    }
    
    // Insert commit record (reward will be set when processed)
    await pool.query(`
      INSERT INTO commits (user_id, commit_hash, repository, commit_message, commit_url)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      user.id,
      commit.id,
      repository.full_name,
      commit.message,
      commit.url
    ]);
    
    console.log(`✅ Recorded commit ${commit.id} for ${user.farcaster_username}`);
    
    // Add to reward processing queue
    await addRewardJob({
      userId: user.id,
      commitHash: commit.id,
      farcasterUsername: user.farcaster_username,
      farcasterFid: user.farcaster_fid,
      repository: repository.full_name,
      commitMessage: commit.message,
      commitUrl: commit.url
    });
    
    // Note: Farcaster announcements are now handled by the queue system
    // The cast will be posted after reward processing is complete
    
  } catch (error) {
    console.error('Error processing commit:', error);
    throw error;
  }
}

// Test endpoint for development  
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  router.post('/test', async (req, res) => {
    try {
      // Simulate a commit for testing
      const testPayload = {
        repository: { 
          full_name: 'test/repo',
          private: false 
        },
        pusher: { name: 'testuser' },
        commits: [{
          id: 'test-commit-' + Date.now(),
          message: 'Test commit for ABC DAO',
          url: 'https://github.com/test/repo/commit/test'
        }]
      };
      
      await handlePushEvent(testPayload);
      res.json({ status: 'Test webhook processed' });
      
    } catch (error) {
      console.error('Test webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin endpoint to manually add user for testing
  router.post('/add-test-user', async (req, res) => {
    try {
      const pool = getPool();
      
      // Insert test user (ipfsnut with FID 8573)
      const result = await pool.query(`
        INSERT INTO users (
          farcaster_fid, 
          farcaster_username, 
          github_username, 
          verified_at
        ) VALUES ($1, $2, $3, NOW())
        ON CONFLICT (farcaster_fid) DO UPDATE SET
          github_username = EXCLUDED.github_username,
          verified_at = NOW()
        RETURNING *
      `, [8573, 'ipfsnut', 'ipfsnut']);
      
      res.json({ 
        status: 'Test user added/updated', 
        user: result.rows[0] 
      });
      
    } catch (error) {
      console.error('Add test user error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

async function handlePullRequestEvent(payload) {
  const { action, pull_request } = payload;
  
  // Only process merged PRs
  if (action !== 'closed' || !pull_request.merged) {
    return;
  }
  
  const pool = getPool();
  
  // Look up user by GitHub username
  const userResult = await pool.query(
    'SELECT * FROM users WHERE github_username = $1 AND verified_at IS NOT NULL',
    [pull_request.user.login]
  );
  
  if (userResult.rows.length === 0) {
    console.log(`⚠️ PR merged by unregistered user: ${pull_request.user.login}`);
    return;
  }
  
  const user = userResult.rows[0];
  
  // Use Farcaster service for PR announcements (higher rewards)
  if (farcasterService.isConfigured()) {
    try {
      const prReward = 500; // Higher reward for merged PRs
      await farcasterService.announcePRMerged(
        user.github_username,
        pull_request.title,
        pull_request.html_url,
        prReward
      );
      
      console.log(`✅ Announced PR merge for ${user.farcaster_username}`);
    } catch (error) {
      console.error('Failed to announce PR merge:', error.message);
    }
  }
}

export default router;