import axios from 'axios';
import { getPool } from './database.js';

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
   * Create webhook for repository
   */
  async createWebhook(accessToken, owner, repo, webhookUrl) {
    try {
      const response = await axios.post(`${this.baseURL}/repos/${owner}/${repo}/hooks`, {
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: webhookUrl,
          content_type: 'json'
        }
      }, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      if (error.response?.status === 422) {
        // Webhook might already exist
        const existingHooks = await this.getWebhooks(accessToken, owner, repo);
        const existingHook = existingHooks.find(hook => 
          hook.config.url === webhookUrl
        );
        if (existingHook) {
          return existingHook;
        }
      }
      throw new Error('Failed to create webhook');
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
      
      // Create webhook
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