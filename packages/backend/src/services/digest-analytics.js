import { CommitDigestService } from './commit-digest-service.js';

/**
 * DigestAnalytics - Analyzes commit data to generate insights for digest content
 * Phase 2: Digest Generation Logic
 */
class DigestAnalytics {
  constructor() {
    this.digestService = new CommitDigestService();
  }

  /**
   * Generate comprehensive weekly activity analysis
   */
  async analyzeWeeklyActivity(startDate, endDate) {
    console.log(`📊 Analyzing weekly activity: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    try {
      const [
        commits,
        repositoryBreakdown,
        contributorRankings,
        developmentTrends,
        rewardDistribution
      ] = await Promise.all([
        this.digestService.getCommitsByDateRange(startDate, endDate),
        this.digestService.getRepositoryActivity(startDate, endDate),
        this.digestService.getTopContributors(startDate, endDate, 10),
        this.analyzeTechnicalFocus(startDate, endDate),
        this.calculateRewardMetrics(startDate, endDate)
      ]);

      const communityGrowth = await this.trackNewContributors(startDate, endDate);
      
      const analytics = {
        period: {
          start: startDate,
          end: endDate,
          days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        },
        totalCommits: commits.length,
        repositoryBreakdown,
        contributorRankings,
        developmentTrends,
        rewardDistribution,
        communityGrowth,
        rawCommits: commits
      };

      console.log(`✅ Analysis complete: ${analytics.totalCommits} commits, ${analytics.repositoryBreakdown.length} repos, ${analytics.contributorRankings.length} contributors`);
      return analytics;
      
    } catch (error) {
      console.error('❌ Weekly activity analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Analyze technical focus areas from commit messages
   */
  async analyzeTechnicalFocus(startDate, endDate) {
    const commits = await this.digestService.getCommitsByDateRange(startDate, endDate);
    
    const categories = {
      frontend: { count: 0, keywords: ['ui', 'frontend', 'component', 'styling', 'dashboard', 'page', 'react', 'tsx', 'css'] },
      backend: { count: 0, keywords: ['api', 'backend', 'endpoint', 'server', 'database', 'service', 'route', 'auth'] },
      automation: { count: 0, keywords: ['bot', 'automation', 'cron', 'job', 'script', 'automated', 'scheduler'] },
      blockchain: { count: 0, keywords: ['contract', 'ethereum', 'staking', 'token', 'web3', 'blockchain', 'wallet'] },
      documentation: { count: 0, keywords: ['docs', 'documentation', 'readme', 'guide', 'comment', 'doc'] },
      testing: { count: 0, keywords: ['test', 'testing', 'spec', 'unit', 'integration', 'coverage'] },
      bugfix: { count: 0, keywords: ['fix', 'bug', 'error', 'issue', 'debug', 'patch', 'hotfix'] },
      feature: { count: 0, keywords: ['add', 'new', 'feature', 'implement', 'create', 'build'] },
      refactor: { count: 0, keywords: ['refactor', 'cleanup', 'optimize', 'improve', 'restructure', 'clean'] }
    };

    // Analyze commit messages and tags
    commits.forEach(commit => {
      const message = (commit.commit_message || '').toLowerCase();
      const tags = commit.commit_tags || {};
      const priority = commit.priority_level || 'normal';

      // Check commit tags first (more reliable)
      if (tags.category) {
        const category = tags.category.toLowerCase();
        if (categories[category]) {
          categories[category].count++;
          return;
        }
      }

      // Fallback to keyword analysis
      let categorized = false;
      for (const [categoryName, categoryData] of Object.entries(categories)) {
        if (categorized) break;
        
        for (const keyword of categoryData.keywords) {
          if (message.includes(keyword)) {
            categoryData.count++;
            categorized = true;
            break;
          }
        }
      }
    });

    // Calculate percentages and top categories
    const totalCategorized = Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);
    const topCategories = Object.entries(categories)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        count: data.count,
        percentage: totalCategorized > 0 ? Math.round((data.count / totalCategorized) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Analyze priority distribution
    const priorityDistribution = commits.reduce((acc, commit) => {
      const priority = commit.priority_level || 'normal';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return {
      categories,
      topCategories,
      priorityDistribution,
      totalCategorized,
      uncategorized: commits.length - totalCategorized
    };
  }

  /**
   * Calculate reward distribution metrics
   */
  async calculateRewardMetrics(startDate, endDate) {
    const [commits, contributors] = await Promise.all([
      this.digestService.getCommitsByDateRange(startDate, endDate),
      this.digestService.getTopContributors(startDate, endDate, 100)
    ]);

    const totalRewards = commits.reduce((sum, commit) => sum + (commit.reward_amount || 0), 0);
    const averageReward = commits.length > 0 ? Math.round(totalRewards / commits.length) : 0;

    // Reward distribution by priority
    const rewardByPriority = commits.reduce((acc, commit) => {
      const priority = commit.priority_level || 'normal';
      if (!acc[priority]) {
        acc[priority] = { count: 0, totalRewards: 0 };
      }
      acc[priority].count++;
      acc[priority].totalRewards += commit.reward_amount || 0;
      return acc;
    }, {});

    // Calculate average by priority
    Object.keys(rewardByPriority).forEach(priority => {
      const data = rewardByPriority[priority];
      data.averageReward = data.count > 0 ? Math.round(data.totalRewards / data.count) : 0;
    });

    // Top earners
    const topEarners = contributors.slice(0, 5).map(contributor => ({
      username: contributor.author_username,
      commits: parseInt(contributor.commit_count),
      rewards: parseInt(contributor.total_rewards || 0),
      averagePerCommit: parseInt(contributor.commit_count) > 0 ? 
        Math.round(parseInt(contributor.total_rewards || 0) / parseInt(contributor.commit_count)) : 0
    }));

    return {
      totalRewards,
      averageReward,
      rewardByPriority,
      topEarners,
      totalContributors: contributors.length
    };
  }

  /**
   * Track new contributors and community growth
   */
  async trackNewContributors(startDate, endDate) {
    // Get all contributors in the period
    const periodContributors = await this.digestService.getTopContributors(startDate, endDate, 100);
    
    // Get contributors from before this period (last 30 days before start)
    const lookbackStart = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const existingContributors = await this.digestService.getTopContributors(lookbackStart, startDate, 100);
    
    const existingFids = new Set(existingContributors.map(c => c.author_fid));
    
    // Identify new contributors
    const newContributors = periodContributors.filter(contributor => 
      !existingFids.has(contributor.author_fid)
    );

    // Identify returning contributors (active in period and before)
    const returningContributors = periodContributors.filter(contributor =>
      existingFids.has(contributor.author_fid)
    );

    // Calculate activity metrics
    const totalCommitsThisPeriod = periodContributors.reduce((sum, c) => sum + parseInt(c.commit_count), 0);
    const averageCommitsPerContributor = periodContributors.length > 0 ? 
      Math.round(totalCommitsThisPeriod / periodContributors.length) : 0;

    return {
      newContributors: newContributors.map(c => ({
        username: c.author_username,
        fid: c.author_fid,
        commits: parseInt(c.commit_count),
        rewards: parseInt(c.total_rewards || 0),
        repositories: c.repositories
      })),
      returningContributors: returningContributors.length,
      totalActive: periodContributors.length,
      newContributorCount: newContributors.length,
      averageCommitsPerContributor,
      contributorRetentionRate: existingContributors.length > 0 ? 
        Math.round((returningContributors.length / existingContributors.length) * 100) : 0
    };
  }

  /**
   * Generate repository insights and comparisons
   */
  async analyzeRepositoryTrends(startDate, endDate) {
    const repositoryBreakdown = await this.digestService.getRepositoryActivity(startDate, endDate);
    
    // Get previous period for comparison (same duration before startDate)
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevEndDate = startDate;
    const prevStartDate = new Date(startDate.getTime() - periodDuration);
    
    const previousBreakdown = await this.digestService.getRepositoryActivity(prevStartDate, prevEndDate);
    const prevRepoMap = new Map(previousBreakdown.map(repo => [repo.repository, repo]));

    // Calculate trends
    const trendsAnalysis = repositoryBreakdown.map(repo => {
      const prevData = prevRepoMap.get(repo.repository);
      const currentCommits = parseInt(repo.commit_count);
      const prevCommits = prevData ? parseInt(prevData.commit_count) : 0;
      
      let trend = 'new';
      let changePercent = 0;
      
      if (prevCommits > 0) {
        changePercent = Math.round(((currentCommits - prevCommits) / prevCommits) * 100);
        if (changePercent > 10) trend = 'up';
        else if (changePercent < -10) trend = 'down';
        else trend = 'stable';
      } else if (currentCommits > 0) {
        trend = 'new';
      }

      return {
        repository: repo.repository,
        currentCommits,
        prevCommits,
        trend,
        changePercent,
        totalRewards: parseInt(repo.total_rewards || 0),
        uniqueContributors: parseInt(repo.unique_contributors),
        contributors: repo.contributors
      };
    });

    return {
      repositoryTrends: trendsAnalysis,
      mostActive: trendsAnalysis[0] || null,
      fastestGrowing: trendsAnalysis
        .filter(repo => repo.trend === 'up')
        .sort((a, b) => b.changePercent - a.changePercent)[0] || null,
      newRepositories: trendsAnalysis.filter(repo => repo.trend === 'new')
    };
  }

  /**
   * Detect significant milestones or achievements
   */
  async detectMilestones(startDate, endDate) {
    const commits = await this.digestService.getCommitsByDateRange(startDate, endDate);
    const milestones = [];

    // High-reward commits (potential significant features)
    const highRewardCommits = commits
      .filter(commit => (commit.reward_amount || 0) >= 8000)
      .sort((a, b) => (b.reward_amount || 0) - (a.reward_amount || 0));

    if (highRewardCommits.length > 0) {
      milestones.push({
        type: 'high_reward',
        message: `High-impact contributions: ${highRewardCommits.length} commits with 8000+ $ABC rewards`,
        details: highRewardCommits.slice(0, 3).map(commit => ({
          author: commit.author_username,
          message: commit.commit_message?.substring(0, 60) + '...',
          reward: commit.reward_amount,
          repository: commit.repository
        }))
      });
    }

    // Priority commits (milestone/high priority work)
    const priorityCommits = commits.filter(commit => 
      commit.priority_level === 'high' || commit.priority_level === 'milestone'
    );

    if (priorityCommits.length > 0) {
      milestones.push({
        type: 'priority_work',
        message: `Priority development: ${priorityCommits.length} high-priority commits completed`,
        details: priorityCommits.slice(0, 3).map(commit => ({
          author: commit.author_username,
          message: commit.commit_message?.substring(0, 60) + '...',
          priority: commit.priority_level,
          repository: commit.repository
        }))
      });
    }

    // Very active days (high commit volume)
    const commitsByDay = commits.reduce((acc, commit) => {
      const day = commit.created_at.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const highActivityDays = Object.entries(commitsByDay)
      .filter(([_, count]) => count >= 5)
      .sort(([_, a], [__, b]) => b - a);

    if (highActivityDays.length > 0) {
      milestones.push({
        type: 'high_activity',
        message: `High activity days: ${highActivityDays.length} days with 5+ commits`,
        details: highActivityDays.slice(0, 2).map(([date, count]) => ({
          date,
          commits: count
        }))
      });
    }

    return milestones;
  }

  /**
   * Generate summary insights for digest
   */
  generateInsights(analytics) {
    const insights = [];
    
    // Repository focus insight
    if (analytics.repositoryBreakdown.length > 0) {
      const topRepo = analytics.repositoryBreakdown[0];
      const percentage = Math.round((topRepo.commit_count / analytics.totalCommits) * 100);
      
      if (percentage >= 50) {
        insights.push(`Heavy focus on ${topRepo.repository} (${percentage}% of commits)`);
      } else {
        insights.push(`Balanced development across ${analytics.repositoryBreakdown.length} repositories`);
      }
    }

    // Development trends insight
    if (analytics.developmentTrends.topCategories.length > 0) {
      const topCategory = analytics.developmentTrends.topCategories[0];
      insights.push(`Primary focus: ${topCategory.name} development (${topCategory.percentage}%)`);
    }

    // Community growth insight
    if (analytics.communityGrowth.newContributorCount > 0) {
      insights.push(`${analytics.communityGrowth.newContributorCount} new contributors joined`);
    }

    // Reward distribution insight
    const avgReward = analytics.rewardDistribution.averageReward;
    if (avgReward > 0) {
      insights.push(`Average reward: ${avgReward.toLocaleString()} $ABC per commit`);
    }

    return insights;
  }
}

export { DigestAnalytics };
export default DigestAnalytics;