/**
 * DigestFormatter - Formats analytics data into engaging Farcaster cast content
 * Phase 2: Digest Generation Logic
 */
class DigestFormatter {
  constructor() {
    this.maxCastLength = 1024; // Farcaster character limit
  }

  /**
   * Format weekly digest from analytics data
   */
  formatWeeklyDigest(analytics) {
    const { 
      repositoryBreakdown, 
      contributorRankings, 
      developmentTrends, 
      rewardDistribution,
      communityGrowth,
      totalCommits,
      period
    } = analytics;

    // Build digest sections
    const sections = [];
    
    // Header
    sections.push('📊 WEEKLY DEVELOPMENT DIGEST');
    sections.push('');

    // Repository activity section
    if (repositoryBreakdown.length > 0) {
      sections.push('🏗️ Repository Activity:');
      const repoLines = this.formatRepositorySection(repositoryBreakdown, Math.min(5, repositoryBreakdown.length));
      sections.push(...repoLines);
      sections.push('');
    }

    // Top contributors section
    if (contributorRankings.length > 0) {
      sections.push('👨‍💻 Top Contributors:');
      const contributorLines = this.formatContributorSection(contributorRankings, Math.min(3, contributorRankings.length));
      sections.push(...contributorLines);
      sections.push('');
    }

    // Development focus section
    if (developmentTrends.topCategories.length > 0) {
      sections.push('🎯 Development Focus:');
      const trendsLines = this.formatTrendsSection(developmentTrends);
      sections.push(...trendsLines);
      sections.push('');
    }

    // Metrics and growth section
    sections.push('📈 Weekly Metrics:');
    const metricsLines = this.formatMetricsSection(rewardDistribution, communityGrowth, totalCommits);
    sections.push(...metricsLines);
    sections.push('');

    // Footer
    sections.push('#ABCDAO #WeeklyDigest #AlwaysBeCoding');

    // Join sections and ensure length limits
    let digest = sections.join('\n');
    
    // Truncate if too long
    if (digest.length > this.maxCastLength) {
      digest = this.truncateDigest(sections);
    }

    return digest;
  }

  /**
   * Format repository activity section
   */
  formatRepositorySection(repositories, maxRepos = 5) {
    return repositories.slice(0, maxRepos).map(repo => {
      const repoName = this.getShortRepoName(repo.repository);
      const commits = parseInt(repo.commit_count);
      const rewards = parseInt(repo.total_rewards || 0);
      const contributors = parseInt(repo.unique_contributors);
      
      let line = `• ${repoName}: ${commits} commit${commits !== 1 ? 's' : ''}`;
      
      if (rewards > 0) {
        line += ` (+${rewards.toLocaleString()} $ABC)`;
      }
      
      if (contributors > 1) {
        line += ` [${contributors} devs]`;
      }
      
      return line;
    });
  }

  /**
   * Format top contributors section
   */
  formatContributorSection(contributors, maxContributors = 3) {
    return contributors.slice(0, maxContributors).map((contributor, index) => {
      const username = contributor.author_username || 'anonymous';
      const commits = parseInt(contributor.commit_count);
      const rewards = parseInt(contributor.total_rewards || 0);
      const rank = index + 1;
      
      const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏆';
      
      let line = `${emoji} @${username}: ${commits} commit${commits !== 1 ? 's' : ''}`;
      
      if (rewards > 0) {
        line += `, ${rewards.toLocaleString()} $ABC earned`;
      }
      
      return line;
    });
  }

  /**
   * Format development trends section
   */
  formatTrendsSection(trends) {
    const lines = [];
    
    if (trends.topCategories.length > 0) {
      const top3 = trends.topCategories.slice(0, 3);
      const trendLine = top3.map(cat => {
        const emoji = this.getCategoryEmoji(cat.name);
        return `${emoji} ${this.capitalize(cat.name)} (${cat.percentage}%)`;
      }).join(', ');
      
      lines.push(`• ${trendLine}`);
    }

    // Add priority work if significant
    if (trends.priorityDistribution.high > 0 || trends.priorityDistribution.milestone > 0) {
      const highPriority = (trends.priorityDistribution.high || 0) + (trends.priorityDistribution.milestone || 0);
      lines.push(`• ⭐ ${highPriority} high-priority commit${highPriority !== 1 ? 's' : ''}`);
    }

    return lines;
  }

  /**
   * Format metrics and community growth section
   */
  formatMetricsSection(rewards, community, totalCommits) {
    const lines = [];
    
    // Total activity
    lines.push(`• 📝 ${totalCommits} total commit${totalCommits !== 1 ? 's' : ''} pushed`);
    
    // Rewards distributed
    if (rewards.totalRewards > 0) {
      lines.push(`• 💰 ${rewards.totalRewards.toLocaleString()} $ABC distributed`);
    }
    
    // Active contributors
    if (community.totalActive > 0) {
      lines.push(`• 👥 ${community.totalActive} active developer${community.totalActive !== 1 ? 's' : ''}`);
    }
    
    // New contributors
    if (community.newContributorCount > 0) {
      lines.push(`• 🎉 ${community.newContributorCount} new contributor${community.newContributorCount !== 1 ? 's' : ''} joined`);
    }

    return lines;
  }

  /**
   * Format monthly digest (more comprehensive)
   */
  formatMonthlyDigest(analytics) {
    const { 
      repositoryBreakdown, 
      contributorRankings, 
      developmentTrends, 
      rewardDistribution,
      communityGrowth,
      totalCommits,
      period
    } = analytics;

    const sections = [];
    
    // Header with month
    const monthName = period.start.toLocaleString('default', { month: 'long', year: 'numeric' });
    sections.push(`📊 ${monthName.toUpperCase()} DEVELOPMENT SUMMARY`);
    sections.push('');

    // Overall stats
    sections.push('📈 Monthly Overview:');
    sections.push(`• ${totalCommits} commits across ${repositoryBreakdown.length} repositories`);
    sections.push(`• ${rewardDistribution.totalRewards.toLocaleString()} $ABC in developer rewards`);
    sections.push(`• ${communityGrowth.totalActive} active contributors`);
    if (communityGrowth.newContributorCount > 0) {
      sections.push(`• ${communityGrowth.newContributorCount} new developers joined`);
    }
    sections.push('');

    // Top repositories
    if (repositoryBreakdown.length > 0) {
      sections.push('🏗️ Most Active Repositories:');
      const repoLines = this.formatRepositorySection(repositoryBreakdown, 5);
      sections.push(...repoLines);
      sections.push('');
    }

    // Top contributors
    if (contributorRankings.length > 0) {
      sections.push('🏆 Top Contributors:');
      const contributorLines = this.formatContributorSection(contributorRankings, 5);
      sections.push(...contributorLines);
      sections.push('');
    }

    // Development focus
    if (developmentTrends.topCategories.length > 0) {
      sections.push('🎯 Development Breakdown:');
      const trendsLines = this.formatTrendsSection(developmentTrends);
      sections.push(...trendsLines);
      sections.push('');
    }

    sections.push('#ABCDAO #MonthlyDigest #AlwaysBeCoding');

    let digest = sections.join('\n');
    
    if (digest.length > this.maxCastLength) {
      digest = this.truncateDigest(sections);
    }

    return digest;
  }

  /**
   * Format special milestone digests
   */
  formatMilestoneDigest(milestones, period) {
    const sections = [];
    
    sections.push('🎯 MILESTONE ACHIEVEMENTS');
    sections.push('');

    milestones.forEach(milestone => {
      const emoji = this.getMilestoneEmoji(milestone.type);
      sections.push(`${emoji} ${milestone.message}`);
      
      if (milestone.details && milestone.details.length > 0) {
        milestone.details.slice(0, 2).forEach(detail => {
          if (milestone.type === 'high_reward') {
            sections.push(`  • @${detail.author}: ${detail.reward.toLocaleString()} $ABC`);
          } else if (milestone.type === 'priority_work') {
            sections.push(`  • @${detail.author}: ${detail.message}`);
          }
        });
      }
      sections.push('');
    });

    sections.push('#ABCDAO #Milestones #AlwaysBeCoding');

    return sections.join('\n');
  }

  /**
   * Truncate digest if it exceeds character limits
   */
  truncateDigest(sections) {
    // Keep header and footer, trim middle sections
    const header = sections.slice(0, 3);
    const footer = sections.slice(-1);
    const middle = sections.slice(3, -1);
    
    let truncated = [...header];
    let currentLength = header.join('\n').length + footer.join('\n').length;
    
    for (const section of middle) {
      if (currentLength + section.length + 1 < this.maxCastLength - 50) { // Leave some buffer
        truncated.push(section);
        currentLength += section.length + 1;
      }
    }
    
    truncated.push(...footer);
    return truncated.join('\n');
  }

  /**
   * Helper: Get shortened repository name
   */
  getShortRepoName(repository) {
    if (!repository) return 'unknown';
    
    // Remove "abc-dao/" prefix if present
    if (repository.startsWith('abc-dao/')) {
      return repository.replace('abc-dao/', '');
    }
    
    // Get last part if it's a full path
    const parts = repository.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Helper: Get emoji for development category
   */
  getCategoryEmoji(category) {
    const emojis = {
      frontend: '🎨',
      backend: '⚙️',
      automation: '🤖',
      blockchain: '⛓️',
      documentation: '📚',
      testing: '🧪',
      bugfix: '🐛',
      feature: '✨',
      refactor: '🔧'
    };
    
    return emojis[category] || '📝';
  }

  /**
   * Helper: Get emoji for milestone type
   */
  getMilestoneEmoji(type) {
    const emojis = {
      high_reward: '💎',
      priority_work: '⭐',
      high_activity: '🔥',
      new_repository: '🆕',
      major_feature: '🚀'
    };
    
    return emojis[type] || '🎯';
  }

  /**
   * Helper: Capitalize first letter
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Preview digest without posting
   */
  previewDigest(analytics, type = 'weekly') {
    const digest = type === 'monthly' ? 
      this.formatMonthlyDigest(analytics) : 
      this.formatWeeklyDigest(analytics);
    
    return {
      content: digest,
      length: digest.length,
      withinLimit: digest.length <= this.maxCastLength,
      sections: digest.split('\n\n').length,
      metadata: {
        totalCommits: analytics.totalCommits,
        repositories: analytics.repositoryBreakdown.length,
        contributors: analytics.contributorRankings.length,
        totalRewards: analytics.rewardDistribution.totalRewards,
        period: {
          start: analytics.period.start.toISOString().split('T')[0],
          end: analytics.period.end.toISOString().split('T')[0]
        }
      }
    };
  }

  /**
   * Format simple activity summary (for low-activity periods)
   */
  formatSimpleSummary(analytics) {
    const { totalCommits, repositoryBreakdown, contributorRankings, rewardDistribution } = analytics;
    
    if (totalCommits === 0) {
      return `📊 Weekly Update: Quiet week in the codebase - developers taking a well-deserved break! 🌴\n\nNext week: Back to building! 🚀\n\n#ABCDAO #WeeklyDigest`;
    }
    
    const topRepo = repositoryBreakdown[0];
    const topContributor = contributorRankings[0];
    
    let summary = `📊 Quick Weekly Update:\n\n`;
    summary += `• ${totalCommits} commit${totalCommits !== 1 ? 's' : ''} pushed\n`;
    
    if (topRepo) {
      summary += `• Primary work in ${this.getShortRepoName(topRepo.repository)}\n`;
    }
    
    if (topContributor) {
      summary += `• Top contributor: @${topContributor.author_username}\n`;
    }
    
    if (rewardDistribution.totalRewards > 0) {
      summary += `• ${rewardDistribution.totalRewards.toLocaleString()} $ABC distributed\n`;
    }
    
    summary += `\nKeep building! 🚀\n\n#ABCDAO #WeeklyDigest`;
    
    return summary;
  }
}

export { DigestFormatter };
export default DigestFormatter;