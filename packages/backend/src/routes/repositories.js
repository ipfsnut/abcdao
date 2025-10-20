import express from 'express';
import { getPool } from '../services/database.js';
import { Octokit } from '@octokit/rest';
import { ethers } from 'ethers';
import githubAPIService from '../services/github-api.js';

const router = express.Router();

// Check if user has 5M+ ABC staked (exempts from repository fees)
async function checkPremiumStaking(userId) {
  try {
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
    const premiumStakeThreshold = ethers.parseEther('5000000'); // 5M ABC
    
    console.log(`🔍 Stake check for user ${userId}: ${ethers.formatEther(stakedAmount)} ABC staked`);
    
    return stakedAmount >= premiumStakeThreshold;
    
  } catch (error) {
    console.error('Error checking premium staking:', error);
    return false;
  }
}

// Get user's registered repositories
router.get('/:fid/repositories', async (req, res) => {
  const { fid } = req.params;
  
  try {
    const pool = getPool();
    
    // Get user info first
    const userResult = await pool.query('SELECT id FROM users WHERE farcaster_fid = $1', [fid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const isPremiumStaker = await checkPremiumStaking(user.id);
    
    // Get user's registered repositories
    const repos = await pool.query(`
      SELECT 
        rr.id,
        rr.repository_name,
        rr.repository_url,
        rr.registration_type,
        rr.webhook_configured,
        rr.reward_multiplier,
        rr.status,
        rr.created_at,
        rr.expires_at
      FROM registered_repositories rr
      JOIN users u ON rr.registered_by_user_id = u.id
      WHERE u.farcaster_fid = $1
      ORDER BY rr.created_at DESC
    `, [fid]);
    
    // Calculate remaining slots for member registrations
    const memberRepos = repos.rows.filter(r => r.registration_type === 'member');
    const maxSlots = isPremiumStaker ? 999 : 3; // Unlimited for premium stakers
    const remainingSlots = isPremiumStaker ? 999 : Math.max(0, 3 - memberRepos.length);
    
    res.json({
      repositories: repos.rows,
      member_slots_used: memberRepos.length,
      member_slots_remaining: remainingSlots,
      member_slots_max: maxSlots,
      premium_staker: isPremiumStaker,
      premium_benefits: isPremiumStaker ? ['Unlimited repositories', 'No 0.002 ETH fee required'] : null,
      partner_repositories: repos.rows.filter(r => r.registration_type === 'partner')
    });
    
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Register a new repository (member)
router.post('/:fid/repositories', async (req, res) => {
  const { fid } = req.params;
  const { repository_url, repository_name } = req.body;
  
  if (!repository_url || !repository_name) {
    return res.status(400).json({ error: 'Repository URL and name required' });
  }
  
  try {
    const pool = getPool();
    
    // Get user
    const userResult = await pool.query('SELECT id, access_token, wallet_address FROM users WHERE farcaster_fid = $1', [fid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user has premium staking (5M+ ABC) to bypass limits
    const isPremiumStaker = await checkPremiumStaking(user.id);
    console.log(`🔍 User ${fid} premium staker status: ${isPremiumStaker}`);
    
    // Check member repository limit (bypass for premium stakers)
    if (!isPremiumStaker) {
      const existingRepos = await pool.query(`
        SELECT COUNT(*) as count 
        FROM registered_repositories 
        WHERE registered_by_user_id = $1 AND registration_type = 'member'
      `, [user.id]);
      
      if (parseInt(existingRepos.rows[0].count) >= 3) {
        return res.status(400).json({ 
          error: 'Maximum 3 member repositories allowed',
          suggestion: 'Stake 5M+ $ABC to remove repository limits'
        });
      }
    }
    
    // Verify GitHub permissions
    if (user.access_token) {
      try {
        const octokit = new Octokit({ auth: user.access_token });
        const [owner, repo] = repository_name.split('/');
        
        // Check if user has admin access
        const { data: repoData } = await octokit.rest.repos.get({
          owner,
          repo
        });
        
        if (!repoData.permissions?.admin) {
          return res.status(403).json({ 
            error: 'Admin access required to register repository' 
          });
        }
        
      } catch (githubError) {
        return res.status(400).json({ 
          error: 'Could not verify repository access. Ensure repository exists and you have admin permissions.' 
        });
      }
    }
    
    // Register repository
    const result = await pool.query(`
      INSERT INTO registered_repositories (
        repository_name,
        repository_url,
        registered_by_user_id,
        registration_type,
        status
      ) VALUES ($1, $2, $3, 'member', 'pending')
      RETURNING *
    `, [repository_name, repository_url, user.id]);
    
    res.json({
      success: true,
      repository: result.rows[0],
      message: 'Repository registered successfully. Configure webhook to activate rewards.',
      premium_staker: isPremiumStaker,
      limits_bypassed: isPremiumStaker
    });
    
  } catch (error) {
    console.error('Error registering repository:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Repository already registered' });
    }
    res.status(500).json({ error: 'Failed to register repository' });
  }
});

// Submit partner application
router.post('/partner-application', async (req, res) => {
  const {
    farcaster_fid,
    organization_name,
    contact_email,
    repository_name,
    repository_url,
    description,
    requested_multiplier
  } = req.body;
  
  const required = ['farcaster_fid', 'organization_name', 'contact_email', 'repository_name', 'repository_url'];
  const missing = required.filter(field => !req.body[field]);
  
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }
  
  try {
    const pool = getPool();
    
    // Get user
    const userResult = await pool.query('SELECT id FROM users WHERE farcaster_fid = $1', [farcaster_fid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check for existing application
    const existingApp = await pool.query(`
      SELECT id FROM partner_applications 
      WHERE repository_name = $1 AND status IN ('submitted', 'approved', 'active')
    `, [repository_name]);
    
    if (existingApp.rows.length > 0) {
      return res.status(400).json({ error: 'Application already exists for this repository' });
    }
    
    // Create application
    const result = await pool.query(`
      INSERT INTO partner_applications (
        organization_name,
        contact_email,
        repository_name,
        repository_url,
        description,
        requested_multiplier,
        submitted_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      organization_name,
      contact_email,
      repository_name,
      repository_url,
      description,
      requested_multiplier || 2.0,
      user.id
    ]);
    
    res.json({
      success: true,
      application: result.rows[0],
      message: 'Partner application submitted. Payment of 1,000,000 $ABC required for approval.',
      payment_amount: '1000000',
      payment_instruction: 'Send 1,000,000 $ABC tokens to complete application'
    });
    
  } catch (error) {
    console.error('Error submitting partner application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get partner applications (admin)
router.get('/partner-applications', async (req, res) => {
  const { status = 'submitted' } = req.query;
  
  try {
    const pool = getPool();
    
    const applications = await pool.query(`
      SELECT 
        pa.*,
        u.farcaster_username,
        u.github_username
      FROM partner_applications pa
      JOIN users u ON pa.submitted_by_user_id = u.id
      WHERE pa.status = $1
      ORDER BY pa.created_at DESC
    `, [status]);
    
    res.json({
      applications: applications.rows,
      total: applications.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching partner applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Webhook configuration endpoint
router.post('/:fid/repositories/:repoId/webhook', async (req, res) => {
  const { fid, repoId } = req.params;
  const { webhook_secret } = req.body;
  
  try {
    const pool = getPool();
    
    // Verify user owns this repository registration
    const repoResult = await pool.query(`
      SELECT rr.id 
      FROM registered_repositories rr
      JOIN users u ON rr.registered_by_user_id = u.id
      WHERE rr.id = $1 AND u.farcaster_fid = $2
    `, [repoId, fid]);
    
    if (repoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repository not found or access denied' });
    }
    
    // Update webhook configuration
    await pool.query(`
      UPDATE registered_repositories 
      SET 
        webhook_configured = true,
        webhook_secret = $1,
        status = 'active',
        updated_at = NOW()
      WHERE id = $2
    `, [webhook_secret, repoId]);
    
    res.json({
      success: true,
      message: 'Webhook configured successfully. Repository is now active for rewards.'
    });
    
  } catch (error) {
    console.error('Error configuring webhook:', error);
    res.status(500).json({ error: 'Failed to configure webhook' });
  }
});

// Fix existing pending repositories by setting up webhooks
router.post('/:fid/repositories/:repoId/fix-webhook', async (req, res) => {
  const { fid, repoId } = req.params;
  
  try {
    const pool = getPool();
    
    // Get repository details and verify ownership
    const repoResult = await pool.query(`
      SELECT rr.id, rr.repository_name, rr.repository_url, rr.status
      FROM registered_repositories rr
      JOIN users u ON rr.registered_by_user_id = u.id
      WHERE rr.id = $1 AND u.farcaster_fid = $2 AND rr.status = 'pending'
    `, [repoId, fid]);
    
    if (repoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pending repository not found or access denied' });
    }
    
    const repo = repoResult.rows[0];
    
    // Generate webhook URL
    const backendUrl = process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app';
    const webhookUrl = `${backendUrl}/api/webhooks/github`;
    
    // Extract owner/repo from repository name
    const [owner, repoName] = repo.repository_name.split('/');
    
    // Set up webhook using GitHub API
    const accessToken = await githubAPIService.getUserAccessToken(fid);
    await githubAPIService.createWebhook(accessToken, owner, repoName, webhookUrl);
    
    // Update repository status
    await pool.query(`
      UPDATE registered_repositories 
      SET 
        webhook_configured = true,
        status = 'active',
        updated_at = NOW()
      WHERE id = $1
    `, [repoId]);
    
    res.json({
      success: true,
      message: `Webhook configured successfully for ${repo.repository_name}. Repository is now active.`
    });
    
  } catch (error) {
    console.error('Error fixing webhook:', error);
    
    if (error.message === 'User not found or GitHub not linked') {
      return res.status(401).json({ error: 'GitHub account not linked. Please link your GitHub account first.' });
    }
    
    res.status(500).json({ error: 'Failed to configure webhook: ' + error.message });
  }
});

export default router;