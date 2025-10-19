import express from 'express';
import { GitHubVerificationService } from '../services/github-verification.js';
import { getPool } from '../services/database.js';

const router = express.Router();

// Verify GitHub user and get earning potential
router.post('/verify-user', async (req, res) => {
  const { username } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ error: 'Valid GitHub username required' });
  }

  try {
    const verificationService = new GitHubVerificationService();
    const result = await verificationService.verifyUser(username.trim());

    res.json(result);

  } catch (error) {
    console.error('GitHub verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify GitHub user',
      details: error.message 
    });
  }
});

// Get repositories for a verified user (for repository selection)
router.get('/user/:username/repositories', async (req, res) => {
  const { username } = req.params;
  const { include_forks = false } = req.query;

  try {
    const verificationService = new GitHubVerificationService();
    
    // First verify the user exists
    const verification = await verificationService.verifyUser(username);
    
    if (!verification.verified) {
      return res.status(400).json({ 
        error: 'User not verified for ABC DAO',
        verification: verification
      });
    }

    // Return the qualifying repositories with additional metadata
    res.json({
      username,
      repositories: verification.repositories.qualifying,
      summary: {
        total_repos: verification.repositories.total,
        qualifying_count: verification.repositories.qualifying.length,
        languages: verification.repositories.languages,
        estimated_earnings: verification.estimatedEarnings
      }
    });

  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repositories',
      details: error.message 
    });
  }
});

// Preview earnings for specific repositories
router.post('/preview-earnings', async (req, res) => {
  const { username, repositories } = req.body;

  if (!username || !Array.isArray(repositories) || repositories.length === 0) {
    return res.status(400).json({ 
      error: 'Username and repositories array required' 
    });
  }

  try {
    const verificationService = new GitHubVerificationService();
    
    // Get user's recent activity
    const activity = await verificationService.getRecentActivity(username);
    
    // Calculate earnings for selected repositories
    const selectedRepos = repositories.map(repoName => {
      // This would be enhanced to get actual repo data
      return {
        name: repoName,
        earning_potential: { tier: 'medium', score: 65 } // Simplified for now
      };
    });

    const earnings = verificationService.calculateEarningsEstimate(selectedRepos, activity);

    res.json({
      username,
      selected_repositories: repositories,
      earnings_preview: {
        ...earnings,
        repository_count: repositories.length,
        membership_cost: 0.002, // ETH
        estimated_roi_days: earnings.monthly_earnings_estimate > 0 
          ? Math.ceil((0.002 * 2000000) / (earnings.monthly_earnings_estimate / 30)) // Assume 1 ETH = 2M $ABC for simplicity
          : null
      }
    });

  } catch (error) {
    console.error('Error calculating earnings preview:', error);
    res.status(500).json({ 
      error: 'Failed to calculate earnings preview',
      details: error.message 
    });
  }
});

// Auto-register qualifying repositories for a user (after payment)
router.post('/auto-register', async (req, res) => {
  const { farcasterFid, githubUsername, selectedRepositories } = req.body;

  if (!farcasterFid || !githubUsername) {
    return res.status(400).json({ 
      error: 'Farcaster FID and GitHub username required' 
    });
  }

  try {
    const pool = getPool();

    // Verify user is a paid member
    const userResult = await pool.query(`
      SELECT id, membership_status 
      FROM users 
      WHERE farcaster_fid = $1 AND membership_status = 'active'
    `, [farcasterFid]);

    if (userResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'User must be an active member to register repositories' 
      });
    }

    const userId = userResult.rows[0].id;

    // Update user's GitHub username and verification status
    await pool.query(`
      UPDATE users 
      SET github_username = $1, verified_at = NOW(), updated_at = NOW()
      WHERE id = $2
    `, [githubUsername, userId]);

    // Get verification data to ensure repos are valid
    const verificationService = new GitHubVerificationService();
    const verification = await verificationService.verifyUser(githubUsername);

    if (!verification.verified) {
      return res.status(400).json({ 
        error: 'GitHub user not verified for ABC DAO' 
      });
    }

    // If no specific repositories selected, use all qualifying ones
    const reposToRegister = selectedRepositories && selectedRepositories.length > 0
      ? verification.repositories.qualifying.filter(repo => 
          selectedRepositories.includes(repo.full_name)
        )
      : verification.repositories.qualifying;

    // Register repositories in database
    const registeredRepos = [];
    
    for (const repo of reposToRegister) {
      try {
        // Check if repository is already registered
        const existingRepo = await pool.query(`
          SELECT id FROM repositories 
          WHERE user_id = $1 AND full_name = $2
        `, [userId, repo.full_name]);

        if (existingRepo.rows.length === 0) {
          // Register new repository
          const repoResult = await pool.query(`
            INSERT INTO repositories (
              user_id, 
              name, 
              full_name, 
              description, 
              language, 
              stars, 
              earning_tier,
              auto_registered,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
            RETURNING id, full_name
          `, [
            userId,
            repo.name,
            repo.full_name,
            repo.description || null,
            repo.language || null,
            repo.stars || 0,
            repo.earning_potential.tier
          ]);

          registeredRepos.push({
            id: repoResult.rows[0].id,
            full_name: repoResult.rows[0].full_name,
            tier: repo.earning_potential.tier,
            status: 'registered'
          });
        } else {
          registeredRepos.push({
            id: existingRepo.rows[0].id,
            full_name: repo.full_name,
            tier: repo.earning_potential.tier,
            status: 'already_registered'
          });
        }
      } catch (error) {
        console.error(`Error registering repository ${repo.full_name}:`, error);
        registeredRepos.push({
          full_name: repo.full_name,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      user_id: userId,
      github_username: githubUsername,
      repositories: registeredRepos,
      summary: {
        total_attempted: reposToRegister.length,
        successfully_registered: registeredRepos.filter(r => r.status === 'registered').length,
        already_registered: registeredRepos.filter(r => r.status === 'already_registered').length,
        errors: registeredRepos.filter(r => r.status === 'error').length
      }
    });

  } catch (error) {
    console.error('Auto-registration error:', error);
    res.status(500).json({ 
      error: 'Failed to auto-register repositories',
      details: error.message 
    });
  }
});

// Get user's registered repositories with earning stats
router.get('/user/:fid/registered-repos', async (req, res) => {
  const { fid } = req.params;

  try {
    const pool = getPool();
    
    const reposResult = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.full_name,
        r.description,
        r.language,
        r.stars,
        r.earning_tier,
        r.auto_registered,
        r.created_at,
        COUNT(c.id) as total_commits,
        COALESCE(SUM(c.reward_amount), 0) as total_earned,
        MAX(c.processed_at) as last_commit_at
      FROM repositories r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN commits c ON r.id = c.repository_id
      WHERE u.farcaster_fid = $1
      GROUP BY r.id, r.name, r.full_name, r.description, r.language, r.stars, r.earning_tier, r.auto_registered, r.created_at
      ORDER BY total_earned DESC, r.created_at DESC
    `, [fid]);

    res.json({
      repositories: reposResult.rows
    });

  } catch (error) {
    console.error('Error fetching registered repositories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch registered repositories' 
    });
  }
});

export default router;