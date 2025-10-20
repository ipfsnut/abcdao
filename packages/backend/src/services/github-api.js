import axios from 'axios';
import { getPool } from './database.js';
import githubAppService from './github-app.js';

class GitHubAPIService {
  constructor() {
    this.baseURL = 'https://api.github.com';
  }

  /**
   * Get user's repositories with admin access
   */
  async getUserRepositories(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/user/repos`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          affiliation: 'owner,collaborator',
          sort: 'updated',
          per_page: 100
        }
      });

      // Filter for repositories where user has admin access
      return response.data.filter(repo => 
        repo.permissions && 
        (repo.permissions.admin || repo.owner.login === repo.permissions.owner)
      );
    } catch (error) {
      console.error('Error fetching user repositories:', error);
      throw new Error('Failed to fetch repositories from GitHub');
    }
  }

  /**
   * Get repository details
   */
  async getRepository(accessToken, owner, repo) {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching repository details:', error);
      throw new Error('Failed to fetch repository details');
    }
  }

  /**
   * Create webhook for repository with GitHub App fallback
   */
  async createWebhookWithFallback(owner, repo, webhookUrl, webhookSecret, userAccessToken = null) {
    // Try GitHub App first if configured
    if (githubAppService.isConfigured()) {
      try {
        console.log(`🤖 Attempting webhook creation using GitHub App for ${owner}/${repo}...`);
        return await githubAppService.createWebhookAsApp(owner, repo, webhookUrl, webhookSecret);
      } catch (appError) {
        console.log(`⚠️ GitHub App failed: ${appError.message}`);
        
        // Fall back to user OAuth if available
        if (userAccessToken) {
          console.log(`🔄 Falling back to user OAuth for ${owner}/${repo}...`);
          return await this.createWebhook(userAccessToken, owner, repo, webhookUrl, webhookSecret);
        } else {
          throw new Error(`GitHub App failed and no user OAuth token available: ${appError.message}`);
        }
      }
    } else if (userAccessToken) {
      // No GitHub App configured, use user OAuth
      console.log(`👤 Using user OAuth for ${owner}/${repo} (GitHub App not configured)...`);
      return await this.createWebhook(userAccessToken, owner, repo, webhookUrl, webhookSecret);
    } else {
      throw new Error('Neither GitHub App nor user OAuth token available for webhook creation');
    }
  }

  /**
   * Create webhook for repository
   */
  async createWebhook(accessToken, owner, repo, webhookUrl, webhookSecret) {
    try {
      console.log(`🔧 Creating webhook for ${owner}/${repo} with URL: ${webhookUrl}`);
      
      const config = {
        url: webhookUrl,
        content_type: 'json'
      };
      
      // Add secret if provided
      if (webhookSecret) {
        config.secret = webhookSecret;
        console.log(`🔐 Including webhook secret for signature verification`);
      }
      
      const response = await axios.post(`${this.baseURL}/repos/${owner}/${repo}/hooks`, {
        name: 'web',
        active: true,
        events: ['push'],
        config: config
      }, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      console.log(`✅ Webhook created successfully for ${owner}/${repo}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Error creating webhook for ${owner}/${repo}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Handle specific GitHub API errors
      if (error.response?.status === 422) {
        console.log(`🔍 Checking for existing webhooks (422 error)...`);
        
        try {
          const existingHooks = await this.getWebhooks(accessToken, owner, repo);
          console.log(`📋 Found ${existingHooks.length} existing webhooks`);
          
          const existingHook = existingHooks.find(hook => 
            hook.config.url === webhookUrl
          );
          
          if (existingHook) {
            console.log(`✅ Webhook already exists for ${owner}/${repo}`);
            return existingHook;
          } else {
            // 422 but no matching webhook found - likely validation error
            const errorMessage = error.response?.data?.message || 'Validation failed';
            throw new Error(`GitHub validation error: ${errorMessage}`);
          }
        } catch (hookError) {
          console.error(`❌ Error checking existing webhooks:`, hookError);
          throw new Error(`Failed to verify existing webhooks: ${hookError.message}`);
        }
      }
      
      // Handle other specific error codes
      if (error.response?.status === 401) {
        throw new Error('GitHub access token is invalid or expired. Please re-link your GitHub account.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Insufficient permissions. You need admin access to this repository to create webhooks.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Repository not found or you do not have access to it.');
      }
      
      // Generic error with GitHub response details
      const errorDetails = error.response?.data?.message || error.message;
      throw new Error(`GitHub API error (${error.response?.status || 'unknown'}): ${errorDetails}`);
    }
  }

  /**
   * Get existing webhooks for repository
   */
  async getWebhooks(accessToken, owner, repo) {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/hooks`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw new Error('Failed to fetch webhooks');
    }
  }

  /**
   * Check if webhook exists for repository
   */
  async webhookExists(accessToken, owner, repo, webhookUrl) {
    try {
      const webhooks = await this.getWebhooks(accessToken, owner, repo);
      return webhooks.some(hook => hook.config.url === webhookUrl);
    } catch (error) {
      console.error('Error checking webhook existence:', error);
      return false;
    }
  }

  /**
   * Get user's access token from database
   */
  async getUserAccessToken(farcasterFid) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT access_token FROM users WHERE farcaster_fid = $1 AND access_token IS NOT NULL',
      [farcasterFid]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found or GitHub not linked');
    }
    
    return result.rows[0].access_token;
  }

  /**
   * Register repository with automatic webhook setup
   */
  async registerRepositoryWithWebhook(farcasterFid, repositoryUrl, webhookUrl) {
    const pool = getPool();
    
    try {
      // Extract owner/repo from URL
      const urlMatch = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        throw new Error('Invalid GitHub repository URL');
      }
      
      const [, owner, repoName] = urlMatch;
      const fullRepoName = `${owner}/${repoName}`;
      
      // Get user's access token
      const accessToken = await this.getUserAccessToken(farcasterFid);
      
      // Verify repository access
      const repoDetails = await this.getRepository(accessToken, owner, repoName);
      
      if (!repoDetails.permissions || !repoDetails.permissions.admin) {
        throw new Error('You must have admin access to this repository');
      }
      
      // Create webhook (note: this method doesn't have access to webhook secret)
      await this.createWebhook(accessToken, owner, repoName, webhookUrl);
      
      // Register repository in database
      const result = await pool.query(`
        INSERT INTO repositories (farcaster_fid, repository_name, repository_url, registration_type, webhook_configured, status)
        VALUES ($1, $2, $3, 'member', true, 'active')
        RETURNING *
      `, [farcasterFid, fullRepoName, repositoryUrl]);
      
      return {
        success: true,
        repository: result.rows[0],
        message: `Repository ${fullRepoName} registered and webhook configured successfully`
      };
      
    } catch (error) {
      console.error('Error registering repository with webhook:', error);
      throw error;
    }
  }

  /**
   * Get formatted repository list for user selection
   */
  async getFormattedUserRepositories(farcasterFid) {
    try {
      const accessToken = await this.getUserAccessToken(farcasterFid);
      const repositories = await this.getUserRepositories(accessToken);
      
      return repositories.map(repo => ({
        id: repo.id,
        name: repo.full_name,
        url: repo.html_url,
        description: repo.description,
        private: repo.private,
        updated_at: repo.updated_at,
        language: repo.language,
        stargazers_count: repo.stargazers_count
      }));
    } catch (error) {
      console.error('Error getting formatted repositories:', error);
      throw error;
    }
  }
}

export default new GitHubAPIService();