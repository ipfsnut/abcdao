'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

export interface EthRewardDistribution {
  id: string;
  timestamp: number;
  ethAmount: number;
  totalStaked: number;
  stakersCount: number;
  apy: number; // Calculated APY at that point
  ethPrice?: number; // ETH price at distribution time
}

export function useEthRewardsHistory() {
  const [distributions, setDistributions] = useState<EthRewardDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRewardsHistory();
  }, []);


  const fetchRewardsHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch ETH distribution history from backend (with pre-calculated cumulative APY)
      const realDistributions: EthRewardDistribution[] = [];
      
      // Get from backend API (primary source with proper APY calculations)
      try {
        console.log('Fetching from backend URL:', `${config.backendUrl}/api/distributions/history`);
        const response = await fetch(`${config.backendUrl}/api/distributions/history`);
        console.log('Backend response status:', response.status);
        if (response.ok) {
          const apiData = await response.json();
          console.log('Backend API data:', apiData);
          if (Array.isArray(apiData) && apiData.length > 0) {
            console.log(`✅ Fetched ${apiData.length} distributions with calculated APY from backend`);
            console.log('Sample distribution APY:', apiData[0]?.apy);
            realDistributions.push(...apiData);
          }
        } else {
          console.log('Backend response not ok:', response.status, response.statusText);
        }
      } catch (e) {
        console.log('❌ Backend distribution API error:', e);
      }
      
      // Fallback: If backend is not available, show empty state
      if (realDistributions.length === 0) {
        console.log('No distribution data available from backend, showing empty state');
      }
      
      // Sort by timestamp (newest first)
      realDistributions.sort((a, b) => b.timestamp - a.timestamp);
      
      setDistributions(realDistributions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards history');
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentWeeklyAPY = () => {
    if (distributions.length === 0) return 0;
    
    // Get current week's cumulative APY (all distributions in the same week have the same APY)
    const latestDistribution = distributions[0];
    return latestDistribution.apy || 0;
  };

  const getAverageAPY = (weeks: number = 4) => {
    if (distributions.length === 0) return 0;
    
    const recentDistributions = distributions.slice(0, weeks);
    const avgAPY = recentDistributions.reduce((sum, dist) => sum + dist.apy, 0) / recentDistributions.length;
    return avgAPY;
  };

  const getTotalETHDistributed = () => {
    return distributions.reduce((total, dist) => total + dist.ethAmount, 0);
  };

  const getDistributionTrend = () => {
    if (distributions.length < 2) return 'stable';
    
    const recent = distributions[0].ethAmount;
    const previous = distributions[1].ethAmount;
    
    if (recent > previous * 1.1) return 'increasing';
    if (recent < previous * 0.9) return 'decreasing';
    return 'stable';
  };

  return {
    distributions,
    loading,
    error,
    calculateCurrentWeeklyAPY,
    getAverageAPY,
    getTotalETHDistributed,
    getDistributionTrend,
    refetch: fetchRewardsHistory
  };
}