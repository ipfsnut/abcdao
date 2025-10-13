'use client';

import { ContractAddressesFooter } from '@/components/contract-addresses-footer';
import { FarcasterAuth } from '@/components/farcaster-auth';
import { GitHubLinkPanel } from '@/components/github-link';
import { WhitepaperButton } from '@/components/whitepaper-button';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useFarcaster } from '@/components/farcaster-miniapp';
import { useState } from 'react';
import { useStaking } from '@/hooks/useStaking';
import { useUnbonding } from '@/hooks/useUnbonding';
import { Toaster } from 'sonner';

export default function Home() {
  const { isInMiniApp } = useFarcaster();
  const [activeTab, setActiveTab] = useState<'stake' | 'vote' | 'proposals'>('stake');
  const stakingData = useStaking();

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Mobile-First Header */}
      <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          {isInMiniApp ? (
            /* Miniapp Header: Centered Layout */
            <>
              <div className="flex flex-col items-center text-center mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src="/abc-logo.png" 
                    alt="ABC Logo" 
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  />
                  <h1 className="text-xl sm:text-2xl font-bold matrix-glow">
                    {'>'} ABC_DAO
                  </h1>
                </div>
                <p className="text-xs text-green-600 font-mono mb-2">
                  Ship code. Earn rewards.
                </p>
                <WhitepaperButton />
              </div>
              
              {/* Wallet Connection - Essential for Web3 */}
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </>
          ) : (
            /* Web Header: Original Layout */
            <>
              <div className="flex items-center justify-between">
                {/* Logo and Title - Compact on Mobile */}
                <div className="flex items-center gap-2">
                  <img 
                    src="/abc-logo.png" 
                    alt="ABC Logo" 
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  />
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold matrix-glow">
                      {'>'} ABC_DAO
                    </h1>
                    <p className="hidden sm:block text-xs text-green-600 font-mono">
                      Ship code. Earn rewards.
                    </p>
                  </div>
                </div>
                
                {/* Mobile-Optimized Actions */}
                <div className="flex items-center gap-2">
                  <WhitepaperButton />
                  <div className="hidden sm:block">
                    <FarcasterAuth />
                  </div>
                  <ConnectButton />
                </div>
              </div>
              
              {/* Mobile Tagline */}
              <p className="sm:hidden text-xs text-green-600 mt-2 font-mono">
                Ship code. Earn rewards. Build the future.
              </p>
            </>
          )}
        </div>
      </header>

      {/* Mobile-First Stats Bar - Horizontal Scroll on Mobile */}
      <div className="bg-black/80 border-b border-green-900/30 backdrop-blur-sm">
        <div className="px-4 py-3">
          <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            <div className="min-w-[140px] sm:min-w-0 bg-green-950/20 border border-green-900/50 rounded-lg p-3 matrix-button">
              <p className="text-green-600 text-xs font-mono">Treasury</p>
              <p className="text-lg sm:text-xl font-bold text-green-400 matrix-glow">0 $ABC</p>
            </div>
            <div className="min-w-[140px] sm:min-w-0 bg-green-950/20 border border-green-900/50 rounded-lg p-3 matrix-button">
              <p className="text-green-600 text-xs font-mono">Total_Staked</p>
              <p className="text-lg sm:text-xl font-bold text-green-400 matrix-glow">{parseFloat(stakingData.totalStaked).toFixed(0)} $ABC</p>
            </div>
            <div className="min-w-[140px] sm:min-w-0 bg-green-950/20 border border-green-900/50 rounded-lg p-3 matrix-button">
              <p className="text-green-600 text-xs font-mono">ETH_Rewards</p>
              <p className="text-lg sm:text-xl font-bold text-green-400 matrix-glow">{parseFloat(stakingData.totalRewardsDistributed).toFixed(3)} ETH</p>
            </div>
            <div className="min-w-[140px] sm:min-w-0 bg-green-950/20 border border-green-900/50 rounded-lg p-3 matrix-button">
              <p className="text-green-600 text-xs font-mono">Active_Devs</p>
              <p className="text-lg sm:text-xl font-bold text-green-400 matrix-glow">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Content Based on Context */}
      <div className="px-4 mt-6">
        {isInMiniApp ? (
          /* Miniapp Context: Show Full Functionality */
          <>
            {/* Mobile-First Tab Navigation */}
            <div className="flex bg-green-950/10 border border-green-900/30 p-1 rounded-lg font-mono overflow-x-auto">
              <button
                onClick={() => setActiveTab('stake')}
                className={`px-3 py-2 sm:px-4 rounded-md font-medium transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'stake' 
                    ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                    : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                }`}
              >
                ./stake
              </button>
              <button
                onClick={() => setActiveTab('vote')}
                className={`px-3 py-2 sm:px-4 rounded-md font-medium transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'vote' 
                    ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                    : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                }`}
              >
                ./rewards
              </button>
              <button
                onClick={() => setActiveTab('proposals')}
                className={`px-3 py-2 sm:px-4 rounded-md font-medium transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'proposals' 
                    ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                    : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                }`}
              >
                ./join
              </button>
            </div>

            {/* Mobile-Optimized Tab Content */}
            <div className="mt-4">
              {activeTab === 'stake' && (
                <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm text-center">
                  <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
                    {'>'} stake_ABC()
                  </h2>
                  <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4">
                    <p className="text-purple-400 font-mono text-sm mb-2">
                      🚧 Coming Soon
                    </p>
                    <p className="text-green-600 font-mono text-xs">
                      Staking will be available after $ABC token deployment
                    </p>
                  </div>
                </div>
              )}
              {activeTab === 'vote' && (
                <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm text-center">
                  <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
                    {'>'} rewards_dashboard()
                  </h2>
                  <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4">
                    <p className="text-purple-400 font-mono text-sm mb-2">
                      🚧 Coming Soon
                    </p>
                    <p className="text-green-600 font-mono text-xs">
                      Rewards dashboard will be available after staking launch
                    </p>
                  </div>
                </div>
              )}
              {activeTab === 'proposals' && <GitHubLinkPanel />}
            </div>
          </>
        ) : (
          /* Regular Web Context: Show Whitepaper Button */
          <div className="flex flex-col items-center justify-center space-y-6 py-12">
            <div className="text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-green-400 matrix-glow font-mono">
                Learn About ABC DAO
              </h2>
              <p className="text-green-600 font-mono text-base sm:text-lg max-w-2xl">
                Discover how developers earn $ABC tokens and ETH rewards by shipping code
              </p>
            </div>
            
            <a
              href="/whitepaper"
              className="bg-green-900/50 hover:bg-green-900/70 border-2 border-green-700/50 hover:border-green-600 
                       text-green-400 hover:text-green-300 px-12 py-6 rounded-xl font-mono font-bold text-xl sm:text-2xl
                       transition-all duration-300 matrix-button matrix-glow hover:scale-105 hover:shadow-lg 
                       hover:shadow-green-900/30 text-center"
            >
              📋 WHITEPAPER
            </a>
            
            <div className="text-center space-y-2 mt-6">
              <p className="text-green-600 font-mono text-sm">
                {"// Full functionality available in Farcaster miniapp"}
              </p>
              <p className="text-green-700 font-mono text-xs">
                Coming soon: Web interface for staking and rewards
              </p>
            </div>
          </div>
        )}
      </div>
      
      <ContractAddressesFooter />
      <Toaster position="bottom-right" />
    </div>
  );
}

function StakePanel({ stakingData }: { stakingData: ReturnType<typeof useStaking> }) {
  const [amount, setAmount] = useState('');
  const [isStaking, setIsStaking] = useState(true);

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
        {isStaking ? '> stake_ABC()' : '> unstake_ABC()'}
      </h2>
      
      <div className="space-y-3 sm:space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setIsStaking(true)}
            className={`flex-1 px-3 py-2 sm:px-4 rounded-lg font-medium font-mono transition-all duration-300 text-sm sm:text-base ${
              isStaking 
                ? 'bg-green-900/50 text-green-400 border border-green-700/50 matrix-glow' 
                : 'bg-green-950/20 text-green-600 border border-green-900/30 hover:text-green-400 hover:border-green-700/50'
            }`}
          >
            STAKE
          </button>
          <button
            onClick={() => setIsStaking(false)}
            className={`flex-1 px-3 py-2 sm:px-4 rounded-lg font-medium font-mono transition-all duration-300 text-sm sm:text-base ${
              !isStaking 
                ? 'bg-green-900/50 text-green-400 border border-green-700/50 matrix-glow' 
                : 'bg-green-950/20 text-green-600 border border-green-900/30 hover:text-green-400 hover:border-green-700/50'
            }`}
          >
            UNSTAKE
          </button>
        </div>

        <div>
          <label className="block text-xs sm:text-sm text-green-600 mb-2 font-mono">
            Amount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-black border border-green-900/50 rounded-lg px-3 py-2 text-green-400 font-mono text-sm sm:text-base
                         focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600
                         placeholder:text-green-800"
            />
            <button 
              onClick={() => setAmount(isStaking ? stakingData.tokenBalance : stakingData.stakedAmount)}
              className="bg-green-950/20 border border-green-900/50 hover:border-green-700/50 
                               text-green-400 hover:text-green-300 px-3 sm:px-4 py-2 rounded-lg font-mono 
                               transition-all duration-300 matrix-button text-sm sm:text-base">
              MAX
            </button>
          </div>
          <p className="text-xs sm:text-sm text-green-600 mt-2 font-mono">
            Balance: {parseFloat(stakingData.tokenBalance).toFixed(2)} $ABC
          </p>
        </div>

        <button 
          onClick={() => isStaking ? stakingData.handleStake(amount) : stakingData.handleUnstake(amount)}
          disabled={stakingData.isStakeLoading || stakingData.isUnstakeLoading || stakingData.isApproveLoading}
          className="w-full bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                           text-green-400 hover:text-green-300 py-2.5 sm:py-3 rounded-lg font-mono font-medium 
                           transition-all duration-300 matrix-button matrix-glow disabled:opacity-50 text-sm sm:text-base">
          {stakingData.isApproveLoading ? 'APPROVING...' : 
           stakingData.isStakeLoading ? 'STAKING...' : 
           stakingData.isUnstakeLoading ? 'UNSTAKING...' :
           stakingData.isApproving ? 'APPROVAL PENDING...' :
           isStaking && stakingData.needsApproval(amount) ? `${'>'} APPROVE $ABC` :
           isStaking ? `${'>'} STAKE $ABC` : `${'>'} UNSTAKE $ABC`}
        </button>

        <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold mb-2 text-green-400 font-mono text-sm sm:text-base">{'>'} Your Position</h3>
          <div className="space-y-2 text-xs sm:text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-green-600">Staked</span>
              <span className="text-green-400">{parseFloat(stakingData.stakedAmount).toFixed(2)} $ABC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">ETH Earned</span>
              <span className="text-green-400">{parseFloat(stakingData.totalEarned).toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Pending</span>
              <span className="text-green-300 matrix-glow">{parseFloat(stakingData.pendingRewards).toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Vote Power</span>
              <span className="text-green-400">0%</span>
            </div>
          </div>
          
          <button 
            onClick={stakingData.handleClaimRewards}
            disabled={stakingData.isClaimLoading || parseFloat(stakingData.pendingRewards) === 0}
            className="w-full bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                             text-green-400 hover:text-green-300 py-2 rounded-lg font-mono font-medium 
                             transition-all duration-300 matrix-button mt-3 disabled:opacity-50 text-xs sm:text-sm">
            {'>'} {stakingData.isClaimLoading ? 'CLAIMING...' : `CLAIM (${parseFloat(stakingData.pendingRewards).toFixed(3)} ETH)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function VotePanel() {
  const stakingData = useStaking();

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-bold text-green-400 matrix-glow font-mono">{'>'} rewards_dashboard()</h2>
      
      {/* Mobile-First ETH Staking Rewards */}
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h3 className="text-base sm:text-lg font-semibold mb-3 text-green-400 font-mono">{'>'} ETH_Rewards</h3>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
            <p className="text-green-600 text-xs font-mono">Total_Earned</p>
            <p className="text-lg sm:text-xl font-bold text-green-400 matrix-glow">{parseFloat(stakingData.totalEarned).toFixed(3)} ETH</p>
          </div>
          
          <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
            <p className="text-green-600 text-xs font-mono">Pending</p>
            <p className="text-lg sm:text-xl font-bold text-green-300 matrix-glow">{parseFloat(stakingData.pendingRewards).toFixed(3)} ETH</p>
          </div>
        </div>

        <button 
          onClick={stakingData.handleClaimRewards}
          disabled={stakingData.isClaimLoading || parseFloat(stakingData.pendingRewards) === 0}
          className="w-full bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                           text-green-400 hover:text-green-300 py-2.5 sm:py-3 rounded-lg font-mono font-medium 
                           transition-all duration-300 matrix-button matrix-glow disabled:opacity-50 text-sm sm:text-base">
          {'>'} {stakingData.isClaimLoading ? 'CLAIMING...' : 'CLAIM_ETH()'}
        </button>
      </div>

      {/* Mobile-First Developer Rewards */}
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h3 className="text-base sm:text-lg font-semibold mb-3 text-green-400 font-mono">{'>'} Dev_Rewards</h3>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
          <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-2 sm:p-3">
            <p className="text-green-600 text-xs font-mono">Commits</p>
            <p className="text-lg sm:text-xl font-bold text-green-400 matrix-glow">0</p>
          </div>
          
          <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-2 sm:p-3">
            <p className="text-green-600 text-xs font-mono">$ABC</p>
            <p className="text-lg sm:text-xl font-bold text-green-400 matrix-glow">0</p>
          </div>
          
          <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-2 sm:p-3">
            <p className="text-green-600 text-xs font-mono">Rank</p>
            <p className="text-lg sm:text-xl font-bold text-green-400 matrix-glow">--</p>
          </div>
        </div>

        <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3">
          <h4 className="font-semibold mb-2 text-green-400 font-mono text-sm">{'>'} Reward Rates</h4>
          <div className="text-xs text-green-600 font-mono space-y-1">
            <p className="text-green-500">• Commit = 10 $ABC</p>
            <p className="text-green-500">• PR Merged = 50 $ABC</p>
            <p className="text-green-500">• Issue Closed = 25 $ABC</p>
          </div>
        </div>
      </div>

      {/* Unbonding Queue */}
      <UnbondingPanel stakingData={stakingData} />
    </div>
  );
}

function UnbondingPanel({ stakingData }: { stakingData: ReturnType<typeof useStaking> }) {
  const unbondingData = useUnbonding();

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h3 className="text-base sm:text-lg font-semibold mb-3 text-green-400 font-mono">{'>'} Unbonding</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
          <p className="text-green-600 text-xs font-mono">Unbonding</p>
          <p className="text-lg sm:text-xl font-bold text-yellow-400 matrix-glow">{parseFloat(unbondingData.totalUnbonding).toFixed(1)}</p>
        </div>
        
        <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
          <p className="text-green-600 text-xs font-mono">Withdrawable</p>
          <p className="text-lg sm:text-xl font-bold text-green-400 matrix-glow">{parseFloat(unbondingData.withdrawableAmount).toFixed(1)}</p>
        </div>
      </div>

      {unbondingData.unbondingQueue.length > 0 ? (
        <div className="space-y-2">
          <h4 className="font-semibold text-green-400 font-mono text-sm">{'>'} Queue</h4>
          {unbondingData.unbondingQueue.map((item, index) => {
            const isReady = item.releaseTime <= Date.now() / 1000;
            const timeLeft = item.releaseTime - Date.now() / 1000;
            
            return (
              <div key={index} className="bg-green-950/10 border border-green-900/30 rounded-lg p-2.5">
                <div className="flex justify-between items-center">
                  <div className="font-mono text-xs sm:text-sm">
                    <span className="text-green-400">{parseFloat(item.amount).toFixed(1)}</span>
                    <span className="text-green-600 ml-2">
                      {isReady ? 'Ready!' : `${Math.ceil(timeLeft / 3600)}h`}
                    </span>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-xs font-mono ${
                    isReady 
                      ? 'bg-green-900/50 text-green-400' 
                      : 'bg-yellow-900/50 text-yellow-400'
                  }`}>
                    {isReady ? 'READY' : 'WAIT'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3 text-center">
          <p className="text-green-600 font-mono text-xs sm:text-sm">No tokens unbonding</p>
        </div>
      )}

      {parseFloat(unbondingData.withdrawableAmount) > 0 && (
        <button 
          onClick={stakingData.handleCompleteUnstake}
          disabled={stakingData.isUnstakeLoading}
          className="w-full bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                           text-green-400 hover:text-green-300 py-2.5 sm:py-3 rounded-lg font-mono font-medium 
                           transition-all duration-300 matrix-button matrix-glow disabled:opacity-50 mt-3 text-sm sm:text-base">
          {'>'} {stakingData.isUnstakeLoading ? 'WITHDRAWING...' : 'WITHDRAW()'}
        </button>
      )}
    </div>
  );
}

