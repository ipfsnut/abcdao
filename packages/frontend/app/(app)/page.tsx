'use client';

import { ContractAddressesFooter } from '@/components/contract-addresses-footer';
import { FarcasterAuth } from '@/components/farcaster-auth';
import { GitHubLinkPanel } from '@/components/github-link';
import { SwapWidget } from '@/components/swap-widget';
import { ClaimRewardsPanel } from '@/components/claim-rewards';
import { RepositoryManager } from '@/components/repository-manager';
import { TokenSupplyMini } from '@/components/token-supply-chart';
import { BlogSection } from '@/components/blog-section';
import { MiniAppPrompt } from '@/components/miniapp-prompt';
import { WebappAuth } from '@/components/webapp-auth';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { useState } from 'react';
import { useStakingWithPrice } from '@/hooks/useStakingWithPrice';
import { useTreasurySystematic } from '@/hooks/useTreasurySystematic';
import { useUsersCommitsStatsSystematic } from '@/hooks/useUsersCommitsSystematic';
import { useMembership } from '@/hooks/useMembership';
import { Toaster } from 'sonner';
import { StatsSkeleton, TabContentSkeleton } from '@/components/skeleton-loader';
import { CollapsibleStatCard, TreasuryRewardsCard } from '@/components/collapsible-stat-card';
import { EthRewardsHistory } from '@/components/eth-rewards-history';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { isInMiniApp } = useFarcaster();
  const { isConnected } = useAccount();
  const membership = useMembership();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stake' | 'dev' | 'proposals' | 'chat' | 'swap' | 'join'>(isInMiniApp ? 'stake' : 'join');
  const stakingData = useStakingWithPrice();
  const treasuryData = useTreasurySystematic();
  const { 
    totalUsers: totalDevelopers,
    totalCommits,
    totalRewardsDistributed: totalRewards,
    isLoading: statsLoading 
  } = useUsersCommitsStatsSystematic();
  
  // Use systematic treasury data - value already calculated
  const formatTotalTreasuryValue = () => {
    if (!treasuryData.totalValueUSD) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(treasuryData.totalValueUSD);
  };

  // Check if core data is still loading
  const isDataLoading = !stakingData.tokenBalance || treasuryData.isLoading || statsLoading;

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Mobile-First Header */}
      <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          {isInMiniApp ? (
            /* Miniapp Header: Centered Layout */
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1" />
                <div className="flex flex-col items-center text-center">
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
                    <p className="text-sm font-bold text-green-400 matrix-glow text-center">{parseFloat(stakingData.tokenBalance).toFixed(0)} $ABC</p>
                  </div>
                  {/* Wallet connection status for miniapp */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                    <p className="text-xs font-mono text-green-600">
                      {isConnected ? 'Wallet Connected' : 'Connecting Wallet...'}
                    </p>
                  </div>
                </div>
                <div className="flex-1 flex justify-end">
                  <a
                    href="/docs"
                    className="bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                               text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs
                               transition-all duration-200 matrix-button"
                  >
                    Docs
                  </a>
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
                  <a
                    href="/docs"
                    className="bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                               text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs
                               transition-all duration-200 matrix-button"
                  >
                    Docs
                  </a>
                  <div className="hidden sm:block">
                    <FarcasterAuth />
                  </div>
                  {/* Only show ConnectButton for web users, miniapp uses auto-connection */}
                  {!isInMiniApp && <ConnectButton />}
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

      {/* Mini-app Prompt */}
      <MiniAppPrompt />

      {/* Hero Call-to-Action Section */}
      <div className="bg-gradient-to-r from-green-950/20 to-black/40 border-b border-green-900/30">
        <div className="px-4 py-6 text-center">
          <h2 className="text-responsive-lg font-bold text-green-400 matrix-glow mb-2 font-mono">
            Always Be Coding Together
          </h2>
          <p className="text-responsive-xs text-green-600 mb-4 font-mono">
            Join a community of developers building FOSS projects, learning together, and creating lasting friendships.
          </p>
        </div>
      </div>

      {/* Smart Header Stats - 2 Expandable Containers */}
      <div className="bg-black/80 border-b border-green-900/30 backdrop-blur-sm">
        <div className="px-4 py-4">
          {isDataLoading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
              
              {/* Treasury & Rewards Container */}
              <CollapsibleStatCard
                title="💰 Treasury & Rewards"
                value={formatTotalTreasuryValue()}
                description="Total treasury value (ETH + $ABC)"
                href="/treasury"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 border border-green-900/30 rounded p-3 text-center">
                      <p className="text-green-600 font-mono text-xs mb-1">$ABC Holdings</p>
                      <p className="text-green-400 font-mono font-bold text-sm">{parseFloat(treasuryData.abcBalance || 0).toFixed(0)} $ABC</p>
                    </div>
                    <div className="bg-black/40 border border-green-900/30 rounded p-3 text-center">
                      <p className="text-green-600 font-mono text-xs mb-1">ETH Distributed</p>
                      <p className="text-green-400 font-mono font-bold text-sm">{parseFloat(stakingData.totalRewardsDistributed).toFixed(3)} ETH</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-mono text-xs">Total Staked:</span>
                      <span className="text-green-400 font-mono text-sm">{parseFloat(stakingData.totalStaked).toFixed(0)} $ABC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-mono text-xs">Staking APY:</span>
                      <span className="text-green-400 font-mono text-sm">Variable</span>
                    </div>
                  </div>

                  <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3">
                    <p className="text-green-600 font-mono text-xs mb-2">Protocol Treasury:</p>
                    <a 
                      href="https://basescan.org/address/0xBE6525b767cA8D38d169C93C8120c0C0957388B8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 font-mono text-xs underline break-all"
                    >
                      0xBE6525b767cA8D38d169C93C8120c0C0957388B8
                    </a>
                    <p className="text-green-700 font-mono text-xs mt-1">abcdao.base.eth</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href="/treasury"
                      className="bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs text-center transition-all duration-300 matrix-button"
                    >
                      {'>'} Treasury
                    </Link>
                    <Link
                      href="/staking"
                      className="bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs text-center transition-all duration-300 matrix-button"
                    >
                      {'>'} Staking
                    </Link>
                    <Link
                      href="/supply"
                      className="bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs text-center transition-all duration-300 matrix-button"
                    >
                      {'>'} Supply
                    </Link>
                  </div>
                </div>
              </CollapsibleStatCard>

              {/* Total Developers Container */}
              <CollapsibleStatCard
                title="👥 DAO Members"
                value={(totalDevelopers || 0).toString()}
                description="Verified contributors"
                href="/roster"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 border border-green-900/30 rounded p-3 text-center">
                      <p className="text-green-600 font-mono text-xs mb-1">Active Members</p>
                      <p className="text-green-400 font-mono font-bold text-sm">{totalDevelopers || 0}</p>
                    </div>
                    <div className="bg-black/40 border border-green-900/30 rounded p-3 text-center">
                      <p className="text-green-600 font-mono text-xs mb-1">Total Commits</p>
                      <p className="text-green-400 font-mono font-bold text-sm">{totalCommits || 0}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-mono text-xs">Rewards Paid:</span>
                      <span className="text-green-400 font-mono text-sm">{totalRewards || 0} $ABC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-mono text-xs">Membership Fee:</span>
                      <span className="text-green-400 font-mono text-sm">0.002 ETH</span>
                    </div>
                  </div>
                  
                  {!membership.isMember ? (
                    <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
                      <p className="text-green-400 font-mono text-xs mb-2 text-center">💎 Join the DAO</p>
                      <p className="text-green-600 font-mono text-xs mb-2 text-center">Get access to dev tools, rewards, and community</p>
                      <Link
                        href="/dev"
                        className="block bg-green-900/50 hover:bg-green-800/60 text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs text-center transition-all duration-300 matrix-button"
                      >
                        Join for 0.002 ETH →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/roster"
                        className="bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs text-center transition-all duration-300 matrix-button"
                      >
                        {'>'} Roster
                      </Link>
                      <Link
                        href="/dev"
                        className="bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs text-center transition-all duration-300 matrix-button"
                      >
                        {'>'} Dev Tools
                      </Link>
                    </div>
                  )}
                </div>
              </CollapsibleStatCard>

            </div>
          )}
        </div>
      </div>

      {/* Hero Section - Community Builder */}
      <div className="bg-gradient-to-r from-green-950/30 via-black/60 to-green-950/30 border-b border-green-900/20">
        <div className="px-4 py-12 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-8 gap-4 h-full">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="border border-green-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="border-2 border-dashed border-green-600/50 rounded-xl p-8 bg-black/40 backdrop-blur-sm">
              <h2 className="text-3xl md:text-4xl font-bold text-green-400 matrix-glow mb-4 font-mono">
                🤝 Build. Learn. Belong.
              </h2>
              <p className="text-green-300 font-mono text-lg mb-6">
                Join ABC DAO — a community-driven dev shop where we build open source projects together and form lasting friendships.
              </p>
              
              {/* Community Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-950/20 border border-green-900/40 rounded-lg p-4">
                  <div className="text-green-400 text-2xl mb-2">🛠️</div>
                  <h3 className="text-green-400 font-mono font-bold mb-2">Build Together</h3>
                  <p className="text-green-600 font-mono text-sm">Collaborate on meaningful FOSS projects that make a difference</p>
                </div>
                <div className="bg-green-950/20 border border-green-900/40 rounded-lg p-4">
                  <div className="text-green-400 text-2xl mb-2">📚</div>
                  <h3 className="text-green-400 font-mono font-bold mb-2">Learn & Grow</h3>
                  <p className="text-green-600 font-mono text-sm">Share knowledge, mentor others, level up your skills</p>
                </div>
                <div className="bg-green-950/20 border border-green-900/40 rounded-lg p-4">
                  <div className="text-green-400 text-2xl mb-2">🎯</div>
                  <h3 className="text-green-400 font-mono font-bold mb-2">Create Impact</h3>
                  <p className="text-green-600 font-mono text-sm">Build public goods and tools that benefit the entire ecosystem</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <a
                  href="/dev"
                  className="bg-green-900/50 hover:bg-green-800/60 border border-green-700/50 hover:border-green-600 
                           text-green-400 hover:text-green-300 px-6 py-3 rounded-lg font-mono font-semibold
                           transition-all duration-300 matrix-button matrix-glow"
                >
                  Join the Community →
                </a>
                <a
                  href="/docs"
                  className="bg-black/40 hover:bg-green-950/30 border border-green-900/50 hover:border-green-600 
                           text-green-600 hover:text-green-300 px-6 py-3 rounded-lg font-mono 
                           transition-all duration-300 matrix-button"
                >
                  Learn More
                </a>
              </div>
              
              {/* Community Benefits */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-mono">
                <div className="text-green-600">
                  👥 Supportive dev community
                </div>
                <div className="text-green-600">
                  🎓 Educational resources & tools
                </div>
                <div className="text-green-600">
                  🏗️ Real-world project experience
                </div>
                <div className="text-green-600">
                  🌟 Recognition for contributions
                </div>
              </div>
              
              {/* Current member count */}
              <div className="mt-8 pt-6 border-t border-green-900/30">
                <p className="text-green-600 font-mono text-xs mb-2">Community Members:</p>
                <div className="flex justify-center items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-mono font-bold">{(totalDevelopers || 0)} developers</span>
                  <span className="text-green-600 font-mono text-sm">building together</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streamlined Two-Container Layout */}
      <div className="px-4 mt-6 space-y-6">
        {/* $ABC Token Container */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-green-400 matrix-glow font-mono">
            {'>'} $ABC Token
          </h2>
          
          <div className="space-y-4">
            {/* Token Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-green-950/10 border border-green-900/30 rounded p-3 text-center">
                <p className="text-green-600 font-mono text-xs mb-1">Your Balance</p>
                <p className="text-green-400 font-mono font-bold">{parseFloat(stakingData.tokenBalance).toFixed(0)} $ABC</p>
              </div>
              <div className="bg-green-950/10 border border-green-900/30 rounded p-3 text-center">
                <p className="text-green-600 font-mono text-xs mb-1">Staked</p>
                <p className="text-green-400 font-mono font-bold">{parseFloat(stakingData.stakedAmount).toFixed(0)} $ABC</p>
              </div>
              <div className="bg-green-950/10 border border-green-900/30 rounded p-3 text-center">
                <p className="text-green-600 font-mono text-xs mb-1">Pending ETH</p>
                <p className="text-green-400 font-mono font-bold">{parseFloat(stakingData.pendingRewards).toFixed(4)} ETH</p>
              </div>
            </div>
            
            {/* Token Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('stake')}
                className={`p-3 rounded-lg border font-mono font-medium transition-all duration-300 ${
                  activeTab === 'stake' 
                    ? 'bg-green-900/50 text-green-400 border-green-700/50 matrix-glow' 
                    : 'bg-green-950/20 text-green-600 border-green-900/30 hover:text-green-400 hover:border-green-700/50'
                }`}
              >
                🏦 Stake & Earn
              </button>
              <button
                onClick={() => setActiveTab('swap')}
                className={`p-3 rounded-lg border font-mono font-medium transition-all duration-300 ${
                  activeTab === 'swap' 
                    ? 'bg-green-900/50 text-green-400 border-green-700/50 matrix-glow' 
                    : 'bg-green-950/20 text-green-600 border-green-900/30 hover:text-green-400 hover:border-green-700/50'
                }`}
              >
                🔄 Buy/Sell
              </button>
            </div>
          </div>
        </div>

        {/* DAO Member Container */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-green-400 matrix-glow font-mono">
            {'>'} DAO Membership
          </h2>
          
          {!membership.isMember ? (
            /* Non-Member: Show membership benefits and join CTA */
            <div className="space-y-4">
              <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                <h3 className="text-green-400 font-mono font-bold mb-3">💎 Join for 0.002 ETH</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-mono mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-600">Create developer profile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-600">Showcase GitHub work</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-600">Earn $ABC from commits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-600">Access exclusive tools</span>
                  </div>
                </div>
              </div>
              <GitHubLinkPanel />
            </div>
          ) : (
            /* Member: Show profile and member tools */
            <div className="space-y-4">
              {membership.hasGithub ? (
                <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                  <h3 className="text-green-400 font-mono font-bold mb-3">👤 Your Profile</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 font-mono text-sm">DAO Member</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 font-mono text-sm">GitHub Connected</span>
                      </div>
                    </div>
                    <div className="bg-black/40 border border-green-900/30 rounded p-3">
                      <p className="text-green-600 font-mono text-xs mb-2">🔗 GitHub Profile</p>
                      <a 
                        href={`https://github.com/${membership.githubUsername || 'your-username'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 font-mono text-sm underline"
                      >
                        @{membership.githubUsername || 'your-username'}
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4 text-center">
                  <p className="text-yellow-400 font-mono text-sm mb-3">
                    🔗 Complete your profile by connecting GitHub
                  </p>
                  <GitHubLinkPanel />
                </div>
              )}
              
              {/* Member tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('proposals')}
                  className={`p-3 rounded-lg border font-mono font-medium transition-all duration-300 ${
                    activeTab === 'proposals' 
                      ? 'bg-green-900/50 text-green-400 border-green-700/50 matrix-glow' 
                      : 'bg-green-950/20 text-green-600 border-green-900/30 hover:text-green-400 hover:border-green-700/50'
                  }`}
                >
                  💰 Claim Rewards
                </button>
                <button
                  onClick={() => setActiveTab('dev')}
                  className={`p-3 rounded-lg border font-mono font-medium transition-all duration-300 ${
                    activeTab === 'dev' 
                      ? 'bg-green-900/50 text-green-400 border-green-700/50 matrix-glow' 
                      : 'bg-green-950/20 text-green-600 border-green-900/30 hover:text-green-400 hover:border-green-700/50'
                  }`}
                >
                  🛠️ Dev Tools
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Content Display Area */}
        <div>
          {activeTab === 'stake' && (
            isDataLoading ? <TabContentSkeleton /> : <StakePanel stakingData={stakingData} />
          )}
          {activeTab === 'swap' && <SwapWidget />}
          {activeTab === 'proposals' && membership.isMember && membership.hasGithub && (
            <ClaimRewardsPanel />
          )}
          {activeTab === 'dev' && membership.isMember && (
            membership.hasGithub ? (
              <RepositoryManager />
            ) : (
              <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4 text-center">
                <p className="text-yellow-400 font-mono text-sm mb-3">
                  🔗 Connect GitHub first to access dev tools
                </p>
                <GitHubLinkPanel />
              </div>
            )
          )}
        </div>
      </div>
      
      {/* Blog Section */}
      <div className="px-4 mt-8">
        <BlogSection />
      </div>
      
      {/* ETH Rewards History - Recent Activity */}
      <div className="px-4 mt-8">
        <EthRewardsHistory />
      </div>
      
      <ContractAddressesFooter />
      <Toaster position="top-center" />
    </div>
  );
}

function StakePanel({ stakingData }: { stakingData: ReturnType<typeof useStakingWithPrice> }) {
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
          <div className="mt-2 space-y-1">
            <p className="text-xs sm:text-sm text-green-600 font-mono">
              Balance: {parseFloat(stakingData.tokenBalance).toFixed(0)} $ABC
            </p>
            <p className="text-xs text-green-700 font-mono">
              ≈ {stakingData.formatUSD(stakingData.tokenBalanceUSD)}
            </p>
          </div>
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
              <div className="text-right">
                <div className="text-green-400">{parseFloat(stakingData.stakedAmount).toFixed(0)} $ABC</div>
                <div className="text-green-700 text-xs">≈ {stakingData.formatUSD(stakingData.stakedValueUSD)}</div>
              </div>
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



