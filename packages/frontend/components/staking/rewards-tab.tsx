/**
 * Rewards Tab Component
 * 
 * Claim ETH rewards and view rewards history
 */

'use client';

import { useState, useEffect } from 'react';

interface RewardTransaction {
  id: string;
  type: 'claim' | 'distribution';
  amount: string;
  timestamp: string;
  txHash: string;
  blockNumber?: number;
}

interface RewardsTabProps {
  stakingData: {
    tokenBalance: string;
    stakedAmount: string;
    pendingRewards: string;
    totalEarned: string;
    isLoading: boolean;
  };
  user: any;
  onClaimSuccess: () => void;
  onClaimRewards?: () => Promise<void>;
  isClaimLoading?: boolean;
}

export function RewardsTab({ stakingData, user, onClaimSuccess, onClaimRewards, isClaimLoading }: RewardsTabProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [rewardsHistory, setRewardsHistory] = useState<RewardTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    loadRewardsHistory();
  }, []);

  const loadRewardsHistory = async () => {
    setIsLoadingHistory(true);
    
    // Simulate API call - replace with actual rewards history API
    setTimeout(() => {
      const mockHistory: RewardTransaction[] = [
        {
          id: '1',
          type: 'claim',
          amount: '0.0156',
          timestamp: '2 hours ago',
          txHash: '0xa1b2c3d4e5f6789012345678901234567890abcdef'
        },
        {
          id: '2',
          type: 'distribution',
          amount: '0.0089',
          timestamp: '1 day ago',
          txHash: '0xb2c3d4e5f6789012345678901234567890abcdef01'
        },
        {
          id: '3',
          type: 'claim',
          amount: '0.0234',
          timestamp: '3 days ago',
          txHash: '0xc3d4e5f6789012345678901234567890abcdef012'
        },
        {
          id: '4',
          type: 'distribution',
          amount: '0.0167',
          timestamp: '5 days ago',
          txHash: '0xd4e5f6789012345678901234567890abcdef0123'
        },
        {
          id: '5',
          type: 'claim',
          amount: '0.0298',
          timestamp: '1 week ago',
          txHash: '0xe5f6789012345678901234567890abcdef01234'
        }
      ];
      
      setRewardsHistory(mockHistory);
      setIsLoadingHistory(false);
    }, 600);
  };

  const handleClaimRewards = async () => {
    if (parseFloat(stakingData.pendingRewards) <= 0 || !onClaimRewards) return;
    
    try {
      setIsClaiming(true);
      await onClaimRewards();
      // onClaimSuccess and data refresh will be handled by the useStaking hook
      onClaimSuccess();
    } catch (error) {
      console.error('Failed to claim rewards:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTxHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getTransactionIcon = (type: string) => {
    return type === 'claim' ? '💰' : '📥';
  };

  const getTransactionColor = (type: string) => {
    return type === 'claim' ? 'text-green-400' : 'text-blue-400';
  };

  const canClaim = parseFloat(stakingData.pendingRewards) > 0 && !!onClaimRewards;
  const estimatedValue = parseFloat(stakingData.pendingRewards) * 3000; // Assume $3000 ETH price
  const isCurrentlyClaiming = isClaiming || isClaimLoading;

  return (
    <div className="space-y-6">
      {/* Claim Rewards Section */}
      <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-2">💎 Available Rewards</h3>
            <p className="text-sm text-green-600 font-mono">
              Claim your ETH rewards from staking ABC tokens
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">
              {stakingData.pendingRewards} ETH
            </div>
            <div className="text-sm text-green-600">
              ≈ ${estimatedValue.toFixed(2)} USD
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-green-600 mb-1">Pending Rewards</div>
            <div className="text-lg font-bold text-green-400">
              {stakingData.pendingRewards} ETH
            </div>
          </div>
          
          <div className="bg-black/40 border border-blue-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-blue-600 mb-1">Total Earned</div>
            <div className="text-lg font-bold text-blue-400">
              {stakingData.totalEarned} ETH
            </div>
          </div>
          
          <div className="bg-black/40 border border-purple-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-purple-600 mb-1">Total Earned</div>
            <div className="text-lg font-bold text-purple-400">
              {stakingData.totalEarned} ETH
            </div>
          </div>
        </div>

        <button
          onClick={handleClaimRewards}
          disabled={!canClaim || isCurrentlyClaiming}
          className={`w-full py-4 rounded-lg font-mono font-bold text-lg transition-all duration-200 ${
            canClaim && !isCurrentlyClaiming
              ? 'bg-green-900/50 text-green-400 hover:bg-green-800/60 hover:matrix-glow'
              : 'bg-gray-900/50 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isCurrentlyClaiming ? '🔄 Claiming Rewards...' : 
           canClaim ? '🎁 Claim ETH Rewards' : 
           '⏳ No Rewards Available'}
        </button>

        {!canClaim && (
          <div className="mt-4 text-center text-sm text-green-600 font-mono">
            💡 Rewards are distributed daily. Check back tomorrow!
          </div>
        )}
      </div>

      {/* Rewards Statistics */}
      <div className="bg-black/40 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">📊 Rewards Analytics</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">Performance Metrics</h5>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Daily Average:</span>
                <span className="text-sm font-mono text-green-400">
                  {(parseFloat(stakingData.totalEarned) / 30).toFixed(6)} ETH
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Weekly Projection:</span>
                <span className="text-sm font-mono text-green-400">
                  {(parseFloat(stakingData.totalEarned) / 30 * 7).toFixed(6)} ETH
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Monthly Projection:</span>
                <span className="text-sm font-mono text-green-400">
                  {(parseFloat(stakingData.totalEarned) / 30 * 30).toFixed(6)} ETH
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">Yield Information</h5>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Total Earned:</span>
                <span className="text-sm font-mono text-green-400">{stakingData.totalEarned} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Compounding:</span>
                <span className="text-sm font-mono text-blue-400">Daily</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Rewards Token:</span>
                <span className="text-sm font-mono text-purple-400">ETH</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards History */}
      <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-green-400">🏆 Rewards History</h4>
          <button
            onClick={loadRewardsHistory}
            className="text-sm font-mono text-green-600 hover:text-green-400 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-black/20 rounded-lg">
                <div className="w-10 h-10 bg-green-950/30 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-green-950/30 rounded mb-2"></div>
                  <div className="h-3 bg-green-950/30 rounded w-2/3"></div>
                </div>
                <div className="w-20 h-4 bg-green-950/30 rounded"></div>
              </div>
            ))}
          </div>
        ) : rewardsHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💎</div>
            <h5 className="text-lg font-bold text-green-400 mb-2">No Rewards Yet</h5>
            <p className="text-sm text-green-600 font-mono">
              Your first rewards will appear here once you start staking
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rewardsHistory.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-4 p-3 bg-black/20 border border-green-900/20 rounded-lg hover:border-green-700/30 hover:bg-green-950/10 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  transaction.type === 'claim' 
                    ? 'bg-green-950/30 text-green-400' 
                    : 'bg-blue-950/30 text-blue-400'
                }`}>
                  <span className="text-lg">{getTransactionIcon(transaction.type)}</span>
                </div>

                <div className="flex-1">
                  <div className={`font-semibold font-mono text-sm ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'claim' ? 'Rewards Claimed' : 'Rewards Distributed'}
                  </div>
                  <div className="text-xs text-green-600">
                    {transaction.timestamp} • {formatTxHash(transaction.txHash)}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold font-mono text-sm ${getTransactionColor(transaction.type)}`}>
                    +{transaction.amount} ETH
                  </div>
                  <div className="text-xs text-green-700">
                    ≈ ${(parseFloat(transaction.amount) * 3000).toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => window.open(`https://basescan.org/tx/${transaction.txHash}`, '_blank')}
                  className="text-green-600 hover:text-green-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            ))}

            {rewardsHistory.length >= 5 && (
              <button className="w-full py-3 text-center text-green-600 hover:text-green-400 font-mono text-sm hover:bg-green-950/10 rounded-lg transition-colors">
                Load More History →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rewards Tips */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">💡 Maximize Your Rewards</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-400">🔄</span>
              <div>
                <div className="text-sm font-mono text-green-400">Compound Daily</div>
                <div className="text-xs text-green-600">Claim and reinvest to maximize returns</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-blue-400">⏰</span>
              <div>
                <div className="text-sm font-mono text-blue-400">Optimal Timing</div>
                <div className="text-xs text-green-600">Rewards are distributed every 24 hours</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-purple-400">📈</span>
              <div>
                <div className="text-sm font-mono text-purple-400">Stake More</div>
                <div className="text-xs text-green-600">Higher stake = higher absolute rewards</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-orange-400">🔒</span>
              <div>
                <div className="text-sm font-mono text-orange-400">Stay Staked</div>
                <div className="text-xs text-green-600">No rewards during unstaking cooldown</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}