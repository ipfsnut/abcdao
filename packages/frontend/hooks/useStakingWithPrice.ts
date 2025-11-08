'use client';

import { useStakingMaster } from './useStakingMaster';
import { useTokenPrice } from './useTokenPrice';
import { useMemo } from 'react';

export function useStakingWithPrice() {
  const stakingData = useStakingMaster();
  const { priceData } = useTokenPrice();

  const enhancedData = useMemo(() => {
    if (!priceData || !stakingData) {
      return {
        ...stakingData,
        stakedValueUSD: 0,
        tokenBalanceUSD: 0,
        totalStakedValueUSD: 0,
        formatUSD: (amount: number): string => '$0.00'
      };
    }

    const formatUSD = (amount: number): string => {
      if (amount < 0.01) return '$0.00';
      if (amount < 1) return `$${amount.toFixed(3)}`;
      if (amount < 100) return `$${amount.toFixed(2)}`;
      if (amount < 10000) return `$${amount.toFixed(0)}`;
      if (amount < 1000000) return `$${(amount / 1000).toFixed(1)}K`;
      return `$${(amount / 1000000).toFixed(1)}M`;
    };

    const stakedTokens = parseFloat(stakingData.stakedAmount || '0');
    const tokenBalance = parseFloat(stakingData.tokenBalance || '0');
    const totalStaked = parseFloat(stakingData.totalStaked || '0');

    return {
      ...stakingData,
      stakedValueUSD: stakedTokens * priceData.price,
      tokenBalanceUSD: tokenBalance * priceData.price,
      totalStakedValueUSD: totalStaked * priceData.price,
      formatUSD,
      tokenPrice: priceData.price
    };
  }, [stakingData, priceData]);

  return enhancedData;
}