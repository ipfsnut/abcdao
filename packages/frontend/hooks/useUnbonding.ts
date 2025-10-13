'use client';

import { useReadContract, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import { useMemo } from 'react';

interface UnbondingInfo {
  amount: string;
  releaseTime: number;
}

export function useUnbonding() {
  const { address } = useAccount();

  // Read unbonding info
  const { data: unbondingInfo } = useReadContract({
    address: CONTRACTS.ABC_STAKING.address,
    abi: CONTRACTS.ABC_STAKING.abi,
    functionName: 'getUnbondingInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 30_000, // 30 seconds
      gcTime: 60_000, // 1 minute
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Read withdrawable amount
  const { data: withdrawableAmount } = useReadContract({
    address: CONTRACTS.ABC_STAKING.address,
    abi: CONTRACTS.ABC_STAKING.abi,
    functionName: 'getWithdrawableAmount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 15_000, // 15 seconds
      gcTime: 60_000,
      retry: 1,
      retryDelay: 2000,
    }
  });

  // Process unbonding data
  const processedData = useMemo(() => {
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

  return {
    unbondingQueue: processedData.unbondingQueue,
    totalUnbonding: processedData.totalUnbonding,
    withdrawableAmount: withdrawableAmount ? formatEther(withdrawableAmount as bigint) : '0',
  };
}