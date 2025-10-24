/**
 * Leaderboard Tab Component
 * 
 * Shows top stakers rankings and user position
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName?: string;
  stakedAmount: string;
  rewardsEarned: string;
  stakingDuration: number;
  isCurrentUser: boolean;
}

interface LeaderboardTabProps {
  currentUser: any;
  userStakedAmount: string;
}

export function LeaderboardTab({ currentUser, userStakedAmount }: LeaderboardTabProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | '30d' | '7d'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
      const response = await fetch(`${backendUrl}/api/staking/leaderboard?limit=50`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform API response to match component interface
      const transformedLeaderboard: LeaderboardEntry[] = data.leaderboard.map((staker: any) => {
        // Format staked amount in millions
        const stakedAmountFormatted = (staker.currentStake / 1000000).toFixed(1) + 'M';
        
        // Format rewards earned
        const rewardsEarned = staker.totalRewardsClaimed.toFixed(4);
        
        // Calculate staking duration (if firstStakeTime is available)
        let stakingDuration = 0;
        if (staker.firstStakeTime) {
          const firstStakeDate = new Date(staker.firstStakeTime * 1000); // Convert from Unix timestamp
          const daysSinceFirstStake = Math.floor((Date.now() - firstStakeDate.getTime()) / (1000 * 60 * 60 * 24));
          stakingDuration = daysSinceFirstStake;
        }
        
        // Check if this is the current user's address
        const isCurrentUser = currentUser?.wallet_address?.toLowerCase() === staker.address.toLowerCase();
        
        // Generate display name (could be enhanced with ENS lookup)
        const displayName = isCurrentUser ? 
          (currentUser?.github_username || 'You') : 
          `Staker${staker.rank}`;
        
        return {
          rank: staker.rank,
          address: staker.address,
          displayName,
          stakedAmount: stakedAmountFormatted,
          rewardsEarned,
          stakingDuration,
          isCurrentUser
        };
      });
      
      setLeaderboard(transformedLeaderboard);
      
      // Find current user's rank
      const currentUserEntry = transformedLeaderboard.find(entry => entry.isCurrentUser);
      setUserRank(currentUserEntry?.rank || null);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load staking leaderboard:', error);
      
      // Fallback to empty state on error
      setLeaderboard([]);
      setUserRank(null);
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-green-400';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-950/30 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-green-950/30 rounded mb-2"></div>
                <div className="h-3 bg-green-950/30 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Position Highlight */}
      {userRank && (
        <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-green-400 mb-2">Your Position</h3>
              <div className="flex items-center gap-4">
                <div className={`text-2xl font-bold ${getRankColor(userRank)}`}>
                  {getRankDisplay(userRank)}
                </div>
                <div>
                  <div className="text-sm font-mono text-green-400">
                    {userStakedAmount}M $ABC staked
                  </div>
                  <div className="text-xs text-green-600">
                    Earning rewards for {leaderboard.find(e => e.isCurrentUser)?.stakingDuration || 0} days
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">
                {leaderboard.find(e => e.isCurrentUser)?.rewardsEarned || '0'} ETH
              </div>
              <div className="text-xs text-green-600">Total rewards earned</div>
            </div>
          </div>
        </div>
      )}

      {/* Timeframe Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-green-400">🏆 Top Stakers</h3>
        
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All Time' },
            { value: '30d', label: '30 Days' },
            { value: '7d', label: '7 Days' }
          ].map((option) => (
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

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboard.map((entry) => (
          <div
            key={entry.address}
            className={`border rounded-lg p-4 transition-all duration-200 ${
              entry.isCurrentUser
                ? 'bg-green-950/30 border-green-700/50 ring-1 ring-green-700/30'
                : 'bg-black/20 border-green-900/30 hover:border-green-700/50 hover:bg-green-950/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`text-xl font-bold ${getRankColor(entry.rank)} min-w-[3rem] text-center`}>
                  {getRankDisplay(entry.rank)}
                </div>
                
                {/* User Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-green-400">
                      {entry.displayName || formatAddress(entry.address)}
                    </span>
                    {entry.isCurrentUser && (
                      <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-xs">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-green-600 font-mono">
                    {formatAddress(entry.address)}
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="text-right">
                <div className="text-sm font-bold text-green-400 font-mono">
                  {entry.stakedAmount} $ABC
                </div>
                <div className="text-xs text-blue-400 font-mono">
                  {entry.rewardsEarned} ETH earned
                </div>
                <div className="text-xs text-green-600">
                  {entry.stakingDuration} days staking
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-green-950/30 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    entry.rank === 1 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                    entry.rank === 2 ? 'bg-gradient-to-r from-gray-500 to-gray-300' :
                    entry.rank === 3 ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                    'bg-gradient-to-r from-green-600 to-green-400'
                  }`}
                  style={{ width: `${Math.min((parseFloat(entry.stakedAmount) / 50.2) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard Stats */}
      <div className="bg-black/40 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-md font-bold text-green-400 mb-4">📊 Leaderboard Stats</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {leaderboard.reduce((sum, entry) => sum + parseFloat(entry.stakedAmount), 0).toFixed(1)}M
            </div>
            <div className="text-xs text-green-600 font-mono">Total Staked</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {leaderboard.reduce((sum, entry) => sum + parseFloat(entry.rewardsEarned), 0).toFixed(4)}
            </div>
            <div className="text-xs text-green-600 font-mono">Total ETH Distributed</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {leaderboard.length}
            </div>
            <div className="text-xs text-green-600 font-mono">Active Stakers</div>
          </div>
        </div>
      </div>

      {/* Climb the Ranks */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-md font-bold text-green-400 mb-4">🚀 Climb the Ranks</h4>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-green-400">📈</span>
            <div>
              <div className="text-sm font-mono text-green-400">Stake More Tokens</div>
              <div className="text-xs text-green-600">Increase your staked amount to move up the leaderboard</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-blue-400">⏰</span>
            <div>
              <div className="text-sm font-mono text-blue-400">Stay Consistent</div>
              <div className="text-xs text-green-600">Longer staking duration improves your position</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-purple-400">🎁</span>
            <div>
              <div className="text-sm font-mono text-purple-400">Compound Rewards</div>
              <div className="text-xs text-green-600">Reinvest ETH rewards to acquire more ABC tokens</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}