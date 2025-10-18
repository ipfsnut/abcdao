'use client';

import useSWR from 'swr';

// API endpoint for blockchain events data
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Systematic Blockchain Events Hook
 * 
 * Consumes pre-computed blockchain event data from the Blockchain Events Manager
 * following the data architecture redesign pattern.
 * 
 * Provides real-time access to contract events, state, and processing status.
 */

/**
 * Hook for contract events
 */
export function useContractEventsSystematic(contractAddress?: string, eventName?: string, limit: number = 100) {
  const { data, error, isLoading, mutate } = useSWR(
    contractAddress 
      ? `${BACKEND_URL}/api/blockchain-events/events/${contractAddress}?${eventName ? `event=${eventName}&` : ''}limit=${limit}`
      : null,
    fetcher,
    {
      refreshInterval: 30000, // Events update every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      fallbackData: { events: [], count: 0 },
    }
  );

  return {
    events: data?.events || [],
    count: data?.count || 0,
    contractAddress: data?.contractAddress,
    eventName: data?.eventName,
    limit,
    isLoading,
    isError: !!error,
    error: error?.message || error,
    refetch: mutate
  };
}

/**
 * Hook for contract state
 */
export function useContractStateSystematic(contractAddress?: string) {
  const { data, error, isLoading } = useSWR(
    contractAddress ? `${BACKEND_URL}/api/blockchain-events/state/${contractAddress}` : null,
    fetcher,
    {
      refreshInterval: 60000, // Contract state updates every minute
      revalidateOnFocus: false,
      fallbackData: { states: [], count: 0 },
    }
  );

  return {
    states: data?.states || [],
    count: data?.count || 0,
    contractAddress: data?.contractAddress,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook for event processing status
 */
export function useProcessingStatusSystematic() {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/blockchain-events/processing-status`,
    fetcher,
    {
      refreshInterval: 60000, // Processing status updates every minute
      revalidateOnFocus: false,
      fallbackData: { contracts: [], count: 0 },
    }
  );

  return {
    contracts: data?.contracts || [],
    count: data?.count || 0,
    timestamp: data?.timestamp,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook for blockchain activity summary
 */
export function useBlockchainSummarySystematic(hours: number = 24) {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/blockchain-events/summary?hours=${hours}`,
    fetcher,
    {
      refreshInterval: 300000, // Summary updates every 5 minutes
      revalidateOnFocus: false,
      fallbackData: null,
    }
  );

  return {
    timeframe: data?.timeframe || {},
    contracts: data?.contracts || [],
    systemHealth: data?.systemHealth || {},
    hours,
    isLoading,
    isError: !!error,
    error: error?.message || error
  };
}

/**
 * Hook for recent staking events
 */
export function useStakingEventsSystematic(limit: number = 50) {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/blockchain-events/events/staking/recent?limit=${limit}`,
    fetcher,
    {
      refreshInterval: 30000, // Staking events update every 30 seconds
      revalidateOnFocus: true,
      fallbackData: { events: [], count: 0 },
    }
  );

  return {
    events: data?.events || [],
    count: data?.count || 0,
    contract: data?.contract,
    limit,
    isLoading,
    isError: !!error,
    error: error?.message || error,
    
    // Helper computed values
    recentStakes: data?.events?.filter((e: any) => e.type === 'Staked') || [],
    recentUnstakes: data?.events?.filter((e: any) => e.type === 'Unstaked') || [],
    recentClaims: data?.events?.filter((e: any) => e.type === 'RewardClaimed') || []
  };
}

/**
 * Hook for recent rewards events
 */
export function useRewardsEventsSystematic(limit: number = 50) {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/blockchain-events/events/rewards/recent?limit=${limit}`,
    fetcher,
    {
      refreshInterval: 30000, // Rewards events update every 30 seconds
      revalidateOnFocus: true,
      fallbackData: { events: [], count: 0 },
    }
  );

  return {
    events: data?.events || [],
    count: data?.count || 0,
    contract: data?.contract,
    limit,
    isLoading,
    isError: !!error,
    error: error?.message || error,
    
    // Helper computed values
    recentClaims: data?.events?.filter((e: any) => e.type === 'RewardsClaimed') || [],
    recentAllocations: data?.events?.filter((e: any) => e.type === 'RewardsAllocated') || []
  };
}

/**
 * Hook for blockchain events health monitoring
 */
export function useBlockchainEventsHealthSystematic() {
  const { data, error, isLoading } = useSWR(
    `${BACKEND_URL}/api/blockchain-events/health`,
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

/**
 * Hook combining all blockchain events systematic data
 */
export function useBlockchainEventsSystematic() {
  const stakingEvents = useStakingEventsSystematic(20);
  const rewardsEvents = useRewardsEventsSystematic(20);
  const processingStatus = useProcessingStatusSystematic();
  const summary = useBlockchainSummarySystematic(24);
  const health = useBlockchainEventsHealthSystematic();

  return {
    // Recent activity
    stakingEvents: stakingEvents.events,
    rewardsEvents: rewardsEvents.events,
    
    // Activity breakdown
    recentStakes: stakingEvents.recentStakes,
    recentUnstakes: stakingEvents.recentUnstakes,
    recentClaims: [...stakingEvents.recentClaims, ...rewardsEvents.recentClaims],
    
    // System status
    processingStatus: processingStatus.contracts,
    summary: summary,
    health,
    
    // Combined loading state
    isLoading: stakingEvents.isLoading || rewardsEvents.isLoading || 
               processingStatus.isLoading || summary.isLoading || health.isLoading,
    
    // Combined error state
    hasErrors: stakingEvents.isError || rewardsEvents.isError || 
               processingStatus.isError || summary.isError || health.isError,
    
    // Individual hook access
    hooks: {
      stakingEvents,
      rewardsEvents,
      processingStatus,
      summary,
      health
    }
  };
}

/**
 * Hook for monitoring specific wallet activity across all contracts
 */
export function useWalletActivitySystematic(walletAddress?: string, hours: number = 24) {
  const stakingEvents = useStakingEventsSystematic(100);
  const rewardsEvents = useRewardsEventsSystematic(100);

  // Filter events for specific wallet
  const walletStakingEvents = stakingEvents.events.filter((event: any) => {
    const eventData = event.data;
    return eventData?.user === walletAddress;
  });

  const walletRewardsEvents = rewardsEvents.events.filter((event: any) => {
    const eventData = event.data;
    return eventData?.user === walletAddress;
  });

  // Combine and sort by timestamp
  const allWalletEvents = [...walletStakingEvents, ...walletRewardsEvents]
    .sort((a, b) => new Date(b.block.timestamp).getTime() - new Date(a.block.timestamp).getTime());

  return {
    walletAddress,
    events: allWalletEvents,
    stakingEvents: walletStakingEvents,
    rewardsEvents: walletRewardsEvents,
    count: allWalletEvents.length,
    hours,
    isLoading: stakingEvents.isLoading || rewardsEvents.isLoading,
    isError: stakingEvents.isError || rewardsEvents.isError,
    error: stakingEvents.error || rewardsEvents.error
  };
}