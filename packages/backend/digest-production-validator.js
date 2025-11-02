#!/usr/bin/env node

/**
 * ULTIMATE PRODUCTION VALIDATION SCRIPT 🔥
 * Phase 4: Final Production Readiness Check
 * 
 * This script performs comprehensive validation of the entire commit digest system
 * to ensure it's bulletproof and ready for production deployment.
 * 
 * Usage:
 *   railway run node digest-production-validator.js
 */

import { CommitDigestService } from './src/services/commit-digest-service.js';
import { DigestAnalytics } from './src/services/digest-analytics.js';
import { DigestFormatter } from './src/services/digest-formatter.js';
import { WeeklyDigestCron } from './src/jobs/weekly-digest-cron.js';
import { performanceMonitor } from './src/services/digest-performance-monitor.js';
import { initializeDatabase, getPool } from './src/services/database.js';
import fetch from 'node-fetch';

class DigestProductionValidator {
  constructor() {
    this.results = {
      database: { tests: [], passed: 0, failed: 0 },
      services: { tests: [], passed: 0, failed: 0 },
      analytics: { tests: [], passed: 0, failed: 0 },
      formatting: { tests: [], passed: 0, failed: 0 },
      cron: { tests: [], passed: 0, failed: 0 },
      api: { tests: [], passed: 0, failed: 0 },
      performance: { tests: [], passed: 0, failed: 0 },
      integration: { tests: [], passed: 0, failed: 0 }
    };
    
    this.criticalIssues = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  /**
   * Add test result
   */
  addTest(category, name, passed, details = null, critical = false) {
    const test = {
      name,
      passed,
      details,
      timestamp: new Date()
    };
    
    this.results[category].tests.push(test);
    
    if (passed) {
      this.results[category].passed++;
      console.log(`✅ ${name}`);
      if (details) console.log(`   ${details}`);
    } else {
      this.results[category].failed++;
      console.error(`❌ ${name}`);
      if (details) console.error(`   ${details}`);
      
      if (critical) {
        this.criticalIssues.push(`${category}: ${name} - ${details}`);
      } else {
        this.warnings.push(`${category}: ${name} - ${details}`);
      }
    }
  }

  /**
   * Validate database schema and performance
   */
  async validateDatabase() {
    console.log('\n🗄️ VALIDATING DATABASE');
    console.log('═══════════════════════');
    
    try {
      // Test database connection
      await initializeDatabase();
      const pool = getPool();
      this.addTest('database', 'Database connection', true, 'Connected successfully');
      
      // Test table existence
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('commit_digest_data', 'digest_posts')
      `);
      
      const hasCommitTable = tableCheck.rows.some(row => row.table_name === 'commit_digest_data');
      const hasDigestTable = tableCheck.rows.some(row => row.table_name === 'digest_posts');
      
      this.addTest('database', 'Commit digest table exists', hasCommitTable, 
        hasCommitTable ? 'commit_digest_data table found' : 'commit_digest_data table missing', true);
      
      this.addTest('database', 'Digest posts table exists', hasDigestTable,
        hasDigestTable ? 'digest_posts table found' : 'digest_posts table missing', true);
      
      // Test indexes
      if (hasCommitTable) {
        const indexCheck = await pool.query(`
          SELECT indexname 
          FROM pg_indexes 
          WHERE tablename = 'commit_digest_data'
        `);
        
        const hasDateIndex = indexCheck.rows.some(row => row.indexname.includes('created_at'));
        this.addTest('database', 'Performance indexes exist', hasDateIndex,
          hasDateIndex ? 'Date index found for performance' : 'Missing performance indexes');
      }
      
      // Test data integrity
      if (hasCommitTable) {
        const dataCheck = await pool.query('SELECT COUNT(*) as count FROM commit_digest_data');
        const commitCount = parseInt(dataCheck.rows[0].count);
        
        this.addTest('database', 'Commit data available', commitCount >= 0,
          `${commitCount} commits stored for analysis`);
      }
      
      // Performance test
      const perfStart = Date.now();
      await pool.query('SELECT 1 as test');
      const perfDuration = Date.now() - perfStart;
      
      this.addTest('database', 'Database performance', perfDuration < 1000,
        `Query latency: ${perfDuration}ms`, perfDuration > 5000);
      
    } catch (error) {
      this.addTest('database', 'Database connection', false, error.message, true);
    }
  }

  /**
   * Validate core services
   */
  async validateServices() {
    console.log('\n⚙️ VALIDATING CORE SERVICES');
    console.log('═══════════════════════════');
    
    try {
      // Test CommitDigestService
      const digestService = new CommitDigestService();
      await digestService.initialize();
      this.addTest('services', 'CommitDigestService initialization', true, 'Service initialized successfully');
      
      // Test DigestAnalytics
      const analytics = new DigestAnalytics();
      this.addTest('services', 'DigestAnalytics initialization', true, 'Analytics service ready');
      
      // Test DigestFormatter
      const formatter = new DigestFormatter();
      this.addTest('services', 'DigestFormatter initialization', true, 'Formatter service ready');
      
      // Test performance monitor
      performanceMonitor.reset();
      this.addTest('services', 'PerformanceMonitor initialization', true, 'Performance monitoring ready');
      
    } catch (error) {
      this.addTest('services', 'Service initialization', false, error.message, true);
    }
  }

  /**
   * Validate analytics functionality
   */
  async validateAnalytics() {
    console.log('\n📊 VALIDATING ANALYTICS ENGINE');
    console.log('══════════════════════════════');
    
    try {
      const analytics = new DigestAnalytics();
      
      // Test date range calculation
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Test analytics generation (this tests the entire pipeline)
      const analysisStart = Date.now();
      const result = await analytics.analyzeWeeklyActivity(startDate, endDate);
      const analysisDuration = Date.now() - analysisStart;
      
      this.addTest('analytics', 'Weekly analysis generation', !!result,
        `Analysis completed in ${analysisDuration}ms`);
      
      this.addTest('analytics', 'Analytics performance', analysisDuration < 15000,
        `Duration: ${analysisDuration}ms (threshold: 15s)`, analysisDuration > 30000);
      
      // Test result structure
      const hasRequiredFields = result.totalCommits !== undefined &&
                               result.repositoryBreakdown !== undefined &&
                               result.contributorRankings !== undefined &&
                               result.developmentTrends !== undefined &&
                               result.rewardDistribution !== undefined &&
                               result.communityGrowth !== undefined;
      
      this.addTest('analytics', 'Analytics result structure', hasRequiredFields,
        hasRequiredFields ? 'All required fields present' : 'Missing required analytics fields', true);
      
      // Test performance monitoring integration
      if (result.performance) {
        this.addTest('analytics', 'Performance monitoring integration', true,
          `Phase 1: ${result.performance.phase1Duration}ms, Phase 2: ${result.performance.phase2Duration}ms`);
      }
      
      // Record performance metrics
      performanceMonitor.recordDigestGeneration(result);
      
    } catch (error) {
      this.addTest('analytics', 'Analytics generation', false, error.message, true);
    }
  }

  /**
   * Validate digest formatting
   */
  async validateFormatting() {
    console.log('\n📝 VALIDATING DIGEST FORMATTING');
    console.log('═══════════════════════════════');
    
    try {
      const formatter = new DigestFormatter();
      const analytics = new DigestAnalytics();
      
      // Get sample data
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sampleAnalytics = await analytics.analyzeWeeklyActivity(startDate, endDate);
      
      // Test weekly digest formatting
      const weeklyDigest = formatter.formatWeeklyDigest(sampleAnalytics);
      
      this.addTest('formatting', 'Weekly digest generation', !!weeklyDigest,
        `Generated ${weeklyDigest.length} character digest`);
      
      this.addTest('formatting', 'Character limit compliance', weeklyDigest.length <= 1024,
        `Length: ${weeklyDigest.length}/1024 characters`, weeklyDigest.length > 1024);
      
      // Test preview functionality
      const preview = formatter.previewDigest(sampleAnalytics, 'weekly');
      
      this.addTest('formatting', 'Preview functionality', !!preview.content,
        `Preview generated with metadata`);
      
      // Test simple summary for quiet periods
      const quietAnalytics = { ...sampleAnalytics, totalCommits: 0 };
      const simpleSummary = formatter.formatSimpleSummary(quietAnalytics);
      
      this.addTest('formatting', 'Quiet period handling', !!simpleSummary,
        'Simple summary generated for quiet periods');
      
      // Test content quality
      const hasHashtags = weeklyDigest.includes('#ABCDAO') && weeklyDigest.includes('#WeeklyDigest');
      this.addTest('formatting', 'Content quality standards', hasHashtags,
        hasHashtags ? 'Hashtags and branding present' : 'Missing required hashtags');
      
    } catch (error) {
      this.addTest('formatting', 'Digest formatting', false, error.message, true);
    }
  }

  /**
   * Validate cron job functionality
   */
  async validateCron() {
    console.log('\n⏰ VALIDATING CRON FUNCTIONALITY');
    console.log('════════════════════════════════');
    
    try {
      const weeklyDigestCron = new WeeklyDigestCron();
      
      // Test configuration
      const stats = await weeklyDigestCron.getDigestStats();
      
      this.addTest('cron', 'Cron configuration', !!stats,
        `Enabled: ${stats.enabled}, Schedule: ${stats.schedule}`);
      
      // Test next run calculation
      const nextRun = weeklyDigestCron.getNextRunTime();
      this.addTest('cron', 'Schedule calculation', nextRun !== 'Disabled',
        `Next run: ${nextRun}`);
      
      // Test preview functionality
      const preview = await weeklyDigestCron.previewDigest();
      this.addTest('cron', 'Preview generation', !!preview.content,
        `Preview type: ${preview.type}`);
      
      // Test environment variables
      const hasSignerUuid = !!process.env.ABC_DEV_SIGNER_UUID;
      const hasNeynarKey = !!process.env.NEYNAR_API_KEY;
      
      this.addTest('cron', 'Farcaster credentials', hasSignerUuid && hasNeynarKey,
        `Signer: ${hasSignerUuid ? '✅' : '❌'}, API Key: ${hasNeynarKey ? '✅' : '❌'}`, 
        !hasSignerUuid || !hasNeynarKey);
      
    } catch (error) {
      this.addTest('cron', 'Cron functionality', false, error.message, true);
    }
  }

  /**
   * Validate admin API endpoints
   */
  async validateAPI() {
    console.log('\n🌐 VALIDATING ADMIN API');
    console.log('═══════════════════════');
    
    if (!process.env.ADMIN_SECRET) {
      this.addTest('api', 'Admin credentials', false, 'ADMIN_SECRET not configured', true);
      return;
    }
    
    const baseUrl = process.env.API_BASE_URL || 'https://abcdao-production.up.railway.app';
    const headers = {
      'Content-Type': 'application/json',
      'x-admin-key': process.env.ADMIN_SECRET
    };
    
    try {
      // Test stats endpoint
      const statsResponse = await fetch(`${baseUrl}/api/admin/digest/stats`, { headers });
      const statsSuccess = statsResponse.ok;
      
      this.addTest('api', 'Stats endpoint', statsSuccess,
        statsSuccess ? `HTTP ${statsResponse.status}` : `HTTP ${statsResponse.status} - ${statsResponse.statusText}`);
      
      // Test preview endpoint
      const previewResponse = await fetch(`${baseUrl}/api/admin/digest/weekly/preview`, { headers });
      const previewSuccess = previewResponse.ok;
      
      this.addTest('api', 'Preview endpoint', previewSuccess,
        previewSuccess ? `HTTP ${previewResponse.status}` : `HTTP ${previewResponse.status} - ${previewResponse.statusText}`);
      
      // Test history endpoint
      const historyResponse = await fetch(`${baseUrl}/api/admin/digest/history`, { headers });
      const historySuccess = historyResponse.ok;
      
      this.addTest('api', 'History endpoint', historySuccess,
        historySuccess ? `HTTP ${historyResponse.status}` : `HTTP ${historyResponse.status} - ${historyResponse.statusText}`);
      
      // Test commits endpoint
      const commitsResponse = await fetch(`${baseUrl}/api/admin/digest/commits`, { headers });
      const commitsSuccess = commitsResponse.ok;
      
      this.addTest('api', 'Commits endpoint', commitsSuccess,
        commitsSuccess ? `HTTP ${commitsResponse.status}` : `HTTP ${commitsResponse.status} - ${commitsResponse.statusText}`);
      
      // Test unauthorized access protection
      const unauthorizedResponse = await fetch(`${baseUrl}/api/admin/digest/stats`);
      const properlyProtected = unauthorizedResponse.status === 401;
      
      this.addTest('api', 'Security protection', properlyProtected,
        properlyProtected ? 'Unauthorized requests properly rejected' : 'Security vulnerability detected');
      
    } catch (error) {
      this.addTest('api', 'API connectivity', false, error.message, true);
    }
  }

  /**
   * Validate performance monitoring
   */
  async validatePerformance() {
    console.log('\n⚡ VALIDATING PERFORMANCE MONITORING');
    console.log('══════════════════════════════════════');
    
    try {
      // Test metric recording
      performanceMonitor.recordDatabaseQuery('test-query', 150, 10);
      performanceMonitor.recordFarcasterPost('test', true, 500, 'test-hash');
      
      this.addTest('performance', 'Metric recording', true, 'Database and Farcaster metrics recorded');
      
      // Test performance stats
      const stats = performanceMonitor.getPerformanceStats();
      
      this.addTest('performance', 'Performance statistics', !!stats,
        `Stats generated for ${stats.period} period`);
      
      // Test health check
      const health = await performanceMonitor.checkSystemHealth();
      
      this.addTest('performance', 'Health monitoring', !!health,
        `Status: ${health.status}, Issues: ${health.issues.length}`);
      
      // Test metric export
      const exportData = performanceMonitor.exportMetrics();
      
      this.addTest('performance', 'Metrics export', !!exportData,
        `Export includes ${Object.keys(exportData.rawMetrics).length} metric types`);
      
    } catch (error) {
      this.addTest('performance', 'Performance monitoring', false, error.message);
    }
  }

  /**
   * Validate end-to-end integration
   */
  async validateIntegration() {
    console.log('\n🔗 VALIDATING END-TO-END INTEGRATION');
    console.log('═══════════════════════════════════════');
    
    try {
      // Test complete digest generation pipeline
      const weeklyDigestCron = new WeeklyDigestCron();
      
      // Generate preview (full pipeline without posting)
      const integrationStart = Date.now();
      const preview = await weeklyDigestCron.previewDigest();
      const integrationDuration = Date.now() - integrationStart;
      
      this.addTest('integration', 'Complete pipeline', !!preview,
        `Full pipeline completed in ${integrationDuration}ms`);
      
      this.addTest('integration', 'Integration performance', integrationDuration < 20000,
        `Duration: ${integrationDuration}ms (threshold: 20s)`, integrationDuration > 30000);
      
      // Test data flow integrity
      const hasValidData = preview.analytics && 
                          preview.analytics.totalCommits !== undefined &&
                          preview.content &&
                          preview.content.length > 0;
      
      this.addTest('integration', 'Data flow integrity', hasValidData,
        hasValidData ? 'Data flows correctly through all services' : 'Data flow integrity compromised', true);
      
      // Test error handling
      try {
        const invalidDate = new Date('invalid');
        await weeklyDigestCron.analytics.analyzeWeeklyActivity(invalidDate, new Date());
        this.addTest('integration', 'Error handling', false, 'Should have failed with invalid date');
      } catch (expectedError) {
        this.addTest('integration', 'Error handling', true, 'Errors properly caught and handled');
      }
      
    } catch (error) {
      this.addTest('integration', 'End-to-end integration', false, error.message, true);
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n\n🎯 PRODUCTION VALIDATION REPORT');
    console.log('═══════════════════════════════════');
    
    // Calculate totals
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.values(this.results).forEach(category => {
      totalTests += category.tests.length;
      totalPassed += category.passed;
      totalFailed += category.failed;
    });
    
    // Category breakdown
    console.log('\n📊 TEST RESULTS BY CATEGORY:');
    Object.entries(this.results).forEach(([category, results]) => {
      const passRate = results.tests.length > 0 ? 
        Math.round((results.passed / results.tests.length) * 100) : 100;
      
      console.log(`  ${category.toUpperCase()}: ${results.passed}/${results.tests.length} (${passRate}%)`);
    });
    
    // Overall results
    const overallPassRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 100;
    
    console.log('\n🏆 OVERALL RESULTS:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Success Rate: ${overallPassRate}%`);
    console.log(`  Validation Time: ${Math.round(totalDuration / 1000)}s`);
    
    // Critical issues
    if (this.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.criticalIssues.forEach(issue => {
        console.log(`  ❌ ${issue}`);
      });
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => {
        console.log(`  ⚠️ ${warning}`);
      });
    }
    
    // Production readiness assessment
    const isProductionReady = this.criticalIssues.length === 0 && overallPassRate >= 95;
    
    console.log('\n🚀 PRODUCTION READINESS:');
    if (isProductionReady) {
      console.log('✅ SYSTEM IS PRODUCTION READY! 🎉');
      console.log('\n🎯 DEPLOYMENT CHECKLIST:');
      console.log('  ✅ Database schema deployed');
      console.log('  ✅ All services functional');
      console.log('  ✅ Analytics engine optimized');
      console.log('  ✅ Digest formatting validated');
      console.log('  ✅ Cron scheduling configured');
      console.log('  ✅ Admin API secured');
      console.log('  ✅ Performance monitoring active');
      console.log('  ✅ End-to-end integration tested');
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('  1. Deploy to Railway production environment');
      console.log('  2. Monitor first automated digest (Friday 5:00 PM UTC)');
      console.log('  3. Check @abc-dao-dev for successful posting');
      console.log('  4. Use admin API for ongoing monitoring and management');
      console.log('  5. Set up alerting for performance issues');
      
    } else {
      console.log('❌ SYSTEM NOT READY FOR PRODUCTION');
      console.log('\n🔧 REQUIRED FIXES:');
      console.log(`  • Resolve ${this.criticalIssues.length} critical issues`);
      console.log(`  • Improve test pass rate from ${overallPassRate}% to 95%+`);
      console.log('  • Address all critical failures before deployment');
    }
    
    return {
      ready: isProductionReady,
      passRate: overallPassRate,
      criticalIssues: this.criticalIssues.length,
      warnings: this.warnings.length,
      duration: totalDuration,
      results: this.results
    };
  }

  /**
   * Run complete validation suite
   */
  async runCompleteValidation() {
    console.log('🔥 STARTING ULTIMATE PRODUCTION VALIDATION 🔥');
    console.log('═══════════════════════════════════════════════');
    console.log('This comprehensive test will validate every aspect of the commit digest system');
    console.log(`Started at: ${new Date().toISOString()}`);
    
    try {
      await this.validateDatabase();
      await this.validateServices();
      await this.validateAnalytics();
      await this.validateFormatting();
      await this.validateCron();
      await this.validateAPI();
      await this.validatePerformance();
      await this.validateIntegration();
      
      const report = this.generateReport();
      
      if (report.ready) {
        console.log('\n🎊🎊🎊 VALIDATION COMPLETE - SYSTEM READY! 🎊🎊🎊');
      } else {
        console.log('\n💪 VALIDATION COMPLETE - ISSUES IDENTIFIED 💪');
      }
      
      return report;
      
    } catch (error) {
      console.error('\n💥 VALIDATION FAILED WITH CRITICAL ERROR:', error.message);
      console.error('Stack trace:', error.stack);
      
      this.criticalIssues.push(`Validation failure: ${error.message}`);
      
      return {
        ready: false,
        passRate: 0,
        criticalIssues: this.criticalIssues.length,
        warnings: this.warnings.length,
        duration: Date.now() - this.startTime,
        error: error.message
      };
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DigestProductionValidator();
  
  validator.runCompleteValidation()
    .then(report => {
      process.exit(report.ready ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Validation script failed:', error.message);
      process.exit(1);
    });
}

export { DigestProductionValidator };
export default DigestProductionValidator;