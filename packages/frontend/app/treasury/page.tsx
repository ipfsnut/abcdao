'use client';

import { useState } from 'react';
import { useTreasury } from '@/hooks/useTreasury';
import { useStakingWithPrice } from '@/hooks/useStakingWithPrice';
import { useStats } from '@/hooks/useStats';
import { ContractAddressesFooter } from '@/components/contract-addresses-footer';
import { BackNavigation } from '@/components/back-navigation';
import { Skeleton } from '@/components/skeleton-loader';
import { EthRewardsHistory } from '@/components/eth-rewards-history';
import { useTreasuryBalances } from '@/hooks/useTreasuryBalances';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { useTreasuryTransactions } from '@/hooks/useTreasuryTransactions';

export default function TreasuryPage() {
  const treasuryData = useTreasury();
  const stakingData = useStakingWithPrice();
  const { stats, loading: statsLoading } = useStats();
  const { balances: treasuryBalances, loading: balancesLoading, formatUSD: formatTreasuryUSD } = useTreasuryBalances();
  const { priceData } = useTokenPrice();
  const { transactions, loading: transactionsLoading, formatTransactionHash, formatTimestamp, getTransactionColor, getTransactionIcon } = useTreasuryTransactions();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'allocation'>('overview');

  const isLoading = !treasuryData.treasuryBalance || !stakingData.totalRewardsDistributed || statsLoading || balancesLoading;

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="treasury_dashboard()" 
        subtitle="Protocol treasury and rewards distribution" 
      />

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
                <h3 className="text-green-600 text-responsive-xs font-mono mb-1">Total Treasury Value</h3>
                <p className="text-responsive-lg font-bold text-green-400 matrix-glow">
                  {treasuryBalances ? formatTreasuryUSD(treasuryBalances.totalValueUSD) : '$0.00'}
                </p>
                <p className="text-green-500 text-xs font-mono mt-1">All protocol assets</p>
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
                <p className="text-green-500 text-xs font-mono mt-1">
                  {stakingData.formatUSD(stakingData.totalStakedValueUSD)} • Earning rewards
                </p>
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                    {'>'} Treasury Holdings
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                      <h4 className="text-green-400 font-mono text-sm mb-3">Protocol Treasury Assets</h4>
                      <div className="space-y-3 text-sm font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-green-600">$ABC Tokens:</span>
                          <div className="text-right">
                            <div className="text-green-400 font-bold">
                              {parseFloat(treasuryData.treasuryBalance).toFixed(0)} $ABC
                            </div>
                            <div className="text-green-700 text-xs">
                              {stakingData.formatUSD(parseFloat(treasuryData.treasuryBalance) * (priceData?.price || 0.0000123))}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-600">ETH Balance:</span>
                          <div className="text-right">
                            <div className="text-green-400 font-bold">
                              {treasuryBalances?.ethBalance || '0.000'} ETH
                            </div>
                            <div className="text-green-700 text-xs">
                              {treasuryBalances ? formatTreasuryUSD(treasuryBalances.ethBalanceUSD) : '$0.00'}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-600">USDC Balance:</span>
                          <div className="text-right">
                            <div className="text-green-400 font-bold">
                              {treasuryBalances?.usdcBalance || '0.00'} USDC
                            </div>
                            <div className="text-green-700 text-xs">
                              {treasuryBalances ? formatTreasuryUSD(treasuryBalances.usdcBalanceUSD) : '$0.00'}
                            </div>
                          </div>
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

              {/* ETH Rewards History */}
              <EthRewardsHistory />
            </div>
          )}

          {activeTab === 'allocation' && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                {'>'} Fund Allocation Strategy
              </h3>
              
              <div className="mb-6">
                <h4 className="text-green-400 font-mono text-sm mb-3">ETH Distribution (Automated Every 6 Hours)</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <h5 className="text-green-400 font-mono text-sm mb-2">Staking Rewards (100%)</h5>
                    <p className="text-green-600 font-mono text-xs">
                      All ETH rewards distributed proportionally to $ABC stakers. Provides passive income for long-term holders.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-green-400 font-mono text-sm mb-3">Fees</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <h5 className="text-green-400 font-mono text-sm mb-2">Trading Fees → Staking Rewards (100%)</h5>
                    <p className="text-green-600 font-mono text-xs">
                      All trading fees from swaps and transactions flow directly to staking rewards pool for distribution to $ABC stakers.
                    </p>
                  </div>
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <h5 className="text-green-400 font-mono text-sm mb-2">Protocol Fees → Staking Rewards (100%)</h5>
                    <p className="text-green-600 font-mono text-xs">
                      Protocol-level fees and revenue streams are channeled into the staking rewards system, benefiting all token holders.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-green-400 font-mono text-sm mb-3">$ABC Token Distribution</h4>
                <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                  <h5 className="text-green-400 font-mono text-sm mb-2">Developer Rewards (100%)</h5>
                  <p className="text-green-600 font-mono text-xs">
                    All $ABC tokens go directly to developers for commits on repos with the ABC DAO tag. Direct incentive for code contributions.
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
              
              {transactionsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                      <Skeleton variant="text" width="60%" className="mb-2" />
                      <Skeleton variant="text" width="40%" />
                    </div>
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx) => (
                    <div key={tx.hash} className="bg-green-950/10 border border-green-900/30 rounded-lg p-4 hover:bg-green-950/20 hover:border-green-700/50 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getTransactionIcon(tx.type)}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://basescan.org/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-400 font-mono text-sm hover:text-green-300 transition-colors"
                              >
                                {formatTransactionHash(tx.hash)}
                              </a>
                              <span className="text-green-600 font-mono text-xs">
                                {formatTimestamp(tx.timestamp)}
                              </span>
                            </div>
                            <p className="text-green-600 font-mono text-xs mt-1">
                              {tx.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono text-sm font-bold ${getTransactionColor(tx.type)}`}>
                            {tx.type === 'outgoing' || tx.type === 'staking_distribution' ? '-' : '+'}
                            {tx.ethValue.toFixed(6)} ETH
                          </div>
                          {tx.usdValue && (
                            <div className="text-green-700 font-mono text-xs">
                              ≈ ${tx.usdValue.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {transactions.length > 10 && (
                    <div className="text-center pt-4">
                      <p className="text-green-600 font-mono text-sm">
                        Showing 10 most recent transactions
                      </p>
                      <a
                        href={`https://basescan.org/address/0xBE6525b767cA8D38d169C93C8120c0C0957388B8`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 font-mono text-xs underline"
                      >
                        View all on BaseScan →
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4 text-center">
                  <p className="text-green-600 font-mono text-sm">
                    No recent transactions found
                  </p>
                  <p className="text-green-500 font-mono text-xs mt-2">
                    Transaction history will appear here as treasury activity occurs
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ContractAddressesFooter />
    </div>
  );
}