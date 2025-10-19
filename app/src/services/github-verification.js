import { Octokit } from '@octokit/rest';

export class GitHubVerificationService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN // GitHub token for API access
    });
  }

  /**
   * Verify a GitHub user and analyze their repositories
   * @param {string} username - GitHub username
   * @returns {Object} Verification result with user info and qualifying repos
   */
  async verifyUser(username) {
    try {
      // Get user profile
      const { data: user } = await this.octokit.rest.users.getByUsername({
        username
      });

      // Get user's repositories
      const { data: repos } = await this.octokit.rest.repos.listForUser({
        username,
        type: 'all',
        sort: 'updated',
        per_page: 100
      });

      // Get recent activity (commits in last 90 days)
      const recentActivity = await this.getRecentActivity(username);

      // Analyze repositories for earning potential
      const qualifyingRepos = await this.analyzeRepositories(repos, username);

      // Calculate verification score
      const verificationScore = this.calculateVerificationScore(user, repos, recentActivity, qualifyingRepos);

      return {
        verified: verificationScore.isValid,
        user: {
          login: user.login,
          name: user.name,
          bio: user.bio,
          company: user.company,
          location: user.location,
          public_repos: user.public_repos,
          followers: user.followers,
          following: user.following,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        activity: recentActivity,
        repositories: {
          total: repos.length,
          qualifying: qualifyingRepos,
          languages: this.extractLanguages(repos),
          topics: this.extractTopics(repos)
        },
        score: verificationScore,
        estimatedEarnings: this.calculateEarningsEstimate(qualifyingRepos, recentActivity)
      };

    } catch (error) {
      if (error.status === 404) {
        return {
          verified: false,
          error: 'GitHub user not found',
          user: null
        };
      }
      throw error;
    }
  }

  /**
   * Get recent commit activity for a user
   * @param {string} username - GitHub username
   * @returns {Object} Activity summary
   */
  async getRecentActivity(username) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Search for recent commits by this user
      const { data: recentCommits } = await this.octokit.rest.search.commits({
        q: `author:${username} author-date:>=${thirtyDaysAgo.toISOString().split('T')[0]}`,
        sort: 'author-date',
        order: 'desc',
        per_page: 100
      });

      const { data: olderCommits } = await this.octokit.rest.search.commits({
        q: `author:${username} author-date:${ninetyDaysAgo.toISOString().split('T')[0]}..${thirtyDaysAgo.toISOString().split('T')[0]}`,
        sort: 'author-date',
        order: 'desc',
        per_page: 100
      });

      return {
        last_30_days: {
          commits: recentCommits.total_count,
          repositories: [...new Set(recentCommits.items.map(c => c.repository.full_name))].length
        },
        last_90_days: {
          commits: recentCommits.total_count + olderCommits.total_count,
          repositories: [...new Set([
            ...recentCommits.items.map(c => c.repository.full_name),
            ...olderCommits.items.map(c => c.repository.full_name)
          ])].length
        }
      };

    } catch (error) {
      console.warn('Could not fetch recent activity:', error.message);
      return {
        last_30_days: { commits: 0, repositories: 0 },
        last_90_days: { commits: 0, repositories: 0 }
      };
    }
  }

  /**
   * Analyze repositories for ABC DAO qualification
   * @param {Array} repos - GitHub repositories
   * @param {string} username - GitHub username
   * @returns {Array} Qualifying repositories with metadata
   */
  async analyzeRepositories(repos, username) {
    const qualifying = [];

    for (const repo of repos.slice(0, 20)) { // Limit to first 20 repos to avoid rate limits
      try {
        // Skip forks unless they have significant commits from the user
        if (repo.fork) {
          // TODO: Could check if user has made commits to this fork
          continue;
        }

        // Skip archived or disabled repos
        if (repo.archived || repo.disabled) {
          continue;
        }

        // Get recent commits to check activity
        let hasRecentCommits = false;
        try {
          const { data: commits } = await this.octokit.rest.repos.listCommits({
            owner: repo.owner.login,
            repo: repo.name,
            author: username,
            since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
            per_page: 1
          });
          hasRecentCommits = commits.length > 0;
        } catch (error) {
          // If we can't access commits, skip this repo
          continue;
        }

        // Calculate earning potential
        const earningPotential = this.calculateRepoEarningPotential(repo, hasRecentCommits);

        if (earningPotential.qualifies) {
          qualifying.push({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            size: repo.size,
            updated_at: repo.updated_at,
            has_recent_commits: hasRecentCommits,
            earning_potential: earningPotential,
            topics: repo.topics || []
          });
        }

        // Rate limiting - small delay between repo checks
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.warn(`Error analyzing repo ${repo.full_name}:`, error.message);
        continue;
      }
    }

    return qualifying;
  }

  /**
   * Calculate earning potential for a repository
   * @param {Object} repo - GitHub repository object
   * @param {boolean} hasRecentCommits - Whether user has recent commits
   * @returns {Object} Earning potential analysis
   */
  calculateRepoEarningPotential(repo, hasRecentCommits) {
    let score = 0;
    const factors = [];

    // Base qualification: must be a code repository
    if (!repo.language && repo.size < 10) {
      return { qualifies: false, score: 0, factors: ['Not a code repository'] };
    }

    // Recent activity (most important)
    if (hasRecentCommits) {
      score += 40;
      factors.push('Recent commits (+40)');
    } else {
      factors.push('No recent commits (-40)');
    }

    // Repository size and activity
    if (repo.size > 100) {
      score += 10;
      factors.push('Substantial codebase (+10)');
    }

    // Language bonus
    const bonusLanguages = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Solidity'];
    if (bonusLanguages.includes(repo.language)) {
      score += 15;
      factors.push(`${repo.language} language (+15)`);
    }

    // Star/fork indicators of quality
    if (repo.stargazers_count > 5) {
      score += 10;
      factors.push('Community interest (+10)');
    }

    // Recently updated
    const lastUpdate = new Date(repo.updated_at);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) {
      score += 15;
      factors.push('Recently updated (+15)');
    }

    // Topics that indicate serious development
    const goodTopics = repo.topics?.filter(topic => 
      ['web3', 'blockchain', 'defi', 'nft', 'api', 'framework', 'library', 'tool'].includes(topic)
    ) || [];
    if (goodTopics.length > 0) {
      score += 10;
      factors.push(`Relevant topics: ${goodTopics.join(', ')} (+10)`);
    }

    const qualifies = score >= 50; // Threshold for earning potential

    return {
      qualifies,
      score,
      factors,
      tier: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low'
    };
  }

  /**
   * Calculate overall verification score
   * @param {Object} user - GitHub user object
   * @param {Array} repos - All repositories
   * @param {Object} activity - Recent activity data
   * @param {Array} qualifyingRepos - Qualifying repositories
   * @returns {Object} Verification score and details
   */
  calculateVerificationScore(user, repos, activity, qualifyingRepos) {
    let score = 0;
    const factors = [];

    // Account age (older accounts are more trustworthy)
    const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAge > 365) {
      score += 20;
      factors.push('Account older than 1 year (+20)');
    } else if (accountAge > 90) {
      score += 10;
      factors.push('Account older than 90 days (+10)');
    }

    // Repository count
    if (user.public_repos > 10) {
      score += 15;
      factors.push('10+ public repositories (+15)');
    } else if (user.public_repos > 3) {
      score += 10;
      factors.push('3+ public repositories (+10)');
    }

    // Recent activity
    if (activity.last_30_days.commits > 10) {
      score += 25;
      factors.push('Active coder (10+ commits in 30 days) (+25)');
    } else if (activity.last_30_days.commits > 0) {
      score += 15;
      factors.push('Some recent activity (+15)');
    }

    // Qualifying repositories
    if (qualifyingRepos.length > 3) {
      score += 20;
      factors.push('Multiple qualifying repositories (+20)');
    } else if (qualifyingRepos.length > 0) {
      score += 15;
      factors.push('Has qualifying repositories (+15)');
    } else {
      factors.push('No qualifying repositories (-20)');
    }

    // Social proof
    if (user.followers > 50) {
      score += 10;
      factors.push('Good community following (+10)');
    }

    // Profile completeness
    if (user.name && user.bio) {
      score += 5;
      factors.push('Complete profile (+5)');
    }

    const isValid = score >= 60 && qualifyingRepos.length > 0; // Must have at least one qualifying repo

    return {
      score,
      isValid,
      factors,
      threshold: 60,
      recommendation: isValid ? 'approve' : 'reject'
    };
  }

  /**
   * Calculate estimated monthly earnings
   * @param {Array} qualifyingRepos - Qualifying repositories
   * @param {Object} activity - Recent activity data
   * @returns {Object} Earnings estimate
   */
  calculateEarningsEstimate(qualifyingRepos, activity) {
    if (qualifyingRepos.length === 0) {
      return {
        monthly_commits_estimate: 0,
        monthly_earnings_estimate: 0,
        daily_limit: 10,
        explanation: 'No qualifying repositories found'
      };
    }

    // Estimate based on recent activity
    const dailyCommitRate = activity.last_30_days.commits / 30;
    const projectedMonthlyCommits = Math.min(dailyCommitRate * 30, 300); // Cap at 300 (10/day * 30 days)

    // ABC DAO reward calculation (50k-1M $ABC per commit, random)
    const avgReward = 525000; // Average of 50k-1M range
    const monthlyEarnings = projectedMonthlyCommits * avgReward;

    return {
      monthly_commits_estimate: Math.round(projectedMonthlyCommits),
      monthly_earnings_estimate: Math.round(monthlyEarnings),
      daily_limit: 10,
      avg_reward_per_commit: avgReward,
      high_tier_repos: qualifyingRepos.filter(r => r.earning_potential.tier === 'high').length,
      explanation: `Based on ${activity.last_30_days.commits} commits in last 30 days across ${qualifyingRepos.length} qualifying repositories`
    };
  }

  /**
   * Extract programming languages from repositories
   * @param {Array} repos - GitHub repositories
   * @returns {Object} Language distribution
   */
  extractLanguages(repos) {
    const languages = {};
    repos.forEach(repo => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    // Sort by frequency
    return Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Top 10 languages
      .reduce((obj, [lang, count]) => ({ ...obj, [lang]: count }), {});
  }

  /**
   * Extract topics from repositories
   * @param {Array} repos - GitHub repositories
   * @returns {Array} Most common topics
   */
  extractTopics(repos) {
    const topics = {};
    repos.forEach(repo => {
      if (repo.topics) {
        repo.topics.forEach(topic => {
          topics[topic] = (topics[topic] || 0) + 1;
        });
      }
    });

    return Object.entries(topics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15) // Top 15 topics
      .map(([topic, count]) => ({ topic, count }));
  }
}