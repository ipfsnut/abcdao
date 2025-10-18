'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, ERC20_ABI } from '@/lib/contracts';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useUserActions } from './useUserActions';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import useSWR from 'swr';
import { config } from '@/lib/config';

/**
 * Enhanced staking hook with real-time updates and optimistic UI
 */
export function useStakingWithActions() {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [pendingStakeAmount, setPendingStakeAmount] = useState<string>('');
  
  // Initialize real-time updates
  useRealtimeUpdates({
    userWallet: address,
    autoReconnect: true,
    debug: process.env.NODE_ENV === 'development'
  });

  // Initialize user actions
  const {
    stake,
    unstake,
    claimRewards,
    loading: actionLoading,
    errors: actionErrors
  } = useUserActions(address);

  // Fetch staking overview with real-time updates
  const { data: stakingOverview, mutate: mutateStakingOverview } = useSWR(
    '/api/user-actions/staking/overview',
    async (url) => {
      const response = await fetch(`${config.backendUrl}${url}`);
      if (!response.ok) throw new Error('Failed to fetch staking overview');
      return response.json();
    },
    {
      refreshInterval: 30000, // Fallback refresh every 30 seconds
      revalidateOnFocus: false
    }
  );

  // Fetch user's staking position
  const { data: userPosition, mutate: mutateUserPosition } = useSWR(
    address ? `/api/user-actions/staking/position/${address}` : null,
    async (url) => {
      const response = await fetch(`${config.backendUrl}${url}`);
      if (!response.ok) throw new Error('Failed to fetch staking position');
      return response.json();
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: false
    }
  );

  // Read token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.ABC_TOKEN.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 15_000,
      gcTime: 60_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.ABC_TOKEN.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.ABC_STAKING.address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 15_000,
      gcTime: 60_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Contract write functions
  const { writeContract: writeApprove } = useWriteContract();
  const { writeContract: writeStake } = useWriteContract();
  const { writeContract: writeUnstake } = useWriteContract();
  const { writeContract: writeClaim } = useWriteContract();

  // Transaction monitoring
  const [txHashes, setTxHashes] = useState<{
    approve?: string;
    stake?: string;
    unstake?: string;
    claim?: string;
  }>({});

  // Wait for transaction receipts
  const approveReceipt = useWaitForTransactionReceipt({
    hash: txHashes.approve as `0x${string}`,
    query: { enabled: !!txHashes.approve }
  });

  const stakeReceipt = useWaitForTransactionReceipt({
    hash: txHashes.stake as `0x${string}`,
    query: { enabled: !!txHashes.stake }
  });

  const unstakeReceipt = useWaitForTransactionReceipt({
    hash: txHashes.unstake as `0x${string}`,
    query: { enabled: !!txHashes.unstake }
  });

  const claimReceipt = useWaitForTransactionReceipt({
    hash: txHashes.claim as `0x${string}`,
    query: { enabled: !!txHashes.claim }
  });

  // Enhanced approval function
  const approveTokens = useCallback(async (amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsApproving(true);
    
    try {
      const amountWei = parseEther(amount);
      
      writeApprove({
        address: CONTRACTS.ABC_TOKEN.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.ABC_STAKING.address, amountWei],
      }, {
        onSuccess: (hash) => {
          setTxHashes(prev => ({ ...prev, approve: hash }));
          toast.loading('Approving tokens...', { id: 'approve' });
        },
        onError: (error) => {
          console.error('Approve error:', error);
          toast.error('Approval failed');
          setIsApproving(false);
        }
      });
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Approval failed');
      setIsApproving(false);
    }
  }, [address, writeApprove]);

  // Enhanced stake function with real-time updates
  const stakeTokens = useCallback(async (amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const amountWei = parseEther(amount);
      setPendingStakeAmount(amount);
      
      writeStake({
        address: CONTRACTS.ABC_STAKING.address,
        abi: CONTRACTS.ABC_STAKING.abi,
        functionName: 'stake',
        args: [amountWei],
      }, {
        onSuccess: (hash) => {
          setTxHashes(prev => ({ ...prev, stake: hash }));
          toast.loading('Staking tokens...', { id: 'stake' });
        },
        onError: (error) => {
          console.error('Stake error:', error);
          toast.error('Staking failed');
          setPendingStakeAmount('');
        }
      });
    } catch (error) {
      console.error('Stake error:', error);
      toast.error('Staking failed');
      setPendingStakeAmount('');
    }
  }, [address, writeStake]);

  // Enhanced unstake function with real-time updates
  const unstakeTokens = useCallback(async (amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const amountWei = parseEther(amount);
      
      writeUnstake({
        address: CONTRACTS.ABC_STAKING.address,
        abi: CONTRACTS.ABC_STAKING.abi,
        functionName: 'unstake',
        args: [amountWei],
      }, {
        onSuccess: (hash) => {
          setTxHashes(prev => ({ ...prev, unstake: hash }));
          toast.loading('Unstaking tokens...', { id: 'unstake' });
        },
        onError: (error) => {
          console.error('Unstake error:', error);
          toast.error('Unstaking failed');
        }
      });
    } catch (error) {
      console.error('Unstake error:', error);
      toast.error('Unstaking failed');
    }
  }, [address, writeUnstake]);

  // Enhanced claim function with real-time updates
  const claimStakingRewards = useCallback(async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      writeClaim({
        address: CONTRACTS.ABC_STAKING.address,
        abi: CONTRACTS.ABC_STAKING.abi,
        functionName: 'claimRewards',
      }, {
        onSuccess: (hash) => {
          setTxHashes(prev => ({ ...prev, claim: hash }));
          toast.loading('Claiming rewards...', { id: 'claim' });
        },
        onError: (error) => {
          console.error('Claim error:', error);
          toast.error('Claiming failed');
        }
      });
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('Claiming failed');
    }
  }, [address, writeClaim]);

  // Handle transaction confirmations and trigger real-time updates
  useEffect(() => {
    if (stakeReceipt.data?.status === 'success' && pendingStakeAmount) {
      const txHash = stakeReceipt.data.transactionHash;
      
      // Trigger real-time update through our action system
      stake(parseFloat(pendingStakeAmount), txHash, {
        onSuccess: () => {
          toast.success('Tokens staked successfully!', { id: 'stake' });
          setPendingStakeAmount('');
          setTxHashes(prev => ({ ...prev, stake: undefined }));
        },
        onError: (error) => {
          toast.error(`Staking failed: ${error.message}`, { id: 'stake' });
        }
      });
    }
  }, [stakeReceipt.data, pendingStakeAmount, stake]);

  useEffect(() => {
    if (unstakeReceipt.data?.status === 'success') {
      const txHash = unstakeReceipt.data.transactionHash;
      const amount = 0; // Would need to parse from transaction logs in real implementation
      
      unstake(amount, txHash, {
        onSuccess: () => {
          toast.success('Tokens unstaked successfully!', { id: 'unstake' });
          setTxHashes(prev => ({ ...prev, unstake: undefined }));
        },
        onError: (error) => {
          toast.error(`Unstaking failed: ${error.message}`, { id: 'unstake' });
        }
      });
    }
  }, [unstakeReceipt.data, unstake]);

  useEffect(() => {
    if (claimReceipt.data?.status === 'success') {
      const txHash = claimReceipt.data.transactionHash;
      const amount = 0; // Would need to parse from transaction logs
      
      claimRewards(amount, txHash, {
        onSuccess: () => {
          toast.success('Rewards claimed successfully!', { id: 'claim' });
          setTxHashes(prev => ({ ...prev, claim: undefined }));
        },
        onError: (error) => {
          toast.error(`Claiming failed: ${error.message}`, { id: 'claim' });
        }
      });
    }
  }, [claimReceipt.data, claimRewards]);

  // Handle approval confirmations
  useEffect(() => {
    if (approveReceipt.data?.status === 'success') {
      toast.success('Approval successful!', { id: 'approve' });
      setIsApproving(false);
      setTxHashes(prev => ({ ...prev, approve: undefined }));
      refetchAllowance();
    }
  }, [approveReceipt.data, refetchAllowance]);

  // Parse staking data with fallbacks
  const parsedStakingData = {
    // From real-time API (preferred)
    globalMetrics: stakingOverview?.data?.globalMetrics || {
      total_staked: '0',
      total_stakers: 0,
      current_apy: 0,
      pending_confirmations: 0
    },
    userPosition: userPosition?.position || {
      staked_amount: '0',
      rewards_earned: '0',
      status: 'active',
      last_action_at: null
    },
    // From blockchain (backup)
    tokenBalance: tokenBalance ? formatEther(tokenBalance) : '0',
    allowance: allowance ? formatEther(allowance) : '0',
  };

  // Calculate derived values
  const needsApproval = useCallback((amount: string) => {
    if (!allowance) return true;
    const allowanceAmount = parseFloat(formatEther(allowance));
    const requiredAmount = parseFloat(amount);
    return allowanceAmount < requiredAmount;
  }, [allowance]);

  const isLoading = {
    approve: isApproving || approveReceipt.isLoading,
    stake: !!txHashes.stake || stakeReceipt.isLoading || actionLoading.stake,
    unstake: !!txHashes.unstake || unstakeReceipt.isLoading || actionLoading.unstake,
    claim: !!txHashes.claim || claimReceipt.isLoading || actionLoading.claim,
  };

  return {
    // Data
    stakingData: parsedStakingData,
    stakingOverview: stakingOverview?.data,
    userPosition: userPosition?.position,
    
    // Blockchain data
    tokenBalance: parsedStakingData.tokenBalance,
    allowance: parsedStakingData.allowance,
    
    // Actions
    approveTokens,
    stakeTokens,
    unstakeTokens,
    claimStakingRewards,
    
    // State
    isLoading,
    errors: actionErrors,
    needsApproval,
    
    // Refresh functions
    refetchBalance,
    refetchAllowance,
    mutateStakingOverview,
    mutateUserPosition,
    
    // Status
    isConnected: !!address,
    pendingStakeAmount
  };
}