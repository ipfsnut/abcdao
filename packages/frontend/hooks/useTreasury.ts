'use client';

import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, ERC20_ABI } from '@/lib/contracts';

// Bot wallet address (treasury)
const TREASURY_ADDRESS = '0x475579e65E140B11bc4656dD4b05e0CADc8366eB' as `0x${string}`;

export function useTreasury() {
  // Read treasury ABC token balance
  const { data: treasuryBalance } = useReadContract({
    address: CONTRACTS.ABC_TOKEN.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [TREASURY_ADDRESS],
    query: {
      staleTime: 60_000, // 1 minute
      gcTime: 300_000, // 5 minutes
      retry: 1,
      retryDelay: 2000,
    }
  });

  return {
    treasuryBalance: treasuryBalance ? formatEther(treasuryBalance as bigint) : '0',
    treasuryAddress: TREASURY_ADDRESS,
  };
}