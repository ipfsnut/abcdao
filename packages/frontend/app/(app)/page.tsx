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
import { useState, useEffect } from 'react';
import { useStakingWithPrice } from '@/hooks/useStakingWithPrice';
import { useTreasurySystematic } from '@/hooks/useTreasurySystematic';
import { useUsersCommitsStatsSystematic } from '@/hooks/useUsersCommitsSystematic';
import { useMembership } from '@/hooks/useMembership';
import { Toaster } from 'sonner';
import { StatsSkeleton, TabContentSkeleton } from '@/components/skeleton-loader';
import { CollapsibleStatCard, TreasuryRewardsCard } from '@/components/collapsible-stat-card';
import { EthRewardsHistory } from '@/components/eth-rewards-history';
import { ABCPriceWidget } from '@/components/abc-price-widget';
import { CollapsibleSection } from '@/components/collapsible-section';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { isInMiniApp } = useFarcaster();
  const { isConnected, address } = useAccount();
  const membership = useMembership();
  
  // Refresh membership status when wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      // Small delay to ensure wallet connection is fully established
      setTimeout(() => {
        membership.refreshStatus();
      }, 1000);
    }
  }, [isConnected, address, membership.refreshStatus]);
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'dev' | 'proposals' | 'chat' | 'swap' | 'join' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
              <div className="flex flex-col items-center text-center mb-3">
                <div className="mb-2">
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
                {/* Status indicators for miniapp */}
                <div className="flex items-center justify-center gap-3 mb-2">
                  {/* Wallet Status */}
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                    <p className="text-xs font-mono text-green-600">Wallet</p>
                  </div>
                  
                  {/* GitHub Status */}
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      membership.hasGithub ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                    <p className="text-xs font-mono text-green-600">GitHub</p>
                  </div>
                  
                  {/* Membership Status */}
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${membership.isMember ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <p className="text-xs font-mono text-green-600">Member</p>
                  </div>
                </div>
                <div className="flex justify-center">
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
                {/* Status indicators - better responsive behavior */}
                <div className="flex flex-col items-start gap-1 min-w-0 flex-shrink-0">
                  {/* Compact status dots for mobile, full labels for larger screens */}
                  <div className="flex items-center gap-2">
                    {/* GitHub Status */}
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                        membership.hasGithub ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                      <span className="hidden md:inline text-xs font-mono text-green-600">
                        GitHub
                      </span>
                    </div>
                    
                    {/* Membership Status */}
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                        membership.isMember ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                      <span className="hidden md:inline text-xs font-mono text-green-600">
                        Member
                      </span>
                    </div>
                  </div>
                  
                  {/* ABC Balance - only show on larger screens */}
                  {parseFloat(stakingData.tokenBalance) > 0 && (
                    <div className="hidden lg:block text-left">
                      <span className="text-xs font-mono text-green-600">$ABC: </span>
                      <span className="text-xs font-mono text-green-400 font-bold">
                        {(parseFloat(stakingData.tokenBalance) / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Centered Title */}
                <div className="flex-1 text-center px-4">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold matrix-glow">
                    {'>'} ABC_DAO
                  </h1>
                  <p className="hidden sm:block text-xs text-green-600 font-mono">
                    Ship code. Earn rewards.
                  </p>
                </div>
                
                {/* Actions - responsive sizing */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {/* Hamburger menu for small screens */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="sm:hidden p-2 text-green-400 hover:text-green-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  
                  {/* Desktop actions */}
                  <a
                    href="/docs"
                    className="hidden sm:block bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
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

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && !isInMiniApp && (
        <div className="sm:hidden bg-black/95 border-b border-green-900/30 backdrop-blur-sm sticky top-16 z-40">
          <div className="px-4 py-3 space-y-3">
            {/* Status indicators for mobile */}
            <div className="flex items-center justify-center gap-4 py-2 border-b border-green-900/30">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${membership.hasGithub ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-xs font-mono text-green-600">GitHub</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${membership.isMember ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-xs font-mono text-green-600">Member</span>
              </div>
              {parseFloat(stakingData.tokenBalance) > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-green-600">$ABC:</span>
                  <span className="text-xs font-mono text-green-400 font-bold">
                    {(parseFloat(stakingData.tokenBalance) / 1000000).toFixed(1)}M
                  </span>
                </div>
              )}
            </div>
            
            {/* Mobile menu actions */}
            <div className="space-y-2">
              <a
                href="/docs"
                className="block w-full text-center bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                           text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs
                           transition-all duration-200 matrix-button"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Docs
              </a>
              <div className="flex justify-center">
                <FarcasterAuth />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini-app Prompt */}
      <MiniAppPrompt />

      {/* Hero Call-to-Action Section */}
      <div className="bg-gradient-to-r from-green-950/20 to-black/40 border-b border-green-900/30">
        <div className="px-4 py-6 text-center">
          <h2 className="text-responsive-lg font-bold text-green-400 matrix-glow mb-2 font-mono">
            Always Be Coding
          </h2>
          <p className="text-responsive-xs text-green-600 mb-4 font-mono">
            Join a community of developers building FOSS projects, learning together, and creating lasting friendships.
          </p>
        </div>
      </div>


      {/* $ABC Price Widget */}
      <div className="bg-black/80 border-b border-green-900/30 backdrop-blur-sm">
        <div className="px-4 py-6">
          <ABCPriceWidget />
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
                  {membership.isMember ? 'Dev Dashboard →' : 'Join the Community →'}
                </a>
                <a
                  href="/docs"
                  className="bg-black/40 hover:bg-green-950/30 border border-green-900/50 hover:border-green-600 
                           text-green-600 hover:text-green-300 px-6 py-3 rounded-lg font-mono 
                           transition-all duration-300 matrix-button"
                >
                  Docs
                </a>
                <a
                  href="/staking"
                  className="bg-black/40 hover:bg-green-950/30 border border-green-900/50 hover:border-green-600 
                           text-green-600 hover:text-green-300 px-6 py-3 rounded-lg font-mono 
                           transition-all duration-300 matrix-button"
                >
                  🏦 Stake ABC
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
        {/* $ABC Token Container - Collapsible */}
        <CollapsibleSection title="$ABC Token" defaultOpen={false}>
          <div className="space-y-4">
            {/* Token Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-green-950/10 border border-green-900/30 rounded p-3 text-left">
                <p className="text-green-600 font-mono text-xs mb-1">Your Balance</p>
                <p className="text-green-400 font-mono font-bold">{parseFloat(stakingData.tokenBalance).toFixed(0)} $ABC</p>
              </div>
              <div className="bg-green-950/10 border border-green-900/30 rounded p-3 text-left">
                <p className="text-green-600 font-mono text-xs mb-1">Staked</p>
                <p className="text-green-400 font-mono font-bold">{parseFloat(stakingData.stakedAmount).toFixed(0)} $ABC</p>
              </div>
              <div className="bg-green-950/10 border border-green-900/30 rounded p-3 text-left">
                <p className="text-green-600 font-mono text-xs mb-1">Pending ETH</p>
                <p className="text-green-400 font-mono font-bold">{parseFloat(stakingData.pendingRewards).toFixed(4)} ETH</p>
              </div>
            </div>
            
            {/* Token Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/staking')}
                className="p-3 rounded-lg border font-mono font-medium transition-all duration-300 bg-green-950/20 text-green-600 border-green-900/30 hover:text-green-400 hover:border-green-700/50 hover:bg-green-900/30"
              >
                🏦 Stake & Earn
              </button>
              <button
                onClick={() => {
                  if (isInMiniApp) {
                    setActiveTab('swap');
                  } else {
                    window.open('https://app.uniswap.org/swap?outputCurrency=0x8dE276BCE40244eb8Dc2A0a5d83D5dA5aD95F3B6&chain=base', '_blank');
                  }
                }}
                className={`p-3 rounded-lg border font-mono font-medium transition-all duration-300 ${
                  activeTab === 'swap' && isInMiniApp
                    ? 'bg-green-900/50 text-green-400 border-green-700/50 matrix-glow' 
                    : 'bg-green-950/20 text-green-600 border-green-900/30 hover:text-green-400 hover:border-green-700/50 hover:bg-green-900/30'
                }`}
              >
                🔄 Buy/Sell
              </button>
            </div>
          </div>
        </CollapsibleSection>

        {/* DAO Member Container - Collapsible */}
        <CollapsibleSection title="DAO Membership" defaultOpen={false}>
          
          {!membership.isMember ? (
            /* Non-Member: Show appropriate join flow based on connection type */
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
              
              {/* Show appropriate join flow based on connection status */}
              {isConnected ? (
                /* Wallet connected - show wallet-based join flow */
                <WebappAuth />
              ) : (
                /* No wallet connected - show Farcaster flow for miniapp users, wallet prompt for web */
                isInMiniApp ? <GitHubLinkPanel /> : (
                  <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                    <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
                      {'>'} connect_wallet()
                    </h2>
                    <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 sm:p-6 text-center">
                      <p className="text-green-600 font-mono mb-2 text-xs sm:text-sm">{"// Wallet required for web users"}</p>
                      <p className="text-green-400 font-mono text-sm sm:text-base mb-4">Connect your wallet to join</p>
                      <div className="flex justify-center">
                        <ConnectButton />
                      </div>
                    </div>
                  </div>
                )
              )}
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
        </CollapsibleSection>
        
        {/* Content Display Area */}
        <div>
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
      
      {/* Blog Section - Collapsible */}
      <div className="px-4 mt-8">
        <CollapsibleSection title="Latest from Dylan's Blog" defaultOpen={false}>
          <BlogSection />
        </CollapsibleSection>
      </div>
      
      {/* ETH Rewards History - Collapsible */}
      <div className="px-4 mt-8">
        <CollapsibleSection title="ETH Rewards History" defaultOpen={false}>
          <EthRewardsHistory />
        </CollapsibleSection>
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



