'use client';

import { useState } from 'react';
import { useStaking } from '@/hooks/useStaking';
import { useUnbonding } from '@/hooks/useUnbonding';
import { useAPYCalculator } from '@/hooks/useAPYCalculator';
import { ContractAddressesFooter } from '@/components/contract-addresses-footer';
import { BackNavigation } from '@/components/back-navigation';
import { Skeleton } from '@/components/skeleton-loader';
import { EthRewardsHistory } from '@/components/eth-rewards-history';

export default function StakingPage() {
  const stakingData = useStaking();
  const unbondingData = useUnbonding();
  const { apyData } = useAPYCalculator();
  const [activeTab, setActiveTab] = useState<'overview' | 'stake' | 'unbonding' | 'rewards'>('overview');
  const [amount, setAmount] = useState('');
  const [isStaking, setIsStaking] = useState(true);

  const isLoading = !stakingData.tokenBalance || !stakingData.totalStaked;

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="staking_dashboard()" 
        subtitle="Stake $ABC tokens to earn ETH rewards • Real-time updates" 
      />
      
      {/* Real-time connection status */}
      <div className="max-w-6xl mx-auto px-4 -mt-2 mb-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400">Real-time WebSocket connected</span>
          </div>
          {/* Real-time status updates would go here */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Staking Overview Cards */}
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
                <h3 className="text-green-600 text-responsive-xs font-mono mb-1">Your Staked</h3>
                <p className="text-responsive-lg font-bold text-green-400 matrix-glow">
                  {parseFloat(stakingData.stakedAmount).toFixed(2)} $ABC
                </p>
                <p className="text-green-500 text-xs font-mono mt-1">Earning rewards</p>
              </div>
              
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
                <h3 className="text-green-600 text-responsive-xs font-mono mb-1">Pending Rewards</h3>
                <p className="text-responsive-lg font-bold text-green-300 matrix-glow">
                  {parseFloat(stakingData.pendingRewards).toFixed(4)} ETH
                </p>
                <p className="text-green-500 text-xs font-mono mt-1">Ready to claim</p>
              </div>
              
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
                <h3 className="text-green-600 text-responsive-xs font-mono mb-1">Total Staked</h3>
                <p className="text-responsive-lg font-bold text-green-400 matrix-glow">
                  {parseFloat(stakingData.totalStaked).toFixed(0)} $ABC
                </p>
                <p className="text-green-500 text-xs font-mono mt-1">Community wide</p>
              </div>
              
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
                <h3 className="text-green-600 text-responsive-xs font-mono mb-1">Current Weekly APY</h3>
                <p className="text-responsive-lg font-bold text-green-400 matrix-glow">
                  {apyData.currentAPY ? apyData.currentAPY.toFixed(1) : '0.0'}%
                </p>
                <p className="text-green-500 text-xs font-mono mt-1">Resets weekly</p>
              </div>
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-green-950/10 border border-green-900/30 p-1 rounded-lg font-mono mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./overview
          </button>
          <button
            onClick={() => setActiveTab('stake')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] whitespace-nowrap ${
              activeTab === 'stake' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./stake
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] whitespace-nowrap ${
              activeTab === 'rewards' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./rewards
          </button>
          <button
            onClick={() => setActiveTab('unbonding')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] whitespace-nowrap ${
              activeTab === 'unbonding' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./unbonding
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                  {'>'} How Staking Works
                </h3>
                <div className="space-y-4">
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <h4 className="text-green-400 font-mono text-sm mb-2">1. Stake $ABC Tokens</h4>
                    <p className="text-green-600 font-mono text-xs">
                      Lock your $ABC tokens in the staking contract to start earning rewards.
                    </p>
                  </div>
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <h4 className="text-green-400 font-mono text-sm mb-2">2. Earn ETH Rewards</h4>
                    <p className="text-green-600 font-mono text-xs">
                      Receive a share of ETH rewards based on your staking proportion.
                    </p>
                  </div>
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <h4 className="text-green-400 font-mono text-sm mb-2">3. Claim Anytime</h4>
                    <p className="text-green-600 font-mono text-xs">
                      Claim your accumulated ETH rewards at any time without unstaking.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                  {'>'} Your Position
                </h3>
                <div className="space-y-4">
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-green-600">Wallet Balance:</span>
                        <span className="text-green-400">{parseFloat(stakingData.tokenBalance).toFixed(2)} $ABC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Staked Amount:</span>
                        <span className="text-green-400">{parseFloat(stakingData.stakedAmount).toFixed(2)} $ABC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Staking Ratio:</span>
                        <span className="text-green-400">
                          {stakingData.totalStaked && parseFloat(stakingData.totalStaked) > 0 
                            ? ((parseFloat(stakingData.stakedAmount) / parseFloat(stakingData.totalStaked)) * 100).toFixed(2)
                            : '0.00'
                          }%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Current Weekly APY:</span>
                        <span className="text-green-400">
                          {apyData.currentAPY ? apyData.currentAPY.toFixed(1) : '0.0'}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {parseFloat(stakingData.pendingRewards || '0') > 0 && (
                    <button 
                      onClick={stakingData.handleClaimRewards}
                      disabled={stakingData.isClaimLoading}
                      className="w-full bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                               text-green-400 hover:text-green-300 py-3 rounded-lg font-mono font-medium 
                               transition-all duration-300 matrix-button matrix-glow disabled:opacity-50"
                    >
                      {'>'} {stakingData.isClaimLoading ? 'CLAIMING...' : `CLAIM ${parseFloat(stakingData.pendingRewards || '0').toFixed(4)} ETH`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stake' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                  {isStaking ? '> stake_ABC()' : '> unstake_ABC()'}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsStaking(true)}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium font-mono transition-all duration-300 min-h-[44px] ${
                        isStaking 
                          ? 'bg-green-900/50 text-green-400 border border-green-700/50 matrix-glow' 
                          : 'bg-green-950/20 text-green-600 border border-green-900/30 hover:text-green-400 hover:border-green-700/50'
                      }`}
                    >
                      STAKE
                    </button>
                    <button
                      onClick={() => setIsStaking(false)}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium font-mono transition-all duration-300 min-h-[44px] ${
                        !isStaking 
                          ? 'bg-green-900/50 text-green-400 border border-green-700/50 matrix-glow' 
                          : 'bg-green-950/20 text-green-600 border border-green-900/30 hover:text-green-400 hover:border-green-700/50'
                      }`}
                    >
                      UNSTAKE
                    </button>
                  </div>

                  {!isStaking && (
                    <div className="bg-yellow-950/20 border border-yellow-900/50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-400 text-lg">⚠️</span>
                        <div>
                          <p className="text-yellow-400 font-mono text-sm font-semibold mb-1">
                            7-Day Unbonding Period
                          </p>
                          <p className="text-yellow-500 font-mono text-xs">
                            Unstaking requires a 7-day unbonding period. Your tokens will stop earning rewards immediately but won&apos;t be withdrawable for 7 days.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-responsive-xs text-green-600 mb-2 font-mono">
                      Amount
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="flex-1 bg-black border border-green-900/50 rounded-lg px-4 py-3 text-green-400 font-mono text-responsive-sm
                                 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600
                                 placeholder:text-green-800 min-h-[44px]"
                      />
                      <button 
                        onClick={() => setAmount(isStaking ? stakingData.tokenBalance : stakingData.stakedAmount)}
                        className="bg-green-950/20 border border-green-900/50 hover:border-green-700/50 
                                 text-green-400 hover:text-green-300 px-4 py-3 rounded-lg font-mono 
                                 transition-all duration-300 matrix-button min-h-[44px] min-w-[60px]"
                      >
                        MAX
                      </button>
                    </div>
                    <p className="text-responsive-xs text-green-600 mt-2 font-mono">
                      Balance: {parseFloat(stakingData.tokenBalance).toFixed(2)} $ABC
                    </p>
                  </div>

                  <button 
                    onClick={() => isStaking ? stakingData.handleStake(amount) : stakingData.handleUnstake(amount)}
                    disabled={stakingData.isStakeLoading || stakingData.isUnstakeLoading || stakingData.isApproveLoading}
                    className="w-full bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                             text-green-400 hover:text-green-300 py-3 rounded-lg font-mono font-medium 
                             transition-all duration-300 matrix-button matrix-glow disabled:opacity-50 min-h-[48px]"
                  >
                    {stakingData.isApproveLoading ? 'APPROVING...' : 
                     stakingData.isStakeLoading ? 'STAKING...' : 
                     stakingData.isUnstakeLoading ? 'STARTING UNBONDING...' :
                     isStaking && stakingData.needsApproval(amount) ? `${'>'} APPROVE $ABC` :
                     isStaking ? `${'>'} STAKE $ABC [REAL-TIME]` : `${'>'} START 7-DAY UNBONDING [REAL-TIME]`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'unbonding' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                  {'>'} Unbonding Queue (7-Day Period)
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
                    <p className="text-green-600 text-responsive-xs font-mono">Unbonding</p>
                    <p className="text-responsive-lg font-bold text-yellow-400 matrix-glow">{parseFloat(unbondingData.totalUnbonding).toFixed(1)} $ABC</p>
                  </div>
                  
                  <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
                    <p className="text-green-600 text-responsive-xs font-mono">Withdrawable</p>
                    <p className="text-responsive-lg font-bold text-green-400 matrix-glow">{parseFloat(unbondingData.withdrawableAmount).toFixed(1)} $ABC</p>
                  </div>
                </div>

                {unbondingData.unbondingQueue.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-400 font-mono text-sm">{'>'} Queue</h4>
                    {unbondingData.unbondingQueue.map((item, index) => {
                      const isReady = item.releaseTime <= Date.now() / 1000;
                      const timeLeft = item.releaseTime - Date.now() / 1000;
                      
                      return (
                        <div key={index} className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div className="font-mono text-sm">
                              <span className="text-green-400">{parseFloat(item.amount).toFixed(1)} $ABC</span>
                              <span className="text-green-600 ml-3">
                                {isReady ? 'Ready for withdrawal!' : `${Math.ceil(timeLeft / 3600)}h remaining`}
                              </span>
                            </div>
                            <div className={`px-3 py-1 rounded text-xs font-mono ${
                              isReady 
                                ? 'bg-green-900/50 text-green-400' 
                                : 'bg-yellow-900/50 text-yellow-400'
                            }`}>
                              {isReady ? 'READY' : 'WAITING'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4 text-center">
                    <p className="text-green-600 font-mono text-sm">No tokens unbonding</p>
                    <p className="text-green-500 font-mono text-xs mt-1">Unstaked tokens enter a 7-day unbonding period</p>
                  </div>
                )}

                {parseFloat(unbondingData.withdrawableAmount) > 0 && (
                  <button 
                    onClick={stakingData.handleCompleteUnstake}
                    disabled={stakingData.isUnstakeLoading}
                    className="w-full bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                             text-green-400 hover:text-green-300 py-3 rounded-lg font-mono font-medium 
                             transition-all duration-300 matrix-button matrix-glow disabled:opacity-50 mt-4 min-h-[48px]"
                  >
                    {'>'} {stakingData.isUnstakeLoading ? 'WITHDRAWING...' : `WITHDRAW ${parseFloat(unbondingData.withdrawableAmount).toFixed(1)} $ABC`}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm mb-6">
                <h3 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                  {'>'} ETH Staking Rewards
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
                    <h4 className="text-green-600 text-xs font-mono mb-1">Pending Rewards</h4>
                    <p className="text-responsive-lg font-bold text-green-300 matrix-glow">
                      {parseFloat(stakingData.pendingRewards).toFixed(4)} ETH
                    </p>
                    <p className="text-green-500 text-xs font-mono mt-1">Available to claim</p>
                  </div>
                  
                  <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
                    <h4 className="text-green-600 text-xs font-mono mb-1">Total Earned</h4>
                    <p className="text-responsive-lg font-bold text-green-400 matrix-glow">
                      {parseFloat(stakingData.totalEarned).toFixed(4)} ETH
                    </p>
                    <p className="text-green-500 text-xs font-mono mt-1">All time rewards</p>
                  </div>
                  
                  <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
                    <h4 className="text-green-600 text-xs font-mono mb-1">Your Stake</h4>
                    <p className="text-responsive-lg font-bold text-green-400 matrix-glow">
                      {parseFloat(stakingData.stakedAmount).toFixed(2)} $ABC
                    </p>
                    <p className="text-green-500 text-xs font-mono mt-1">
                      {stakingData.totalStaked && parseFloat(stakingData.totalStaked) > 0 
                        ? ((parseFloat(stakingData.stakedAmount) / parseFloat(stakingData.totalStaked)) * 100).toFixed(2)
                        : '0.00'
                      }% of total
                    </p>
                  </div>
                </div>

                {parseFloat(stakingData.pendingRewards) > 0 ? (
                  <button 
                    onClick={stakingData.handleClaimRewards}
                    disabled={stakingData.isClaimLoading}
                    className="w-full bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                             text-green-400 hover:text-green-300 py-3 rounded-lg font-mono font-medium 
                             transition-all duration-300 matrix-button matrix-glow disabled:opacity-50 min-h-[48px] mb-6"
                  >
                    {'>'} {stakingData.isClaimLoading ? 'CLAIMING...' : `CLAIM ${parseFloat(stakingData.pendingRewards).toFixed(4)} ETH REWARDS`}
                  </button>
                ) : (
                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4 text-center mb-6">
                    <p className="text-green-600 font-mono text-sm">No pending rewards</p>
                    <p className="text-green-500 font-mono text-xs mt-1">
                      ETH rewards are distributed automatically to stakers
                    </p>
                  </div>
                )}

                <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-mono text-sm mb-3">{'>'} How ETH Rewards Work</h4>
                  <div className="space-y-2 text-xs font-mono text-green-600">
                    <p>• ETH rewards are distributed every 6 hours from protocol revenue</p>
                    <p>• 25% of protocol ETH goes to the staking contract</p>
                    <p>• Your share is proportional to your staked $ABC</p>
                    <p>• Rewards accumulate automatically and can be claimed anytime</p>
                    <p>• No fees for claiming - just gas costs</p>
                  </div>
                </div>
              </div>

              <EthRewardsHistory />
            </div>
          )}
        </div>
      </div>

      <ContractAddressesFooter />
    </div>
  );
}