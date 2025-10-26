'use client';

import useSWR from 'swr';
import { useTreasury } from './useTreasury';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Unified Treasury Hook
 * 
 * Primary source: Backend treasury data manager (cached blockchain data)
 * Secondary source: Direct blockchain calls for real-time verification
 * 
 * This ensures consistency across all components while maintaining
 * the most up-to-date treasury information.
 */
export function useTreasuryUnified() {
  // Get cached treasury data from backend (primary source for display)
  const { data: treasurySnapshot, error: snapshotError, isLoading: snapshotLoading, mutate: refreshSnapshot } = useSWR(
    `${BACKEND_URL}/api/treasury/current`,
    fetcher,
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Get treasury statistics from backend
  const { data: treasuryStats, error: statsError, isLoading: statsLoading } = useSWR(
    `${BACKEND_URL}/api/treasury/stats`,
    fetcher,
    {
      refreshInterval: 120000, // 2 minutes
      revalidateOnFocus: false,
    }
  );

  // Get token price data for USD calculations
  const { data: tokenData, error: tokenError, isLoading: tokenLoading } = useSWR(
    `${BACKEND_URL}/api/treasury/token-data?symbol=ABC`,
    fetcher,
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: false,
    }
  );

  // Get direct blockchain data for verification (secondary source)
  const {
    treasuryAbcBalance: blockchainTreasuryBalance,
    stakingContractBalance: blockchainStakingBalance,
    rewardsContractBalance: blockchainRewardsBalance,
    totalAbcDistributed: blockchainAbcDistributed,
    totalRewardsDistributedEth: blockchainEthDistributed,
    totalTreasuryValue: blockchainTotalValue,
    addresses,
    isLoading: blockchainLoading
  } = useTreasury();

  // Helper function to refresh all data
  const refreshAll = () => {
    refreshSnapshot();
  };

  // Consistent data formatting
  const formatTokenAmount = (amount: string | number) => {
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

  const formatUsdAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Use backend data as primary source, fallback to blockchain for missing data
  const treasuryAbcBalance = treasurySnapshot?.abcBalance || blockchainTreasuryBalance || '0';
  const treasuryEthBalance = treasurySnapshot?.ethBalance || '0';
  const stakingContractBalance = treasurySnapshot?.stakingBalance || blockchainStakingBalance || '0';
  const rewardsContractBalance = treasurySnapshot?.rewardsBalance || blockchainRewardsBalance || '0';
  const totalAbcDistributed = treasurySnapshot?.totalAbcDistributed || blockchainAbcDistributed || '0';
  const totalRewardsDistributedEth = treasurySnapshot?.totalEthDistributed || blockchainEthDistributed || '0';

  // Calculate total treasury value
  const totalTreasuryValue = (
    parseFloat(treasuryAbcBalance) + 
    parseFloat(stakingContractBalance) + 
    parseFloat(rewardsContractBalance)
  );

  // Calculate USD values if price data is available
  const abcPrice = tokenData?.price || 0;
  const totalTreasuryValueUSD = totalTreasuryValue * abcPrice;
  const treasuryAbcValueUSD = parseFloat(treasuryAbcBalance) * abcPrice;

  return {
    // Primary treasury data (formatted for display)
    treasuryAbcBalance: formatTokenAmount(treasuryAbcBalance),
    treasuryEthBalance: formatEthAmount(treasuryEthBalance),
    stakingContractBalance: formatTokenAmount(stakingContractBalance),
    rewardsContractBalance: formatTokenAmount(rewardsContractBalance),
    
    // Distribution stats
    totalAbcDistributed: formatTokenAmount(totalAbcDistributed),
    totalRewardsDistributedEth: formatEthAmount(totalRewardsDistributedEth),
    
    // Aggregated stats
    totalTreasuryValue: formatTokenAmount(totalTreasuryValue),
    totalTreasuryValueUSD: formatUsdAmount(totalTreasuryValueUSD),
    treasuryAbcValueUSD: formatUsdAmount(treasuryAbcValueUSD),
    
    // Raw values for calculations
    raw: {
      treasuryAbcBalance: parseFloat(treasuryAbcBalance),
      treasuryEthBalance: parseFloat(treasuryEthBalance),
      stakingContractBalance: parseFloat(stakingContractBalance),
      rewardsContractBalance: parseFloat(rewardsContractBalance),
      totalAbcDistributed: parseFloat(totalAbcDistributed),
      totalRewardsDistributedEth: parseFloat(totalRewardsDistributedEth),
      totalTreasuryValue,
      totalTreasuryValueUSD,
      treasuryAbcValueUSD
    },
    
    // Price data
    abcPrice,
    abcPriceFormatted: formatUsdAmount(abcPrice),
    
    // Treasury statistics (from backend)
    stats: {
      peakValue: treasuryStats?.statistics?.peakValue || 0,
      minimumValue: treasuryStats?.statistics?.minimumValue || 0,
      averageValue: treasuryStats?.statistics?.averageValue || 0,
      totalSnapshots: treasuryStats?.statistics?.totalSnapshots || 0,
      lastSnapshot: treasurySnapshot?.lastUpdated
    },
    
    // Contract addresses
    addresses: addresses || {
      treasury: '0xBE6525b767cA8D38d169C93C8120c0C0957388B8',
      stakingContract: treasurySnapshot?.stakingContractAddress,
      rewardsContract: treasurySnapshot?.rewardsContractAddress,
      abcToken: treasurySnapshot?.abcTokenAddress,
    },
    
    // Loading states
    isLoading: snapshotLoading || statsLoading || tokenLoading || blockchainLoading,
    isError: !!snapshotError || !!statsError || !!tokenError,
    error: snapshotError || statsError || tokenError,
    
    // Utility functions
    formatTokenAmount,
    formatEthAmount,
    formatUsdAmount,
    refreshData: refreshAll,
    
    // Raw data access for advanced use cases
    rawSnapshot: treasurySnapshot,
    rawStats: treasuryStats,
    rawTokenData: tokenData,
    
    // Health indicators
    dataFreshness: {
      snapshot: treasurySnapshot?.lastUpdated,
      stats: treasuryStats?.lastUpdated,
      prices: tokenData?.lastUpdated,
      isStale: false // TODO: Implement staleness detection
    },
    
    // Data source indicators (for debugging)
    dataSources: {
      primary: 'backend_cache',
      fallback: 'blockchain_direct',
      usingFallback: !treasurySnapshot && !!blockchainTreasuryBalance
    }
  };
}