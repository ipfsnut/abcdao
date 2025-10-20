'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, ERC20_ABI } from '@/lib/contracts';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

export function useStaking() {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [pendingStakeAmount, setPendingStakeAmount] = useState<string>('');
  
  // Read staking info
  const { data: stakeInfo, refetch: refetchStakeInfo } = useReadContract({
    address: CONTRACTS.ABC_STAKING.address,
    abi: CONTRACTS.ABC_STAKING.abi,
    functionName: 'getStakeInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 30_000, // 30 seconds
      gcTime: 60_000, // 1 minute
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Read token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.ABC_TOKEN.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 15_000, // 15 seconds
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
      staleTime: 10_000, // 10 seconds
      gcTime: 60_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Read total staked
  const { data: totalStaked } = useReadContract({
    address: CONTRACTS.ABC_STAKING.address,
    abi: CONTRACTS.ABC_STAKING.abi,
    functionName: 'totalStaked',
    query: {
      staleTime: 60_000, // 1 minute
      gcTime: 300_000, // 5 minutes
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Read total rewards distributed
  const { data: totalRewardsDistributed } = useReadContract({
    address: CONTRACTS.ABC_STAKING.address,
    abi: CONTRACTS.ABC_STAKING.abi,
    functionName: 'totalRewardsDistributed',
    query: {
      staleTime: 60_000, // 1 minute
      gcTime: 300_000, // 5 minutes
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Write functions
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: stake, data: stakeHash } = useWriteContract();
  const { writeContract: unstake, data: unstakeHash } = useWriteContract();
  const { writeContract: claimRewards, data: claimHash } = useWriteContract();

  // Wait for transactions
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

  // Handle approval errors
  useEffect(() => {
    if (isApproveError) {
      setIsApproving(false);
      setPendingStakeAmount('');
      toast.error(`Approval failed: ${approveError?.message || 'Unknown error'}`);
      console.error('❌ Approval failed:', approveError);
    }
  }, [isApproveError, approveError]);

  // Refetch data on successful transactions
  useEffect(() => {
    if (isApproveSuccess && pendingStakeAmount) {
      setIsApproving(false);
      toast.success('Approval successful! Now staking...');
      
      // Store the amount to prevent state changes
      const stakeAmount = pendingStakeAmount;
      const amountWei = parseEther(stakeAmount);
      
      console.log('🎯 About to stake:', { stakeAmount, amountWei: amountWei.toString() });
      
      // Wait for allowance to update before staking
      const attemptStake = async () => {
        // Retry allowance check with backoff
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 1s, 2s, 3s, 4s, 5s
          
          const { data: currentAllowance } = await refetchAllowance();
          console.log(`🔄 Attempt ${i + 1}: Allowance check:`, currentAllowance?.toString());
          
          if (currentAllowance && currentAllowance >= amountWei) {
            console.log('✅ Sufficient allowance confirmed, proceeding to stake with amount:', amountWei.toString());
            stake({
              address: CONTRACTS.ABC_STAKING.address,
              abi: CONTRACTS.ABC_STAKING.abi,
              functionName: 'stake',
              args: [amountWei],
            });
            setPendingStakeAmount('');
            return;
          }
        }
        
        toast.error('Approval failed to register. Please try again.');
        setPendingStakeAmount('');
      };
      
      attemptStake();
    }
  }, [isApproveSuccess, pendingStakeAmount, refetchAllowance, stake]);

  useEffect(() => {
    if (isStakeSuccess) {
      refetchStakeInfo();
      refetchBalance();
      refetchAllowance();
      toast.success('Staking successful!');
    }
  }, [isStakeSuccess, refetchStakeInfo, refetchBalance, refetchAllowance]);

  useEffect(() => {
    if (isUnstakeSuccess) {
      refetchStakeInfo();
      refetchBalance();
      toast.success('Unstaking successful!');
    }
  }, [isUnstakeSuccess, refetchStakeInfo, refetchBalance]);

  useEffect(() => {
    if (isClaimSuccess) {
      refetchStakeInfo();
      toast.success('Rewards claimed successfully!');
    }
  }, [isClaimSuccess, refetchStakeInfo]);

  const handleStake = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountWei = parseEther(amount);

    // Check if approval is needed
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

    console.log('✅ Sufficient allowance, proceeding to stake');
    // Stake tokens
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

    // V2 uses startUnbonding to begin the unbonding process
    unstake({
      address: CONTRACTS.ABC_STAKING.address,
      abi: CONTRACTS.ABC_STAKING.abi,
      functionName: 'startUnbonding',
      args: [amountWei],
    });
  };

  const handleCompleteUnstake = async () => {
    // V2 uses unstake() with no parameters to complete unbonding
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

  // Memoized helper function to check if approval is needed for a given amount
  const needsApproval = useMemo(() => {
    return (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) return false;
      const amountWei = parseEther(amount);
      const needed = !allowance || allowance < amountWei;
      return needed;
    };
  }, [allowance]);

  // Note: estimatedAPY removed to break circular dependency with useAPYCalculator
  // APY should be calculated at component level using useAPYCalculator directly

  return {
    // Data
    stakedAmount: stakeInfo ? formatEther(stakeInfo[0]) : '0',
    pendingRewards: stakeInfo ? formatEther(stakeInfo[3]) : '0',
    totalEarned: stakeInfo ? formatEther(stakeInfo[2]) : '0',
    tokenBalance: tokenBalance ? formatEther(tokenBalance as bigint) : '0',
    totalStaked: totalStaked ? formatEther(totalStaked as bigint) : '0',
    totalRewardsDistributed: totalRewardsDistributed ? formatEther(totalRewardsDistributed as bigint) : '0',
    
    // State
    isApproving,
    isApproveLoading,
    isStakeLoading,
    isUnstakeLoading,
    isClaimLoading,
    
    // Functions
    handleStake,
    handleUnstake,
    handleCompleteUnstake,
    handleClaimRewards,
    needsApproval,
  };
}