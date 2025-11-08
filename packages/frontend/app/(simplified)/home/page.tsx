/**
 * Consolidated Dashboard Page (/home)
 * 
 * Single dashboard that replaces the previous scattered home page.
 * Features:
 * - Wallet-first authentication status
 * - Progressive integration progress
 * - Quick access to all major features  
 * - Personalized based on profile completeness
 * - Real-time activity feed
 * - Key metrics overview
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWalletFirstAuth } from '@/hooks/useWalletFirstAuth';
import { useUsersCommitsStatsSystematic } from '@/hooks/useUsersCommitsSystematic';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Import consolidated components
import { QuickActionsPanel } from '@/components/quick-actions-panel';
import { IntegrationProgressCard } from '@/components/integration-progress-card';
import { ActivityFeed } from '@/components/activity-feed';
import { MetricsDashboard } from '@/components/metrics-dashboard';
import { NextStepsWizard } from '@/components/next-steps-wizard';

// Component for wallet not connected state
function WalletNotConnectedView({ systemStats }: { systemStats: any }) {
  // Format large numbers for display
  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-green-400 matrix-glow mb-6">
            Welcome to ABC DAO
          </h1>
          <p className="text-2xl text-green-300 mb-4">
            The future of developer rewards
          </p>
          <p className="text-lg text-green-600 font-mono mb-8">
            Ship code → Earn crypto → Build community
          </p>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {systemStats.isLoading ? '...' : systemStats.totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 font-mono">Active Developers</div>
          </div>
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {systemStats.isLoading ? '...' : formatLargeNumber(systemStats.totalRewardsDistributed)}
            </div>
            <div className="text-sm text-green-600 font-mono">$ABC Distributed</div>
          </div>
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {systemStats.isLoading ? '...' : formatLargeNumber(systemStats.totalCommits)}
            </div>
            <div className="text-sm text-green-600 font-mono">Commits Rewarded</div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-green-950/30 via-black/60 to-green-950/30 border border-green-900/30 rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-green-400 mb-6">
            Why ABC DAO?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold text-green-400 mb-2">Instant Rewards</h3>
              <p className="text-sm text-green-600">
                Earn 50k-1M $ABC tokens for every commit you make
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="font-semibold text-green-400 mb-2">Auto-Detection</h3>
              <p className="text-sm text-green-600">
                Connect GitHub once, we handle the rest automatically
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">🏦</div>
              <h3 className="font-semibold text-green-400 mb-2">Stake & Earn</h3>
              <p className="text-sm text-green-600">
                Stake $ABC tokens to earn ETH rewards passively
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="font-semibold text-green-400 mb-2">Community</h3>
              <p className="text-sm text-green-600">
                Join a thriving community of builders and creators
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-black/40 border border-green-900/30 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-green-400 mb-4">Ready to Start Earning?</h3>
          <p className="text-green-600 font-mono mb-6">
            Connect your wallet to begin your developer journey
          </p>
          <ConnectButton />
          <p className="text-xs text-green-700 font-mono mt-4">
            No signup required • Your wallet, your identity • Start earning immediately
          </p>
        </div>
      </div>
    </div>
  );
}

// Component for loading state
function LoadingDashboardView() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-green-950/20 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-green-950/20 rounded-xl"></div>
              <div className="h-64 bg-green-950/20 rounded-xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-green-950/20 rounded-xl"></div>
              <div className="h-48 bg-green-950/20 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsolidatedDashboard() {
  // ALL hooks must be called in every render
  const { isConnected } = useAccount();
  const { 
    user, 
    features, 
    nextSteps, 
    isLoading, 
    isAuthenticated,
    walletConnected,
    requiresMembership,
    addGitHubIntegration,
    addDiscordIntegration,
    addFarcasterIntegration 
  } = useWalletFirstAuth();

  // Get real statistics for hero section
  const systemStats = useUsersCommitsStatsSystematic();
  const [farcasterAvatar, setFarcasterAvatar] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');
  
  // Render appropriate view based on state, but keep same component structure
  const currentView = !isConnected ? 'not_connected' : 
                     isLoading ? 'loading' : 
                     'dashboard';

  // Format large numbers for display
  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Fetch Farcaster profile picture
  useEffect(() => {
    const fetchFarcasterAvatar = async () => {
      if (!user?.farcaster_username || !user?.farcaster_connected) return;
      
      setAvatarLoading(true);
      try {
        // Try farcaster.xyz profile URL pattern as primary method
        const fallbackUrl = `https://farcaster.xyz/v2/user/${user.farcaster_username}/avatar`;
        setFarcasterAvatar(fallbackUrl);
      } catch (error) {
        console.log('Failed to fetch Farcaster avatar:', error);
        setFarcasterAvatar(null);
      } finally {
        setAvatarLoading(false);
      }
    };

    if (user && !isLoading) {
      fetchFarcasterAvatar();
    }
  }, [user, isLoading]);

  // Show different content based on authentication status

  return (
    <div className="container mx-auto px-4 py-8">
      {currentView === 'not_connected' && (
        <WalletNotConnectedView systemStats={systemStats} />
      )}
      
      {currentView === 'loading' && (
        <LoadingDashboardView />
      )}
      
      {currentView === 'dashboard' && (
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Profile Section - Different for authenticated vs public */}
              {user ? (
                <>
                  {/* Farcaster Profile Picture */}
                  {user.farcaster_connected && (
                    <div className="flex-shrink-0">
                      {farcasterAvatar ? (
                        <div className="relative w-16 h-16">
                          <Image
                            src={farcasterAvatar}
                            alt={`${user.farcaster_username || 'User'}'s profile`}
                            fill
                            className="rounded-full border-2 border-green-400/50 object-cover"
                            sizes="64px"
                            onError={() => setFarcasterAvatar(null)}
                          />
                        </div>
                      ) : avatarLoading ? (
                        <div className="w-16 h-16 rounded-full border-2 border-green-400/30 bg-green-950/20 animate-pulse flex items-center justify-center">
                          <span className="text-green-600 text-xs">...</span>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-green-400/30 bg-green-950/20 flex items-center justify-center">
                          <span className="text-2xl">🎭</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <h1 className="text-3xl font-bold text-green-400 matrix-glow">
                      Welcome back, {user.display_name || 'Developer'}!
                    </h1>
                    <div className="space-y-1">
                      <p className="text-green-600 font-mono text-sm">
                        {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                        {user.is_member && (
                          <span className="ml-3 px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">
                            MEMBER
                          </span>
                        )}
                      </p>
                      {user.farcaster_connected && user.farcaster_username && (
                        <p className="text-purple-400 font-mono text-sm">
                          🎭 @{user.farcaster_username}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-green-400 matrix-glow">
                    ABC DAO Dashboard
                  </h1>
                  <p className="text-green-600 font-mono text-sm">
                    Public staking data • Connect wallet for personal dashboard
                  </p>
                </div>
              )}
            </div>
            
            {/* Quick Profile Status or Connect Button */}
            {user && isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${user.github_connected ? 'bg-green-400' : 'bg-yellow-400'}`} 
                     title={`GitHub: ${user.github_connected ? 'Connected' : 'Not connected'}`} />
                <div className={`w-3 h-3 rounded-full ${user.discord_connected ? 'bg-blue-400' : 'bg-gray-400'}`}
                     title={`Discord: ${user.discord_connected ? 'Connected' : 'Not connected'}`} />
                <div className={`w-3 h-3 rounded-full ${user.farcaster_connected ? 'bg-purple-400' : 'bg-gray-400'}`}
                     title={`Farcaster: ${user.farcaster_connected ? 'Connected' : 'Not connected'}`} />
              </div>
            ) : walletConnected && requiresMembership ? (
              <div className="text-center">
                <div className="text-sm text-yellow-400 font-mono mb-1">Non-Member Wallet</div>
                <div className="text-xs text-green-600">Purchase membership to unlock features</div>
              </div>
            ) : (
              <ConnectButton />
            )}
          </div>

          {/* Integration Progress Bar - Only for authenticated users */}
          {user && isAuthenticated && (
            <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-green-600">Profile Completion</span>
                <span className="text-sm font-mono text-green-400">
                  {getProfileCompletionPercentage(user)}%
                </span>
              </div>
              <div className="w-full bg-green-950/30 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getProfileCompletionPercentage(user)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Metrics Dashboard - Always visible with different content */}
            <MetricsDashboard user={user} features={features} />
            
            {/* Quick Actions - Only for authenticated users */}
            {user && isAuthenticated && (
              <QuickActionsPanel 
                user={user} 
                features={features}
                onSectionChange={setActiveSection}
              />
            )}
            
            {/* Activity Feed - Only for authenticated users */}
            {user && isAuthenticated && (
              <ActivityFeed walletAddress={user.wallet_address} />
            )}
            
            {/* Information for non-authenticated or non-member users */}
            {(!isAuthenticated) && (
              <div className="bg-gradient-to-r from-green-950/30 via-black/60 to-green-950/30 border border-green-900/30 rounded-xl p-8">
                {walletConnected && requiresMembership ? (
                  // Non-member wallet connected
                  <>
                    <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                      👋 Welcome, Non-Member!
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-bold text-green-400 mb-3">What You Can Do Now</h3>
                        <ul className="space-y-2 text-green-600">
                          <li>• View your ABC token balance</li>
                          <li>• Stake ABC tokens to earn ETH rewards</li>
                          <li>• Access public staking and treasury data</li>
                          <li>• Browse community content</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-blue-400 mb-3">Unlock with Membership</h3>
                        <ul className="space-y-2 text-blue-600">
                          <li>• Earn ABC tokens for code commits</li>
                          <li>• Add repositories to ABC DAO</li>
                          <li>• Access developer tools and APIs</li>
                          <li>• Join exclusive developer community</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-yellow-500 font-mono text-sm mb-4">
                        You can stake ABC tokens now, or purchase membership for full features
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Link href="/staking" className="px-6 py-2 bg-green-900/50 text-green-400 rounded hover:bg-green-900/70 transition-colors">
                          Start Staking
                        </Link>
                        <button className="px-6 py-2 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-900/70 transition-colors">
                          Purchase Membership
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // No wallet connected (anonymous)
                  <>
                    <h2 className="text-2xl font-bold text-green-400 mb-6">
                      🌟 Join ABC DAO
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-bold text-green-400 mb-3">For Developers (Members)</h3>
                        <ul className="space-y-2 text-green-600">
                          <li>• Earn ABC tokens for code commits</li>
                          <li>• Get rewards for building features</li>
                          <li>• Access developer tools and APIs</li>
                          <li>• Join exclusive developer community</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-blue-400 mb-3">For Stakers (Everyone)</h3>
                        <ul className="space-y-2 text-blue-600">
                          <li>• Stake ABC tokens for ETH rewards</li>
                          <li>• Earn passive income from protocol fees</li>
                          <li>• No coding required, just hold and stake</li>
                          <li>• Public staking data available below</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-green-500 font-mono text-sm mb-4">
                        Connect your wallet to get started
                      </p>
                      <ConnectButton />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Next Steps */}
            {nextSteps.length > 0 && (
              <NextStepsWizard 
                steps={nextSteps}
                onGitHubConnect={() => addGitHubIntegration()}
                onDiscordConnect={() => addDiscordIntegration()}
                onFarcasterConnect={() => addFarcasterIntegration({})}
              />
            )}
            
            {/* Integration Progress */}
            <IntegrationProgressCard user={user} features={features} />
            
            {/* Quick Links */}
            <div className="bg-black/40 border border-green-900/30 rounded-xl p-4">
              <h3 className="font-semibold text-green-400 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link 
                  href="/staking" 
                  className="block p-2 rounded hover:bg-green-950/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>🏦</span>
                    <span className="text-sm font-mono text-green-600">Staking</span>
                  </div>
                </Link>
                <Link 
                  href="/developers" 
                  className="block p-2 rounded hover:bg-green-950/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>💻</span>
                    <span className="text-sm font-mono text-green-600">Dev Tools</span>
                  </div>
                </Link>
                <Link 
                  href="/community" 
                  className="block p-2 rounded hover:bg-green-950/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span className="text-sm font-mono text-green-600">Community</span>
                  </div>
                </Link>
                <Link 
                  href="/treasury" 
                  className="block p-2 rounded hover:bg-green-950/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>💰</span>
                    <span className="text-sm font-mono text-green-600">Treasury</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

/**
 * Calculate profile completion percentage based on integrations
 */
function getProfileCompletionPercentage(user: any): number {
  if (!user) return 0;
  
  let completed = 0;
  let total = 4;
  
  // Wallet connected (always true if we're here)
  completed += 1;
  
  // GitHub connected
  if (user.github_connected) completed += 1;
  
  // Membership status
  if (user.is_member || user.membership_status === 'paid') completed += 1;
  
  // Social connections (Discord or Farcaster)
  if (user.discord_connected || user.farcaster_connected) completed += 1;
  
  return Math.round((completed / total) * 100);
}