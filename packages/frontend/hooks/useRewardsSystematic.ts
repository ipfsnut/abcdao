'use client';

import useSWR from 'swr';
import { useAccount } from 'wagmi';
import { useFarcaster } from '@/contexts/unified-farcaster-context';

interface RewardSummary {
  totalPending: number;
  totalClaimable: number;
  pendingCount: number;
  claimableCount: number;
}

interface Reward {
  id: number;
  commitHash: string;
  repository: string;
  message: string;
  amount: number;
  processedAt: string;
  castUrl?: string;
  contractTxHash?: string;
  transferredAt?: string;
}

interface UserRewardsData {
  summary: RewardSummary;
  rewards: {
    pending: Reward[];
    claimable: Reward[];
  };
}

interface RewardsStats {
  totalUsers: number;
  totalCommits: number;
  totalRewardsDistributed: number;
  commitsToday: number;
  rewardsToday: number;
}

interface UseRewardsSystematicReturn {
  // User rewards data
  userRewards: UserRewardsData | null;
  isUserRewardsLoading: boolean;
  userRewardsError: string | null;
  
  // Overall stats
  stats: RewardsStats | null;
  isStatsLoading: boolean;
  statsError: string | null;
  
  // Actions
  refetchUserRewards: () => void;
  refetchStats: () => void;
}

const fetcher = async (url: string): Promise<any> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Systematic hook for rewards data using cached backend data
 * Replaces reactive contract calls and direct API calls with systematic data fetching
 */
export function useRewardsSystematic(): UseRewardsSystematicReturn {
  const { address } = useAccount();
  const { user: profile } = useFarcaster();

  const apiUrl = process.env.NODE_ENV === 'production' 
    ? 'https://abcdao-production.up.railway.app'
    : 'https://abcdao-production.up.railway.app'; // Always use Railway

  // Get user rewards data
  const { 
    data: userRewards, 
    error: userRewardsError, 
    isLoading: isUserRewardsLoading,
    mutate: refetchUserRewards
  } = useSWR<UserRewardsData>(
    profile?.fid ? `${apiUrl}/api/rewards/user/${profile.fid}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
      errorRetryInterval: 5000,
      errorRetryCount: 3
    }
  );

  // Get overall rewards stats
  const { 
    data: stats, 
    error: statsError, 
    isLoading: isStatsLoading,
    mutate: refetchStats
  } = useSWR<RewardsStats>(
    `${apiUrl}/api/rewards/stats`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Dedupe requests within 30 seconds
    }
  );

  return {
    // User rewards data
    userRewards: userRewards || null,
    isUserRewardsLoading,
    userRewardsError: userRewardsError?.message || null,
    
    // Overall stats
    stats: stats || null,
    isStatsLoading,
    statsError: statsError?.message || null,
    
    // Actions
    refetchUserRewards,
    refetchStats
  };
}