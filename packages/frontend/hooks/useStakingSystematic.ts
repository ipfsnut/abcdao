'use client';

import useSWR from 'swr';
import { useAccount } from 'wagmi';

// API endpoint for staking data
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Systematic Staking Hook
 * 
 * Consumes pre-computed staking data from the Staking Data Manager
 * following the data architecture redesign pattern.
 * 
 * Replaces direct blockchain calls with systematic API consumption.
 */
export function useStakingSystematic() {
  // Get staking overview from systematic API
  const { 
    data: stakingData, 
    error: stakingError, 
    isLoading: stakingLoading,
    mutate: refetchStaking
  } = useSWR(
    `${BACKEND_URL}/api/staking/overview`,
    fetcher,
    {
      refreshInterval: 60000, // Staking manager updates every 2min, we poll every 1min
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      fallbackData: null,
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
    }
  );

  // Get staking statistics
  const { 
    data: statsData, 
    error: statsError, 
    isLoading: statsLoading 
  } = useSWR(
    `${BACKEND_URL}/api/staking/stats`,
    fetcher,
    {
      refreshInterval: 120000, // Stats update every 2 minutes
      revalidateOnFocus: false,
      fallbackData: null,
    }
  );

  // Debug logging for development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Staking Systematic Hook:', {
      stakingData,
      statsData,
      errors: { stakingError, statsError },
      loading: { stakingLoading, statsLoading }
    });
  }

  // Determine overall loading state
  const isLoading = stakingLoading || statsLoading;
  
  // Determine error state
  const error = stakingError || statsError;

  // Extract data with fallbacks
  const staking = stakingData || {};
  const stats = statsData?.statistics || {};
  const apyAnalytics = statsData?.apyAnalytics || {};

  return {
    // Current staking data
    totalStaked: staking.totalStaked || 0,
    totalStakers: staking.totalStakers || 0,
    rewardsPoolBalance: staking.rewardsPoolBalance || 0,
    totalRewardsDistributed: staking.totalRewardsDistributed || 0,
    currentAPY: staking.currentAPY || 0,
    lastUpdated: staking.lastUpdated,

    // APY breakdown by period
    apyBreakdown: staking.apyBreakdown || [],
    
    // APY analytics
    dailyAPY: apyAnalytics.daily || 0,
    weeklyAPY: apyAnalytics.weekly || 0,
    monthlyAPY: apyAnalytics.monthly || 0,

    // Health and data freshness
    dataHealth: statsData?.dataHealth || { isHealthy: false },
    
    // State management
    isLoading,
    isError: !!error,
    error: error?.message || error,
    refetch: refetchStaking
  };
}

/**
 * Hook for user's staking position
 */
export function useStakingPosition(walletAddress?: string) {
  const { address: connectedAddress } = useAccount();
  const address = walletAddress || connectedAddress;

  const { data, error, isLoading, mutate } = useSWR(
    address ? `${BACKEND_URL}/api/staking/position/${address}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Position updates every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      fallbackData: null,
    }
  );

  return {
    // Position data
    walletAddress: data?.walletAddress || address,
    stakedAmount: data?.stakedAmount || 0,
    rewardsEarned: data?.rewardsEarned || 0,
    pendingRewards: data?.pendingRewards || 0,
    lastStakeTime: data?.lastStakeTime,
    lastRewardClaim: data?.lastRewardClaim,
    isActive: data?.isActive || false,
    lastUpdated: data?.lastUpdated,
    
    // State
    isLoading,
    isError: !!error,
    error: error?.message || error,
    refetch: mutate,
    
    // Helper computed values
    hasStaked: (data?.stakedAmount || 0) > 0,
    hasPendingRewards: (data?.pendingRewards || 0) > 0
  };
}

/**
 * Hook for staking historical data
 */
export function useStakingHistory(days: number = 30) {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/staking/history?days=${days}`,
    fetcher,
    {
      refreshInterval: 300000, // Historical data updates every 5 minutes
      revalidateOnFocus: false,
      fallbackData: { snapshots: [], count: 0 },
    }
  );

  return {
    history: data?.snapshots || [],
    count: data?.count || 0,
    days,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook for APY historical data
 */
export function useAPYHistory(period: '24h' | '7d' | '30d' = '30d', days: number = 30) {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/staking/apy/historical?period=${period}&days=${days}`,
    fetcher,
    {
      refreshInterval: 600000, // APY history updates every 10 minutes
      revalidateOnFocus: false,
      fallbackData: { calculations: [], count: 0 },
    }
  );

  return {
    apyHistory: data?.calculations || [],
    count: data?.count || 0,
    period,
    days,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook for staking leaderboard
 */
export function useStakingLeaderboard(limit: number = 20) {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/staking/leaderboard?limit=${limit}`,
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
    limit,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook for staking health monitoring
 */
export function useStakingHealth() {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/staking/health`,
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
 * Hook combining both systematic data and user actions
 * 
 * This hook provides the systematic data consumption while maintaining
 * compatibility with user actions for staking operations.
 */
export function useStakingWithSystematicData() {
  const stakingOverview = useStakingSystematic();
  const stakingPosition = useStakingPosition();
  const stakingHealth = useStakingHealth();

  return {
    // Overview data (from systematic APIs)
    ...stakingOverview,
    
    // User position data (from systematic APIs)
    position: stakingPosition,
    
    // Health monitoring
    health: stakingHealth,
    
    // Combined loading state
    isLoading: stakingOverview.isLoading || stakingPosition.isLoading || stakingHealth.isLoading,
    
    // Combined error state
    hasErrors: stakingOverview.isError || stakingPosition.isError || stakingHealth.isError,
    
    // Refetch all data
    refetchAll: () => {
      stakingOverview.refetch();
      stakingPosition.refetch();
    }
  };
}