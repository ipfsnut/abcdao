/**
 * DigestPerformanceMonitor - Tracks performance metrics and system health for digest operations
 * Phase 4: Performance Optimization & Monitoring
 */
class DigestPerformanceMonitor {
  constructor() {
    this.metrics = {
      digestGenerations: [],
      databaseQueries: [],
      farcasterPosts: [],
      errors: [],
      systemHealth: {
        lastCheck: null,
        status: 'unknown',
        issues: []
      }
    };
    
    // Retention limits to prevent memory leaks
    this.maxMetricsRetention = {
      digestGenerations: 100,
      databaseQueries: 500,
      farcasterPosts: 200,
      errors: 100
    };
  }

  /**
   * Record digest generation performance
   */
  recordDigestGeneration(analytics) {
    const record = {
      timestamp: new Date(),
      performance: analytics.performance,
      dataMetrics: {
        totalCommits: analytics.totalCommits,
        repositories: analytics.repositoryBreakdown?.length || 0,
        contributors: analytics.contributorRankings?.length || 0,
        totalRewards: analytics.rewardDistribution?.totalRewards || 0
      },
      success: true
    };
    
    this.metrics.digestGenerations.push(record);
    this._trimArray('digestGenerations');
    
    // Log performance warnings
    const totalDuration = analytics.performance?.totalDuration || 0;
    if (totalDuration > 10000) { // 10 seconds
      console.warn(`⚠️ Slow digest generation: ${totalDuration}ms (threshold: 10s)`);
    }
    
    if (analytics.totalCommits > 500) {
      console.warn(`⚠️ Large dataset processed: ${analytics.totalCommits} commits`);
    }
    
    console.log(`📊 Performance recorded: ${totalDuration}ms for ${analytics.totalCommits} commits`);
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(operation, duration, resultCount = null, error = null) {
    const record = {
      timestamp: new Date(),
      operation,
      duration,
      resultCount,
      success: !error,
      error: error?.message || null
    };
    
    this.metrics.databaseQueries.push(record);
    this._trimArray('databaseQueries');
    
    // Log slow queries
    if (duration > 5000) { // 5 seconds
      console.warn(`⚠️ Slow database query: ${operation} took ${duration}ms`);
    }
    
    if (error) {
      console.error(`❌ Database query failed: ${operation} - ${error.message}`);
      this.recordError('database', error, { operation, duration });
    }
  }

  /**
   * Record Farcaster posting performance
   */
  recordFarcasterPost(type, success, duration, castHash = null, error = null) {
    const record = {
      timestamp: new Date(),
      type, // 'weekly', 'test', 'admin-test', etc.
      duration,
      success,
      castHash,
      error: error?.message || null
    };
    
    this.metrics.farcasterPosts.push(record);
    this._trimArray('farcasterPosts');
    
    if (success) {
      console.log(`📢 Farcaster post successful: ${type} in ${duration}ms (${castHash?.substring(0, 8)})`);
    } else {
      console.error(`❌ Farcaster post failed: ${type} - ${error?.message}`);
      this.recordError('farcaster', error, { type, duration });
    }
  }

  /**
   * Record system errors
   */
  recordError(component, error, context = {}) {
    const record = {
      timestamp: new Date(),
      component, // 'database', 'farcaster', 'analytics', 'cron', etc.
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context
    };
    
    this.metrics.errors.push(record);
    this._trimArray('errors');
    
    console.error(`🚨 Error recorded in ${component}:`, error.message);
  }

  /**
   * Check system health
   */
  async checkSystemHealth() {
    const now = new Date();
    const issues = [];
    
    try {
      // Check recent errors
      const recentErrors = this.getRecentErrors(30 * 60 * 1000); // Last 30 minutes
      if (recentErrors.length > 10) {
        issues.push(`High error rate: ${recentErrors.length} errors in last 30 minutes`);
      }
      
      // Check failed Farcaster posts
      const recentPosts = this.metrics.farcasterPosts.filter(
        post => post.timestamp > new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
      );
      const failedPosts = recentPosts.filter(post => !post.success);
      const failureRate = recentPosts.length > 0 ? (failedPosts.length / recentPosts.length) * 100 : 0;
      
      if (failureRate > 20) {
        issues.push(`High Farcaster failure rate: ${failureRate.toFixed(1)}%`);
      }
      
      // Check slow database queries
      const recentQueries = this.metrics.databaseQueries.filter(
        query => query.timestamp > new Date(now.getTime() - 60 * 60 * 1000) // Last hour
      );
      const slowQueries = recentQueries.filter(query => query.duration > 5000);
      
      if (slowQueries.length > 5) {
        issues.push(`Multiple slow database queries: ${slowQueries.length} in last hour`);
      }
      
      // Check digest generation performance
      const recentDigests = this.metrics.digestGenerations.filter(
        digest => digest.timestamp > new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
      );
      const slowDigests = recentDigests.filter(
        digest => digest.performance?.totalDuration > 10000
      );
      
      if (slowDigests.length > 0) {
        issues.push(`Slow digest generation detected: ${slowDigests.length} slow generations`);
      }
      
      const status = issues.length === 0 ? 'healthy' : issues.length < 3 ? 'warning' : 'critical';
      
      this.metrics.systemHealth = {
        lastCheck: now,
        status,
        issues,
        summary: {
          recentErrors: recentErrors.length,
          farcasterFailureRate: failureRate,
          slowQueries: slowQueries.length,
          slowDigests: slowDigests.length
        }
      };
      
      if (status !== 'healthy') {
        console.warn(`⚠️ System health check: ${status} - ${issues.length} issues found`);
        issues.forEach(issue => console.warn(`  • ${issue}`));
      } else {
        console.log('✅ System health check: All systems normal');
      }
      
      return this.metrics.systemHealth;
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      this.recordError('health-check', error);
      
      this.metrics.systemHealth = {
        lastCheck: now,
        status: 'error',
        issues: [`Health check failed: ${error.message}`]
      };
      
      return this.metrics.systemHealth;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Digest generation stats
    const recentDigests = this.metrics.digestGenerations.filter(d => d.timestamp > last24h);
    const digestStats = {
      total: recentDigests.length,
      avgDuration: recentDigests.length > 0 ? 
        Math.round(recentDigests.reduce((sum, d) => sum + (d.performance?.totalDuration || 0), 0) / recentDigests.length) : 0,
      avgCommits: recentDigests.length > 0 ?
        Math.round(recentDigests.reduce((sum, d) => sum + d.dataMetrics.totalCommits, 0) / recentDigests.length) : 0,
      successRate: recentDigests.length > 0 ?
        (recentDigests.filter(d => d.success).length / recentDigests.length) * 100 : 100
    };
    
    // Database query stats
    const recentQueries = this.metrics.databaseQueries.filter(q => q.timestamp > last24h);
    const queryStats = {
      total: recentQueries.length,
      avgDuration: recentQueries.length > 0 ?
        Math.round(recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length) : 0,
      slowQueries: recentQueries.filter(q => q.duration > 5000).length,
      failureRate: recentQueries.length > 0 ?
        (recentQueries.filter(q => !q.success).length / recentQueries.length) * 100 : 0
    };
    
    // Farcaster posting stats
    const recentPosts = this.metrics.farcasterPosts.filter(p => p.timestamp > last24h);
    const postStats = {
      total: recentPosts.length,
      avgDuration: recentPosts.length > 0 ?
        Math.round(recentPosts.reduce((sum, p) => sum + p.duration, 0) / recentPosts.length) : 0,
      successRate: recentPosts.length > 0 ?
        (recentPosts.filter(p => p.success).length / recentPosts.length) * 100 : 100
    };
    
    // Error stats
    const recentErrors = this.getRecentErrors(24 * 60 * 60 * 1000);
    const errorsByComponent = recentErrors.reduce((acc, error) => {
      acc[error.component] = (acc[error.component] || 0) + 1;
      return acc;
    }, {});
    
    return {
      period: '24h',
      digestGeneration: digestStats,
      database: queryStats,
      farcaster: postStats,
      errors: {
        total: recentErrors.length,
        byComponent: errorsByComponent
      },
      systemHealth: this.metrics.systemHealth
    };
  }

  /**
   * Get recent errors within timeframe
   */
  getRecentErrors(timeframeMs) {
    const cutoff = new Date(Date.now() - timeframeMs);
    return this.metrics.errors.filter(error => error.timestamp > cutoff);
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics() {
    return {
      timestamp: new Date(),
      performance: this.getPerformanceStats(),
      health: this.metrics.systemHealth,
      rawMetrics: {
        digestGenerations: this.metrics.digestGenerations.length,
        databaseQueries: this.metrics.databaseQueries.length,
        farcasterPosts: this.metrics.farcasterPosts.length,
        errors: this.metrics.errors.length
      }
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  _trimArray(metricType) {
    const maxLength = this.maxMetricsRetention[metricType];
    if (this.metrics[metricType].length > maxLength) {
      this.metrics[metricType] = this.metrics[metricType].slice(-maxLength);
    }
  }

  /**
   * Reset all metrics (for testing)
   */
  reset() {
    this.metrics = {
      digestGenerations: [],
      databaseQueries: [],
      farcasterPosts: [],
      errors: [],
      systemHealth: {
        lastCheck: null,
        status: 'unknown',
        issues: []
      }
    };
  }
}

// Singleton instance for global use
const performanceMonitor = new DigestPerformanceMonitor();

export { DigestPerformanceMonitor, performanceMonitor };
export default performanceMonitor;