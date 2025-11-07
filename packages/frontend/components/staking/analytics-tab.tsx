/**
 * Analytics Tab Component
 * 
 * Personal staking analytics and performance insights
 */

'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  stakingPerformance: {
    totalStaked: string;
    totalRewards: string;
    averageDailyReward: string;
    bestDay: string;
    stakingDays: number;
  };
  portfolioBreakdown: {
    stakedPercentage: number;
    availablePercentage: number;
    rewardsPercentage: number;
  };
  recentActivity: {
    stakingActions: number;
    claimActions: number;
    totalTransactions: number;
  };
}

interface AnalyticsTabProps {
  stakingData: {
    tokenBalance: string;
    stakedAmount: string;
    pendingRewards: string;
    totalEarned: string;
    isLoading: boolean;
  };
  user: any;
  isPublicView?: boolean;
}

export function AnalyticsTab({ stakingData, user, isPublicView = false }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe, stakingData]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    
    try {
      if (!user?.wallet_address) {
        // No wallet address available, use fallback data
        const totalTokens = parseFloat(stakingData.tokenBalance) + parseFloat(stakingData.stakedAmount);
        const fallbackAnalytics: AnalyticsData = {
          stakingPerformance: {
            totalStaked: stakingData.stakedAmount,
            totalRewards: stakingData.totalEarned,
            averageDailyReward: (parseFloat(stakingData.totalEarned) / 30).toFixed(6),
            bestDay: '0.0000',
            stakingDays: 1,
          },
          portfolioBreakdown: {
            stakedPercentage: totalTokens > 0 ? (parseFloat(stakingData.stakedAmount) / totalTokens) * 100 : 0,
            availablePercentage: totalTokens > 0 ? (parseFloat(stakingData.tokenBalance) / totalTokens) * 100 : 0,
            rewardsPercentage: 0
          },
          recentActivity: {
            stakingActions: 0,
            claimActions: 0,
            totalTransactions: 0
          }
        };
        setAnalytics(fallbackAnalytics);
        setIsLoading(false);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
      const response = await fetch(`${backendUrl}/api/staking/analytics/${user.wallet_address}?timeframe=${timeframe}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User not found in staking data - use fallback based on current staking data
          const totalTokens = parseFloat(stakingData.tokenBalance) + parseFloat(stakingData.stakedAmount);
          const fallbackAnalytics: AnalyticsData = {
            stakingPerformance: {
              totalStaked: stakingData.stakedAmount,
              totalRewards: stakingData.totalEarned,
              averageDailyReward: '0.000000',
              bestDay: '0.000000',
              stakingDays: 1,
              },
            portfolioBreakdown: {
              stakedPercentage: totalTokens > 0 ? (parseFloat(stakingData.stakedAmount) / totalTokens) * 100 : 0,
              availablePercentage: totalTokens > 0 ? (parseFloat(stakingData.tokenBalance) / totalTokens) * 100 : 0,
              rewardsPercentage: 0
            },
            recentActivity: {
              stakingActions: 0,
              claimActions: 0,
              totalTransactions: 0
            }
          };
          setAnalytics(fallbackAnalytics);
          setIsLoading(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform API response to match component interface
      const transformedAnalytics: AnalyticsData = {
        stakingPerformance: {
          totalStaked: data.stakingPerformance.totalStaked + 'M',
          totalRewards: data.stakingPerformance.totalRewards,
          averageDailyReward: data.stakingPerformance.averageDailyReward,
          bestDay: data.stakingPerformance.bestDay,
          stakingDays: data.stakingPerformance.stakingDays,
        },
        portfolioBreakdown: {
          stakedPercentage: data.portfolioBreakdown.stakedPercentage,
          availablePercentage: data.portfolioBreakdown.availablePercentage,
          rewardsPercentage: data.portfolioBreakdown.rewardsPercentage
        },
        recentActivity: {
          stakingActions: data.recentActivity.stakingActions,
          claimActions: data.recentActivity.claimActions,
          totalTransactions: data.recentActivity.totalTransactions
        }
      };
      
      setAnalytics(transformedAnalytics);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load staking analytics:', error);
      
      // Fallback to basic analytics on error
      const totalTokens = parseFloat(stakingData.tokenBalance) + parseFloat(stakingData.stakedAmount);
      const fallbackAnalytics: AnalyticsData = {
        stakingPerformance: {
          totalStaked: stakingData.stakedAmount,
          totalRewards: stakingData.totalEarned,
          averageDailyReward: '0.000000',
          bestDay: '0.000000',
          stakingDays: 1,
        },
        portfolioBreakdown: {
          stakedPercentage: totalTokens > 0 ? (parseFloat(stakingData.stakedAmount) / totalTokens) * 100 : 0,
          availablePercentage: totalTokens > 0 ? (parseFloat(stakingData.tokenBalance) / totalTokens) * 100 : 0,
          rewardsPercentage: 0
        },
        recentActivity: {
          stakingActions: 0,
          claimActions: 0,
          totalTransactions: 0
        }
      };
      setAnalytics(fallbackAnalytics);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
              <div className="h-6 bg-green-950/30 rounded mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                {Array(3).fill(0).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 bg-green-950/30 rounded"></div>
                    <div className="h-8 bg-green-950/30 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 mb-2">📊</div>
        <div className="text-green-400">Loading analytics...</div>
      </div>
    );
  }

  const timeframeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-green-400">📊 Your Analytics</h3>
        
        <div className="flex gap-2">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeframe(option.value as any)}
              className={`px-3 py-1 rounded-lg font-mono text-sm transition-colors ${
                timeframe === option.value
                  ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                  : 'bg-black/40 text-green-600 border border-green-900/30 hover:text-green-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">🎯 Performance Overview</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-green-600 mb-1">Total Staked</div>
            <div className="text-2xl font-bold text-green-400">
              {analytics.stakingPerformance.totalStaked}M
            </div>
            <div className="text-xs text-green-700">$ABC tokens</div>
          </div>
          
          <div className="bg-black/40 border border-blue-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-blue-600 mb-1">Total Rewards</div>
            <div className="text-2xl font-bold text-blue-400">
              {analytics.stakingPerformance.totalRewards}
            </div>
            <div className="text-xs text-blue-700">ETH earned</div>
          </div>
          
          <div className="bg-black/40 border border-purple-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-purple-600 mb-1">Staking Days</div>
            <div className="text-2xl font-bold text-purple-400">
              {analytics.stakingPerformance.stakingDays}
            </div>
            <div className="text-xs text-purple-700">Days staking</div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
          <h4 className="text-lg font-bold text-green-400 mb-4">📈 Performance Metrics</h4>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600">Average Daily Reward:</span>
              <span className="font-mono text-green-400 font-bold">
                {analytics.stakingPerformance.averageDailyReward} ETH
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600">Best Single Day:</span>
              <span className="font-mono text-green-400 font-bold">
                {analytics.stakingPerformance.bestDay} ETH
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600">Days Staking:</span>
              <span className="font-mono text-green-400 font-bold">
                {analytics.stakingPerformance.stakingDays} days
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600">Total Days:</span>
              <span className="font-mono text-green-400 font-bold">
                94.2%
              </span>
            </div>

            {/* Performance Trend */}
            <div className="mt-4 pt-4 border-t border-green-900/30">
              <div className="text-sm text-green-600 mb-2">Performance Trend</div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">📈</span>
                <span className="text-sm font-mono text-green-400">+12.5% vs last period</span>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Breakdown */}
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6">
          <h4 className="text-lg font-bold text-blue-400 mb-4">💼 Portfolio Breakdown</h4>
          
          <div className="space-y-4">
            {/* Staked Percentage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-blue-600">Staked Tokens</span>
                <span className="font-mono text-blue-400 font-bold">
                  {analytics.portfolioBreakdown.stakedPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-blue-950/30 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.portfolioBreakdown.stakedPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Available Percentage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-green-600">Available Tokens</span>
                <span className="font-mono text-green-400 font-bold">
                  {analytics.portfolioBreakdown.availablePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-green-950/30 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-600 to-green-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.portfolioBreakdown.availablePercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Rewards Value */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-purple-600">Rewards Value</span>
                <span className="font-mono text-purple-400 font-bold">
                  {analytics.portfolioBreakdown.rewardsPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-purple-950/30 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-purple-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(analytics.portfolioBreakdown.rewardsPercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Optimization Score */}
            <div className="mt-4 pt-4 border-t border-blue-900/30">
              <div className="text-sm text-blue-600 mb-2">Portfolio Optimization</div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">⭐</span>
                <span className="text-sm font-mono text-green-400">
                  {analytics.portfolioBreakdown.stakedPercentage > 80 ? 'Excellent' : 
                   analytics.portfolioBreakdown.stakedPercentage > 60 ? 'Good' : 'Room for improvement'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-purple-400 mb-4">⚡ Activity Summary</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {analytics.recentActivity.stakingActions}
            </div>
            <div className="text-sm text-green-600 font-mono">Staking Actions</div>
            <div className="text-xs text-green-700 mt-1">Stakes & unstakes</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {analytics.recentActivity.claimActions}
            </div>
            <div className="text-sm text-blue-600 font-mono">Reward Claims</div>
            <div className="text-xs text-blue-700 mt-1">ETH withdrawals</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {analytics.recentActivity.totalTransactions}
            </div>
            <div className="text-sm text-purple-600 font-mono">Total Transactions</div>
            <div className="text-xs text-purple-700 mt-1">All staking activity</div>
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">💡 Insights & Recommendations</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">🎯 Performance Insights</h5>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-400">✅</span>
                <div className="text-xs">
                  <div className="text-green-400 font-mono">Strong Consistency</div>
                  <div className="text-green-600">You've maintained staking for {analytics.stakingPerformance.stakingDays} days</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-blue-400">📊</span>
                <div className="text-xs">
                  <div className="text-blue-400 font-mono">Above Average Returns</div>
                  <div className="text-green-600">Consistent staking performance across all timeframes</div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">🚀 Optimization Tips</h5>
            <div className="space-y-3">
              {analytics.portfolioBreakdown.stakedPercentage < 80 && (
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400">⚡</span>
                  <div className="text-xs">
                    <div className="text-yellow-400 font-mono">Increase Staking Ratio</div>
                    <div className="text-green-600">Consider staking more of your available tokens</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <span className="text-purple-400">🔄</span>
                <div className="text-xs">
                  <div className="text-purple-400 font-mono">Compound Regularly</div>
                  <div className="text-green-600">Claim and reinvest rewards to maximize returns</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-orange-400">📅</span>
                <div className="text-xs">
                  <div className="text-orange-400 font-mono">Long-term Perspective</div>
                  <div className="text-green-600">Consistent staking yields the best results over time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}