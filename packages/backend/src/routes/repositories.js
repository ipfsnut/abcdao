import express from 'express';
import { getPool } from '../services/database.js';
import { Octokit } from '@octokit/rest';
import { ethers } from 'ethers';
import crypto from 'crypto';
import githubAPIService from '../services/github-api.js';

const router = express.Router();

// Helper function to resolve user by wallet address or Farcaster FID
async function resolveUserByIdentifier(identifier) {
  const pool = getPool();
  
  // Check if identifier is a wallet address (starts with 0x and is 42 chars)
  if (identifier.startsWith('0x') && identifier.length === 42) {
    console.log(`🔍 Resolving user by wallet address: ${identifier}`);
    const result = await pool.query(`
      SELECT id, farcaster_fid, farcaster_username, github_username, access_token, wallet_address
      FROM users 
      WHERE LOWER(wallet_address) = LOWER($1)
    `, [identifier]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found for wallet address');
    }
    
    return result.rows[0];
  } 
  // Otherwise treat as Farcaster FID
  else {
    console.log(`🔍 Resolving user by Farcaster FID: ${identifier}`);
    const result = await pool.query(`
      SELECT id, farcaster_fid, farcaster_username, github_username, access_token, wallet_address
      FROM users 
      WHERE farcaster_fid = $1
    `, [parseInt(identifier)]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found for Farcaster FID');
    }
    
    return result.rows[0];
  }
}

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

// Universal endpoint: Get user's registered repositories (accepts wallet address or FID)
router.get('/user/:identifier/repositories', async (req, res) => {
  const { identifier } = req.params;
  
  try {
    console.log(`📁 Fetching repositories for identifier: ${identifier}`);
    const user = await resolveUserByIdentifier(identifier);
    const isPremiumStaker = await checkPremiumStaking(user.id);
    
    const pool = getPool();
    
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
      WHERE rr.registered_by_user_id = $1
      ORDER BY rr.created_at DESC
    `, [user.id]);
    
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
      partner_repositories: repos.rows.filter(r => r.registration_type === 'partner'),
      user_info: {
        identifier: identifier,
        resolved_fid: user.farcaster_fid,
        github_connected: !!user.github_username
      }
    });
    
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(404).json({ error: error.message });
  }
});

// Legacy endpoint: Get user's registered repositories (FID only)
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

// Universal endpoint: Get user's GitHub repositories (accepts wallet address or FID)
router.get('/user/:identifier/github-repositories', async (req, res) => {
  const { identifier } = req.params;
  
  try {
    console.log(`🐙 Fetching GitHub repositories for identifier: ${identifier}`);
    const user = await resolveUserByIdentifier(identifier);
    
    if (!user.access_token || !user.github_username) {
      return res.status(401).json({ 
        error: 'GitHub not connected',
        user_info: {
          identifier: identifier,
          resolved_fid: user.farcaster_fid,
          github_connected: false
        }
      });
    }
    
    // Fetch repositories from GitHub API
    try {
      const octokit = new Octokit({ auth: user.access_token });
      
      // Get repositories where user has admin access
      const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
        visibility: 'all',
        affiliation: 'owner,collaborator',
        sort: 'updated',
        per_page: 100
      });
      
      // Filter for repositories with admin permissions
      const adminRepos = repos.filter(repo => repo.permissions && repo.permissions.admin);
      
      const pool = getPool();
      
      // Get already registered repositories to exclude from list
      const registeredRepos = await pool.query(`
        SELECT repository_name, repository_url 
        FROM registered_repositories rr
        WHERE rr.registered_by_user_id = $1
      `, [user.id]);
      
      const registeredRepoNames = new Set(registeredRepos.rows.map(r => r.repository_name));
      
      // Format repository data and exclude already registered ones
      const availableRepos = adminRepos
        .filter(repo => !registeredRepoNames.has(repo.full_name))
        .map(repo => ({
          id: repo.id,
          name: repo.full_name,
          url: repo.html_url,
          description: repo.description,
          private: repo.private,
          updated_at: repo.updated_at,
          language: repo.language,
          stargazers_count: repo.stargazers_count
        }));
      
      res.json({
        repositories: availableRepos,
        total_repos: adminRepos.length,
        available_repos: availableRepos.length,
        registered_repos: registeredRepoNames.size,
        user_info: {
          identifier: identifier,
          resolved_fid: user.farcaster_fid,
          github_connected: true,
          github_username: user.github_username
        }
      });
      
    } catch (githubError) {
      console.error('GitHub API error:', githubError);
      
      if (githubError.status === 401) {
        return res.status(401).json({ 
          error: 'GitHub access token expired. Please reconnect your GitHub account.',
          user_info: {
            identifier: identifier,
            resolved_fid: user.farcaster_fid,
            github_connected: false
          }
        });
      }
      
      throw githubError;
    }
    
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    res.status(error.message.includes('User not found') ? 404 : 500).json({ 
      error: error.message 
    });
  }
});

// Legacy endpoint: Get user's GitHub repositories (FID only)
router.get('/:fid/github-repositories', async (req, res) => {
  const { fid } = req.params;
  
  try {
    const pool = getPool();
    
    // Get user with GitHub access token
    const userResult = await pool.query(
      'SELECT id, github_username, access_token FROM users WHERE farcaster_fid = $1', 
      [fid]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    if (!user.access_token || !user.github_username) {
      return res.status(401).json({ error: 'GitHub not connected' });
    }
    
    // Fetch repositories from GitHub API
    try {
      const octokit = new Octokit({ auth: user.access_token });
      
      // Get repositories where user has admin access
      const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
        visibility: 'all',
        affiliation: 'owner,collaborator',
        sort: 'updated',
        per_page: 100
      });
      
      // Filter for repositories with admin permissions
      const adminRepos = repos.filter(repo => repo.permissions && repo.permissions.admin);
      
      // Get already registered repositories to exclude from list
      const registeredRepos = await pool.query(`
        SELECT repository_name, repository_url 
        FROM registered_repositories rr
        JOIN users u ON rr.registered_by_user_id = u.id
        WHERE u.farcaster_fid = $1
      `, [fid]);
      
      const registeredRepoNames = new Set(registeredRepos.rows.map(r => r.repository_name));
      
      // Format repository data and exclude already registered ones
      const availableRepos = adminRepos
        .filter(repo => !registeredRepoNames.has(repo.full_name))
        .map(repo => ({
          id: repo.id,
          name: repo.full_name,
          url: repo.html_url,
          description: repo.description,
          private: repo.private,
          updated_at: repo.updated_at,
          language: repo.language,
          stargazers_count: repo.stargazers_count
        }));
      
      res.json({
        repositories: availableRepos,
        total_repos: adminRepos.length,
        available_repos: availableRepos.length,
        registered_repos: registeredRepoNames.size
      });
      
    } catch (githubError) {
      console.error('GitHub API error:', githubError);
      
      if (githubError.status === 401) {
        return res.status(401).json({ 
          error: 'GitHub access token expired. Please reconnect your GitHub account.' 
        });
      }
      
      throw githubError;
    }
    
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub repositories' });
  }
});

// Universal endpoint: Register a new repository (accepts wallet address or FID)
router.post('/user/:identifier/repositories', async (req, res) => {
  const { identifier } = req.params;
  const { repository_url, repository_name } = req.body;
  
  if (!repository_url || !repository_name) {
    return res.status(400).json({ error: 'Repository URL and name required' });
  }
  
  try {
    console.log(`📝 Registering repository for identifier: ${identifier}`);
    const user = await resolveUserByIdentifier(identifier);
    const isPremiumStaker = await checkPremiumStaking(user.id);
    
    const pool = getPool();
    
    // Check if repository already exists
    const existingRepo = await pool.query(`
      SELECT id FROM registered_repositories 
      WHERE repository_name = $1 AND registered_by_user_id = $2
    `, [repository_name, user.id]);
    
    if (existingRepo.rows.length > 0) {
      return res.status(400).json({ error: 'Repository already registered' });
    }
    
    // Check member slot limits (unless premium staker)
    if (!isPremiumStaker) {
      const memberRepos = await pool.query(`
        SELECT COUNT(*) as count FROM registered_repositories 
        WHERE registered_by_user_id = $1 AND registration_type = 'member'
      `, [user.id]);
      
      if (parseInt(memberRepos.rows[0].count) >= 3) {
        return res.status(400).json({ 
          error: 'Maximum of 3 member repositories allowed. Stake 5M+ $ABC for unlimited repositories.' 
        });
      }
    }
    
    // Register repository
    const result = await pool.query(`
      INSERT INTO registered_repositories (
        registered_by_user_id, 
        repository_name, 
        repository_url, 
        registration_type,
        webhook_configured,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, 'member', false, 'pending', NOW(), NOW())
      RETURNING *
    `, [user.id, repository_name, repository_url]);
    
    const repository = result.rows[0];
    
    console.log(`✅ Repository registered: ${repository_name} for user ${identifier}`);
    
    res.json({
      success: true,
      message: `Repository ${repository_name} registered successfully`,
      repository: {
        id: repository.id,
        repository_name: repository.repository_name,
        repository_url: repository.repository_url,
        webhook_configured: repository.webhook_configured,
        status: repository.status
      },
      next_step: 'webhook_setup',
      webhook_setup_required: true,
      user_info: {
        identifier: identifier,
        resolved_fid: user.farcaster_fid
      }
    });
    
  } catch (error) {
    console.error('Error registering repository:', error);
    res.status(error.message.includes('User not found') ? 404 : 500).json({ 
      error: error.message 
    });
  }
});

// Legacy endpoint: Register a new repository (FID only)
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
    
    // Generate unique webhook secret for this repository
    const webhookSecret = crypto.randomBytes(32).toString('hex');
    
    // Register repository
    const result = await pool.query(`
      INSERT INTO registered_repositories (
        repository_name,
        repository_url,
        registered_by_user_id,
        registration_type,
        status,
        webhook_secret
      ) VALUES ($1, $2, $3, 'member', 'pending', $4)
      RETURNING *
    `, [repository_name, repository_url, user.id, webhookSecret]);
    
    res.json({
      success: true,
      repository: result.rows[0],
      message: 'Repository registered successfully. Configure webhook to activate rewards.',
      webhook_setup: {
        url: `${process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app'}/api/webhooks/github`,
        secret: webhookSecret,
        repository_id: result.rows[0].id
      },
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

// Get manual webhook setup instructions
router.get('/:fid/:repoId/webhook-instructions', async (req, res) => {
  const { fid, repoId } = req.params;
  
  try {
    const pool = getPool();
    
    // Get repository details and verify ownership
    const repoResult = await pool.query(`
      SELECT rr.id, rr.repository_name, rr.webhook_secret, rr.status
      FROM registered_repositories rr
      JOIN users u ON rr.registered_by_user_id = u.id
      WHERE rr.id = $1 AND u.farcaster_fid = $2
    `, [repoId, fid]);
    
    if (repoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repository not found or access denied' });
    }
    
    const repo = repoResult.rows[0];
    const webhookUrl = `${process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app'}/api/webhooks/github`;
    
    res.json({
      success: true,
      repository: repo.repository_name,
      instructions: {
        step1: "Go to your GitHub repository settings",
        step2: "Click 'Settings' → 'Webhooks' → 'Add webhook'",
        step3: "Fill in the webhook configuration:",
        webhook_config: {
          payload_url: webhookUrl,
          content_type: "application/json",
          secret: repo.webhook_secret,
          events: ["push"],
          active: true
        },
        step4: "Click 'Add webhook' and verify it shows a green checkmark",
        step5: "Return to ABC DAO and click 'I\\'ve configured the webhook'"
      },
      markdown_guide: `## Manual Webhook Setup for ${repo.repository_name}

### 1. Go to Repository Settings
Navigate to: https://github.com/${repo.repository_name}/settings/hooks

### 2. Add New Webhook
Click **"Add webhook"** and fill in:

**Payload URL:**
\`\`\`
${webhookUrl}
\`\`\`

**Content type:** application/json

**Secret:**
\`\`\`
${repo.webhook_secret}
\`\`\`

**Events:** Just the push event ✅

**Active:** ✅ Enabled

### 3. Test & Confirm
- Click **"Add webhook"**
- Should see green checkmark ✅
- Return to ABC DAO and click "I've configured the webhook"

### 4. Start Earning!
Make commits to ${repo.repository_name} and earn ABC rewards automatically! 🎉`
    });
    
  } catch (error) {
    console.error('Error getting webhook instructions:', error);
    res.status(500).json({ error: 'Failed to get webhook instructions' });
  }
});

// Mark webhook as manually configured
router.post('/:fid/:repoId/webhook-configured', async (req, res) => {
  const { fid, repoId } = req.params;
  
  try {
    const pool = getPool();
    
    // Verify repository ownership
    const repoResult = await pool.query(`
      SELECT rr.id, rr.repository_name
      FROM registered_repositories rr
      JOIN users u ON rr.registered_by_user_id = u.id
      WHERE rr.id = $1 AND u.farcaster_fid = $2
    `, [repoId, fid]);
    
    if (repoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repository not found or access denied' });
    }
    
    // Mark webhook as configured
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
      message: `Webhook marked as configured for ${repoResult.rows[0].repository_name}. Repository is now active for rewards!`
    });
    
  } catch (error) {
    console.error('Error marking webhook as configured:', error);
    res.status(500).json({ error: 'Failed to update webhook status' });
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
      SELECT rr.id, rr.repository_name, rr.repository_url, rr.status, rr.webhook_configured
      FROM registered_repositories rr
      JOIN users u ON rr.registered_by_user_id = u.id
      WHERE rr.id = $1 AND u.farcaster_fid = $2
    `, [repoId, fid]);
    
    if (repoResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Repository not found or access denied',
        code: 'REPOSITORY_NOT_FOUND',
        details: `No repository found with ID ${repoId} for user ${fid}`
      });
    }
    
    const repo = repoResult.rows[0];
    
    console.log(`🔍 Processing webhook setup for repository:`, {
      id: repo.id,
      name: repo.repository_name,
      status: repo.status,
      webhook_configured: repo.webhook_configured,
      fid: fid
    });
    
    // Generate webhook URL
    const backendUrl = process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app';
    const webhookUrl = `${backendUrl}/api/webhooks/github`;
    
    // Extract owner/repo from repository name
    const [owner, repoName] = repo.repository_name.split('/');
    
    if (!owner || !repoName) {
      console.error('❌ Invalid repository name format:', repo.repository_name);
      return res.status(400).json({ 
        error: `Invalid repository name format: ${repo.repository_name}. Expected format: owner/repo`,
        code: 'INVALID_REPO_FORMAT'
      });
    }
    
    console.log(`🔧 Setting up webhook for ${owner}/${repoName}`);
    
    // Get the webhook secret for this repository
    const secretResult = await pool.query(`
      SELECT webhook_secret FROM registered_repositories WHERE id = $1
    `, [repoId]);
    
    if (secretResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repository webhook secret not found' });
    }
    
    const webhookSecret = secretResult.rows[0].webhook_secret;
    
    // Set up webhook using GitHub App with OAuth fallback
    console.log(`🔧 Setting up webhook with GitHub App/OAuth fallback...`);
    
    let userAccessToken = null;
    try {
      userAccessToken = await githubAPIService.getUserAccessToken(fid);
      console.log(`✅ Got user OAuth token for fallback`);
    } catch (tokenError) {
      console.log(`⚠️ No user OAuth token available: ${tokenError.message}`);
    }
    
    await githubAPIService.createWebhookWithFallback(owner, repoName, webhookUrl, webhookSecret, userAccessToken);
    
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
      return res.status(401).json({ 
        error: 'GitHub account not linked. Please link your GitHub account first.',
        code: 'GITHUB_NOT_LINKED'
      });
    }
    
    // Handle specific GitHub API errors with user-friendly messages
    if (error.message.includes('access token is invalid')) {
      return res.status(401).json({ 
        error: 'Your GitHub access has expired. Please re-link your GitHub account.',
        code: 'GITHUB_TOKEN_EXPIRED'
      });
    }
    
    if (error.message.includes('Insufficient permissions')) {
      return res.status(403).json({ 
        error: 'You need admin access to this repository to set up webhooks. Please check your repository permissions.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    if (error.message.includes('Repository not found')) {
      return res.status(404).json({ 
        error: 'Repository not found or you no longer have access to it.',
        code: 'REPOSITORY_NOT_FOUND'
      });
    }
    
    if (error.message.includes('GitHub validation error')) {
      return res.status(422).json({ 
        error: 'GitHub rejected the webhook configuration. ' + error.message,
        code: 'GITHUB_VALIDATION_ERROR'
      });
    }
    
    // Log the full error for debugging but return a generic message
    console.error('Full webhook setup error:', {
      repository: repo?.repository_name,
      fid,
      repoId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to configure webhook automatically. Please try the manual setup option.',
      details: error.message,
      code: 'WEBHOOK_SETUP_FAILED'
    });
  }
});

// Universal endpoint: Get webhook setup instructions for a specific repository
router.get('/user/:identifier/repositories/:repoId/webhook-instructions', async (req, res) => {
  const { identifier, repoId } = req.params;
  
  try {
    console.log(`🔗 Getting webhook instructions for repo ${repoId}, user ${identifier}`);
    const user = await resolveUserByIdentifier(identifier);
    
    const pool = getPool();
    
    // Get repository details and verify ownership
    const repoResult = await pool.query(`
      SELECT rr.id, rr.repository_name, rr.webhook_secret, rr.webhook_configured, rr.status
      FROM registered_repositories rr
      WHERE rr.id = $1 AND rr.registered_by_user_id = $2
    `, [repoId, user.id]);
    
    if (repoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repository not found or access denied' });
    }
    
    const repo = repoResult.rows[0];
    
    // Generate new secret if one doesn't exist
    let webhookSecret = repo.webhook_secret;
    if (!webhookSecret) {
      webhookSecret = crypto.randomBytes(32).toString('hex');
      await pool.query(`
        UPDATE registered_repositories 
        SET webhook_secret = $1, updated_at = NOW()
        WHERE id = $2
      `, [webhookSecret, repoId]);
    }
    
    const backendUrl = process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app';
    const [owner, repoName] = repo.repository_name.split('/');
    
    res.json({
      success: true,
      repository: {
        id: repo.id,
        name: repo.repository_name,
        owner,
        repo: repoName,
        webhook_configured: repo.webhook_configured,
        status: repo.status
      },
      webhook_setup: {
        github_url: `https://github.com/${repo.repository_name}/settings/hooks`,
        payload_url: `${backendUrl}/api/webhooks/github`,
        content_type: 'application/json',
        secret: webhookSecret,
        events: ['push'],
        active: true
      },
      instructions: {
        steps: [
          `Go to https://github.com/${repo.repository_name}/settings/hooks`,
          'Click "Add webhook"',
          `Set Payload URL to: ${backendUrl}/api/webhooks/github`,
          'Set Content type to: application/json',
          `Set Secret to: ${webhookSecret}`,
          'Select "Just the push event"',
          'Make sure "Active" is checked',
          'Click "Add webhook"',
          'Come back here and click "I\'ve configured the webhook"'
        ]
      },
      user_info: {
        identifier: identifier,
        resolved_fid: user.farcaster_fid
      }
    });
    
  } catch (error) {
    console.error('Error getting webhook instructions:', error);
    res.status(error.message.includes('User not found') ? 404 : 500).json({ 
      error: error.message 
    });
  }
});

// Universal endpoint: Mark webhook as manually configured
router.post('/user/:identifier/repositories/:repoId/webhook-configured', async (req, res) => {
  const { identifier, repoId } = req.params;
  
  try {
    console.log(`✅ Marking webhook as configured for repo ${repoId}, user ${identifier}`);
    const user = await resolveUserByIdentifier(identifier);
    
    const pool = getPool();
    
    // Verify repository ownership
    const repoResult = await pool.query(`
      SELECT rr.id, rr.repository_name
      FROM registered_repositories rr
      WHERE rr.id = $1 AND rr.registered_by_user_id = $2
    `, [repoId, user.id]);
    
    if (repoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repository not found or access denied' });
    }
    
    // Mark webhook as configured
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
      message: `Webhook marked as configured for ${repoResult.rows[0].repository_name}. Repository is now active for rewards!`,
      user_info: {
        identifier: identifier,
        resolved_fid: user.farcaster_fid
      }
    });
    
  } catch (error) {
    console.error('Error marking webhook as configured:', error);
    res.status(error.message.includes('User not found') ? 404 : 500).json({ 
      error: error.message 
    });
  }
});

// Legacy endpoint: Get webhook setup instructions for a specific repository
router.get('/:fid/repositories/:repoId/webhook-instructions', async (req, res) => {
  const { fid, repoId } = req.params;
  
  try {
    const pool = getPool();
    
    // Get repository details and verify ownership
    const repoResult = await pool.query(`
      SELECT rr.id, rr.repository_name, rr.webhook_secret, rr.webhook_configured, rr.status
      FROM registered_repositories rr
      JOIN users u ON rr.registered_by_user_id = u.id
      WHERE rr.id = $1 AND u.farcaster_fid = $2
    `, [repoId, fid]);
    
    if (repoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repository not found or access denied' });
    }
    
    const repo = repoResult.rows[0];
    
    // Generate new secret if one doesn't exist
    let webhookSecret = repo.webhook_secret;
    if (!webhookSecret) {
      webhookSecret = crypto.randomBytes(32).toString('hex');
      await pool.query(`
        UPDATE registered_repositories 
        SET webhook_secret = $1, updated_at = NOW()
        WHERE id = $2
      `, [webhookSecret, repoId]);
    }
    
    const backendUrl = process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app';
    const [owner, repoName] = repo.repository_name.split('/');
    
    res.json({
      success: true,
      repository: {
        id: repo.id,
        name: repo.repository_name,
        owner,
        repo: repoName,
        webhook_configured: repo.webhook_configured,
        status: repo.status
      },
      webhook_setup: {
        github_url: `https://github.com/${repo.repository_name}/settings/hooks`,
        payload_url: `${backendUrl}/api/webhooks/github`,
        content_type: 'application/json',
        secret: webhookSecret,
        events: ['push'],
        active: true
      },
      instructions: {
        steps: [
          `Go to https://github.com/${repo.repository_name}/settings/hooks`,
          'Click "Add webhook"',
          `Set Payload URL to: ${backendUrl}/api/webhooks/github`,
          'Set Content type to: application/json',
          `Set Secret to: ${webhookSecret}`,
          'Select "Just the push event"',
          'Make sure "Active" is checked',
          'Click "Add webhook"',
          'Come back here and click "I\'ve configured the webhook"'
        ]
      }
    });
    
  } catch (error) {
    console.error('Error getting webhook instructions:', error);
    res.status(500).json({ error: 'Failed to get webhook instructions' });
  }
});

// Repository Detection Endpoint
router.get('/:fid/detect', async (req, res) => {
  const { fid } = req.params;
  
  try {
    const pool = getPool();
    
    // Get user info
    const userResult = await pool.query(`
      SELECT id, wallet_address, github_username, github_oauth_token 
      FROM users 
      WHERE farcaster_fid = $1 AND github_username IS NOT NULL
    `, [fid]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found or GitHub not connected',
        suggestion: 'Please connect your GitHub account first'
      });
    }
    
    const user = userResult.rows[0];
    
    if (!user.github_oauth_token) {
      return res.status(400).json({ 
        error: 'GitHub OAuth token not available',
        suggestion: 'Please reconnect your GitHub account'
      });
    }
    
    // Use GitHub API to fetch repositories
    const octokit = new Octokit({
      auth: user.github_oauth_token
    });
    
    // Fetch user's repositories
    const { data: repositories } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      type: 'owner' // Only repos owned by the user
    });
    
    // Filter and score repositories
    const recentDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    const scoredRepos = repositories
      .filter(repo => {
        // Filter criteria
        const isRecent = new Date(repo.updated_at) > recentDate;
        const hasActivity = repo.size > 0; // Has some content
        const notFork = !repo.fork;
        
        return isRecent && hasActivity && notFork;
      })
      .map(repo => {
        // Scoring algorithm
        let score = 0;
        
        // Activity score (based on update recency)
        const daysSinceUpdate = Math.floor((Date.now() - new Date(repo.updated_at)) / (1000 * 60 * 60 * 24));
        score += Math.max(0, 100 - daysSinceUpdate); // More recent = higher score
        
        // Popularity score
        score += repo.stargazers_count * 2;
        score += repo.forks_count * 3;
        
        // Size/content score
        score += Math.min(repo.size / 1000, 20); // Cap at 20 points for size
        
        // Language boost for popular languages
        const languageBoost = {
          'JavaScript': 10,
          'TypeScript': 10,
          'Python': 8,
          'Rust': 8,
          'Go': 6,
          'Java': 5
        };
        score += languageBoost[repo.language] || 0;
        
        return {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          private: repo.private,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          updated_at: repo.updated_at,
          score: Math.round(score),
          auto_eligible: !repo.private && score > 30 // Auto-enable if public and good score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Top 20 repositories
    
    // Check which repositories are already registered
    const repoIds = scoredRepos.map(repo => repo.id.toString());
    const existingRepos = await pool.query(`
      SELECT github_repo_id 
      FROM registered_repositories 
      WHERE github_repo_id = ANY($1::text[])
    `, [repoIds]);
    
    const existingRepoIds = new Set(existingRepos.rows.map(row => row.github_repo_id));
    
    // Mark existing repositories
    const detectedRepos = scoredRepos.map(repo => ({
      ...repo,
      already_registered: existingRepoIds.has(repo.id.toString())
    }));
    
    const stats = {
      total_repositories: repositories.length,
      detected_count: detectedRepos.length,
      auto_eligible_count: detectedRepos.filter(repo => repo.auto_eligible && !repo.already_registered).length,
      already_registered_count: detectedRepos.filter(repo => repo.already_registered).length
    };
    
    res.json({
      success: true,
      user: {
        github_username: user.github_username,
        wallet_address: user.wallet_address
      },
      repositories: detectedRepos,
      stats,
      recommendations: {
        auto_enable: detectedRepos.filter(repo => repo.auto_eligible && !repo.already_registered),
        manual_setup: detectedRepos.filter(repo => !repo.auto_eligible && !repo.already_registered),
        already_setup: detectedRepos.filter(repo => repo.already_registered)
      }
    });
    
  } catch (error) {
    console.error('Error detecting repositories:', error);
    
    if (error.status === 401) {
      return res.status(401).json({ 
        error: 'GitHub token expired',
        suggestion: 'Please reconnect your GitHub account'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to detect repositories',
      message: error.message 
    });
  }
});

export default router;