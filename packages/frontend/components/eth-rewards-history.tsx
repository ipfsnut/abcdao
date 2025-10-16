'use client';

import { useEthRewardsHistory, EthRewardDistribution } from '@/hooks/useEthRewardsHistory';
import { useState } from 'react';

export function EthRewardsHistory() {
  const { 
    distributions, 
    loading, 
    error, 
    getAverageAPY, 
    getTotalETHDistributed,
    getDistributionTrend 
  } = useEthRewardsHistory();
  
  const [showAll, setShowAll] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatETH = (amount: number) => {
    return amount.toFixed(4);
  };

  const formatUSD = (ethAmount: number, ethPrice?: number) => {
    if (!ethPrice) return 'N/A';
    const usdValue = ethAmount * ethPrice;
    if (usdValue < 1) return `$${usdValue.toFixed(3)}`;
    if (usdValue < 100) return `$${usdValue.toFixed(2)}`;
    if (usdValue < 10000) return `$${usdValue.toFixed(0)}`;
    return `$${(usdValue / 1000).toFixed(1)}K`;
  };

  const getTrendIcon = () => {
    const trend = getDistributionTrend();
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const displayedDistributions = showAll ? distributions : distributions.slice(0, 3);

  if (loading) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-green-800/30 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-green-950/20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-red-400 font-mono text-sm mb-2">Error loading rewards history</p>
          <p className="text-green-600 font-mono text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-green-400 matrix-glow font-mono">
          {'>'} ETH_rewards_history()
        </h3>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-green-600">Trend:</span>
          <span className="text-green-400">{getTrendIcon()}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
          <p className="text-green-600 text-xs font-mono">Avg APY (4w)</p>
          <p className="text-sm font-bold text-green-400 matrix-glow">
            {getAverageAPY(4).toFixed(1)}%
          </p>
        </div>
        <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
          <p className="text-green-600 text-xs font-mono">Total ETH</p>
          <p className="text-sm font-bold text-green-400 matrix-glow">
            {getTotalETHDistributed().toFixed(3)}
          </p>
        </div>
        <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
          <p className="text-green-600 text-xs font-mono">Distributions</p>
          <p className="text-sm font-bold text-green-400 matrix-glow">
            {distributions.length}
          </p>
        </div>
        <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
          <p className="text-green-600 text-xs font-mono">Last Amount</p>
          <p className="text-sm font-bold text-green-400 matrix-glow">
            {distributions.length > 0 ? formatETH(distributions[0].ethAmount) : '0.0000'} ETH
          </p>
        </div>
      </div>

      {/* Distribution History */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-green-400 font-mono mb-3">Recent Distributions</h4>
        
        {displayedDistributions.map((distribution, index) => (
          <div 
            key={distribution.id}
            className="bg-green-950/10 border border-green-900/30 rounded-lg p-4 hover:bg-green-950/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-green-400 font-mono text-sm font-semibold">
                  Week {index + 1}
                </div>
                <div className="text-green-600 font-mono text-xs">
                  {formatDate(distribution.timestamp)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-mono text-sm font-bold">
                  {formatETH(distribution.ethAmount)} ETH
                </div>
                <div className="text-green-700 font-mono text-xs">
                  {formatUSD(distribution.ethAmount, distribution.ethPrice)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-green-600">Staked:</span>
                <div className="text-green-400">
                  {(distribution.totalStaked / 1000000).toFixed(1)}M $ABC
                </div>
              </div>
              <div>
                <span className="text-green-600">Stakers:</span>
                <div className="text-green-400">{distribution.stakersCount}</div>
              </div>
              <div>
                <span className="text-green-600">APY:</span>
                <div className="text-green-400">{distribution.apy.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-green-600">ETH Price:</span>
                <div className="text-green-400">
                  {distribution.ethPrice ? `$${distribution.ethPrice.toFixed(0)}` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}

        {distributions.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                     text-green-400 hover:text-green-300 py-2 rounded-lg font-mono text-sm 
                     transition-all duration-300 matrix-button"
          >
            {showAll ? 'Show Less' : `Show All ${distributions.length} Distributions`}
          </button>
        )}
      </div>

      {distributions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-green-600 font-mono text-sm">No distribution history available</p>
          <p className="text-green-700 font-mono text-xs mt-1">
            History will appear as ETH rewards are distributed to stakers
          </p>
        </div>
      )}
    </div>
  );
}