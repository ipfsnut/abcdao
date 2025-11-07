/**
 * Wallet-First Authentication Component
 * 
 * Primary authentication interface that guides users through:
 * 1. Wallet connection (required)
 * 2. Progressive profile building (GitHub, Discord, Farcaster)
 * 3. Feature unlocking and next steps
 */

'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useWalletFirstAuth } from '@/hooks/useWalletFirstAuth';

export function WalletFirstAuth() {
  // ALL hooks must be called before any conditional logic
  const { isConnected } = useAccount();
  const { 
    user, 
    features, 
    nextSteps, 
    isLoading, 
    isAuthenticated, 
    error,
    addGitHubIntegration,
    addDiscordIntegration,
    addFarcasterIntegration,
    processMembershipPurchase
  } = useWalletFirstAuth();

  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);

  // Conditional rendering AFTER all hooks
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse text-green-400 text-4xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-green-400 matrix-glow mb-2">
            Connecting...
          </h2>
          <p className="text-green-600 font-mono">
            Setting up your wallet-first profile
          </p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-green-400 matrix-glow mb-4">
              Welcome to ABC DAO
            </h1>
            <p className="text-xl text-green-300 mb-2">
              Ship code. Earn rewards. Build the future.
            </p>
            <p className="text-green-600 font-mono">
              Connect your wallet to get started
            </p>
          </div>

          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-6">
              Why Wallet-First?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="font-semibold text-green-400 mb-2">Secure Identity</h3>
                <p className="text-sm text-green-600">
                  Your wallet is your identity - secure, decentralized, and owned by you
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-semibold text-green-400 mb-2">Instant Access</h3>
                <p className="text-sm text-green-600">
                  View tokens, stake, claim rewards - no signup required
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="font-semibold text-green-400 mb-2">Progressive Setup</h3>
                <p className="text-sm text-green-600">
                  Add features as you need them - GitHub, Discord, social
                </p>
              </div>
            </div>

            <div className="mb-6">
              <ConnectButton />
            </div>

            <p className="text-xs text-green-700 font-mono">
              No personal data required • No email signup • Your keys, your identity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 border border-green-900/30 rounded-lg p-6">
              <h3 className="font-semibold text-green-400 mb-3">For Developers</h3>
              <ul className="text-sm text-green-600 space-y-2">
                <li>• Earn 50k-1M $ABC per commit</li>
                <li>• Auto-track your repositories</li>
                <li>• Repository integration tools</li>
                <li>• Developer community access</li>
              </ul>
            </div>
            
            <div className="bg-black/40 border border-green-900/30 rounded-lg p-6">
              <h3 className="font-semibold text-green-400 mb-3">For Everyone</h3>
              <ul className="text-sm text-green-600 space-y-2">
                <li>• Stake $ABC tokens for rewards</li>
                <li>• Community access and networking</li>
                <li>• Social features and recognition</li>
                <li>• Treasury transparency</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Overview */}
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-green-400 matrix-glow">
                  Welcome, {user.display_name || 'Developer'}!
                </h1>
                <p className="text-green-600 font-mono text-sm">
                  {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-mono ${
                  user.is_member 
                    ? 'bg-green-900/50 text-green-400 border border-green-700/50' 
                    : 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50'
                }`}>
                  {user.membership_tier?.toUpperCase() || user.membership_status?.toUpperCase() || 'MEMBER'}
                </div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-3 rounded-lg border ${
                user.github_connected 
                  ? 'bg-green-950/30 border-green-700/50' 
                  : 'bg-gray-950/30 border-gray-700/50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💻</span>
                  <span className="font-mono text-sm">GitHub</span>
                </div>
                <p className="text-xs text-green-600">
                  {user.github_connected ? `@${user.github_username}` : 'Not connected'}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                user.discord_connected 
                  ? 'bg-blue-950/30 border-blue-700/50' 
                  : 'bg-gray-950/30 border-gray-700/50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💬</span>
                  <span className="font-mono text-sm">Discord</span>
                </div>
                <p className="text-xs text-green-600">
                  {user.discord_connected ? `${user.discord_username}` : 'Not connected'}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                user.farcaster_connected 
                  ? 'bg-purple-950/30 border-purple-700/50' 
                  : 'bg-gray-950/30 border-gray-700/50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🌐</span>
                  <span className="font-mono text-sm">Farcaster</span>
                </div>
                <p className="text-xs text-green-600">
                  {user.farcaster_connected ? `@${user.farcaster_username}` : 'Not connected'}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-green-700/50 bg-green-950/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💰</span>
                  <span className="font-mono text-sm">Wallet</span>
                </div>
                <p className="text-xs text-green-400 font-semibold">Connected</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{user.total_commits}</div>
                <div className="text-xs text-green-600 font-mono">Commits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {(user.total_earned_tokens / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-green-600 font-mono">$ABC Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {(user.total_staked_tokens / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-green-600 font-mono">$ABC Staked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {Object.values(features || {}).filter(Boolean).length}
                </div>
                <div className="text-xs text-green-600 font-mono">Features</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          {nextSteps.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-green-400 mb-4">
                Recommended Next Steps
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nextSteps.map((step) => (
                  <div 
                    key={step.action}
                    className={`p-6 rounded-lg border transition-all duration-200 hover:border-green-700/50 cursor-pointer ${
                      step.priority === 'high' 
                        ? 'bg-green-950/20 border-green-900/50' 
                        : 'bg-black/40 border-green-900/30'
                    }`}
                    onClick={() => handleNextStepAction(step.action)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-green-400">{step.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-mono ${
                        step.priority === 'high' 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-gray-900/50 text-gray-400'
                      }`}>
                        {step.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-green-600 mb-3">{step.description}</p>
                    
                    <ul className="space-y-1">
                      {step.benefits.map((benefit, index) => (
                        <li key={index} className="text-xs text-green-700 font-mono">
                          • {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Features */}
          {features && (
            <div>
              <h2 className="text-xl font-bold text-green-400 mb-4">
                Available Features
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(features).map(([feature, enabled]) => (
                  <div 
                    key={feature}
                    className={`p-3 rounded-lg border text-center ${
                      enabled 
                        ? 'bg-green-950/20 border-green-700/50' 
                        : 'bg-gray-950/20 border-gray-700/50 opacity-50'
                    }`}
                  >
                    <div className="text-sm font-mono capitalize">
                      {feature.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {enabled ? '✓ Available' : '✗ Locked'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle action clicks for next steps
  const handleNextStepAction = (action: string) => {
    switch (action) {
      case 'connect_github':
        setActiveIntegration('github');
        initiateGitHubOAuth();
        break;
      case 'connect_discord':
        setActiveIntegration('discord');
        initiateDiscordOAuth();
        break;
      case 'connect_farcaster':
        setActiveIntegration('farcaster');
        // Handle Farcaster connection
        break;
      case 'upgrade_membership':
        // Handle membership upgrade
        break;
    }
  };

  const initiateGitHubOAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const state = user?.wallet_address;
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email,read:user&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.location.href = authUrl;
  };

  const initiateDiscordOAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/discord/callback`;
    const state = user?.wallet_address;
    
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify&state=${state}`;
    
    window.location.href = authUrl;
  };

  return null;
}