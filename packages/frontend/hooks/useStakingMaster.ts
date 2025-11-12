'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, ERC20_ABI } from '@/lib/contracts';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useWalletFirstAuth } from './useWalletFirstAuth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface UnbondingInfo {
  amount: string;
  releaseTime: number;
}

/**
 * Master Staking Hook
 * 
 * Consolidates all 6+ overlapping staking hooks into a single, unified hook.
 * Provides both backend cached data and direct blockchain operations.
 * 
 * Replaces:
 * - useStaking.ts
 * - useStakingSystematic.ts 
 * - useStakingUnified.ts
 * - useStakingWithActions.ts
 * - useStakingWithPrice.ts
 * - useUnbonding.ts
 */
export function useStakingMaster() {
  const { address } = useAccount();
  const { user } = useWalletFirstAuth();
  
  // Use connected wallet address if available, otherwise use authenticated user's wallet address
  const effectiveAddress = (address || user?.wallet_address) as `0x${string}` | undefined;
  
  console.log('🔍 useStakingMaster addresses:', { 
    connectedWallet: address, 
    authWallet: user?.wallet_address,
    effective: effectiveAddress 
  });
  const [isApproving, setIsApproving] = useState(false);
  const [pendingStakeAmount, setPendingStakeAmount] = useState<string>('');
  
  // Stable refs for tracking state changes
  const approvalHandledRef = useRef(false);
  const stakeHandledRef = useRef(false);
  const unstakeHandledRef = useRef(false);
  const claimHandledRef = useRef(false);

  // Backend API Data (Primary Source)
  const { data: stakingOverview, error: overviewError, isLoading: overviewLoading, mutate: refreshOverview } = useSWR(
    `${BACKEND_URL}/api/staking/overview`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const { data: userPosition, error: positionError, isLoading: positionLoading, mutate: refreshPosition } = useSWR(
    effectiveAddress ? `${BACKEND_URL}/api/staking/position/${effectiveAddress}` : null,
    fetcher,
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const { data: stakingStats, error: statsError, isLoading: statsLoading } = useSWR(
    `${BACKEND_URL}/api/staking/stats`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
    }
  );

  const { data: leaderboard, error: leaderboardError, isLoading: leaderboardLoading } = useSWR(
    `${BACKEND_URL}/api/staking/leaderboard?limit=20`,
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: false,
    }
  );

  // Blockchain Data (For Transactions & Accuracy)
  const { data: stakeInfo, refetch: refetchStakeInfo } = useReadContract({
    address: CONTRACTS.ABC_STAKING.address,
    abi: CONTRACTS.ABC_STAKING.abi,
    functionName: 'getStakeInfo',
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!effectiveAddress,
      staleTime: 30_000,
      gcTime: 60_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.ABC_TOKEN.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!effectiveAddress,
      staleTime: 15_000,
      gcTime: 60_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.ABC_TOKEN.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: effectiveAddress ? [effectiveAddress, CONTRACTS.ABC_STAKING.address] : undefined,
    query: {
      enabled: !!effectiveAddress,
      staleTime: 10_000,
      gcTime: 60_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  const { data: totalStaked } = useReadContract({
    address: CONTRACTS.ABC_STAKING.address,
    abi: CONTRACTS.ABC_STAKING.abi,
    functionName: 'totalStaked',
    query: {
      staleTime: 60_000,
      gcTime: 300_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  const { data: totalRewardsDistributed } = useReadContract({
    address: CONTRACTS.ABC_STAKING.address,
    abi: CONTRACTS.ABC_STAKING.abi,
    functionName: 'totalRewardsDistributed',
    query: {
      staleTime: 60_000,
      gcTime: 300_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Unbonding data
  const { data: unbondingInfo } = useReadContract({
    address: CONTRACTS.ABC_STAKING.address,
    abi: CONTRACTS.ABC_STAKING.abi,
    functionName: 'getUnbondingInfo',
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!effectiveAddress,
      staleTime: 30_000,
      gcTime: 60_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  const { data: withdrawableAmount } = useReadContract({
    address: CONTRACTS.ABC_STAKING.address,
    abi: CONTRACTS.ABC_STAKING.abi,
    functionName: 'getWithdrawableAmount',
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!effectiveAddress,
      staleTime: 15_000,
      gcTime: 60_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Write contracts
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: stake, data: stakeHash } = useWriteContract();
  const { writeContract: unstake, data: unstakeHash } = useWriteContract();
  const { writeContract: claimRewards, data: claimHash } = useWriteContract();

  // Transaction receipts
  const { 
    isLoading: isApproveLoading, 
    isSuccess: isApproveSuccess,
    isError: isApproveError,
    error: approveError
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isStakeLoading, isSuccess: isStakeSuccess } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });

  const { isLoading: isUnstakeLoading, isSuccess: isUnstakeSuccess } = useWaitForTransactionReceipt({
    hash: unstakeHash,
  });

  const { isLoading: isClaimLoading, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // Transaction handling effects
  useEffect(() => {
    if (isApproveError && !approvalHandledRef.current) {
      approvalHandledRef.current = true;
      setIsApproving(false);
      setPendingStakeAmount('');
      toast.error(`Approval failed: ${approveError?.message || 'Unknown error'}`);
    }
    if (!isApproveError) {
      approvalHandledRef.current = false;
    }
  }, [isApproveError, approveError]);

  useEffect(() => {
    if (isApproveSuccess && pendingStakeAmount && !approvalHandledRef.current) {
      approvalHandledRef.current = true;
      setIsApproving(false);
      toast.success('Approval successful! Now staking...');
      
      const stakeAmount = pendingStakeAmount;
      const amountWei = parseEther(stakeAmount);
      
      setTimeout(async () => {
        try {
          const { data: currentAllowance } = await refetchAllowance();
          if (currentAllowance && currentAllowance >= amountWei) {
            stake({
              address: CONTRACTS.ABC_STAKING.address,
              abi: CONTRACTS.ABC_STAKING.abi,
              functionName: 'stake',
              args: [amountWei],
            });
          } else {
            toast.error('Approval not yet registered. Please try again in a moment.');
          }
        } catch (error) {
          toast.error('Failed to proceed with staking. Please try again.');
        }
        setPendingStakeAmount('');
      }, 2000);
    }
    if (!isApproveSuccess) {
      approvalHandledRef.current = false;
    }
  }, [isApproveSuccess, pendingStakeAmount, refetchAllowance, stake]);

  useEffect(() => {
    if (isStakeSuccess && !stakeHandledRef.current) {
      stakeHandledRef.current = true;
      refreshAllData();
      toast.success('Staking successful!');
    }
    if (!isStakeSuccess) {
      stakeHandledRef.current = false;
    }
  }, [isStakeSuccess]);

  useEffect(() => {
    if (isUnstakeSuccess && !unstakeHandledRef.current) {
      unstakeHandledRef.current = true;
      refreshAllData();
      toast.success('Unstaking successful!');
    }
    if (!isUnstakeSuccess) {
      unstakeHandledRef.current = false;
    }
  }, [isUnstakeSuccess]);

  useEffect(() => {
    if (isClaimSuccess && !claimHandledRef.current) {
      claimHandledRef.current = true;
      refreshAllData();
      toast.success('Rewards claimed successfully!');
    }
    if (!isClaimSuccess) {
      claimHandledRef.current = false;
    }
  }, [isClaimSuccess]);

  // Helper functions
  const refreshAllData = useCallback(() => {
    refreshOverview();
    refreshPosition();
    refetchStakeInfo();
    refetchBalance();
    refetchAllowance();
  }, [refreshOverview, refreshPosition, refetchStakeInfo, refetchBalance, refetchAllowance]);

  const needsApproval = useCallback((amount: string) => {
    if (!amount || parseFloat(amount) <= 0) return false;
    const amountWei = parseEther(amount);
    return !allowance || allowance < amountWei;
  }, [allowance]);

  // Transaction handlers
  const handleStake = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountWei = parseEther(amount);

    if (!allowance || allowance < amountWei) {
      setIsApproving(true);
      setPendingStakeAmount(amount);
      toast.info(`Approval needed for ${CONTRACTS.ABC_STAKING.address}`);
      
      approve({
        address: CONTRACTS.ABC_TOKEN.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.ABC_STAKING.address, amountWei],
      });
      return;
    }

    stake({
      address: CONTRACTS.ABC_STAKING.address,
      abi: CONTRACTS.ABC_STAKING.abi,
      functionName: 'stake',
      args: [amountWei],
    });
  };

  const handleUnstake = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountWei = parseEther(amount);

    unstake({
      address: CONTRACTS.ABC_STAKING.address,
      abi: CONTRACTS.ABC_STAKING.abi,
      functionName: 'startUnbonding',
      args: [amountWei],
    });
  };

  const handleCompleteUnstake = async () => {
    unstake({
      address: CONTRACTS.ABC_STAKING.address,
      abi: CONTRACTS.ABC_STAKING.abi,
      functionName: 'unstake',
      args: [],
    });
  };

  const handleClaimRewards = async () => {
    claimRewards({
      address: CONTRACTS.ABC_STAKING.address,
      abi: CONTRACTS.ABC_STAKING.abi,
      functionName: 'withdrawRewards',
    });
  };

  // Process unbonding data
  const processedUnbonding = useMemo(() => {
    if (!unbondingInfo || !Array.isArray(unbondingInfo)) {
      return {
        unbondingQueue: [] as UnbondingInfo[],
        totalUnbonding: '0',
      };
    }

    const queue = unbondingInfo.map((item: any) => ({
      amount: formatEther(item.amount as bigint),
      releaseTime: Number(item.releaseTime),
    }));

    const total = queue.reduce((acc, item) => acc + parseFloat(item.amount), 0);

    return {
      unbondingQueue: queue,
      totalUnbonding: total.toString(),
    };
  }, [unbondingInfo]);

  // Format helper functions
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

  // Combine data sources with backend preferred for display, blockchain for transactions
  const isLoading = overviewLoading || positionLoading || statsLoading || leaderboardLoading;
  const hasErrors = !!overviewError || !!positionError || !!statsError || !!leaderboardError;

  return {
    // Primary display data (backend preferred, blockchain fallback)
    stakedAmount: userPosition?.stakedAmount || (stakeInfo ? formatEther(stakeInfo[0]) : '0'),
    pendingRewards: userPosition?.pendingRewards || (stakeInfo ? formatEther(stakeInfo[3]) : '0'),
    totalEarned: userPosition?.rewardsEarned || (stakeInfo ? formatEther(stakeInfo[2]) : '0'),
    tokenBalance: tokenBalance ? formatEther(tokenBalance as bigint) : '0',
    
    // System-wide data (backend preferred)
    totalStaked: stakingOverview?.totalStaked || (totalStaked ? formatEther(totalStaked as bigint) : '0'),
    totalRewardsDistributed: stakingOverview?.totalRewardsDistributed || (totalRewardsDistributed ? formatEther(totalRewardsDistributed as bigint) : '0'),
    totalStakers: stakingOverview?.totalStakers || 0,
    rewardsPoolBalance: stakingOverview?.rewardsPoolBalance || '0',
    currentAPY: stakingOverview?.currentAPY || 0,
    
    // APY breakdown and analytics
    apyBreakdown: stakingOverview?.apyBreakdown || [],
    dailyAPY: stakingStats?.statistics?.apyAnalytics?.daily || 0,
    weeklyAPY: stakingStats?.statistics?.apyAnalytics?.weekly || 0,
    monthlyAPY: stakingStats?.statistics?.apyAnalytics?.monthly || 0,
    
    // Unbonding data
    unbondingQueue: processedUnbonding.unbondingQueue,
    totalUnbonding: processedUnbonding.totalUnbonding,
    withdrawableAmount: withdrawableAmount ? formatEther(withdrawableAmount as bigint) : '0',
    
    // Leaderboard data
    leaderboard: leaderboard?.leaderboard || [],
    leaderboardCount: leaderboard?.count || 0,
    
    // Transaction state
    isApproving,
    isApproveLoading,
    isStakeLoading,
    isUnstakeLoading,
    isClaimLoading,
    
    // Loading and error states
    isLoading,
    isError: hasErrors,
    error: overviewError || positionError || statsError || leaderboardError,
    
    // Raw blockchain values for MAX buttons
    rawTokenBalance: tokenBalance ? tokenBalance.toString() : '0',
    rawStakedAmount: stakeInfo ? stakeInfo[0].toString() : '0',
    
    // Transaction functions
    handleStake,
    handleUnstake,
    handleCompleteUnstake,
    handleClaimRewards,
    needsApproval,
    
    // Utility functions
    formatStakingAmount,
    formatEthAmount,
    refreshData: refreshAllData,
    
    // Raw data access for advanced use cases
    rawOverview: stakingOverview,
    rawPosition: userPosition,
    rawStats: stakingStats,
    rawLeaderboard: leaderboard,
    
    // Health indicators
    dataFreshness: {
      overview: stakingOverview?.lastUpdated,
      position: userPosition?.lastUpdated,
      stats: stakingStats?.lastUpdated,
      isStale: false,
    },
    
    // Data health monitoring
    dataHealth: stakingStats?.dataHealth || { isHealthy: false },
    
    // User context
    isConnected: !!effectiveAddress,
    userAddress: effectiveAddress,
    
    // Backward compatibility helpers
    position: {
      walletAddress: userPosition?.walletAddress || effectiveAddress,
      stakedAmount: userPosition?.stakedAmount || '0',
      rewardsEarned: userPosition?.rewardsEarned || '0',
      pendingRewards: userPosition?.pendingRewards || '0',
      lastStakeTime: userPosition?.lastStakeTime,
      lastRewardClaim: userPosition?.lastRewardClaim,
      isActive: userPosition?.isActive || false,
      lastUpdated: userPosition?.lastUpdated,
      hasStaked: (userPosition?.stakedAmount || 0) > 0,
      hasPendingRewards: (userPosition?.pendingRewards || 0) > 0,
    }
  };
}