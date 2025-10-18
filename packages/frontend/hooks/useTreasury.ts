'use client';

import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, ERC20_ABI } from '@/lib/contracts';

// Protocol wallet address (treasury) - corrected address
const TREASURY_ADDRESS = '0xBE6525b767cA8D38d169C93C8120c0C0957388B8' as `0x${string}`;

export function useTreasury() {
  // Read treasury ABC token balance
  const { data: treasuryBalance, error, isLoading, isError } = useReadContract({
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

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('Treasury Debug:', {
      treasuryBalance: treasuryBalance?.toString(),
      error: error?.message,
      isLoading,
      isError,
      tokenAddress: CONTRACTS.ABC_TOKEN.address,
      treasuryAddress: TREASURY_ADDRESS
    });
  }

  return {
    treasuryBalance: treasuryBalance ? formatEther(treasuryBalance as bigint) : '0',
    treasuryAddress: TREASURY_ADDRESS,
    isLoading,
    isError,
    error: error?.message
  };
}