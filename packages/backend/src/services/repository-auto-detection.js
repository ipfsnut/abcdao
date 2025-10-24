/**
 * Repository Auto-Detection Service
 * 
 * Automatically detects and suggests repositories when users connect GitHub:
 * 1. Fetch user's repositories from GitHub API
 * 2. Filter for recently active, non-fork repositories  
 * 3. Auto-enable public repos for earning
 * 4. Suggest private repos for manual setup
 * 5. Smart scoring based on activity and relevance
 */

import { getPool } from './database.js';

class RepositoryAutoDetectionService {
  constructor() {
    this.pool = getPool();
    this.GITHUB_API_BASE = 'https://api.github.com';
  }

  /**
   * Auto-detect and register repositories for a user after GitHub integration
   */
  async autoDetectRepositories(walletAddress, githubUsername, githubToken) {
    try {
      console.log(`Auto-detecting repositories for ${githubUsername} (wallet: ${walletAddress})`);
      
      // Fetch user's repositories from GitHub
      const repositories = await this.fetchUserRepositories(githubUsername, githubToken);
      
      // Score and filter repositories
      const scoredRepos = await this.scoreRepositories(repositories);
      const suggestedRepos = this.filterSuggestedRepositories(scoredRepos);
      
      // Auto-enable public repositories
      const autoEnabledRepos = await this.autoEnablePublicRepositories(
        walletAddress, 
        suggestedRepos.filter(repo => !repo.private)
      );
      
      // Store suggestions for private repositories
      const privateSuggestions = await this.storePrimaryRepositorySuggestions(
        walletAddress,
        suggestedRepos.filter(repo => repo.private)
      );
      
      return {
        success: true,
        auto_enabled: autoEnabledRepos,
        private_suggestions: privateSuggestions,
        total_repositories: repositories.length,
        suggested_count: suggestedRepos.length,
        message: `Auto-enabled ${autoEnabledRepos.length} public repos, ${privateSuggestions.length} private repos suggested`
      };

    } catch (error) {
      console.error('Repository auto-detection error:', error);
      throw new Error(`Auto-detection failed: ${error.message}`);
    }
  }

  /**
   * Fetch user repositories from GitHub API
   */
  async fetchUserRepositories(githubUsername, githubToken) {
    try {
      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ABC-DAO-Bot/1.0'
      };
      
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      // Fetch all user repositories (including private if token provided)
      let allRepos = [];
      let page = 1;
      const perPage = 100;
      
      while (true) {
        const response = await fetch(
          `${this.GITHUB_API_BASE}/users/${githubUsername}/repos?page=${page}&per_page=${perPage}&sort=updated&direction=desc`,
          { headers }
        );
        
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const repos = await response.json();
        
        if (repos.length === 0) break;
        
        allRepos = allRepos.concat(repos);
        page++;
        
        // Limit to prevent excessive API calls
        if (allRepos.length >= 500) break;
      }
      
      console.log(`Fetched ${allRepos.length} repositories for ${githubUsername}`);
      return allRepos;

    } catch (error) {
      console.error('GitHub repository fetch error:', error);
      throw error;
    }
  }

  /**
   * Score repositories based on activity, size, and relevance
   */
  async scoreRepositories(repositories) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return repositories.map(repo => {
      let score = 0;
      const factors = {};

      // Base score for existing repository
      score += 10;
      factors.base = 10;

      // Recent activity (very important)
      const pushedAt = new Date(repo.pushed_at);
      if (pushedAt > thirtyDaysAgo) {
        score += 50;
        factors.recent_activity = 50;
      } else if (pushedAt > ninetyDaysAgo) {
        score += 25;
        factors.moderate_activity = 25;
      }

      // Repository size and engagement
      if (repo.stargazers_count > 0) {
        score += Math.min(repo.stargazers_count * 2, 30);
        factors.stars = Math.min(repo.stargazers_count * 2, 30);
      }
      
      if (repo.forks_count > 0) {
        score += Math.min(repo.forks_count * 3, 20);
        factors.forks = Math.min(repo.forks_count * 3, 20);
      }

      // Language and type preferences (coding projects)
      const language = repo.language?.toLowerCase();
      const codingLanguages = [
        'javascript', 'typescript', 'python', 'rust', 'go', 'java', 
        'c++', 'c', 'solidity', 'swift', 'kotlin', 'ruby', 'php'
      ];
      
      if (language && codingLanguages.includes(language)) {
        score += 20;
        factors.coding_language = 20;
      }

      // Penalize forks (prefer original work)
      if (repo.fork) {
        score -= 15;
        factors.fork_penalty = -15;
      }

      // Penalize archived repositories
      if (repo.archived) {
        score -= 25;
        factors.archived_penalty = -25;
      }

      // Bonus for public repositories (easier to enable)
      if (!repo.private) {
        score += 15;
        factors.public_bonus = 15;
      }

      // Repository size (prefer active projects)
      if (repo.size > 1000) { // 1MB+
        score += 10;
        factors.size_bonus = 10;
      }

      // Has description (indicates maintained project)
      if (repo.description && repo.description.length > 10) {
        score += 5;
        factors.description_bonus = 5;
      }

      // Has topics/tags
      if (repo.topics && repo.topics.length > 0) {
        score += 5;
        factors.topics_bonus = 5;
      }

      return {
        ...repo,
        score,
        score_factors: factors,
        recommended: score >= 40 // Threshold for recommendation
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Filter repositories for suggestions (top scoring, active ones)
   */
  filterSuggestedRepositories(scoredRepos) {
    return scoredRepos
      .filter(repo => repo.score >= 30) // Minimum score threshold
      .filter(repo => !repo.archived)   // Exclude archived
      .slice(0, 10); // Top 10 suggestions
  }

  /**
   * Auto-enable public repositories for earning
   */
  async autoEnablePublicRepositories(walletAddress, publicRepos) {
    const enabledRepos = [];
    
    for (const repo of publicRepos) {
      try {
        // Check if repository is already registered
        const existingRepo = await this.getRegisteredRepository(walletAddress, repo.full_name);
        
        if (!existingRepo) {
          // Register repository for earning
          const registeredRepo = await this.registerRepository(walletAddress, {
            github_repo_id: repo.id,
            repo_name: repo.name,
            repo_full_name: repo.full_name,
            repo_url: repo.html_url,
            clone_url: repo.clone_url,
            ssh_url: repo.ssh_url,
            is_private: false,
            language: repo.language,
            description: repo.description,
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            size: repo.size,
            auto_enabled: true,
            enabled_at: new Date(),
            score: repo.score,
            score_factors: repo.score_factors
          });
          
          enabledRepos.push(registeredRepo);
          
          console.log(`Auto-enabled public repository: ${repo.full_name} (score: ${repo.score})`);
        }
      } catch (error) {
        console.error(`Failed to auto-enable repository ${repo.full_name}:`, error);
        // Continue with other repositories
      }
    }
    
    return enabledRepos;
  }

  /**
   * Store private repository suggestions for manual setup
   */
  async storePrimaryRepositorySuggestions(walletAddress, privateRepos) {
    const suggestions = [];
    
    for (const repo of privateRepos) {
      try {
        // Store as suggestion for manual review
        const suggestion = await this.storeRepositorySuggestion(walletAddress, {
          github_repo_id: repo.id,
          repo_name: repo.name,
          repo_full_name: repo.full_name,
          repo_url: repo.html_url,
          is_private: true,
          language: repo.language,
          description: repo.description,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          size: repo.size,
          score: repo.score,
          score_factors: repo.score_factors,
          suggestion_reason: this.generateSuggestionReason(repo)
        });
        
        suggestions.push(suggestion);
        
      } catch (error) {
        console.error(`Failed to store suggestion for ${repo.full_name}:`, error);
      }
    }
    
    return suggestions;
  }

  /**
   * Register a repository for earning
   */
  async registerRepository(walletAddress, repoData) {
    const query = `
      INSERT INTO user_repositories (
        wallet_address, github_repo_id, repo_name, repo_full_name, repo_url,
        clone_url, ssh_url, is_private, language, description,
        stargazers_count, forks_count, size, auto_enabled, enabled_at,
        score, score_factors, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, 'active'
      )
      RETURNING *
    `;
    
    const values = [
      walletAddress,
      repoData.github_repo_id,
      repoData.repo_name,
      repoData.repo_full_name,
      repoData.repo_url,
      repoData.clone_url,
      repoData.ssh_url,
      repoData.is_private,
      repoData.language,
      repoData.description,
      repoData.stargazers_count,
      repoData.forks_count,
      repoData.size,
      repoData.auto_enabled,
      repoData.enabled_at,
      repoData.score,
      JSON.stringify(repoData.score_factors)
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Store repository suggestion for manual review
   */
  async storeRepositorySuggestion(walletAddress, suggestionData) {
    const query = `
      INSERT INTO repository_suggestions (
        wallet_address, github_repo_id, repo_name, repo_full_name, repo_url,
        is_private, language, description, stargazers_count, forks_count,
        size, score, score_factors, suggestion_reason, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, 'pending'
      )
      RETURNING *
    `;
    
    const values = [
      walletAddress,
      suggestionData.github_repo_id,
      suggestionData.repo_name,
      suggestionData.repo_full_name,
      suggestionData.repo_url,
      suggestionData.is_private,
      suggestionData.language,
      suggestionData.description,
      suggestionData.stargazers_count,
      suggestionData.forks_count,
      suggestionData.size,
      suggestionData.score,
      JSON.stringify(suggestionData.score_factors),
      suggestionData.suggestion_reason
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Check if repository is already registered
   */
  async getRegisteredRepository(walletAddress, repoFullName) {
    const query = `
      SELECT * FROM user_repositories 
      WHERE wallet_address = $1 AND repo_full_name = $2
    `;
    
    const result = await this.pool.query(query, [walletAddress, repoFullName]);
    return result.rows[0] || null;
  }

  /**
   * Generate human-readable suggestion reason
   */
  generateSuggestionReason(repo) {
    const reasons = [];
    
    if (repo.score >= 60) {
      reasons.push('High-value repository');
    }
    
    if (repo.score_factors.recent_activity >= 25) {
      reasons.push('Recently active');
    }
    
    if (repo.score_factors.stars > 0) {
      reasons.push(`${repo.stargazers_count} stars`);
    }
    
    if (repo.score_factors.coding_language) {
      reasons.push(`${repo.language} project`);
    }
    
    if (repo.score_factors.size_bonus) {
      reasons.push('Substantial codebase');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Active repository';
  }

  /**
   * Get repository suggestions for a user
   */
  async getRepositorySuggestions(walletAddress, status = 'pending') {
    const query = `
      SELECT * FROM repository_suggestions 
      WHERE wallet_address = $1 AND status = $2
      ORDER BY score DESC, created_at DESC
    `;
    
    const result = await this.pool.query(query, [walletAddress, status]);
    return result.rows;
  }

  /**
   * Get auto-enabled repositories for a user
   */
  async getAutoEnabledRepositories(walletAddress) {
    const query = `
      SELECT * FROM user_repositories 
      WHERE wallet_address = $1 AND auto_enabled = TRUE AND status = 'active'
      ORDER BY score DESC, enabled_at DESC
    `;
    
    const result = await this.pool.query(query, [walletAddress]);
    return result.rows;
  }

  /**
   * Manual repository enablement (for private repos or manual additions)
   */
  async enableRepository(walletAddress, githubRepoId, setupData = {}) {
    try {
      // Get suggestion or fetch from GitHub
      const suggestion = await this.getRepositorySuggestionById(walletAddress, githubRepoId);
      
      if (!suggestion) {
        throw new Error('Repository suggestion not found');
      }

      // Register repository
      const registeredRepo = await this.registerRepository(walletAddress, {
        ...suggestion,
        auto_enabled: false,
        enabled_at: new Date(),
        webhook_url: setupData.webhook_url,
        webhook_secret: setupData.webhook_secret
      });

      // Mark suggestion as accepted
      await this.updateSuggestionStatus(suggestion.id, 'accepted');

      return {
        success: true,
        repository: registeredRepo,
        message: 'Repository enabled successfully'
      };

    } catch (error) {
      console.error('Repository enablement error:', error);
      throw error;
    }
  }

  /**
   * Get repository suggestion by GitHub repo ID
   */
  async getRepositorySuggestionById(walletAddress, githubRepoId) {
    const query = `
      SELECT * FROM repository_suggestions 
      WHERE wallet_address = $1 AND github_repo_id = $2
    `;
    
    const result = await this.pool.query(query, [walletAddress, githubRepoId]);
    return result.rows[0] || null;
  }

  /**
   * Update suggestion status
   */
  async updateSuggestionStatus(suggestionId, status) {
    const query = `
      UPDATE repository_suggestions 
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [suggestionId, status]);
    return result.rows[0];
  }
}

export default new RepositoryAutoDetectionService();