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
    
    // Try queue system, fall back to direct processing if Redis unavailable
    try {
      await addRewardJob({
        userId: user.id,
        commitHash: commit.id,
        farcasterUsername: user.farcaster_username,
        farcasterFid: user.farcaster_fid,
        repository: repository.full_name,
        commitMessage: commit.message,
        commitUrl: commit.url
      });
      console.log(`✅ Added commit ${commit.id} to reward queue`);
    } catch (queueError) {
      console.log(`⚠️ Queue unavailable, processing directly:`, queueError.message);
      
      // Process reward directly without queue
      await processRewardDirectly({
        userId: user.id,
        commitHash: commit.id,
        farcasterUsername: user.farcaster_username,
        farcasterFid: user.farcaster_fid,
        repository: repository.full_name,
        commitMessage: commit.message,
        commitUrl: commit.url
      });
    }
    
  } catch (error) {
    console.error('Error processing commit:', error);
    throw error;
  }
}

// Direct reward processing when queue is unavailable
async function processRewardDirectly(commitData) {
  const { userId, commitHash, farcasterUsername, farcasterFid, repository, commitMessage, commitUrl } = commitData;
  
  try {
    console.log(`🏗️ Processing reward directly for commit ${commitHash} by ${farcasterUsername}`);
    
    // Generate reward amount (10 ABC for now)
    const rewardAmount = 10;
    
    // Update commit record with reward amount
    const pool = getPool();
    await pool.query(`
      UPDATE commits 
      SET reward_amount = $1, processed_at = NOW()
      WHERE commit_hash = $2
    `, [rewardAmount, commitHash]);
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    await pool.query(`
      INSERT INTO daily_stats (user_id, date, commit_count, total_rewards)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (user_id, date)
      DO UPDATE SET 
        commit_count = daily_stats.commit_count + 1,
        total_rewards = daily_stats.total_rewards + $3
    `, [userId, today, rewardAmount]);
    
    console.log(`✅ Awarded ${rewardAmount} ABC to ${farcasterUsername}`);
    
    // Post Farcaster cast directly
    await postCommitCast({
      farcasterUsername,
      farcasterFid,
      repository,
      commitMessage: commitMessage.slice(0, 100),
      commitUrl,
      rewardAmount,
      commitHash
    });
    
    return { success: true, rewardAmount };
    
  } catch (error) {
    console.error(`❌ Direct reward processing failed for ${commitHash}:`, error);
    throw error;
  }
}

// Direct Farcaster posting when queue is unavailable
async function postCommitCast(castData) {
  const { farcasterUsername, farcasterFid, repository, commitMessage, commitUrl, rewardAmount, commitHash } = castData;
  
  try {
    console.log(`📢 Posting cast directly for ${farcasterUsername}'s commit`);
    
    if (!process.env.NEYNAR_API_KEY || !process.env.NEYNAR_SIGNER_UUID) {
      console.log(`⚠️ Farcaster credentials not configured, skipping cast`);
      return;
    }
    
    // Initialize Neynar client
    const { NeynarAPIClient } = await import('@neynar/nodejs-sdk');
    const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    
    // Create cast message
    const repoName = repository.split('/').pop() || repository;
    const cleanMessage = commitMessage
      .replace(/^(feat|fix|docs|style|refactor|test|chore|build|ci|perf)(\(.+?\))?:\s*/i, '')
      .split('\n')[0]
      .trim();
    
    const castText = `🚀 New commit!\n\n@${farcasterUsername} just pushed to ${repoName}:\n\n"${cleanMessage}"\n\n💰 Earned: ${rewardAmount} $ABC\n\n🔗 ${commitUrl}\n\n#ABCDao #AlwaysBeCoding`;
    
    // Post cast
    const cast = await neynar.publishCast(
      process.env.NEYNAR_SIGNER_UUID,
      castText
    );
    
    // Update commit record with cast URL
    const pool = getPool();
    await pool.query(`
      UPDATE commits 
      SET cast_url = $1
      WHERE commit_hash = $2
    `, [cast.cast.hash, commitHash]);
    
    console.log(`✅ Posted cast: ${cast.cast.hash}`);
    
    return { success: true, castHash: cast.cast.hash };
    
  } catch (error) {
    console.error(`❌ Cast posting failed:`, error.message);
    // Don't throw - cast failure shouldn't break reward processing
    return { success: false, error: error.message };
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