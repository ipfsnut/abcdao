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
import { useStakingUnified } from '@/hooks/useStakingUnified';
import { BackNavigation } from '@/components/back-navigation';
import { ErrorBoundary } from '@/components/error-boundary';

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
  
  // Use unified staking hook for live blockchain data
  const {
    tokenBalance,
    stakedAmount,
    pendingRewards,
    totalEarned,
    blockchainStakedAmount,
    isApproveLoading,
    isStakeLoading,
    isUnstakeLoading,
    isClaimLoading,
    handleClaimRewards
  } = useStakingUnified();

  // Use data directly from unified hook (already formatted)
  const stakingData = {
    tokenBalance: tokenBalance ? (Number(tokenBalance) / 1e6).toFixed(1) : '0',
    stakedAmount: stakedAmount ? (Number(stakedAmount) / 1e6).toFixed(1) : '0',
    pendingRewards: pendingRewards ? Number(pendingRewards).toFixed(4) : '0',
    totalEarned: totalEarned ? Number(totalEarned).toFixed(4) : '0',
    isLoading: isApproveLoading || isStakeLoading || isUnstakeLoading || isClaimLoading,
    // Raw values for MAX buttons
    rawTokenBalance: tokenBalance || '0',
    rawStakedAmount: blockchainStakedAmount || '0'
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

  // Show connection prompt at top of interface when not connected
  const connectionPrompt = !isAuthenticated && (
    <div className="mb-6 bg-yellow-950/20 border border-yellow-900/30 rounded-xl p-6">
      <div className="text-center">
        <div className="text-3xl mb-4">🔗</div>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">Connect Wallet to Stake</h3>
        <p className="text-yellow-600 font-mono text-sm mb-4">
          Connect your wallet to stake ABC tokens and earn ETH rewards
        </p>
        <div className="text-xs text-yellow-700">
          You can view all public staking data below
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation title="Staking Dashboard" subtitle="Stake ABC • Earn ETH • Community Benefits" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Connection Prompt for non-authenticated users */}
          {connectionPrompt}
          
          {/* Staking Overview Header */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-green-600 mb-1">
                  {isAuthenticated ? "Your Balance" : "Total Staked"}
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {stakingData.isLoading ? '...' : 
                    isAuthenticated ? `${stakingData.tokenBalance}M` : '1.13B'
                  }
                </div>
                <div className="text-xs text-green-700">
                  {isAuthenticated ? "$ABC available" : "$ABC tokens staked"}
                </div>
              </div>
              
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-blue-600 mb-1">
                  {isAuthenticated ? "Staked Amount" : "Staking Ratio"}
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {stakingData.isLoading ? '...' : 
                    isAuthenticated ? `${stakingData.stakedAmount}M` : '1.13%'
                  }
                </div>
                <div className="text-xs text-blue-700">
                  {isAuthenticated ? "$ABC staked" : "of total supply"}
                </div>
              </div>
              
              <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-yellow-600 mb-1">
                  {isAuthenticated ? "Pending Rewards" : "Total Rewards"}
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {stakingData.isLoading ? '...' : 
                    isAuthenticated ? stakingData.pendingRewards : '0.107'
                  }
                </div>
                <div className="text-xs text-yellow-700">
                  {isAuthenticated ? "ETH claimable" : "ETH distributed"}
                </div>
              </div>
              
              <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-purple-600 mb-1">
                  {isAuthenticated ? "Total Earned" : "Active Stakers"}
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  {isAuthenticated ? stakingData.totalEarned : '3'}
                </div>
                <div className="text-xs text-purple-700">
                  {isAuthenticated ? "ETH lifetime" : "unique addresses"}
                </div>
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
            <ErrorBoundary>
              {activeTab === 'stake' && (
                <StakeTab 
                  stakingData={stakingData}
                  user={user}
                  onDataUpdate={() => {}} // Data auto-updates from staking hook
                  isPublicView={!isAuthenticated}
                />
              )}
              
              {activeTab === 'leaderboard' && (
                <LeaderboardTab 
                  currentUser={user}
                  userStakedAmount={stakingData.stakedAmount}
                  isPublicView={!isAuthenticated}
                />
              )}
              
              {activeTab === 'rewards' && (
                <RewardsTab 
                  stakingData={stakingData}
                  user={user}
                  onClaimSuccess={() => {}} // Data auto-updates from staking hook
                  onClaimRewards={handleClaimRewards}
                  isClaimLoading={isClaimLoading}
                  isPublicView={!isAuthenticated}
                />
              )}
              
              {activeTab === 'analytics' && (
                <AnalyticsTab 
                  stakingData={stakingData}
                  user={user}
                  isPublicView={!isAuthenticated}
                />
              )}
              
              {activeTab === 'supply' && (
                <div className="bg-gray-900/50 border border-green-900/30 rounded-lg p-6">
                  <TokenSupplyChart size={400} showLegend={true} interactive={true} />
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}