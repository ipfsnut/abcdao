/**
 * Stake Tab Component
 * 
 * Main staking interface with staking operations
 */

'use client';

import { useState } from 'react';
import { useStaking } from '@/hooks/useStaking';

interface StakeTabProps {
  stakingData: {
    tokenBalance: string;
    stakedAmount: string;
    pendingRewards: string;
    totalEarned: string;
    isLoading: boolean;
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
    handleClaimRewards, 
    isApproving,
    needsApproval 
  } = useStaking();
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [activeOperation, setActiveOperation] = useState<'stake' | 'unstake'>('stake');

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
                  onClick={() => setStakeAmount(stakingData.tokenBalance)}
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
                  onClick={() => setUnstakeAmount(stakingData.stakedAmount)}
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