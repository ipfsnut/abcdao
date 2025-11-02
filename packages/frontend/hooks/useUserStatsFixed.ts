/**
 * Fixed User Statistics Hook
 * 
 * Uses the working /api/users/:fid/status endpoint instead of the broken
 * systematic API to display correct ABC rewards and user data.
 * 
 * This is a quick fix to resolve the 0 ABC rewards display issue.
 */

'use client';

import useSWR from 'swr';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useUserStatsFixed(farcasterFid?: number) {
  const { data, error, isLoading, mutate } = useSWR(
    farcasterFid ? `${BACKEND_URL}/api/users/${farcasterFid}/status` : null,
    fetcher,
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      fallbackData: null,
    }
  );

  // Helper function to format numbers with null safety
  const formatNumber = (value: number | null | undefined) => {
    const num = Number(value || 0);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatEthAmount = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '0.0000';
    }
    return Number(value).toFixed(4);
  };

  // Extract data from the working API response with proper null handling
  const totalCommits = parseInt(data?.stats?.total_commits || '0');
  const totalRewardsEarned = parseFloat(data?.stats?.total_rewards || '0');
  const ethRewardsEarned = data?.eth_rewards?.earned ? parseFloat(data.eth_rewards.earned) : 0;
  const ethRewardsPending = data?.eth_rewards?.pending ? parseFloat(data.eth_rewards.pending) : 0;
  const avatarUrl = data?.user?.avatar_url || null;
  const walletAddress = data?.user?.wallet_address || null;

  return {
    // Core statistics (formatted for display)
    totalCommits,
    totalCommitsFormatted: formatNumber(totalCommits),
    totalRewardsEarned,
    totalRewardsEarnedFormatted: formatNumber(totalRewardsEarned),
    
    // ETH rewards
    ethRewardsEarned,
    ethRewardsEarnedFormatted: formatEthAmount(ethRewardsEarned),
    ethRewardsPending,
    ethRewardsPendingFormatted: formatEthAmount(ethRewardsPending),
    
    // Profile data
    avatarUrl,
    walletAddress,
    membership: {
      status: data?.membership_status || 'free',
      txHash: data?.membership_tx_hash,
      paidAt: data?.membership_paid_at
    },
    
    // Loading states
    isLoading,
    isError: !!error,
    error: error?.message || error,
    
    // Utility functions
    formatNumber,
    formatEthAmount,
    refreshData: mutate,
    
    // Raw data for debugging
    raw: data,
    
    // Data source indicator
    dataSource: 'users_status_api_fixed'
  };
}