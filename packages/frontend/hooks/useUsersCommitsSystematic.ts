'use client';

import useSWR from 'swr';

// API endpoint for users/commits data
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Systematic Users/Commits Hook
 * 
 * Consumes pre-computed user and commit data from the User/Commit Data Manager
 * following the data architecture redesign pattern.
 * 
 * Replaces direct database calls and reactive patterns with systematic API consumption.
 */

/**
 * Hook for user profile data
 */
export function useUserProfileSystematic(identifier?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    identifier ? `${BACKEND_URL}/api/users-commits/profile/${identifier}` : null,
    fetcher,
    {
      refreshInterval: 60000, // User data updates every minute
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      fallbackData: null,
    }
  );

  return {
    // Profile data
    profile: data?.profile || {},
    identifiers: data?.identifiers || {},
    stats: data?.stats || {},
    membership: data?.membership || {},
    meta: data?.meta || {},
    
    // State
    isLoading,
    isError: !!error,
    error: error?.message || error,
    refetch: mutate,
    
    // Helper computed values
    isActive: data?.meta?.isActive || false,
    isPaidMember: data?.membership?.status === 'active',
    hasCommits: (data?.stats?.totalCommits || 0) > 0,
    totalRewards: data?.stats?.totalRewardsEarned || 0
  };
}

/**
 * Hook for user leaderboard
 */
export function useLeaderboardSystematic(timeframe: 'all' | 'week' | 'month' = 'all', limit: number = 20) {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/users-commits/leaderboard?timeframe=${timeframe}&limit=${limit}`,
    fetcher,
    {
      refreshInterval: 120000, // Leaderboard updates every 2 minutes
      revalidateOnFocus: false,
      fallbackData: { leaderboard: [], count: 0 },
    }
  );

  return {
    leaderboard: data?.leaderboard || [],
    count: data?.count || 0,
    timeframe,
    limit,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook for recent commits across all users
 */
export function useRecentCommitsSystematic(limit: number = 50) {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/users-commits/commits/recent?limit=${limit}`,
    fetcher,
    {
      refreshInterval: 30000, // Recent commits update every 30 seconds
      revalidateOnFocus: true,
      fallbackData: { commits: [], count: 0 },
    }
  );

  return {
    commits: data?.commits || [],
    count: data?.count || 0,
    limit,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook for user-specific commits
 */
export function useUserCommitsSystematic(userId?: number, limit: number = 50, offset: number = 0) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `${BACKEND_URL}/api/users-commits/commits/user/${userId}?limit=${limit}&offset=${offset}` : null,
    fetcher,
    {
      refreshInterval: 60000, // User commits update every minute
      revalidateOnFocus: false,
      fallbackData: { commits: [], count: 0 },
    }
  );

  return {
    commits: data?.commits || [],
    count: data?.count || 0,
    userId,
    limit,
    offset,
    hasMore: data?.hasMore || false,
    isLoading,
    isError: !!error,
    error: error?.message || error,
    refetch: mutate
  };
}

/**
 * Hook for system-wide user and commit statistics
 */
export function useUsersCommitsStatsSystematic() {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/users-commits/stats`,
    fetcher,
    {
      refreshInterval: 300000, // Stats update every 5 minutes
      revalidateOnFocus: false,
      fallbackData: null,
    }
  );

  return {
    // Statistics
    totalUsers: data?.statistics?.totalUsers || 0,
    paidMembers: data?.statistics?.paidMembers || 0,
    totalCommits: data?.statistics?.totalCommits || 0,
    uniqueRepositories: data?.statistics?.uniqueRepositories || 0,
    totalRewardsDistributed: data?.statistics?.totalRewardsDistributed || 0,
    
    // Recent activity
    recentActivity: data?.statistics?.recentActivity || {},
    commits24h: data?.statistics?.recentActivity?.commits24h || 0,
    commits7d: data?.statistics?.recentActivity?.commits7d || 0,
    commits30d: data?.statistics?.recentActivity?.commits30d || 0,
    
    // Health monitoring
    dataHealth: data?.dataHealth || { isHealthy: false },
    
    // State
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook for users/commits health monitoring
 */
export function useUsersCommitsHealthSystematic() {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/users-commits/health`,
    fetcher,
    {
      refreshInterval: 60000, // Check health every minute
      revalidateOnFocus: true,
      fallbackData: { status: 'unknown' },
    }
  );

  return {
    status: data?.status || 'unknown',
    isHealthy: data?.isHealthy || false,
    isStale: data?.isStale || false,
    lastUpdate: data?.lastUpdate,
    timeSinceUpdate: data?.timeSinceUpdateMs,
    errorCount: data?.errorCount || 0,
    lastError: data?.lastError,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook combining all users/commits systematic data
 */
export function useUsersCommitsSystematic() {
  const stats = useUsersCommitsStatsSystematic();
  const recentCommits = useRecentCommitsSystematic(20);
  const leaderboard = useLeaderboardSystematic('all', 10);
  const health = useUsersCommitsHealthSystematic();

  return {
    // Combined stats
    ...stats,
    
    // Recent activity
    recentCommits: recentCommits.commits,
    
    // Top performers
    topUsers: leaderboard.leaderboard,
    
    // Health monitoring
    health,
    
    // Combined loading state
    isLoading: stats.isLoading || recentCommits.isLoading || leaderboard.isLoading || health.isLoading,
    
    // Combined error state
    hasErrors: stats.isError || recentCommits.isError || leaderboard.isError || health.isError,
    
    // Individual hook access
    hooks: {
      stats,
      recentCommits,
      leaderboard,
      health
    }
  };
}