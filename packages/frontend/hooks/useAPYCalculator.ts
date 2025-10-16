'use client';

import { useMemo } from 'react';
import { useEthRewardsHistory } from './useEthRewardsHistory';
import { useStakingWithPrice } from './useStakingWithPrice';
import { useTokenPrice } from './useTokenPrice';

export interface APYData {
  currentAPY: number;
  averageAPY: number;
  projectedYearlyETH: number;
  projectedYearlyUSD: number;
  weeklyETHPerABC: number;
  stakingEfficiency: number; // ETH earned per $ABC staked
  trend: 'increasing' | 'decreasing' | 'stable';
}

export function useAPYCalculator() {
  const { distributions, getAverageAPY } = useEthRewardsHistory();
  const stakingData = useStakingWithPrice();
  const { priceData } = useTokenPrice();

  const apyData = useMemo(() => {
    if (!distributions.length || !stakingData || !priceData) {
      return {
        currentAPY: 0,
        averageAPY: 0,
        projectedYearlyETH: 0,
        projectedYearlyUSD: 0,
        weeklyETHPerABC: 0,
        stakingEfficiency: 0,
        trend: 'stable' as const
      };
    }

    // Get the most recent distribution
    const latestDistribution = distributions[0];
    const totalStaked = parseFloat(stakingData.totalStaked) || 1;
    
    // Calculate weekly ETH per ABC token
    const weeklyETHPerABC = latestDistribution.ethAmount / latestDistribution.totalStaked;
    
    // Calculate current APY based on most recent distribution
    const weeklyReturn = weeklyETHPerABC * priceData.ethPrice; // Convert to USD
    const abcPriceUSD = priceData.price; // $ABC price in USD
    const weeklyYield = weeklyReturn / abcPriceUSD; // Weekly yield percentage
    const currentAPY = weeklyYield * 52 * 100; // Annualized percentage yield
    
    // Calculate average APY over the last 4 weeks
    const averageAPY = getAverageAPY(4);
    
    // Project yearly ETH earnings for current staking amount
    const userStaked = parseFloat(stakingData.stakedAmount) || 0;
    const projectedYearlyETH = userStaked * weeklyETHPerABC * 52;
    const projectedYearlyUSD = projectedYearlyETH * priceData.ethPrice;
    
    // Calculate staking efficiency (ETH per $ABC per week)
    const stakingEfficiency = weeklyETHPerABC;
    
    // Determine trend based on recent distributions
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (distributions.length >= 2) {
      const recent = distributions[0].apy;
      const previous = distributions[1].apy;
      
      if (recent > previous * 1.1) trend = 'increasing';
      else if (recent < previous * 0.9) trend = 'decreasing';
    }

    return {
      currentAPY,
      averageAPY,
      projectedYearlyETH,
      projectedYearlyUSD,
      weeklyETHPerABC,
      stakingEfficiency,
      trend
    };
  }, [distributions, stakingData, priceData, getAverageAPY]);

  const calculateProjectedEarnings = (stakingAmount: number, timeframe: 'week' | 'month' | 'year') => {
    if (!apyData.weeklyETHPerABC) return { eth: 0, usd: 0 };
    
    let multiplier = 1;
    switch (timeframe) {
      case 'week': multiplier = 1; break;
      case 'month': multiplier = 4.33; break; // Average weeks per month
      case 'year': multiplier = 52; break;
    }
    
    const ethEarnings = stakingAmount * apyData.weeklyETHPerABC * multiplier;
    const usdEarnings = ethEarnings * (priceData?.ethPrice || 3200);
    
    return { eth: ethEarnings, usd: usdEarnings };
  };

  const getAPYRange = () => {
    if (distributions.length < 4) return { min: 0, max: 0 };
    
    const apys = distributions.slice(0, 8).map(d => d.apy); // Last 8 weeks
    return {
      min: Math.min(...apys),
      max: Math.max(...apys)
    };
  };

  const getOptimalStakingAmount = (targetMonthlyUSD: number) => {
    if (!apyData.weeklyETHPerABC || !priceData?.ethPrice) return 0;
    
    const weeklyUSDPerABC = apyData.weeklyETHPerABC * priceData.ethPrice;
    const monthlyUSDPerABC = weeklyUSDPerABC * 4.33;
    
    return targetMonthlyUSD / monthlyUSDPerABC;
  };

  return {
    apyData,
    calculateProjectedEarnings,
    getAPYRange,
    getOptimalStakingAmount,
    isLoading: !distributions.length || !stakingData || !priceData
  };
}