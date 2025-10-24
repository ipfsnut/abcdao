/**
 * Unified Staking Page (/staking)
 * 
 * Consolidates previous /staking and /staking/leaderboard into single tabbed interface:
 * - Stake Tab: Staking operations
 * - Leaderboard Tab: Top stakers, rankings  
 * - Rewards Tab: Claim rewards, history
 * - Analytics Tab: Personal staking analytics
 */

'use client';

import { useState } from 'react';
import { useWalletFirstAuth } from '@/hooks/useWalletFirstAuth';
import { useStaking } from '@/hooks/useStaking';
import { BackNavigation } from '@/components/back-navigation';

// Import tabbed components
import { StakeTab } from '@/components/staking/stake-tab';
import { LeaderboardTab } from '@/components/staking/leaderboard-tab';
import { RewardsTab } from '@/components/staking/rewards-tab';
import { AnalyticsTab } from '@/components/staking/analytics-tab';
import { TokenSupplyChart } from '@/components/token-supply-chart';

type TabId = 'stake' | 'leaderboard' | 'rewards' | 'analytics' | 'supply';

export default function UnifiedStakingPage() {
  const { user, isAuthenticated } = useWalletFirstAuth();
  const [activeTab, setActiveTab] = useState<TabId>('stake');
  
  // Use real staking hook for live blockchain data
  const {
    tokenBalance,
    stakedAmount,
    pendingRewards,
    totalEarned,
    isApproveLoading,
    isStakeLoading,
    isUnstakeLoading,
    isClaimLoading
  } = useStaking();

  // Transform blockchain data to display format
  const stakingData = {
    tokenBalance: tokenBalance ? (Number(tokenBalance) / 1e6).toFixed(1) : '0',
    stakedAmount: stakedAmount ? (Number(stakedAmount) / 1e6).toFixed(1) : '0',
    pendingRewards: pendingRewards ? Number(pendingRewards).toFixed(4) : '0',
    totalEarned: totalEarned ? Number(totalEarned).toFixed(4) : '0',
    isLoading: isApproveLoading || isStakeLoading || isUnstakeLoading || isClaimLoading
  };

  const tabs = [
    {
      id: 'stake' as TabId,
      label: 'Stake',
      icon: '🏦',
      description: 'Stake ABC tokens',
      count: null
    },
    {
      id: 'leaderboard' as TabId,
      label: 'Leaderboard',
      icon: '🏆',
      description: 'Top stakers',
      count: null
    },
    {
      id: 'rewards' as TabId,
      label: 'Rewards',
      icon: '🎁',
      description: 'Claim ETH rewards',
      count: parseFloat(stakingData.pendingRewards) > 0 ? '1' : null
    },
    {
      id: 'analytics' as TabId,
      label: 'Analytics',
      icon: '📊',
      description: 'Your staking stats',
      count: null
    },
    {
      id: 'supply' as TabId,
      label: 'Supply',
      icon: '🪙',
      description: 'Token supply breakdown',
      count: null
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation title="Staking" subtitle="Stake ABC tokens for ETH rewards" />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="text-4xl mb-6">🏦</div>
            <h1 className="text-2xl font-bold text-green-400 matrix-glow mb-4">
              ABC Token Staking
            </h1>
            <p className="text-green-600 font-mono mb-6">
              Connect your wallet to view staking opportunities
            </p>
            
            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">Staking Benefits</h3>
              <ul className="space-y-3 text-sm text-green-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Earn ETH rewards passively
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Passive rewards
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Community status benefits
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Premium features unlock
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation title="Staking Dashboard" subtitle="Stake ABC • Earn ETH • Community Benefits" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Staking Overview Header */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-green-600 mb-1">Your Balance</div>
                <div className="text-2xl font-bold text-green-400">
                  {stakingData.isLoading ? '...' : `${stakingData.tokenBalance}M`}
                </div>
                <div className="text-xs text-green-700">$ABC available</div>
              </div>
              
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-blue-600 mb-1">Staked Amount</div>
                <div className="text-2xl font-bold text-blue-400">
                  {stakingData.isLoading ? '...' : `${stakingData.stakedAmount}M`}
                </div>
                <div className="text-xs text-blue-700">$ABC staked</div>
              </div>
              
              <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-yellow-600 mb-1">Pending Rewards</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {stakingData.isLoading ? '...' : stakingData.pendingRewards}
                </div>
                <div className="text-xs text-yellow-700">ETH claimable</div>
              </div>
              
              <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-purple-600 mb-1">Total Earned</div>
                <div className="text-2xl font-bold text-purple-400">
                  {stakingData.totalEarned}
                </div>
                <div className="text-xs text-purple-700">ETH lifetime</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-green-900/30">
              <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 sm:px-6 py-4 font-mono text-sm font-medium transition-all duration-200 min-w-fit whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-green-400 border-b-2 border-green-400 bg-green-950/20'
                        : 'text-green-600 hover:text-green-400 hover:bg-green-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.count && (
                        <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </div>
                    
                    {activeTab === tab.id && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-green-600 to-green-400"></div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Description */}
            <div className="mt-4 text-sm text-green-600 font-mono">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === 'stake' && (
              <StakeTab 
                stakingData={stakingData}
                user={user}
                onDataUpdate={() => {}} // Data auto-updates from staking hook
              />
            )}
            
            {activeTab === 'leaderboard' && (
              <LeaderboardTab 
                currentUser={user}
                userStakedAmount={stakingData.stakedAmount}
              />
            )}
            
            {activeTab === 'rewards' && (
              <RewardsTab 
                stakingData={stakingData}
                user={user}
                onClaimSuccess={() => {}} // Data auto-updates from staking hook
              />
            )}
            
            {activeTab === 'analytics' && (
              <AnalyticsTab 
                stakingData={stakingData}
                user={user}
              />
            )}
            
            {activeTab === 'supply' && (
              <div className="bg-gray-900/50 border border-green-900/30 rounded-lg p-6">
                <TokenSupplyChart size={400} showLegend={true} interactive={true} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}