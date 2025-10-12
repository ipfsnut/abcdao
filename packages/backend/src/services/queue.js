import Queue from 'bull';
import Redis from 'redis';
import { ethers } from 'ethers';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { getPool } from './database.js';

let rewardQueue;
let castQueue;
let redisClient;

export async function setupQueues() {
  // Initialize Redis connection
  redisClient = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  await redisClient.connect();
  console.log('✅ Redis connected');
  
  // Create job queues
  rewardQueue = new Queue('reward processing', process.env.REDIS_URL || 'redis://localhost:6379');
  castQueue = new Queue('farcaster casting', process.env.REDIS_URL || 'redis://localhost:6379');
  
  // Process reward jobs
  rewardQueue.process(processRewardJob);
  
  // Process cast jobs
  castQueue.process(processCastJob);
  
  console.log('✅ Job queues setup complete');
  
  return { rewardQueue, castQueue };
}

export async function addRewardJob(commitData) {
  await rewardQueue.add('process-commit-reward', commitData, {
    attempts: 3,
    backoff: 'exponential',
    delay: 1000 // 1 second delay
  });
}

export async function addCastJob(castData) {
  await castQueue.add('post-cast', castData, {
    attempts: 5,
    backoff: 'exponential',
    delay: 2000 // 2 second delay
  });
}

async function processRewardJob(job) {
  const { userId, commitHash, farcasterUsername, farcasterFid, repository, commitMessage, commitUrl } = job.data;
  
  try {
    console.log(`🏗️ Processing reward for commit ${commitHash} by ${farcasterUsername}`);
    
    // Check if user is eligible (1M ABC staked)
    const isEligible = await checkStakeEligibility(userId);
    if (!isEligible) {
      console.log(`❌ User ${farcasterUsername} not eligible (insufficient stake)`);
      return;
    }
    
    // Generate random reward amount (100 - 10,000 ABC)
    const rewardAmount = Math.floor(Math.random() * 9901) + 100; // 100 to 10,000
    
    // Send ABC tokens from bot wallet
    const txHash = await sendABCReward(userId, rewardAmount);
    
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
    
    console.log(`✅ Sent ${rewardAmount} ABC to ${farcasterUsername} (tx: ${txHash})`);
    
    // Queue Farcaster cast
    await addCastJob({
      farcasterUsername,
      farcasterFid,
      repository,
      commitMessage: commitMessage.slice(0, 100), // Truncate long messages
      commitUrl,
      rewardAmount,
      txHash
    });
    
    return { success: true, rewardAmount, txHash };
    
  } catch (error) {
    console.error(`❌ Reward processing failed for ${commitHash}:`, error);
    throw error;
  }
}

async function processCastJob(job) {
  const { farcasterUsername, farcasterFid, repository, commitMessage, commitUrl, rewardAmount, txHash } = job.data;
  
  try {
    console.log(`📢 Posting cast for ${farcasterUsername}'s commit`);
    
    // Initialize Neynar client
    const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    
    // Create cast message with proper tagging and links
    const castText = generateCommitAnnouncement(farcasterUsername, farcasterFid, repository, commitMessage, commitUrl, rewardAmount);
    
    // Post cast (using your bot account)
    const cast = await neynar.publishCast(
      process.env.NEYNAR_SIGNER_UUID,
      castText
    );
    
    // Update commit record with cast URL
    const pool = getPool();
    await pool.query(`
      UPDATE commits 
      SET cast_url = $1
      WHERE commit_hash = (SELECT commit_hash FROM commits WHERE reward_amount = $2 AND processed_at IS NOT NULL LIMIT 1)
    `, [cast.cast.hash, rewardAmount]);
    
    console.log(`✅ Posted cast: ${cast.cast.hash}`);
    
    return { success: true, castHash: cast.cast.hash };
    
  } catch (error) {
    console.error(`❌ Cast posting failed:`, error);
    throw error;
  }
}

function generateCommitAnnouncement(username, fid, repository, commitMessage, commitUrl, rewardAmount) {
  // Extract repo name
  const repoName = repository.split('/').pop() || repository;
  
  // Clean up commit message - remove conventional commit prefixes and truncate
  let cleanMessage = commitMessage
    .replace(/^(feat|fix|docs|style|refactor|test|chore|build|ci|perf)(\(.+?\))?:\s*/i, '')
    .split('\n')[0] // Take first line only
    .trim();
  
  if (cleanMessage.length > 100) {
    cleanMessage = cleanMessage.substring(0, 97) + '...';
  }

  // Pick a random celebratory intro
  const intros = [
    '🚀 New commit!',
    '⚡ Code shipped!',
    '🔥 Fresh push!',
    '💻 Update landed!',
    '✨ Changes deployed!',
    '🛠️ Build complete!'
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];

  // Build the message with proper tagging
  let message = `${intro}\n\n`;
  message += `@${username} just pushed to ${repoName}:\n\n`;
  message += `"${cleanMessage}"\n\n`;
  message += `💰 Earned: ${rewardAmount.toLocaleString()} $ABC\n\n`;
  message += `🔗 ${commitUrl}\n\n`;
  message += `#ABCDao #AlwaysBeCoding`;

  return message;
}

async function checkStakeEligibility(userId) {
  try {
    // Get user's wallet address
    const pool = getPool();
    const userResult = await pool.query('SELECT wallet_address FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0 || !userResult.rows[0].wallet_address) {
      return false;
    }
    
    const walletAddress = userResult.rows[0].wallet_address;
    
    // Check staked amount via contract
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const stakingContract = new ethers.Contract(
      process.env.STAKING_CONTRACT_ADDRESS,
      ['function getStakedAmount(address) view returns (uint256)'],
      provider
    );
    
    const stakedAmount = await stakingContract.getStakedAmount(walletAddress);
    const minimumStake = ethers.parseEther('1000000'); // 1M ABC
    
    return stakedAmount >= minimumStake;
    
  } catch (error) {
    console.error('Error checking stake eligibility:', error);
    return false;
  }
}

async function sendABCReward(userId, amount) {
  try {
    // Initialize wallet and provider
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    // Get user's wallet address
    const pool = getPool();
    const userResult = await pool.query('SELECT wallet_address FROM users WHERE id = $1', [userId]);
    const userAddress = userResult.rows[0].wallet_address;
    
    // Create ABC token contract instance
    const abcToken = new ethers.Contract(
      process.env.ABC_TOKEN_ADDRESS,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      botWallet
    );
    
    // Send ABC tokens
    const amountWei = ethers.parseEther(amount.toString());
    const tx = await abcToken.transfer(userAddress, amountWei);
    
    console.log(`💸 Sent ${amount} ABC to ${userAddress} (tx: ${tx.hash})`);
    
    return tx.hash;
    
  } catch (error) {
    console.error('Error sending ABC reward:', error);
    throw error;
  }
}