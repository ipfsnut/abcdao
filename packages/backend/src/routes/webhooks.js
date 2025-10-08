import express from 'express';
import crypto from 'crypto';
import { Webhooks } from '@octokit/webhooks';
import { getPool } from '../services/database.js';
import { addRewardJob } from '../services/queue.js';

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
    }
    
    res.status(200).json({ status: 'received' });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handlePushEvent(payload) {
  const { repository, pusher, commits } = payload;
  
  // Skip if no commits or if it's a private repo
  if (!commits || commits.length === 0 || repository.private) {
    return;
  }
  
  const pool = getPool();
  
  // Look up user by GitHub username
  const userResult = await pool.query(
    'SELECT * FROM users WHERE github_username = $1 AND verified_at IS NOT NULL',
    [pusher.name]
  );
  
  if (userResult.rows.length === 0) {
    console.log(`⚠️ Push from unregistered user: ${pusher.name}`);
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
    
  } catch (error) {
    console.error('Error processing commit:', error);
    throw error;
  }
}

// Test endpoint for development
if (process.env.NODE_ENV === 'development') {
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
}

export default router;