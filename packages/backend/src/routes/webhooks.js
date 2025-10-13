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
  
  console.log('🔍 WEBHOOK DEBUG:');
  console.log('Event:', event);
  console.log('Repository:', payload?.repository?.full_name);
  console.log('Pusher:', payload?.pusher?.name);
  console.log('Commits:', payload?.commits?.length);
  
  try {
    if (event === 'push') {
      await handlePushEvent(payload);
    } else if (event === 'pull_request') {
      await handlePullRequestEvent(payload);
    }
    
    console.log('✅ Webhook processed successfully');
    res.status(200).json({ status: 'received' });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorCode: error.code,
      errorName: error.name
    });
  }
});

async function handlePushEvent(payload) {
  try {
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
    
    console.log('🔍 Attempting to get database pool...');
    const pool = getPool();
    console.log('✅ Database pool obtained');
  
    // Try multiple fields for GitHub username
    const githubUsername = pusher?.name || pusher?.login || pusher?.username;
    console.log('🔍 Looking for user with GitHub username:', githubUsername);
    
    // Look up user by GitHub username
    console.log('🔍 Querying database for user...');
    const userResult = await pool.query(
      'SELECT * FROM users WHERE github_username = $1 AND verified_at IS NOT NULL',
      [githubUsername]
    );
    console.log('✅ User query completed, found:', userResult.rows.length, 'users');
    
    if (userResult.rows.length === 0) {
      console.log(`⚠️ Push from unregistered user: ${githubUsername}`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Found user:', user.farcaster_username);
    
    // Process each commit
    console.log('🔍 Processing', commits.length, 'commits...');
    for (const commit of commits) {
      await processCommit(user, repository, commit);
    }
    console.log('✅ All commits processed');
    
  } catch (error) {
    console.error('❌ Error in handlePushEvent:', error);
    throw error; // Re-throw to be caught by main handler
  }
}

async function processCommit(user, repository, commit) {
  try {
    console.log('🔍 Processing commit:', commit.id);
    const pool = getPool();
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
      console.log(`⚠️ Daily limit reached for user ${user.farcaster_username} - posting limit reached cast`);
      
      // Get user notification settings
      const userSettings = user.notification_settings;
      
      // Still post a cast but indicate daily limit reached
      await postCommitCast({
        farcasterUsername: user.farcaster_username,
        farcasterFid: user.farcaster_fid,
        repository: repository.full_name,
        commitMessage: commit.message.slice(0, 100),
        commitUrl: `${repository.html_url}/commit/${commit.id}`,
        rewardAmount: null, // This will trigger "MAX DAILY REWARDS REACHED" message
        commitHash: commit.id,
        dailyLimitReached: true,
        userSettings
      });
      
      return;
    }
    
    // Insert commit record (reward will be set when processed)
    await pool.query(`
      INSERT INTO commits (user_id, commit_hash, repository, commit_message)
      VALUES ($1, $2, $3, $4)
    `, [
      user.id,
      commit.id,
      repository.full_name,
      commit.message
    ]);
    
    console.log(`✅ Recorded commit ${commit.id} for ${user.farcaster_username}`);
    
    // Always process directly for now (bypass queue issues)
    console.log(`🔄 Processing commit ${commit.id} directly`);
    await processRewardDirectly({
      userId: user.id,
      commitHash: commit.id,
      farcasterUsername: user.farcaster_username,
      farcasterFid: user.farcaster_fid,
      repository: repository.full_name,
      commitMessage: commit.message,
      commitUrl: commit.url,
      userSettings: user.notification_settings
    });
    
  } catch (error) {
    console.error('Error processing commit:', error);
    throw error;
  }
}

// Direct reward processing when queue is unavailable
async function processRewardDirectly(commitData) {
  const { userId, commitHash, farcasterUsername, farcasterFid, repository, commitMessage, commitUrl, userSettings } = commitData;
  
  try {
    console.log(`🏗️ Processing reward directly for commit ${commitHash} by ${farcasterUsername}`);
    
    // Generate random reward amount (50,000 - 1,000,000 ABC)
    const rewardAmount = Math.floor(Math.random() * 950000) + 50000; // 50k to 1M ABC
    
    // Update commit record with reward amount
    const pool = getPool();
    await pool.query(`
      UPDATE commits 
      SET reward_amount = $1, processed_at = NOW()
      WHERE commit_hash = $2
    `, [rewardAmount, commitHash]);
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    try {
      await pool.query(`
        INSERT INTO daily_stats (user_id, date, commit_count, total_rewards)
        VALUES ($1, $2, 1, $3)
        ON CONFLICT (user_id, date) 
        DO UPDATE SET 
          commit_count = daily_stats.commit_count + 1,
          total_rewards = daily_stats.total_rewards + EXCLUDED.total_rewards
      `, [userId, today, rewardAmount]);
    } catch (error) {
      console.log('⚠️ Daily stats update failed:', error.message);
      throw error;
    }
    
    console.log(`✅ Awarded ${rewardAmount} ABC to ${farcasterUsername}`);
    
    // Post Farcaster cast directly
    await postCommitCast({
      farcasterUsername,
      farcasterFid,
      repository,
      commitMessage: commitMessage.slice(0, 100),
      commitUrl,
      rewardAmount,
      commitHash,
      userSettings
    });
    
    return { success: true, rewardAmount };
    
  } catch (error) {
    console.error(`❌ Direct reward processing failed for ${commitHash}:`, error);
    throw error;
  }
}

// Direct Farcaster posting when queue is unavailable
async function postCommitCast(castData) {
  const { farcasterUsername, farcasterFid, repository, commitMessage, commitUrl, rewardAmount, commitHash, dailyLimitReached, userSettings } = castData;
  
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
    
    // Apply user settings to cast content
    const settings = userSettings || {
      commit_casts: { enabled: true, tag_me: true, include_repo_name: true, include_commit_message: true, max_message_length: 100 },
      daily_limit_casts: { enabled: true, tag_me: true, custom_message: null }
    };
    
    // Check if user wants this type of cast
    if (dailyLimitReached && !settings.daily_limit_casts?.enabled) {
      console.log(`⏭️ User ${farcasterUsername} has daily limit casts disabled, skipping`);
      return;
    } else if (!dailyLimitReached && !settings.commit_casts?.enabled) {
      console.log(`⏭️ User ${farcasterUsername} has commit casts disabled, skipping`);
      return;
    }
    
    // Create username mention based on settings
    const usernameText = dailyLimitReached 
      ? (settings.daily_limit_casts?.tag_me !== false ? `@${farcasterUsername}` : farcasterUsername)
      : (settings.commit_casts?.tag_me !== false ? `@${farcasterUsername}` : farcasterUsername);
    
    // Create repo name based on settings
    const repoText = (!dailyLimitReached && settings.commit_casts?.include_repo_name === false) 
      ? 'their repo' : repoName;
    
    // Create commit message based on settings  
    const maxLength = settings.commit_casts?.max_message_length || 100;
    const messageText = (!dailyLimitReached && settings.commit_casts?.include_commit_message === false)
      ? 'some awesome code'
      : cleanMessage.substring(0, maxLength);
    
    // Create reward text with custom messages
    let rewardText;
    if (dailyLimitReached) {
      rewardText = settings.daily_limit_casts?.custom_message || '🔴 MAX DAILY REWARDS REACHED (10/10)';
    } else {
      rewardText = `💰 Earned: ${rewardAmount.toLocaleString()} $ABC`;
    }
    
    const castText = `🚀 New commit!\n\n${usernameText} just pushed to ${repoText}:\n\n"${messageText}"\n\n${rewardText}\n\n🔗 ${commitUrl}\n\n📱 Want rewards? Add our miniapp:\nfarcaster.xyz/miniapps/S1edg9PycxZP/abcdao\n\n#ABCDAO #AlwaysBeCoding`;
    
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
  // Diagnostic endpoint to check schema
  router.get('/db-schema', async (req, res) => {
    try {
      const pool = getPool();
      
      // Check commits table schema
      const schemaQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'commits' 
        ORDER BY ordinal_position;
      `;
      
      const result = await pool.query(schemaQuery);
      
      res.json({
        status: 'success',
        table: 'commits',
        columns: result.rows,
        message: 'Schema check completed'
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Schema check failed',
        details: error.message,
        code: error.code
      });
    }
  });

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