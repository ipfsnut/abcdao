'use client';

import useSWR from 'swr';

// API endpoint for treasury data
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Systematic Treasury Hook
 * 
 * Consumes pre-computed treasury data from the Treasury Data Manager
 * following the data architecture redesign pattern.
 * 
 * Replaces direct blockchain calls with systematic API consumption.
 */
export function useTreasurySystematic() {
  // Get current treasury snapshot from systematic API
  const { 
    data: treasuryData, 
    error: treasuryError, 
    isLoading: treasuryLoading,
    mutate: refetchTreasury
  } = useSWR(
    `${BACKEND_URL}/api/treasury/current`,
    fetcher,
    {
      refreshInterval: 30000, // Treasury manager updates every 5min, we poll every 30sec
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      fallbackData: null,
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
    }
  );

  // Get token prices from systematic API
  const { 
    data: pricesData, 
    error: pricesError, 
    isLoading: pricesLoading 
  } = useSWR(
    `${BACKEND_URL}/api/treasury/prices`,
    fetcher,
    {
      refreshInterval: 60000, // Price manager updates every 10min, we poll every 1min
      revalidateOnFocus: false, // Prices don't need immediate updates on focus
      fallbackData: { prices: {} },
    }
  );

  // Get treasury statistics
  const { 
    data: statsData, 
    error: statsError, 
    isLoading: statsLoading 
  } = useSWR(
    `${BACKEND_URL}/api/treasury/stats`,
    fetcher,
    {
      refreshInterval: 120000, // Stats update every 2 minutes
      revalidateOnFocus: false,
      fallbackData: null,
    }
  );

  // Debug logging for development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Treasury Systematic Hook:', {
      treasuryData,
      pricesData,
      statsData,
      errors: { treasuryError, pricesError, statsError },
      loading: { treasuryLoading, pricesLoading, statsLoading }
    });
  }

  // Determine overall loading state
  const isLoading = treasuryLoading || pricesLoading || statsLoading;
  
  // Determine error state
  const error = treasuryError || pricesError || statsError;

  // Extract data with fallbacks
  const treasury = treasuryData || {};
  const prices = pricesData?.prices || {};
  const stats = statsData?.statistics || {};

  return {
    // Current treasury data
    treasuryBalance: treasury.abcBalance || 0,
    ethBalance: treasury.ethBalance || 0,
    totalValueUSD: treasury.totalValueUSD || 0,
    stakingTVL: treasury.stakingTVL || 0,
    lastUpdated: treasury.lastUpdated,

    // Token prices
    abcPrice: prices.ABC || 0,
    ethPrice: prices.ETH || 0,
    pricesLastUpdated: pricesData?.lastUpdated,

    // Treasury statistics
    peakValue: stats.peakValue || 0,
    minimumValue: stats.minimumValue || 0,
    averageValue: stats.averageValue || 0,
    totalSnapshots: stats.totalSnapshots || 0,

    // Health and data freshness
    dataHealth: statsData?.dataHealth || { isHealthy: false },
    
    // State management
    isLoading,
    isError: !!error,
    error: error?.message || error,
    refetch: refetchTreasury,
    
    // Treasury address for reference (no longer used for direct calls)
    treasuryAddress: '0xBE6525b767cA8D38d169C93C8120c0C0957388B8'
  };
}

/**
 * Hook for treasury historical data
 */
export function useTreasuryHistory(days: number = 30) {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/treasury/history?days=${days}`,
    fetcher,
    {
      refreshInterval: 300000, // Historical data updates every 5 minutes
      revalidateOnFocus: false,
      fallbackData: { snapshots: [], count: 0 },
    }
  );

  return {
    history: data?.snapshots || [],
    count: data?.count || 0,
    days,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook for treasury health monitoring
 */
export function useTreasuryHealth() {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/treasury/health`,
    fetcher,
    {
      refreshInterval: 60000, // Check health every minute
      revalidateOnFocus: true,
      fallbackData: { status: 'unknown' },
    }
  );

  return {
    status: data?.status || 'unknown',
    isHealthy: data?.isHealthy || false,
    isStale: data?.isStale || false,
    lastUpdate: data?.lastUpdate,
    timeSinceUpdate: data?.timeSinceUpdateMs,
    errorCount: data?.errorCount || 0,
    lastError: data?.lastError,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}