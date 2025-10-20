import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';

class GitHubAppService {
  constructor() {
    this.appId = process.env.GITHUB_APP_ID;
    this.privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    
    if (!this.appId || !this.privateKey) {
      console.warn('⚠️ GitHub App credentials not configured. Automated webhook setup will not work.');
      this.app = null;
      return;
    }
    
    try {
      this.app = new App({
        appId: this.appId,
        privateKey: this.privateKey,
      });
      console.log('✅ GitHub App service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize GitHub App:', error);
      this.app = null;
    }
  }

  /**
   * Check if GitHub App is properly configured
   */
  isConfigured() {
    return this.app !== null;
  }

  /**
   * Create webhook using GitHub App authentication
   */
  async createWebhookAsApp(owner, repo, webhookUrl, webhookSecret) {
    if (!this.app) {
      throw new Error('GitHub App not configured - falling back to user OAuth');
    }

    try {
      console.log(`🔧 Creating webhook for ${owner}/${repo} using GitHub App...`);

      // Get Octokit instance with installation authentication
      const octokit = await this.app.getInstallationOctokit(
        await this.getInstallationIdForRepo(owner, repo)
      );

      // Check if webhook already exists
      const { data: existingHooks } = await octokit.rest.repos.listWebhooks({
        owner,
        repo
      });

      const existingHook = existingHooks.find(hook => hook.config.url === webhookUrl);
      if (existingHook) {
        console.log(`✅ Webhook already exists for ${owner}/${repo}`);
        return existingHook;
      }

      // Create new webhook
      const { data: webhook } = await octokit.rest.repos.createWebhook({
        owner,
        repo,
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: webhookSecret
        }
      });

      console.log(`✅ Webhook created successfully for ${owner}/${repo} using GitHub App`);
      return webhook;

    } catch (error) {
      console.error(`❌ GitHub App webhook creation failed for ${owner}/${repo}:`, error);
      throw new Error(`Failed to create webhook using GitHub App: ${error.message}`);
    }
  }

  /**
   * Get installation ID for a repository  
   */
  async getInstallationIdForRepo(owner, repo) {
    if (!this.app) {
      throw new Error('GitHub App not configured');
    }

    try {
      // Create App-authenticated Octokit instance
      const appOctokit = new Octokit({
        auth: {
          type: 'app',
          appId: this.appId,
          privateKey: this.privateKey,
        },
      });

      // Use the App's Octokit to get repository installation
      const { data: installation } = await appOctokit.rest.apps.getRepoInstallation({
        owner,
        repo
      });

      return installation.id;
    } catch (error) {
      console.error(`❌ Failed to get installation ID for ${owner}/${repo}:`, error);
      throw new Error(`ABC DAO Bot is not installed on ${owner}/${repo}`);
    }
  }

  /**
   * Test GitHub App access to a repository
   */
  async testRepositoryAccess(owner, repo) {
    if (!this.app) {
      return { success: false, error: 'GitHub App not configured' };
    }

    try {
      const installationId = await this.getInstallationIdForRepo(owner, repo);
      const octokit = await this.app.getInstallationOctokit(installationId);

      // Test repository access
      const { data: repoData } = await octokit.rest.repos.get({
        owner,
        repo
      });

      return { 
        success: true, 
        repository: repoData.full_name,
        permissions: 'GitHub App has webhook permissions'
      };

    } catch (error) {
      return { 
        success: false, 
        error: `Cannot access ${owner}/${repo}: ${error.message}` 
      };
    }
  }
}

export default new GitHubAppService();