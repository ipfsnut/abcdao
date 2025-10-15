'use client';

import { ContractAddressesFooter } from '@/components/contract-addresses-footer';
import { FarcasterAuth } from '@/components/farcaster-auth';
import { GitHubLinkPanel } from '@/components/github-link';
import { WhitepaperButton } from '@/components/whitepaper-button';
import { RepositoryIntegrationButton } from '@/components/repository-integration-button';
import { SwapWidget } from '@/components/swap-widget';
import { ClaimRewardsPanel } from '@/components/claim-rewards';
import { TokenSupplyMini } from '@/components/token-supply-chart';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { useState } from 'react';
import { useStaking } from '@/hooks/useStaking';
import { useTreasury } from '@/hooks/useTreasury';
import { useStats } from '@/hooks/useStats';
import { useMembership } from '@/hooks/useMembership';
import { Toaster } from 'sonner';
import { StatsSkeleton, TabContentSkeleton, RewardsSkeleton } from '@/components/skeleton-loader';
import { CollapsibleStatCard, TreasuryRewardsCard } from '@/components/collapsible-stat-card';

export default function Home() {
  const { isInMiniApp } = useFarcaster();
  useAccount();
  const membership = useMembership();
  const [activeTab, setActiveTab] = useState<'stake' | 'rewards' | 'proposals' | 'chat' | 'swap'>(isInMiniApp ? 'stake' : 'swap');
  const stakingData = useStaking();
  const treasuryData = useTreasury();
  const { stats, loading: statsLoading } = useStats();
  
  // Check if core data is still loading
  const isDataLoading = !stakingData.tokenBalance || !treasuryData.treasuryBalance || statsLoading;

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
                  <h1 className="text-responsive-xl font-bold matrix-glow">
                    {'>'} ABC_DAO
                  </h1>
                </div>
                <p className="text-responsive-xs text-green-600 font-mono mb-2">
                  Ship code. Earn rewards.
                </p>
                <div className="bg-green-950/20 border border-green-900/50 rounded-lg px-3 py-2 mb-2">
                  <p className="text-green-600 text-xs font-mono text-center">Your Balance</p>
                  <p className="text-sm font-bold text-green-400 matrix-glow text-center">{parseFloat(stakingData.tokenBalance).toFixed(2)} $ABC</p>
                </div>
                <div className="flex flex-col gap-2">
                  <WhitepaperButton />
                  <RepositoryIntegrationButton />
                </div>
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
                    <h1 className="text-responsive-xl font-bold matrix-glow">
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
                  <RepositoryIntegrationButton />
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

      {/* Responsive Stats Bar - Stacked on small, grid on larger screens */}
      <div className="bg-black/80 border-b border-green-900/30 backdrop-blur-sm">
        <div className="px-4 py-3">
          {isDataLoading ? (
            <StatsSkeleton />
          ) : (
            <>
              {/* Mobile: Collapsible stats cards */}
              <div className="grid grid-cols-1 gap-2 xs:hidden">
                <TreasuryRewardsCard 
                  treasuryBalance={treasuryData.treasuryBalance}
                  totalRewardsDistributed={stakingData.totalRewardsDistributed}
                />
                <CollapsibleStatCard
                  title="Total Staked"
                  value={`${parseFloat(stakingData.totalStaked).toFixed(0)} $ABC`}
                  description="Community staking"
                  href="/staking"
                >
                  <div className="bg-black/40 border border-green-900/30 rounded p-3">
                    <h4 className="text-green-400 font-mono text-xs mb-2">Staking Info</h4>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-green-600">APY:</span>
                        <span className="text-green-400">Variable</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Rewards:</span>
                        <span className="text-green-400">ETH</span>
                      </div>
                    </div>
                  </div>
                </CollapsibleStatCard>
                <CollapsibleStatCard
                  title="Active Developers"
                  value={stats.activeDevelopers.toString()}
                  description="Contributors this month"
                  href="/roster"
                >
                  <div className="bg-black/40 border border-green-900/30 rounded p-3">
                    <h4 className="text-green-400 font-mono text-xs mb-2">Developer Activity</h4>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-green-600">Total Commits:</span>
                        <span className="text-green-400">{stats.totalCommits || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Rewards Paid:</span>
                        <span className="text-green-400">{stats.totalRewards || 0} $ABC</span>
                      </div>
                    </div>
                  </div>
                </CollapsibleStatCard>
              </div>
          
          {/* Larger screens: Collapsible stats grid */}
          <div className="hidden xs:grid gap-3 xs:grid-cols-2 lg:grid-cols-4">
            <TreasuryRewardsCard 
              treasuryBalance={treasuryData.treasuryBalance}
              totalRewardsDistributed={stakingData.totalRewardsDistributed}
            />
            <CollapsibleStatCard
              title="Total Staked"
              value={`${parseFloat(stakingData.totalStaked).toFixed(0)} $ABC`}
              description="Community staking"
              href="/staking"
            >
              <div className="bg-black/40 border border-green-900/30 rounded p-3">
                <h4 className="text-green-400 font-mono text-xs mb-2">Staking Info</h4>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-green-600">APY:</span>
                    <span className="text-green-400">Variable</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Rewards:</span>
                    <span className="text-green-400">ETH</span>
                  </div>
                </div>
              </div>
            </CollapsibleStatCard>
            <CollapsibleStatCard
              title="Active Developers"
              value={stats.activeDevelopers.toString()}
              description="Contributors this month"
              href="/roster"
            >
              <div className="bg-black/40 border border-green-900/30 rounded p-3">
                <h4 className="text-green-400 font-mono text-xs mb-2">Developer Activity</h4>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-green-600">Total Commits:</span>
                    <span className="text-green-400">{stats.totalCommits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Rewards Paid:</span>
                    <span className="text-green-400">{stats.totalRewards || 0} $ABC</span>
                  </div>
                </div>
              </div>
            </CollapsibleStatCard>
            <TokenSupplyMini />
          </div>
          
              {/* Token supply always visible on mobile, integrated into grid */}
              <div className="mt-2 xs:hidden">
                <TokenSupplyMini />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conditional Content Based on Context */}
      <div className="px-4 mt-6">
        {isInMiniApp ? (
          /* Farcaster Miniapp Context: Full DAO Functionality */
          <>
            {/* Mobile-First Tab Navigation */}
            <div className="flex bg-green-950/10 border border-green-900/30 p-1 rounded-lg font-mono overflow-x-auto">
              <button
                onClick={() => setActiveTab('stake')}
                className={`px-4 py-3 sm:px-4 rounded-md font-medium transition-all duration-300 whitespace-nowrap text-responsive-sm min-h-[44px] ${
                  activeTab === 'stake' 
                    ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                    : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                }`}
              >
                ./stake
              </button>
              {/* Show rewards tab only for members */}
              {membership.isMember && (
                <button
                  onClick={() => setActiveTab('rewards')}
                  className={`px-4 py-3 sm:px-4 rounded-md font-medium transition-all duration-300 whitespace-nowrap text-responsive-sm min-h-[44px] ${
                    activeTab === 'rewards' 
                      ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                      : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                  }`}
                >
                  ./rewards
                </button>
              )}
              
              {/* Show join tab only for non-members */}
              {!membership.isMember && (
                <button
                  onClick={() => setActiveTab('proposals')}
                  className={`px-4 py-3 sm:px-4 rounded-md font-medium transition-all duration-300 whitespace-nowrap text-responsive-sm min-h-[44px] ${
                    activeTab === 'proposals' 
                      ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                      : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                  }`}
                >
                  ./join
                </button>
              )}
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-3 sm:px-4 rounded-md font-medium transition-all duration-300 whitespace-nowrap text-responsive-sm min-h-[44px] ${
                  activeTab === 'chat' 
                    ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                    : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                }`}
              >
                ./chat
              </button>
              <button
                onClick={() => setActiveTab('swap')}
                className={`px-4 py-3 sm:px-4 rounded-md font-medium transition-all duration-300 whitespace-nowrap text-responsive-sm min-h-[44px] ${
                  activeTab === 'swap' 
                    ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                    : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                }`}
              >
                ./swap
              </button>
            </div>

            {/* Mobile-Optimized Tab Content */}
            <div className="mt-4">
              {activeTab === 'stake' && (
                isDataLoading ? <TabContentSkeleton /> : <StakePanel stakingData={stakingData} />
              )}
              {activeTab === 'rewards' && membership.isMember && (
                isDataLoading ? <RewardsSkeleton /> : <ClaimRewardsPanel />
              )}
              {activeTab === 'proposals' && !membership.isMember && <GitHubLinkPanel />}
              {activeTab === 'chat' && (
                <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm text-center">
                  <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
                    {'>'} access_chat()
                  </h2>
                  <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4 mb-4">
                    <p className="text-blue-400 font-mono text-sm mb-2">
                      🔒 Token-Gated Chat
                    </p>
                    <p className="text-green-600 font-mono text-xs mb-4">
                      Join the exclusive ABC community chat on Nounspace. $ABC token holders only.
                    </p>
                    <a
                      href="https://www.nounspace.com/t/base/0x5c0872b790bb73e2b3a9778db6e7704095624b07/Profile"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-green-900/50 hover:bg-green-800/60 text-green-400 font-mono px-4 py-2 rounded-lg border border-green-700/50 transition-all duration-300 matrix-button text-sm"
                    >
                      Enter Chat →
                    </a>
                  </div>
                  <p className="text-green-600/70 font-mono text-xs">
                    Hold $ABC tokens to verify access. Connect your wallet on Nounspace.
                  </p>
                </div>
              )}
              {activeTab === 'swap' && <SwapWidget />}
            </div>
          </>
        ) : (
          /* Web Browser Context: Staking and Rewards Only */
          <>
            {/* Web User Tab Navigation */}
            <div className="flex bg-green-950/10 border border-green-900/30 p-1 rounded-lg font-mono max-w-2xl mx-auto">
              <button
                onClick={() => setActiveTab('swap')}
                className={`flex-1 px-3 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] ${
                  activeTab === 'swap' 
                    ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                    : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                }`}
              >
                ./swap
              </button>
              <button
                onClick={() => setActiveTab('stake')}
                className={`flex-1 px-3 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] ${
                  activeTab === 'stake' 
                    ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                    : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                }`}
              >
                ./stake
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className={`flex-1 px-3 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] ${
                  activeTab === 'rewards' 
                    ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                    : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                }`}
              >
                ./rewards
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-3 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] ${
                  activeTab === 'chat' 
                    ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                    : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
                }`}
              >
                ./chat
              </button>
            </div>

            {/* Web User Tab Content */}
            <div className="mt-6">
              {activeTab === 'swap' && <SwapWidget />}
              {activeTab === 'stake' && (
                isDataLoading ? <TabContentSkeleton /> : <StakePanel stakingData={stakingData} />
              )}
              {activeTab === 'rewards' && (
                isDataLoading ? <RewardsSkeleton /> : <ClaimRewardsPanel />
              )}
              {activeTab === 'chat' && (
                <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm text-center">
                  <h2 className="text-responsive-lg font-bold mb-3 text-green-400 matrix-glow font-mono">
                    {'>'} access_chat()
                  </h2>
                  <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4 mb-4">
                    <p className="text-blue-400 font-mono text-sm mb-2">
                      🔒 Token-Gated Chat
                    </p>
                    <p className="text-green-600 font-mono text-xs mb-4">
                      Join the exclusive ABC community chat on Nounspace. $ABC token holders only.
                    </p>
                    <a
                      href="https://www.nounspace.com/t/base/0x5c0872b790bb73e2b3a9778db6e7704095624b07/Profile"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-green-900/50 hover:bg-green-800/60 text-green-400 font-mono px-4 py-2 rounded-lg border border-green-700/50 transition-all duration-300 matrix-button text-sm"
                    >
                      Enter Chat →
                    </a>
                  </div>
                  <p className="text-green-600/70 font-mono text-xs">
                    Hold $ABC tokens to verify access. Connect your wallet on Nounspace.
                  </p>
                </div>
              )}
            </div>
            
            {/* Whitepaper Link */}
            <div className="text-center mt-8">
              <a
                href="/whitepaper"
                className="inline-block bg-green-900/30 hover:bg-green-900/50 border border-green-700/50 hover:border-green-600 
                         text-green-400 hover:text-green-300 px-6 py-3 rounded-lg font-mono
                         transition-all duration-300 matrix-button text-sm"
              >
                📋 Read Whitepaper
              </a>
            </div>
          </>
        )}
      </div>
      
      <ContractAddressesFooter />
      <Toaster position="top-center" />
    </div>
  );
}

function StakePanel({ stakingData }: { stakingData: ReturnType<typeof useStaking> }) {
  const [amount, setAmount] = useState('');
  const [isStaking, setIsStaking] = useState(true);

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h2 className="text-responsive-lg font-bold mb-3 text-green-400 matrix-glow font-mono">
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

        {/* Important Notice for Unstaking */}
        {!isStaking && (
          <div className="bg-yellow-950/20 border border-yellow-900/50 rounded-lg p-3">
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
          <label className="block text-xs sm:text-sm text-green-600 mb-2 font-mono">
            Amount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-black border border-green-900/50 rounded-lg px-4 py-3 text-green-400 font-mono text-sm sm:text-base
                         focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600
                         placeholder:text-green-800 min-h-[44px]"
            />
            <button 
              onClick={() => setAmount(isStaking ? stakingData.tokenBalance : stakingData.stakedAmount)}
              className="bg-green-950/20 border border-green-900/50 hover:border-green-700/50 
                               text-green-400 hover:text-green-300 px-4 py-3 rounded-lg font-mono 
                               transition-all duration-300 matrix-button text-sm sm:text-base min-h-[44px] min-w-[60px]">
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
           stakingData.isUnstakeLoading ? 'STARTING UNBONDING...' :
           stakingData.isApproving ? 'APPROVAL PENDING...' :
           isStaking && stakingData.needsApproval(amount) ? `${'>'} APPROVE $ABC` :
           isStaking ? `${'>'} STAKE $ABC` : `${'>'} START 7-DAY UNBONDING`}
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



