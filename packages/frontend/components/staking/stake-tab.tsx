/**
 * Stake Tab Component
 * 
 * Main staking interface with staking operations
 */

'use client';

import { useState, useEffect } from 'react';
import { useStaking } from '@/hooks/useStaking';
import { useUnbonding } from '@/hooks/useUnbonding';

interface StakeTabProps {
  stakingData: {
    tokenBalance: string;
    stakedAmount: string;
    pendingRewards: string;
    totalEarned: string;
    isLoading: boolean;
    rawTokenBalance?: string;
    rawStakedAmount?: string;
  };
  user: any;
  onDataUpdate: () => void;
}

export function StakeTab({ stakingData, user, onDataUpdate }: StakeTabProps) {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  
  // Use real staking functions
  const { 
    handleStake: stakeTokens, 
    handleUnstake: unstakeTokens, 
    handleCompleteUnstake: claimUnbondedTokens,
    handleClaimRewards, 
    isApproving,
    needsApproval 
  } = useStaking();
  
  // Get unbonding information
  const { unbondingQueue, totalUnbonding, withdrawableAmount } = useUnbonding();
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [activeOperation, setActiveOperation] = useState<'stake' | 'unstake'>('stake');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClaimUnbondedTokens = async () => {
    setIsClaiming(true);
    try {
      await claimUnbondedTokens();
    } catch (error) {
      console.error('Claiming failed:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    
    setIsStaking(true);
    try {
      await stakeTokens(stakeAmount);
      setStakeAmount('');
    } catch (error) {
      console.error('Staking failed:', error);
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) return;
    
    setIsUnstaking(true);
    try {
      await unstakeTokens(unstakeAmount);
      setUnstakeAmount('');
    } catch (error) {
      console.error('Unstaking failed:', error);
    } finally {
      setIsUnstaking(false);
    }
  };


  return (
    <div className="space-y-6">

      {/* Operation Tabs */}
      <div className="bg-black/40 border border-green-900/30 rounded-xl p-6">
        <div className="flex border-b border-green-900/30 mb-6">
          <button
            onClick={() => setActiveOperation('stake')}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              activeOperation === 'stake'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-green-600 hover:text-green-400'
            }`}
          >
            🏦 Stake Tokens
          </button>
          <button
            onClick={() => setActiveOperation('unstake')}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              activeOperation === 'unstake'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-green-600 hover:text-green-400'
            }`}
          >
            📤 Unstake Tokens
          </button>
        </div>

        {activeOperation === 'stake' ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-mono text-green-600">Amount to Stake</label>
                <span className="text-xs text-green-700">
                  Balance: {stakingData.tokenBalance}M $ABC
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-black/40 border border-green-900/50 rounded-lg px-3 py-2 text-green-400 font-mono focus:outline-none focus:border-green-700/50"
                />
                <button
                  onClick={() => setStakeAmount(stakingData.rawTokenBalance || stakingData.tokenBalance)}
                  className="px-4 py-2 bg-green-900/50 text-green-400 rounded-lg font-mono text-sm hover:bg-green-800/60 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>


            <button
              onClick={handleStake}
              disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || isStaking}
              className="w-full py-3 bg-green-900/50 text-green-400 rounded-lg font-mono font-bold hover:bg-green-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isStaking ? '🔄 Staking...' : '🏦 Stake Tokens'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-mono text-green-600">Amount to Unstake</label>
                <span className="text-xs text-green-700">
                  Staked: {stakingData.stakedAmount}M $ABC
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-black/40 border border-green-900/50 rounded-lg px-3 py-2 text-green-400 font-mono focus:outline-none focus:border-green-700/50"
                />
                <button
                  onClick={() => setUnstakeAmount(stakingData.rawStakedAmount || stakingData.stakedAmount)}
                  className="px-4 py-2 bg-yellow-900/50 text-yellow-400 rounded-lg font-mono text-sm hover:bg-yellow-800/60 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="bg-yellow-950/20 border border-yellow-700/30 rounded-lg p-4">
              <div className="text-sm text-yellow-600 font-mono mb-2">⚠️ Unstaking Notice</div>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Unstaking has a 7-day cooldown period</li>
                <li>• No rewards earned during cooldown</li>
                <li>• You can cancel unstaking anytime</li>
              </ul>
            </div>

            <button
              onClick={handleUnstake}
              disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0 || isUnstaking}
              className="w-full py-3 bg-yellow-900/50 text-yellow-400 rounded-lg font-mono font-bold hover:bg-yellow-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUnstaking ? '🔄 Unstaking...' : '📤 Unstake Tokens'}
            </button>
          </div>
        )}
      </div>

      {/* Unbonding Status Widget */}
      {(parseFloat(totalUnbonding) > 0 || parseFloat(withdrawableAmount) > 0) && (
        <div className="bg-yellow-950/20 border border-yellow-700/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⏳</span>
            <h3 className="text-lg font-bold text-yellow-400">Unbonding Tokens</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4">
              <div className="text-sm font-mono text-yellow-600 mb-1">Total Unbonding</div>
              <div className="text-xl font-bold text-yellow-400">
                {(parseFloat(totalUnbonding) / 1e6).toFixed(1)}M $ABC
              </div>
            </div>
            
            <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-4">
              <div className="text-sm font-mono text-green-600 mb-1">Ready to Claim</div>
              <div className="text-xl font-bold text-green-400">
                {(parseFloat(withdrawableAmount) / 1e6).toFixed(1)}M $ABC
              </div>
            </div>
          </div>

          {/* Unbonding Queue */}
          {unbondingQueue.length > 0 && (
            <div className="space-y-3 mb-4">
              <div className="text-sm font-mono text-yellow-600">Unbonding Schedule:</div>
              {unbondingQueue.map((item, index) => {
                const releaseTime = item.releaseTime * 1000;
                const timeRemaining = releaseTime - currentTime;
                const isReady = timeRemaining <= 0;
                
                const formatTimeRemaining = (ms: number) => {
                  if (ms <= 0) return "Ready to claim!";
                  
                  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
                  
                  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
                  if (hours > 0) return `${hours}h ${minutes}m`;
                  return `${minutes}m`;
                };

                return (
                  <div key={index} className="bg-black/40 border border-yellow-800/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={isReady ? "text-green-400" : "text-yellow-400"}>
                          {isReady ? "✅" : "⏱️"}
                        </span>
                        <div>
                          <div className="text-sm font-mono text-green-400">
                            {(parseFloat(item.amount) / 1e6).toFixed(1)}M $ABC
                          </div>
                          <div className="text-xs text-yellow-600">
                            Release: {new Date(releaseTime).toLocaleDateString()} at {new Date(releaseTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm font-mono ${isReady ? "text-green-400" : "text-yellow-400"}`}>
                        {formatTimeRemaining(timeRemaining)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Claim Button */}
          {parseFloat(withdrawableAmount) > 0 && (
            <button
              onClick={handleClaimUnbondedTokens}
              disabled={isClaiming}
              className="w-full py-3 bg-green-900/50 text-green-400 rounded-lg font-mono font-bold hover:bg-green-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isClaiming ? '🔄 Claiming...' : `🎁 Claim ${(parseFloat(withdrawableAmount) / 1e6).toFixed(1)}M $ABC`}
            </button>
          )}
        </div>
      )}

      {/* Staking Benefits */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-green-400 mb-4">🎁 Staking Benefits</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-400 text-xl">💰</span>
              <div>
                <div className="text-sm font-mono text-green-400">ETH Rewards</div>
                <div className="text-xs text-green-600">Earn ETH passively from protocol fees</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-blue-400 text-xl">🏆</span>
              <div>
                <div className="text-sm font-mono text-blue-400">Community Status</div>
                <div className="text-xs text-green-600">Higher reputation and recognition</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-purple-400 text-xl">🏆</span>
              <div>
                <div className="text-sm font-mono text-purple-400">Premium Features</div>
                <div className="text-xs text-green-600">Access exclusive tools and analytics</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-orange-400 text-xl">🎯</span>
              <div>
                <div className="text-sm font-mono text-orange-400">Compound Returns</div>
                <div className="text-xs text-green-600">Reinvest rewards for exponential growth</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}