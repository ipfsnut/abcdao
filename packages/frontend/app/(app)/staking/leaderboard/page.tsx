'use client';

import { useState, useEffect } from 'react';
import { BackNavigation } from '@/components/back-navigation';
import { config } from '@/lib/config';

interface Staker {
  rank: number;
  address: string;
  currentStake: number;
  totalStaked: number;
  totalUnstaked: number;
  totalRewardsClaimed: number;
  pendingRewards: number;
  firstStakeTime: string;
  lastStakeTime: string;
  lastUnstakeTime: string | null;
  percentageOfTotal: number;
}

interface LeaderboardData {
  leaderboard: Staker[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  summary: {
    totalActiveStakers: number;
    totalCurrentStaked: number;
    averageStake: number;
    largestStake: number;
    smallestStake: number;
    dataNote?: string;
  };
  unbonding?: {
    totalUnbonding: number;
    totalWithdrawable: number;
    totalPendingSell: number;
    stakersWithUnbonding: number;
  };
  lastUpdated: string;
}

export default function StakingLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.backendUrl}/api/staking/leaderboard`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
      }
      
      const leaderboardData = await response.json();
      setData(leaderboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const formatABC = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation title="staking_leaderboard()" subtitle="Loading staking data..." />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse text-lg">Loading staking leaderboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation title="staking_leaderboard()" subtitle="Error loading data" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-4">Error: {error}</div>
            <button 
              onClick={fetchLeaderboard}
              className="bg-green-900 text-green-400 px-4 py-2 rounded border border-green-500 hover:bg-green-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation title="staking_leaderboard()" subtitle="No data available" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="staking_leaderboard()" 
        subtitle={`${data.summary.totalActiveStakers} active stakers`} 
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Summary Statistics */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-green-500 rounded p-4">
            <div className="text-green-300 text-sm">Total Staked</div>
            <div className="text-xl font-bold">{formatABC(data.summary.totalCurrentStaked)} ABC</div>
            {data.summary.dataNote && (
              <div className="text-yellow-400 text-xs mt-1">ⓘ {data.summary.dataNote}</div>
            )}
          </div>
          <div className="bg-gray-900 border border-green-500 rounded p-4">
            <div className="text-green-300 text-sm">Average Stake</div>
            <div className="text-xl font-bold">{formatABC(data.summary.averageStake)} ABC</div>
          </div>
          <div className="bg-gray-900 border border-green-500 rounded p-4">
            <div className="text-green-300 text-sm">Active Stakers</div>
            <div className="text-xl font-bold">{data.summary.totalActiveStakers}</div>
          </div>
        </div>

        {/* Unbonding Statistics */}
        {data.unbonding && (data.unbonding.totalPendingSell > 0 || data.unbonding.stakersWithUnbonding > 0) && (
          <div className="mb-8 bg-yellow-950/20 border border-yellow-500/50 rounded p-4">
            <h3 className="text-yellow-300 text-lg font-bold mb-4">
              📊 Market Impact - Unbonding Queue
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3">
                <div className="text-yellow-200 text-sm">In Unbonding (7-day cooldown)</div>
                <div className="text-lg font-bold text-yellow-300">
                  {formatABC(data.unbonding.totalUnbonding)} ABC
                </div>
                <div className="text-yellow-400 text-xs">Locked, cannot sell yet</div>
              </div>
              <div className="bg-red-900/20 border border-red-600/30 rounded p-3">
                <div className="text-red-200 text-sm">Ready to Sell</div>
                <div className="text-lg font-bold text-red-300">
                  {formatABC(data.unbonding.totalWithdrawable)} ABC
                </div>
                <div className="text-red-400 text-xs">Can hit market anytime</div>
              </div>
              <div className="bg-orange-900/20 border border-orange-600/30 rounded p-3">
                <div className="text-orange-200 text-sm">Total Potential Sell Pressure</div>
                <div className="text-lg font-bold text-orange-300">
                  {formatABC(data.unbonding.totalPendingSell)} ABC
                </div>
                <div className="text-orange-400 text-xs">
                  {data.unbonding.stakersWithUnbonding} staker(s) unbonding
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-yellow-500">
              💡 This data provides transparency about potential selling pressure on $ABC token
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-gray-900 border border-green-500 rounded overflow-hidden">
          <div className="bg-green-900 text-green-400 p-4 text-lg font-bold">
            🏆 Staking Leaderboard
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 border-b border-green-500">
                <tr>
                  <th className="text-left p-3">Rank</th>
                  <th className="text-left p-3">Address</th>
                  <th className="text-right p-3">Current Stake</th>
                  <th className="text-right p-3">% of Total</th>
                  <th className="text-right p-3">ETH Rewards</th>
                  <th className="text-right p-3">First Stake</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((staker) => (
                  <tr 
                    key={staker.address} 
                    className="border-b border-gray-700 hover:bg-gray-800 transition-colors"
                  >
                    <td className="p-3">
                      <span className="flex items-center gap-2">
                        {getRankEmoji(staker.rank)}
                        #{staker.rank}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-green-300">
                        {formatAddress(staker.address)}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-bold text-green-400">
                        {formatABC(staker.currentStake)} ABC
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="text-green-300">
                        {staker.percentageOfTotal.toFixed(2)}%
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="text-green-300">
                        {staker.totalRewardsClaimed.toFixed(4)} ETH
                      </div>
                    </td>
                    <td className="p-3 text-right text-gray-400">
                      {staker.firstStakeTime ? formatDate(staker.firstStakeTime) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-800 p-4 text-xs text-gray-400 border-t border-green-500">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        </div>

        {/* Load More Button (if needed for pagination) */}
        {data.pagination.hasMore && (
          <div className="text-center mt-6">
            <button 
              className="bg-green-900 text-green-400 px-6 py-2 rounded border border-green-500 hover:bg-green-800 transition-colors"
              onClick={() => {
                // TODO: Implement pagination
                console.log('Load more functionality to be implemented');
              }}
            >
              Load More Stakers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}