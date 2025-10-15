'use client';

import { useState } from 'react';
import { useTreasury } from '@/hooks/useTreasury';
import { useStaking } from '@/hooks/useStaking';
import { useStats } from '@/hooks/useStats';
import { ContractAddressesFooter } from '@/components/contract-addresses-footer';
import { Skeleton } from '@/components/skeleton-loader';

export default function TreasuryPage() {
  const treasuryData = useTreasury();
  const stakingData = useStaking();
  const { stats, loading: statsLoading } = useStats();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'allocation'>('overview');

  const isLoading = !treasuryData.treasuryBalance || !stakingData.totalRewardsDistributed || statsLoading;

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm">
        <div className="px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-responsive-xl font-bold matrix-glow mb-2">
              {'>'} treasury_dashboard()
            </h1>
            <p className="text-responsive-xs text-green-600">
              Community treasury and rewards distribution
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Treasury Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
                <Skeleton variant="text" width="60%" className="mb-2" />
                <Skeleton variant="text" width="80%" height="24px" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
                <h3 className="text-green-600 text-responsive-xs font-mono mb-1">Treasury Balance</h3>
                <p className="text-responsive-lg font-bold text-green-400 matrix-glow">
                  {parseFloat(treasuryData.treasuryBalance).toFixed(0)} $ABC
                </p>
                <p className="text-green-500 text-xs font-mono mt-1">Community funds</p>
              </div>
              
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
                <h3 className="text-green-600 text-responsive-xs font-mono mb-1">ETH Distributed</h3>
                <p className="text-responsive-lg font-bold text-green-400 matrix-glow">
                  {parseFloat(stakingData.totalRewardsDistributed).toFixed(3)} ETH
                </p>
                <p className="text-green-500 text-xs font-mono mt-1">To stakers</p>
              </div>
              
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
                <h3 className="text-green-600 text-responsive-xs font-mono mb-1">Total Staked</h3>
                <p className="text-responsive-lg font-bold text-green-400 matrix-glow">
                  {parseFloat(stakingData.totalStaked).toFixed(0)} $ABC
                </p>
                <p className="text-green-500 text-xs font-mono mt-1">Earning rewards</p>
              </div>
              
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
                <h3 className="text-green-600 text-responsive-xs font-mono mb-1">Contributors</h3>
                <p className="text-responsive-lg font-bold text-green-400 matrix-glow">
                  {stats.totalDevelopers}
                </p>
                <p className="text-green-500 text-xs font-mono mt-1">Total developers</p>
              </div>
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-green-950/10 border border-green-900/30 p-1 rounded-lg font-mono mb-6 max-w-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] ${
              activeTab === 'overview' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./overview
          </button>
          <button
            onClick={() => setActiveTab('allocation')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] ${
              activeTab === 'allocation' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./allocation
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] ${
              activeTab === 'transactions' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./transactions
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                  {'>'} Treasury Overview
                </h3>
                <div className="space-y-4">
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <h4 className="text-green-400 font-mono text-sm mb-3">Fund Allocation</h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-green-600">Developer Rewards:</span>
                        <span className="text-green-400">60%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Staking Rewards:</span>
                        <span className="text-green-400">25%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Operations:</span>
                        <span className="text-green-400">10%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Reserve:</span>
                        <span className="text-green-400">5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                  {'>'} Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-green-400 font-mono text-sm">ETH Rewards Distribution</p>
                        <p className="text-green-600 font-mono text-xs">To stakers</p>
                      </div>
                      <span className="text-green-300 font-mono text-sm">
                        {parseFloat(stakingData.totalRewardsDistributed).toFixed(3)} ETH
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-green-400 font-mono text-sm">Developer Rewards</p>
                        <p className="text-green-600 font-mono text-xs">Code contributions</p>
                      </div>
                      <span className="text-green-300 font-mono text-sm">
                        {stats.totalRewards || 0} $ABC
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'allocation' && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                {'>'} Fund Allocation Strategy
              </h3>
              
              <div className="mb-6">
                <h4 className="text-green-400 font-mono text-sm mb-3">ETH Distribution (Automated Every 6 Hours)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <h5 className="text-green-400 font-mono text-sm mb-2">Staking Rewards (25%)</h5>
                    <p className="text-green-600 font-mono text-xs">
                      ETH rewards distributed to $ABC stakers. Provides passive income for long-term holders.
                    </p>
                  </div>
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <h5 className="text-green-400 font-mono text-sm mb-2">Treasury (25%)</h5>
                    <p className="text-green-600 font-mono text-xs">
                      Protocol development, operations, and maintenance funding.
                    </p>
                  </div>
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <h5 className="text-green-400 font-mono text-sm mb-2">Bot Operations (50%)</h5>
                    <p className="text-green-600 font-mono text-xs">
                      Retained for gas fees, operations, and future distributions.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-green-400 font-mono text-sm mb-3">$ABC Token Distribution</h4>
                <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                  <h5 className="text-green-400 font-mono text-sm mb-2">Developer Rewards (100%)</h5>
                  <p className="text-green-600 font-mono text-xs">
                    All $ABC tokens go to developers for commits on repos with the ABC DAO tag. Direct incentive for code contributions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                {'>'} Recent Transactions
              </h3>
              <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4 text-center">
                <p className="text-green-600 font-mono text-sm">
                  Transaction history integration coming soon
                </p>
                <p className="text-green-500 font-mono text-xs mt-2">
                  Will display treasury transactions, rewards distributions, and fund movements
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ContractAddressesFooter />
    </div>
  );
}