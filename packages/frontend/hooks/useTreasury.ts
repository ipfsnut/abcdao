'use client';

import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, ERC20_ABI } from '@/lib/contracts';
import { useMemo } from 'react';

// Protocol wallet address (treasury) - updated current treasury
const TREASURY_ADDRESS = '0x48D87BE38677Ad764203b5516900691Cbd8C7042' as `0x${string}`;

export function useTreasury() {
  // Read treasury ABC token balance
  const { data: treasuryAbcBalance, error: treasuryError, isLoading: treasuryLoading } = useReadContract({
    address: CONTRACTS.ABC_TOKEN.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [TREASURY_ADDRESS],
    query: {
      staleTime: 60_000, // 1 minute
      gcTime: 300_000, // 5 minutes
      retry: 3,
      retryDelay: 2000,
    }
  });

  // Read total staked amount
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

  // Read total ETH rewards distributed
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

  // Read ABC rewards contract stats
  const { data: abcRewardsStats } = useReadContract({
    address: CONTRACTS.ABC_REWARDS.address,
    abi: CONTRACTS.ABC_REWARDS.abi,
    functionName: 'getContractStats',
    query: {
      staleTime: 60_000, // 1 minute
      gcTime: 300_000, // 5 minutes
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Read ABC tokens in staking contract
  const { data: stakingContractBalance } = useReadContract({
    address: CONTRACTS.ABC_TOKEN.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CONTRACTS.ABC_STAKING.address],
    query: {
      staleTime: 30_000, // 30 seconds
      gcTime: 60_000, // 1 minute
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Read ABC tokens in rewards contract
  const { data: rewardsContractBalance } = useReadContract({
    address: CONTRACTS.ABC_TOKEN.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CONTRACTS.ABC_REWARDS.address],
    query: {
      staleTime: 30_000, // 30 seconds
      gcTime: 60_000, // 1 minute
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Calculate derived treasury data
  const treasuryData = useMemo(() => {
    const treasuryAbcFormatted = treasuryAbcBalance ? formatEther(treasuryAbcBalance as bigint) : '0';
    const stakingBalanceFormatted = stakingContractBalance ? formatEther(stakingContractBalance as bigint) : '0';
    const rewardsBalanceFormatted = rewardsContractBalance ? formatEther(rewardsContractBalance as bigint) : '0';
    const totalRewardsEthFormatted = totalRewardsDistributed ? formatEther(totalRewardsDistributed as bigint) : '0';
    
    // Total ABC distributed from rewards contract (claimed amount)
    const totalAbcDistributed = abcRewardsStats ? formatEther(abcRewardsStats[1] as bigint) : '0';
    
    // Total treasury value (sum of all ABC holdings)
    const totalTreasuryValue = (
      parseFloat(treasuryAbcFormatted) + 
      parseFloat(stakingBalanceFormatted) + 
      parseFloat(rewardsBalanceFormatted)
    );

    return {
      // Treasury wallet balances
      treasuryAbcBalance: treasuryAbcFormatted,
      treasuryEthBalance: '0', // TODO: Implement ETH balance if needed
      
      // Contract balances
      stakingContractBalance: stakingBalanceFormatted,
      rewardsContractBalance: rewardsBalanceFormatted,
      
      // Distribution stats
      totalRewardsDistributedEth: totalRewardsEthFormatted,
      totalAbcDistributed,
      
      // Aggregated stats
      totalTreasuryValue: totalTreasuryValue.toFixed(2),
      totalStaked: totalStaked ? formatEther(totalStaked as bigint) : '0',
    };
  }, [
    treasuryAbcBalance,
    stakingContractBalance,
    rewardsContractBalance,
    totalRewardsDistributed,
    abcRewardsStats,
    totalStaked
  ]);

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('Treasury Debug:', {
      treasuryAbcBalance: treasuryAbcBalance?.toString(),
      stakingContractBalance: stakingContractBalance?.toString(),
      rewardsContractBalance: rewardsContractBalance?.toString(),
      totalRewardsDistributed: totalRewardsDistributed?.toString(),
      error: treasuryError?.message,
      isLoading: treasuryLoading,
      treasuryAddress: TREASURY_ADDRESS
    });
  }

  return {
    ...treasuryData,
    
    // Contract addresses
    addresses: {
      treasury: TREASURY_ADDRESS,
      stakingContract: CONTRACTS.ABC_STAKING.address,
      rewardsContract: CONTRACTS.ABC_REWARDS.address,
      abcToken: CONTRACTS.ABC_TOKEN.address,
    },
    
    // Loading and error states
    isLoading: treasuryLoading,
    isError: !!treasuryError,
    error: treasuryError?.message
  };
}