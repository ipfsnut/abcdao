'use client';

import { useState, useEffect } from 'react';

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
      
      // Mock data for now - this would be replaced with actual API call
      // to fetch historical ETH reward distributions from the backend
      const mockDistributions: EthRewardDistribution[] = [
        {
          id: '1',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000), // 1 week ago
          ethAmount: 0.125,
          totalStaked: 25000000,
          stakersCount: 42,
          apy: 12.5,
          ethPrice: 3200
        },
        {
          id: '2', 
          timestamp: Date.now() - (14 * 24 * 60 * 60 * 1000), // 2 weeks ago
          ethAmount: 0.098,
          totalStaked: 23500000,
          stakersCount: 38,
          apy: 11.8,
          ethPrice: 3150
        },
        {
          id: '3',
          timestamp: Date.now() - (21 * 24 * 60 * 60 * 1000), // 3 weeks ago
          ethAmount: 0.156,
          totalStaked: 24800000,
          stakersCount: 45,
          apy: 14.2,
          ethPrice: 3380
        },
        {
          id: '4',
          timestamp: Date.now() - (28 * 24 * 60 * 60 * 1000), // 4 weeks ago
          ethAmount: 0.089,
          totalStaked: 22100000,
          stakersCount: 35,
          apy: 10.1,
          ethPrice: 3050
        }
      ];

      // Sort by timestamp (newest first)
      mockDistributions.sort((a, b) => b.timestamp - a.timestamp);
      
      setDistributions(mockDistributions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards history');
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentWeeklyAPY = () => {
    if (distributions.length === 0) return 0;
    
    const lastDistribution = distributions[0];
    const weeklyReturn = lastDistribution.ethAmount / (lastDistribution.totalStaked * 0.00001); // Assuming $ABC price
    return weeklyReturn * 52 * 100; // Annualized percentage
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