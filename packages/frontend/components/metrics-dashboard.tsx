/**
 * Metrics Dashboard Component
 * 
 * Displays key user metrics and statistics in a beautiful card layout
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStakingUnified } from '@/hooks/useStakingUnified';
import { useUserStatsFixed } from '@/hooks/useUserStatsFixed';

interface MetricsDashboardProps {
  user: any;
  features: any;
}

export function MetricsDashboard({ user, features }: MetricsDashboardProps) {
  // Use unified staking data for consistency across all components
  const {
    tokenBalance,
    stakedAmount,
    pendingRewards,
    formatStakingAmount
  } = useStakingUnified();

  // Use fixed user statistics to show correct ABC rewards and profile data
  const {
    totalCommits,
    totalRewardsEarnedFormatted,
    ethRewardsEarnedFormatted,
    isLoading: userStatsLoading,
    formatEthAmount
  } = useUserStatsFixed(user?.farcaster_fid, user?.wallet_address);

  // Loading state now handled by unified hooks
  const isLoading = userStatsLoading;

  if (isLoading) {
    return (
      <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
        <h2 className="text-xl font-bold text-green-400 mb-6">Your Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-green-950/30 rounded mb-2"></div>
              <div className="h-8 bg-green-950/30 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Use unified formatting for consistent display

  const metricCards = [
    {
      label: 'Token Balance',
      value: formatStakingAmount(tokenBalance || '0'),
      unit: '$ABC',
      icon: '💰',
      color: 'text-green-400',
      link: '/staking'
    },
    {
      label: 'Staked Amount',
      value: formatStakingAmount(stakedAmount || '0'),
      unit: '$ABC',
      icon: '🏦',
      color: 'text-blue-400',
      link: '/staking'
    },
    {
      label: 'Pending ETH',
      value: formatEthAmount(pendingRewards || '0'),
      unit: 'ETH',
      icon: '⏳',
      color: 'text-yellow-400',
      link: '/staking'
    },
    {
      label: 'Total Earned',
      value: totalRewardsEarnedFormatted,
      unit: '$ABC',
      icon: '🎁',
      color: 'text-green-400',
      link: '/developers'
    },
    {
      label: 'Commits',
      value: totalCommits.toString(),
      unit: 'commits',
      icon: '📝',
      color: 'text-purple-400',
      link: '/developers'
    },
    {
      label: 'ETH Rewards',
      value: ethRewardsEarnedFormatted || '0.0000',
      unit: 'ETH',
      icon: '📈',
      color: 'text-orange-400',
      link: '/staking'
    }
  ];

  return (
    <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-green-400">Your Metrics</h2>
        <div className="text-xs text-green-600 font-mono">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((metric, index) => (
          <Link
            key={index}
            href={metric.link}
            className="group bg-black/40 border border-green-900/30 rounded-lg p-4 hover:border-green-700/50 hover:bg-green-950/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{metric.icon}</span>
              <div className="text-xs text-green-700 opacity-0 group-hover:opacity-100 transition-opacity">
                View
              </div>
            </div>
            
            <div className="mb-1">
              <div className={`text-2xl font-bold ${metric.color} group-hover:matrix-glow transition-all`}>
                {metric.value}
              </div>
              <div className="text-xs text-green-600 font-mono">
                {metric.unit}
              </div>
            </div>
            
            <div className="text-xs text-green-700 font-mono">
              {metric.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/20 border border-green-900/20 rounded-lg p-3">
          <div className="text-sm font-mono text-green-600 mb-1">💡 Quick Tip</div>
          <div className="text-xs text-green-700">
            {user.github_connected 
              ? 'Stake your $ABC to earn passive ETH rewards!'
              : 'Connect GitHub to start earning $ABC for your commits!'
            }
          </div>
        </div>
        
        <div className="bg-black/20 border border-green-900/20 rounded-lg p-3">
          <div className="text-sm font-mono text-green-600 mb-1">🎯 Goal</div>
          <div className="text-xs text-green-700">
            {parseFloat(stakedAmount || '0') >= 5000000 
              ? 'You have premium staking benefits!'
              : 'Stake 5M+ $ABC for premium benefits'
            }
          </div>
        </div>
        
        <div className="bg-black/20 border border-green-900/20 rounded-lg p-3">
          <div className="text-sm font-mono text-green-600 mb-1">📊 Status</div>
          <div className="text-xs text-green-700">
            {features?.earning_rewards 
              ? 'Earning rewards from commits ✅'
              : 'Setup needed for earning 🔧'
            }
          </div>
        </div>
      </div>
    </div>
  );
}