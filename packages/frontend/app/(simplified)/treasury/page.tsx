/**
 * Treasury Page (/treasury)
 * 
 * Treasury information and analytics
 */

'use client';

import React from 'react';
import { BackNavigation } from '@/components/back-navigation';
import { useTreasuryUnified } from '@/hooks/useTreasuryUnified';
import Link from 'next/link';

export default function TreasuryPage() {
  // Use unified treasury data for consistency across all components
  const {
    treasuryAbcBalance,
    treasuryEthBalance,
    stakingContractBalance,
    rewardsContractBalance,
    totalRewardsDistributedEth,
    totalAbcDistributed,
    totalTreasuryValue,
    totalTreasuryValueUSD,
    abcPriceFormatted,
    addresses,
    isLoading,
    isError,
    error,
    formatTokenAmount,
    formatEthAmount,
    formatUsdAmount
  } = useTreasuryUnified();

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="treasury_analytics()" 
        subtitle="Protocol finances and transparency" 
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Treasury Overview */}
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-6">Treasury Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-black/40 border border-green-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {isLoading ? '...' : totalTreasuryValue}
                </div>
                <div className="text-sm text-green-600 font-mono">Total Treasury Value</div>
                <div className="text-xs text-green-700 mt-1">
                  {totalTreasuryValueUSD} • $ABC tokens
                </div>
              </div>
              
              <div className="bg-black/40 border border-blue-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  {isLoading ? '...' : treasuryAbcBalance}
                </div>
                <div className="text-sm text-green-600 font-mono">Protocol Treasury</div>
                <div className="text-xs text-green-700 mt-1">Main wallet ABC</div>
              </div>
              
              <div className="bg-black/40 border border-purple-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-2">
                  {isLoading ? '...' : totalRewardsDistributedEth}
                </div>
                <div className="text-sm text-green-600 font-mono">ETH Distributed</div>
                <div className="text-xs text-green-700 mt-1">Staking rewards</div>
              </div>
              
              <div className="bg-black/40 border border-orange-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400 mb-2">
                  {isLoading ? '...' : totalAbcDistributed}
                </div>
                <div className="text-sm text-green-600 font-mono">ABC Distributed</div>
                <div className="text-xs text-green-700 mt-1">Developer rewards</div>
              </div>
            </div>
          </div>

          {/* Treasury Addresses */}
          <div className="bg-black/40 border border-green-900/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-green-400 mb-4">Treasury Addresses</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-950/10 border border-green-900/20 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-green-400 mb-1">Protocol Treasury</div>
                  <div className="text-xs text-green-600 font-mono mb-2">Main treasury wallet holding $ABC tokens</div>
                  <div className="text-xs text-green-500">
                    Balance: {isLoading ? '...' : `${treasuryAbcBalance} $ABC`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-green-300">{addresses?.treasury?.slice(0, 6)}...{addresses?.treasury?.slice(-3)}</div>
                  <Link 
                    href={`https://basescan.org/address/${addresses?.treasury}`}
                    target="_blank"
                    className="text-xs text-green-600 hover:text-green-400 transition-colors"
                  >
                    View on BaseScan →
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-950/10 border border-blue-900/20 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-blue-400 mb-1">Staking Contract</div>
                  <div className="text-xs text-green-600 font-mono mb-2">Staking rewards and ETH distribution</div>
                  <div className="text-xs text-green-500">
                    Staked: {isLoading ? '...' : `${(parseFloat(stakingContractBalance) / 1e6).toFixed(1)}M $ABC`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-blue-300">{addresses?.stakingContract?.slice(0, 6)}...{addresses?.stakingContract?.slice(-3)}</div>
                  <Link 
                    href={`https://basescan.org/address/${addresses?.stakingContract}`}
                    target="_blank"
                    className="text-xs text-green-600 hover:text-green-400 transition-colors"
                  >
                    View on BaseScan →
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-950/10 border border-purple-900/20 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-purple-400 mb-1">Rewards Contract</div>
                  <div className="text-xs text-green-600 font-mono mb-2">Developer commit rewards distribution</div>
                  <div className="text-xs text-green-500">
                    Available: {isLoading ? '...' : `${(parseFloat(rewardsContractBalance) / 1e6).toFixed(1)}M $ABC`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-purple-300">{addresses?.rewardsContract?.slice(0, 6)}...{addresses?.rewardsContract?.slice(-3)}</div>
                  <Link 
                    href={`https://basescan.org/address/${addresses?.rewardsContract}`}
                    target="_blank"
                    className="text-xs text-green-600 hover:text-green-400 transition-colors"
                  >
                    View on BaseScan →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Protocol Transparency */}
          <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4">Protocol Transparency</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-400 mb-3">📊 Real-time Data</h4>
                <ul className="space-y-2 text-sm text-green-600">
                  <li>• All treasury transactions are public on Base</li>
                  <li>• Smart contracts are verified and open source</li>
                  <li>• Real-time balance tracking via blockchain</li>
                  <li>• Automated reward distributions</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-400 mb-3">🔗 External Links</h4>
                <div className="space-y-2">
                  <Link 
                    href={`https://basescan.org/token/${addresses?.abcToken}`}
                    target="_blank"
                    className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    $ABC Token Contract →
                  </Link>
                  <Link 
                    href="https://github.com/abc-dao"
                    target="_blank"
                    className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Source Code →
                  </Link>
                  <Link 
                    href="/docs"
                    className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Documentation →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}