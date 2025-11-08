'use client';

import { useAccount } from 'wagmi';
import useSWR from 'swr';
import { useStakingMaster } from './useStakingMaster';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Unified Staking Hook
 * 
 * Primary source: Backend staking data manager (cached blockchain data)
 * Secondary source: Direct blockchain calls for write operations
 * 
 * This ensures consistency across all components while maintaining
 * the ability to perform transactions.
 */
export function useStakingUnified() {
  const { address } = useAccount();
  
  // Get all operations from master hook
  const masterHook = useStakingMaster();
  const {
    handleStake,
    handleUnstake,
    handleCompleteUnstake,
    handleClaimRewards,
    needsApproval,
    isApproving,
    isApproveLoading,
    isStakeLoading,
    isUnstakeLoading,
    isClaimLoading,
    tokenBalance,
    stakedAmount: blockchainStakedAmount
  } = masterHook;

  // Get cached staking data from backend (primary source for display)
  const { data: stakingOverview, error: overviewError, isLoading: overviewLoading, mutate: refreshOverview } = useSWR(
    `${BACKEND_URL}/api/staking/overview`,
    fetcher,
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Get user-specific staking position from backend
  const { data: userPosition, error: positionError, isLoading: positionLoading, mutate: refreshPosition } = useSWR(
    address ? `${BACKEND_URL}/api/staking/position/${address}` : null,
    fetcher,
    {
      refreshInterval: 15000, // 15 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Helper function to refresh all data after transactions
  const refreshAll = () => {
    refreshOverview();
    refreshPosition();
  };

  // Enhanced transaction handlers that refresh backend data
  const handleStakeUnified = async (amount: string) => {
    await handleStake(amount);
    // Refresh backend data after successful transaction
    setTimeout(refreshAll, 2000); // Give blockchain time to confirm
  };

  const handleUnstakeUnified = async (amount: string) => {
    await handleUnstake(amount);
    setTimeout(refreshAll, 2000);
  };

  const handleCompleteUnstakeUnified = async () => {
    await handleCompleteUnstake();
    setTimeout(refreshAll, 2000);
  };

  const handleClaimRewardsUnified = async () => {
    await handleClaimRewards();
    setTimeout(refreshAll, 2000);
  };

  // Consistent data formatting
  const formatStakingAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(1);
  };

  const formatEthAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(4);
  };

  return {
    // Primary display data (from backend cache)
    stakedAmount: userPosition?.stakedAmount || '0',
    pendingRewards: userPosition?.pendingRewards || '0',
    totalEarned: userPosition?.rewardsEarned || '0',
    lastStakeTime: userPosition?.lastStakeTime,
    
    // System-wide data (from backend cache)
    totalStaked: stakingOverview?.totalStaked || '0',
    totalRewardsDistributed: stakingOverview?.totalRewardsDistributed || '0',
    totalStakers: stakingOverview?.totalStakers || 0,
    rewardsPoolBalance: stakingOverview?.rewardsPoolBalance || '0',
    currentAPY: stakingOverview?.currentAPY || 0,
    
    // APY breakdown by timeframe
    apyBreakdown: stakingOverview?.apyBreakdown || [],
    
    // User wallet data (from blockchain for accuracy)
    tokenBalance,
    blockchainStakedAmount, // Raw staked amount for MAX buttons
    
    // Transaction state
    isApproving,
    isApproveLoading,
    isStakeLoading,
    isUnstakeLoading,
    isClaimLoading,
    
    // Loading states
    isLoading: overviewLoading || positionLoading,
    isError: !!overviewError || !!positionError,
    error: overviewError || positionError,
    
    // Transaction functions
    handleStake: handleStakeUnified,
    handleUnstake: handleUnstakeUnified,
    handleCompleteUnstake: handleCompleteUnstakeUnified,
    handleClaimRewards: handleClaimRewardsUnified,
    needsApproval,
    
    // Utility functions
    formatStakingAmount,
    formatEthAmount,
    refreshData: refreshAll,
    
    // Raw data access for advanced use cases
    rawOverview: stakingOverview,
    rawPosition: userPosition,
    
    // Health indicators
    dataFreshness: {
      overview: stakingOverview?.lastUpdated,
      position: userPosition?.lastUpdated,
      isStale: false // TODO: Implement staleness detection
    }
  };
}