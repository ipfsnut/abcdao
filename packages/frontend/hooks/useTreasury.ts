'use client';

import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, ERC20_ABI } from '@/lib/contracts';

// Protocol wallet address (treasury) - corrected address
const TREASURY_ADDRESS = '0xBE6525b767cA8D38d169C93C8120c0C0957388B8' as `0x${string}`;

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