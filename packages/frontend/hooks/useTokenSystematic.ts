'use client';

import useSWR from 'swr';

interface TokenData {
  symbol: string;
  price: number;
  volume24h: number;
  volume6h: number;
  volume1h: number;
  liquidity: number;
  marketCap: number;
  priceChange24h: number;
  priceChange6h: number;
  priceChange1h: number;
  pairAddress: string | null;
  dexId: string;
  lastUpdated: string;
}

interface UseTokenSystematicReturn {
  tokenData: TokenData | null;
  isLoading: boolean;
  error: string | null;
  formatPrice: (price: number) => string;
  formatVolume: (volume: number) => string;
  formatMarketCap: (cap: number) => string;
  mutate: () => void;
}

const fetcher = async (url: string): Promise<TokenData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
};

/**
 * Systematic hook for token data using cached backend data
 * Replaces the reactive useTokenPrice hook to eliminate CORS issues
 */
export function useTokenSystematic(symbol: string = 'ABC'): UseTokenSystematicReturn {
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? 'https://abcdao-production.up.railway.app'
    : 'https://abcdao-production.up.railway.app'; // Always use Railway in development too

  const { data: tokenData, error, isLoading, mutate } = useSWR<TokenData>(
    `${apiUrl}/api/treasury/token-data?symbol=${symbol.toUpperCase()}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
      errorRetryInterval: 5000,
      errorRetryCount: 3
    }
  );

  const formatPrice = (price: number): string => {
    if (price < 0.000001) {
      return price.toExponential(3);
    }
    if (price < 0.01) {
      return price.toFixed(6);
    }
    return price.toFixed(4);
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1_000_000) {
      return `$${(volume / 1_000_000).toFixed(1)}M`;
    }
    if (volume >= 1_000) {
      return `$${(volume / 1_000).toFixed(1)}K`;
    }
    return `$${volume.toFixed(0)}`;
  };

  const formatMarketCap = (cap: number): string => {
    if (cap >= 1_000_000_000) {
      return `$${(cap / 1_000_000_000).toFixed(1)}B`;
    }
    if (cap >= 1_000_000) {
      return `$${(cap / 1_000_000).toFixed(1)}M`;
    }
    if (cap >= 1_000) {
      return `$${(cap / 1_000).toFixed(1)}K`;
    }
    return `$${cap.toFixed(0)}`;
  };

  return {
    tokenData: tokenData || null,
    isLoading,
    error: error?.message || null,
    formatPrice,
    formatVolume,
    formatMarketCap,
    mutate
  };
}