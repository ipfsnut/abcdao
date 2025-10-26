'use client';

import useSWR from 'swr';
import { useUserProfileSystematic } from './useUsersCommitsSystematic';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Unified User Statistics Hook
 * 
 * Primary source: Systematic user profile API (most complete data)
 * Secondary source: Direct metrics API (for verification)
 * Fallback source: User object properties (basic fallback)
 * 
 * This ensures consistency across all components while maintaining
 * the most up-to-date user statistics.
 */
export function useUserStatsUnified(userIdentifier?: string, userObject?: any) {
  // Get systematic user profile data (primary source)
  const userProfile = useUserProfileSystematic(userIdentifier);

  // Get direct metrics for verification (secondary source)
  const { data: directMetrics, error: metricsError, mutate: refreshMetrics } = useSWR(
    userIdentifier ? `${BACKEND_URL}/api/users-commits/metrics/${userIdentifier}` : null,
    fetcher,
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      fallbackData: null,
    }
  );

  // Helper function to refresh all data
  const refreshAll = () => {
    userProfile.refetch();
    refreshMetrics();
  };

  // Consistent data formatting
  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const formatDecimal = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  // Use systematic API as primary source, with smart fallbacks
  const totalCommits = userProfile.stats?.totalCommits || 
                      directMetrics?.metrics?.commitCount || 
                      userObject?.total_commits || 
                      0;

  const totalRewardsEarned = userProfile.totalRewards || 
                            directMetrics?.metrics?.totalRewardsEarned || 
                            0;

  const uniqueRepositories = userProfile.stats?.uniqueRepositories || 
                            userProfile.stats?.totalRepositories || 
                            0;

  const activeRepositories = userProfile.stats?.activeRepositories || 0;

  const totalRepositories = userProfile.stats?.totalRepositories || 0;

  // Calculate derived statistics
  const averageRewardPerCommit = totalCommits > 0 ? totalRewardsEarned / totalCommits : 0;
  
  const commitActivity = {
    commits7d: userProfile.stats?.commits7d || 0,
    commits30d: userProfile.stats?.commits30d || 0,
    lastCommitAt: userProfile.stats?.lastCommitAt
  };

  // Profile completeness calculation
  const profileCompleteness = userProfile.meta?.profileCompleteness || 0;

  return {
    // Core statistics (formatted for display)
    totalCommits,
    totalCommitsFormatted: formatNumber(totalCommits),
    totalRewardsEarned,
    totalRewardsEarnedFormatted: formatNumber(totalRewardsEarned),
    averageRewardPerCommit,
    averageRewardPerCommitFormatted: formatDecimal(averageRewardPerCommit),
    
    // Repository statistics
    uniqueRepositories,
    activeRepositories,
    totalRepositories,
    repositoryStats: {
      unique: uniqueRepositories,
      active: activeRepositories,
      total: totalRepositories,
      activePercentage: totalRepositories > 0 ? (activeRepositories / totalRepositories) * 100 : 0
    },
    
    // Activity metrics
    commitActivity,
    isActive: commitActivity.commits7d > 0,
    activityLevel: commitActivity.commits7d > 5 ? 'high' : commitActivity.commits7d > 1 ? 'medium' : 'low',
    
    // Profile information
    profileCompleteness,
    membership: userProfile.membership,
    
    // Raw values for calculations
    raw: {
      totalCommits,
      totalRewardsEarned,
      averageRewardPerCommit,
      uniqueRepositories,
      activeRepositories,
      totalRepositories,
      commits7d: commitActivity.commits7d,
      commits30d: commitActivity.commits30d
    },
    
    // Loading states
    isLoading: userProfile.isLoading,
    isError: userProfile.isError || !!metricsError,
    error: userProfile.error || metricsError,
    
    // Utility functions
    formatNumber,
    formatDecimal,
    refreshData: refreshAll,
    
    // Raw data access for advanced use cases
    rawProfile: userProfile,
    rawMetrics: directMetrics,
    
    // Health indicators
    dataFreshness: {
      profile: userProfile.meta?.lastUpdated,
      metrics: directMetrics?.timestamp,
      isStale: false // TODO: Implement staleness detection
    },
    
    // Data source indicators (for debugging)
    dataSources: {
      primary: 'systematic_profile',
      secondary: 'direct_metrics',
      fallback: 'user_object',
      usingFallback: !userProfile.profile && !!userObject
    },
    
    // Consistency check (useful for debugging)
    consistencyCheck: {
      commitsMatch: userProfile.stats?.totalCommits === directMetrics?.metrics?.commitCount,
      rewardsMatch: Math.abs((userProfile.totalRewards || 0) - (directMetrics?.metrics?.totalRewardsEarned || 0)) < 0.01,
      hasDiscrepancies: false // Will be calculated if needed
    }
  };
}

/**
 * Hook for developer-specific statistics
 * Extends user stats with developer-focused metrics
 */
export function useDeveloperStatsUnified(userIdentifier?: string, userObject?: any) {
  const userStats = useUserStatsUnified(userIdentifier, userObject);
  
  // Additional developer-specific calculations
  const dailyCommitAverage = userStats.commitActivity.commits30d / 30;
  const weeklyCommitAverage = userStats.commitActivity.commits30d / 4.3; // ~4.3 weeks in 30 days
  
  const performanceLevel = userStats.averageRewardPerCommit > 1000 ? 'high' : 
                          userStats.averageRewardPerCommit > 500 ? 'medium' : 'low';
  
  const productivityScore = Math.min(100, 
    (userStats.commitActivity.commits7d * 10) + 
    (userStats.activeRepositories * 5) + 
    (userStats.averageRewardPerCommit / 10)
  );

  return {
    ...userStats,
    
    // Developer-specific metrics
    developerMetrics: {
      dailyCommitAverage: dailyCommitAverage,
      weeklyCommitAverage: weeklyCommitAverage,
      performanceLevel,
      productivityScore: Math.round(productivityScore),
      earningEfficiency: userStats.totalRewardsEarned / Math.max(1, userStats.totalCommits),
      repositoryUtilization: userStats.totalRepositories > 0 ? (userStats.activeRepositories / userStats.totalRepositories) * 100 : 0
    },
    
    // Formatted developer metrics
    developerMetricsFormatted: {
      dailyCommitAverage: userStats.formatDecimal(dailyCommitAverage, 1),
      weeklyCommitAverage: userStats.formatDecimal(weeklyCommitAverage, 1),
      productivityScore: Math.round(productivityScore) + '%',
      earningEfficiency: userStats.formatNumber(userStats.totalRewardsEarned / Math.max(1, userStats.totalCommits))
    }
  };
}