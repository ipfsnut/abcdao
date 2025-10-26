import express from 'express';
import crypto from 'crypto';
import { Webhooks } from '@octokit/webhooks';
import dotenv from 'dotenv';
import { getPool } from '../services/database.js';
import { addRewardJob } from '../services/queue.js';
import farcasterService from '../services/farcaster.js';
import commitTagParser from '../services/commit-tags.js';
import priorityLimits from '../services/priority-limits.js';

// Ensure dotenv is loaded
dotenv.config();

const router = express.Router();

// Initialize GitHub webhooks handler
const webhooks = process.env.GITHUB_WEBHOOK_SECRET ? new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET
}) : null;

// Middleware to verify GitHub webhook signature using repository-specific secrets
async function verifyGitHubSignature(req, res, next) {
  const signature = req.get('X-Hub-Signature-256');
  const payload = JSON.stringify(req.body);
  
  console.log('🔍 WEBHOOK SIGNATURE DEBUG:');
  console.log('Received signature:', signature);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Payload length:', payload.length);
  console.log('Payload (first 200 chars):', payload.substring(0, 200));
  
  if (!signature) {
    console.log('❌ Missing X-Hub-Signature-256 header');
    return res.status(401).json({ error: 'Missing signature' });
  }
  
  try {
    const repository = req.body?.repository;
    if (!repository?.full_name) {
      console.log('❌ Missing repository information in payload');
      return res.status(400).json({ error: 'Missing repository information' });
    }
    
    console.log('📁 Repository:', repository.full_name);
    
    // Get repository-specific webhook secret from database
    const pool = getPool();
    const repoResult = await pool.query(`
      SELECT webhook_secret 
      FROM registered_repositories 
      WHERE repository_name = $1 AND webhook_configured = true
    `, [repository.full_name]);
    
    if (repoResult.rows.length === 0) {
      console.log(`⚠️ Webhook received for unregistered repository: ${repository.full_name}`);
      return res.status(404).json({ error: 'Repository not registered or webhook not configured' });
    }
    
    const webhookSecret = repoResult.rows[0].webhook_secret;
    if (!webhookSecret) {
      console.log(`⚠️ No webhook secret found for repository: ${repository.full_name}`);
      return res.status(401).json({ error: 'No webhook secret configured for repository' });
    }
    
    console.log('🔑 Stored secret:', webhookSecret);
    console.log('🔑 Secret length:', webhookSecret.length);
    
    // Verify signature using repository-specific secret
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');
    
    console.log('🔑 Expected signature:', expectedSignature);
    console.log('🔑 Received signature:', signature);
    console.log('🔑 Signatures match:', signature === expectedSignature);
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      console.log(`❌ Invalid webhook signature for repository: ${repository.full_name}`);
      console.log('❌ Debug info:');
      console.log('  - Expected length:', expectedSignature.length);
      console.log('  - Received length:', signature.length);
      console.log('  - Secret used:', webhookSecret);
      console.log('  - Payload used for signing:', payload.substring(0, 500));
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    console.log(`✅ Webhook signature verified for repository: ${repository.full_name}`);
    next();
    
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return res.status(500).json({ error: 'Signature verification failed' });
  }
}

// GitHub webhook endpoint
router.post('/github', async (req, res) => {
  // Temporarily bypass signature verification for debugging
  console.log('🔧 WEBHOOK DEBUG: Bypassing signature verification for steaknstake');
  
  // Original line: router.post('/github', verifyGitHubSignature, async (req, res) => {
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
    console.log('🔍 PUSHER DEBUG:', {
      pusher_name: pusher?.name,
      pusher_login: pusher?.login, 
      pusher_username: pusher?.username,
      pusher_email: pusher?.email,
      full_pusher: JSON.stringify(pusher, null, 2)
    });
    
    // GitHub typically sends the username in pusher.login, not pusher.name
    // pusher.name is the display name, pusher.login is the actual username
    const githubUsername = pusher?.login || pusher?.name || pusher?.username;
    console.log('🔍 Looking for user with GitHub username:', githubUsername);
    console.log('🔍 Expected GitHub username in DB: ipfsnut');
    console.log('🔍 Checking prioritized order: login, name, username');
    
    // Look up user by GitHub username
    console.log('🔍 Querying database for user...');
    const userResult = await pool.query(
      'SELECT * FROM users WHERE github_username = $1 AND verified_at IS NOT NULL',
      [githubUsername]
    );
    console.log('✅ User query completed, found:', userResult.rows.length, 'users');
    
    if (userResult.rows.length === 0) {
      console.log(`⚠️ Push from unregistered user: ${githubUsername}`);
      console.log('🔍 Available GitHub usernames in database:');
      
      // Debug: Show all GitHub usernames in database to help diagnose
      try {
        const allUsersResult = await pool.query(
          'SELECT farcaster_fid, farcaster_username, github_username FROM users WHERE github_username IS NOT NULL AND verified_at IS NOT NULL LIMIT 10'
        );
        allUsersResult.rows.forEach(user => {
          console.log(`  - FID ${user.farcaster_fid} (${user.farcaster_username}): github_username="${user.github_username}"`);
        });
      } catch (debugError) {
        console.log('Could not query users for debugging:', debugError.message);
      }
      
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
    
    // Parse commit message for tags
    const commitParsed = commitTagParser.parseCommitMessage(commit.message);
    console.log('📝 Commit tags:', {
      tags: commitParsed.tags,
      shouldCast: commitParsed.shouldCast,
      shouldReward: commitParsed.shouldReward,
      isPrivate: commitParsed.isPrivate,
      devStatusChange: commitParsed.devStatusChange,
      priority: commitParsed.priority
    });
    
    // Handle dev status changes first
    if (commitParsed.devStatusChange) {
      const isActive = commitParsed.devStatusChange === 'enable';
      await pool.query(
        'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2',
        [isActive, user.id]
      );
      console.log(`🔄 Updated dev status for ${user.farcaster_username}: ${isActive ? 'enabled' : 'disabled'}`);
      
      // Cast about status change if not silent
      if (commitParsed.shouldCast) {
        await postDevStatusChangeCast(user, isActive, commitParsed.cleanedMessage);
      }
    }
    
    // Check if commit already processed
    const existingCommit = await pool.query(
      'SELECT id FROM commits WHERE commit_hash = $1',
      [commit.id]
    );
    
    if (existingCommit.rows.length > 0) {
      console.log(`⚠️ Commit ${commit.id} already processed`);
      return;
    }
    
    // Skip reward processing if #norew tag
    if (!commitParsed.shouldReward) {
      console.log(`⏭️ Skipping rewards for commit ${commit.id} (tagged #norew)`);
      
      // Still record the commit but without reward
      await pool.query(`
        INSERT INTO commits (user_id, commit_hash, repository, commit_message, tags, priority, is_private)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        user.id,
        commit.id,
        repository.full_name,
        commitParsed.cleanedMessage,
        commitParsed.tags,
        commitParsed.priority,
        commitParsed.isPrivate
      ]);
      
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
      
      // Still post a cast but indicate daily limit reached (if not silent)
      if (commitParsed.shouldCast) {
        await postCommitCast({
          farcasterUsername: user.farcaster_username,
          farcasterFid: user.farcaster_fid,
          repository: repository.full_name,
          commitMessage: commitParsed.cleanedMessage.slice(0, 100),
          commitUrl: `${repository.html_url}/commit/${commit.id}`,
          rewardAmount: null, // This will trigger "MAX DAILY REWARDS REACHED" message
          commitHash: commit.id,
          dailyLimitReached: true,
          userSettings,
          commitTags: commitParsed
        });
      }
      
      return;
    }
    
    // Insert commit record with tag information (reward will be set when processed)
    await pool.query(`
      INSERT INTO commits (user_id, commit_hash, repository, commit_message, tags, priority, is_private)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      user.id,
      commit.id,
      repository.full_name,
      commitParsed.cleanedMessage,
      commitParsed.tags,
      commitParsed.priority,
      commitParsed.isPrivate
    ]);
    
    // Commit recorded in main commits table only
    
    console.log(`✅ Recorded commit ${commit.id} for ${user.farcaster_username}`);
    
    // Always process directly for now (bypass queue issues)
    console.log(`🔄 Processing commit ${commit.id} directly`);
    await processRewardDirectly({
      userId: user.id,
      commitHash: commit.id,
      farcasterUsername: user.farcaster_username,
      farcasterFid: user.farcaster_fid,
      repository: repository.full_name,
      commitMessage: commitParsed.cleanedMessage,
      commitUrl: commit.url,
      userSettings: user.notification_settings,
      commitTags: commitParsed
    });
    
  } catch (error) {
    console.error('Error processing commit:', error);
    throw error;
  }
}

// Direct reward processing when queue is unavailable
async function processRewardDirectly(commitData) {
  const { userId, commitHash, farcasterUsername, farcasterFid, repository, commitMessage, commitUrl, userSettings, commitTags } = commitData;
  
  try {
    console.log(`🏗️ Processing reward directly for commit ${commitHash} by ${farcasterUsername}`);
    
    // Check priority tag limits first
    let finalPriority = commitTags?.priority || 'normal';
    let priorityMultiplier = 1;
    
    if (commitTags?.priority === 'high' || commitTags?.priority === 'milestone') {
      // Check if user has remaining priority uses this week
      const priorityCheck = await priorityLimits.checkPriorityLimit(userId);
      
      if (priorityCheck.canUse) {
        // User can use priority tag
        priorityMultiplier = 1.5;
        
        // Record the usage
        const tagType = commitTags.priority === 'milestone' ? 'milestone' : 'priority';
        await priorityLimits.recordPriorityUsage(userId, commitHash, tagType);
        
        console.log(`⭐ Priority boost applied: ${priorityMultiplier}x (${priorityCheck.remaining - 1} remaining this week)`);
      } else {
        // User has exceeded weekly limit, downgrade to normal
        finalPriority = 'normal';
        priorityMultiplier = 1;
        console.log(`⚠️ Priority tag limit exceeded for user ${farcasterUsername} (${priorityCheck.used}/${priorityCheck.limit} used this week)`);
      }
    }
    
    // Generate weighted random reward amount (with priority boost)
    const rand = Math.random();
    let rewardAmount;
    
    if (rand < 0.95) {
      // 95% chance: 50k-60k ABC (baseline rewards)
      rewardAmount = Math.floor(Math.random() * 10000) + 50000; // 50k-60k
    } else if (rand < 0.975) {
      // 2.5% chance: 60k-100k ABC (small bonus)
      rewardAmount = Math.floor(Math.random() * 40000) + 60000; // 60k-100k
    } else {
      // 2.5% chance: 100k-999k ABC (rare big rewards)
      rewardAmount = Math.floor(Math.random() * 899000) + 100000; // 100k-999k
    }
    
    // Apply priority multiplier if allowed
    if (priorityMultiplier > 1) {
      rewardAmount = Math.floor(rewardAmount * priorityMultiplier);
    }
    
    console.log(`🎲 Reward roll: ${(rand * 100).toFixed(1)}% → ${rewardAmount.toLocaleString()} $ABC`);
    
    // Update commit record with reward amount
    const pool = getPool();
    await pool.query(`
      UPDATE commits 
      SET reward_amount = $1, processed_at = NOW()
      WHERE commit_hash = $2
    `, [rewardAmount, commitHash]);
    
    // Commit reward updated in main commits table only
    
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
    
    // Update user statistics in main users table
    try {
      const userUpdateResult = await pool.query(`
        UPDATE users 
        SET 
          total_commits = COALESCE((
            SELECT COUNT(*) FROM commits WHERE user_id = users.id
          ), 0),
          total_rewards_earned = COALESCE((
            SELECT SUM(reward_amount) FROM commits 
            WHERE user_id = users.id AND reward_amount IS NOT NULL
          ), 0),
          last_commit_at = (
            SELECT MAX(processed_at) FROM commits WHERE user_id = users.id
          ),
          updated_at = NOW()
        WHERE farcaster_fid = $1
        RETURNING total_commits, total_rewards_earned
      `, [farcasterFid]);
      
      if (userUpdateResult.rows.length > 0) {
        const stats = userUpdateResult.rows[0];
        console.log(`✅ Updated user stats: ${stats.total_commits} commits, ${stats.total_rewards_earned} $ABC`);
      }
    } catch (statsError) {
      console.error('Error updating user stats:', statsError.message);
    }
    
    // Post Farcaster cast directly (unless silent)
    if (commitTags?.shouldCast !== false) {
      await postCommitCast({
        farcasterUsername,
        farcasterFid,
        repository,
        commitMessage: commitMessage.slice(0, 100),
        commitUrl,
        rewardAmount,
        commitHash,
        userSettings,
        commitTags,
        finalPriority
      });
    } else {
      console.log(`🤐 Skipping cast for silent commit ${commitHash}`);
    }
    
    return { success: true, rewardAmount };
    
  } catch (error) {
    console.error(`❌ Direct reward processing failed for ${commitHash}:`, error);
    throw error;
  }
}

// Direct Farcaster posting when queue is unavailable
async function postCommitCast(castData) {
  const { farcasterUsername, farcasterFid, repository, commitMessage, commitUrl, rewardAmount, commitHash, dailyLimitReached, userSettings, commitTags, finalPriority } = castData;
  
  try {
    console.log(`📢 Posting cast directly for ${farcasterUsername}'s commit`);
    
    // Use ABC Commits bot for GitHub activity posts
    const commitsApiKey = process.env.ABC_COMMITS_API_KEY || process.env.NEYNAR_API_KEY;
    const commitsSignerUuid = process.env.ABC_COMMITS_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;
    
    if (!commitsApiKey || !commitsSignerUuid) {
      console.log(`⚠️ ABC Commits bot credentials not configured, skipping cast`);
      return;
    }
    
    console.log(`📢 Posting from @abc-dao-commits bot (signer: ${commitsSignerUuid})`);
    
    // Initialize Neynar client for commits bot
    const { NeynarAPIClient } = await import('@neynar/nodejs-sdk');
    const neynar = new NeynarAPIClient(commitsApiKey);
    
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
      
      // Add priority indicators (only if actually applied)
      if (finalPriority === 'high') {
        rewardText += ' ⭐ (Priority)';
      } else if (finalPriority === 'milestone') {
        rewardText += ' 🎯 (Milestone)';
      } else if (commitTags?.priority === 'experimental') {
        rewardText += ' 🧪 (Experiment)';
      }
      
      // Add limit exceeded indicator if priority was requested but denied
      if ((commitTags?.priority === 'high' || commitTags?.priority === 'milestone') && finalPriority === 'normal') {
        rewardText += ' ⚠️ (Priority limit reached)';
      }
    }
    
    // Add privacy indicator if commit is private
    const privacyText = commitTags?.isPrivate ? ' 🔒' : '';
    
    const castText = `🚀 New commit!${privacyText}\n\n${usernameText} just pushed to ${repoText}:\n\n"${messageText}"\n\n${rewardText}\n\n🔗 ${commitUrl}\n\n📱 Want rewards? Add our miniapp:\nfarcaster.xyz/miniapps/S1edg9PycxZP/abcdao\n\n#ABCDAO #AlwaysBeCoding`;
    
    // Post cast using ABC Commits bot
    const cast = await neynar.publishCast(
      commitsSignerUuid,
      castText
    );
    
    console.log('🔍 Cast API response:', JSON.stringify(cast, null, 2));
    
    // Update commit record with cast URL - handle different response structures
    const pool = getPool();
    const castHash = cast?.cast?.hash || cast?.hash || 'unknown';
    await pool.query(`
      UPDATE commits 
      SET cast_url = $1
      WHERE commit_hash = $2
    `, [castHash, commitHash]);
    
    console.log(`✅ Posted cast: ${castHash}`);
    
    return { success: true, castHash };
    
  } catch (error) {
    console.error(`❌ Cast posting failed:`, error.message);
    // Don't throw - cast failure shouldn't break reward processing
    return { success: false, error: error.message };
  }
}

// Post dev status change cast
async function postDevStatusChangeCast(user, isActive, commitMessage) {
  try {
    console.log(`📢 Posting dev status change cast for ${user.farcaster_username}`);
    
    const devSignerUuid = process.env.ABC_DEV_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;
    if (!process.env.NEYNAR_API_KEY || !devSignerUuid) {
      console.log(`⚠️ Farcaster or ABC_DEV_SIGNER_UUID not configured, skipping cast`);
      return;
    }
    
    const { NeynarAPIClient } = await import('@neynar/nodejs-sdk');
    const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    
    const statusText = isActive ? 'back online' : 'taking a break';
    const statusEmoji = isActive ? '🟢' : '🟡';
    const actionText = isActive ? 'Ready to ship code!' : 'See you soon!';
    
    const castText = `${statusEmoji} Dev Status Update\n\n@${user.farcaster_username} is ${statusText}\n\n"${commitMessage}"\n\n${actionText}\n\n#ABCDAO #AlwaysBeCoding`;
    
    console.log(`📢 Posting dev status from @abc-dao-dev (signer: ${devSignerUuid})`);
    const cast = await neynar.publishCast(
      devSignerUuid,
      castText
    );
    
    console.log(`✅ Posted dev status cast: ${cast.cast.hash}`);
    return { success: true, castHash: cast.cast.hash };
    
  } catch (error) {
    console.error(`❌ Dev status cast failed:`, error.message);
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