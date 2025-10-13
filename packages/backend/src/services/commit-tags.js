/**
 * Commit Tag Parser Service
 * 
 * Parses commit messages for special tags that control behavior:
 * - #silent: Skip casting about this commit
 * - #private: Don't include in leaderboards or public stats
 * - #devoff: Temporarily disable dev status
 * - #devon: Re-enable dev status
 * - #norew: Skip reward generation
 * - #priority: Mark as high priority commit
 * - #experiment: Mark as experimental work
 * - #milestone: Mark as milestone achievement
 */

class CommitTagParser {
  constructor() {
    this.supportedTags = new Set([
      'silent',
      'private', 
      'devoff',
      'devon',
      'norew',
      'priority',
      'experiment',
      'milestone'
    ]);
  }

  /**
   * Parse commit message and extract tags
   * @param {string} commitMessage - The commit message
   * @returns {Object} Parsed result with tags and cleaned message
   */
  parseCommitMessage(commitMessage) {
    if (!commitMessage || typeof commitMessage !== 'string') {
      return {
        originalMessage: commitMessage || '',
        cleanedMessage: commitMessage || '',
        tags: [],
        tagMap: {},
        shouldCast: true,
        shouldReward: true,
        isPrivate: false,
        devStatusChange: null,
        priority: 'normal'
      };
    }

    // Find all hashtags in the commit message
    const tagRegex = /#([a-zA-Z_][a-zA-Z0-9_]*)/g;
    const foundTags = [];
    const tagMap = {};
    let match;

    while ((match = tagRegex.exec(commitMessage)) !== null) {
      const tagName = match[1].toLowerCase();
      if (this.supportedTags.has(tagName)) {
        foundTags.push(tagName);
        tagMap[tagName] = true;
      }
    }

    // Clean the message by removing supported tags
    let cleanedMessage = commitMessage;
    for (const tag of foundTags) {
      const tagPattern = new RegExp(`\\s*#${tag}\\b`, 'gi');
      cleanedMessage = cleanedMessage.replace(tagPattern, '');
    }
    cleanedMessage = cleanedMessage.trim();

    // Determine behavior based on tags
    const shouldCast = !tagMap.silent;
    const shouldReward = !tagMap.norew;
    const isPrivate = tagMap.private || false;
    
    // Determine dev status change
    let devStatusChange = null;
    if (tagMap.devoff) {
      devStatusChange = 'disable';
    } else if (tagMap.devon) {
      devStatusChange = 'enable';
    }

    // Determine priority
    let priority = 'normal';
    if (tagMap.priority) {
      priority = 'high';
    } else if (tagMap.experiment) {
      priority = 'experimental';
    } else if (tagMap.milestone) {
      priority = 'milestone';
    }

    return {
      originalMessage: commitMessage,
      cleanedMessage: cleanedMessage || commitMessage,
      tags: foundTags,
      tagMap,
      shouldCast,
      shouldReward,
      isPrivate,
      devStatusChange,
      priority
    };
  }

  /**
   * Check if commit should be cast publicly
   * @param {string} commitMessage 
   * @returns {boolean}
   */
  shouldCastCommit(commitMessage) {
    const parsed = this.parseCommitMessage(commitMessage);
    return parsed.shouldCast;
  }

  /**
   * Check if commit should generate rewards
   * @param {string} commitMessage 
   * @returns {boolean}
   */
  shouldRewardCommit(commitMessage) {
    const parsed = this.parseCommitMessage(commitMessage);
    return parsed.shouldReward;
  }

  /**
   * Check if commit should be private
   * @param {string} commitMessage 
   * @returns {boolean}
   */
  isPrivateCommit(commitMessage) {
    const parsed = this.parseCommitMessage(commitMessage);
    return parsed.isPrivate;
  }

  /**
   * Get commit priority level
   * @param {string} commitMessage 
   * @returns {string}
   */
  getCommitPriority(commitMessage) {
    const parsed = this.parseCommitMessage(commitMessage);
    return parsed.priority;
  }

  /**
   * Get dev status change if any
   * @param {string} commitMessage 
   * @returns {string|null} 'enable', 'disable', or null
   */
  getDevStatusChange(commitMessage) {
    const parsed = this.parseCommitMessage(commitMessage);
    return parsed.devStatusChange;
  }

  /**
   * Get all supported tags for documentation
   * @returns {Object} Tag descriptions
   */
  getSupportedTags() {
    return {
      silent: 'Skip casting about this commit',
      private: "Don't include in leaderboards or public stats",
      devoff: 'Temporarily disable dev status',
      devon: 'Re-enable dev status', 
      norew: 'Skip reward generation',
      priority: 'Mark as high priority commit',
      experiment: 'Mark as experimental work',
      milestone: 'Mark as milestone achievement'
    };
  }

  /**
   * Create help text for commit tags
   * @returns {string} Formatted help text
   */
  getHelpText() {
    const tags = this.getSupportedTags();
    const lines = ['Available commit tags:'];
    
    for (const [tag, description] of Object.entries(tags)) {
      lines.push(`  #${tag} - ${description}`);
    }
    
    lines.push('');
    lines.push('Examples:');
    lines.push('  "fix: update database schema #silent"');
    lines.push('  "feat: add user profiles #milestone"'); 
    lines.push('  "experiment: try new algorithm #experiment #private"');
    lines.push('  "disable dev mode temporarily #devoff"');
    
    return lines.join('\n');
  }
}

export default new CommitTagParser();