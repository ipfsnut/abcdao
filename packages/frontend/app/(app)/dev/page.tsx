'use client';

import { BackNavigation } from '@/components/back-navigation';
import { ClaimRewardsPanel } from '@/components/claim-rewards';
import { GitHubLinkPanel } from '@/components/github-link';
import { RepositoryManager } from '@/components/repository-manager';
import { ContractAddressesFooter } from '@/components/contract-addresses-footer';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { useMembership } from '@/hooks/useMembership';
import { useState, useEffect } from 'react';

export default function DevPage() {
  const { user } = useFarcaster();
  const membership = useMembership();
  const [activeTab, setActiveTab] = useState<'rewards' | 'github' | 'repositories'>('rewards');

  // Check for GitHub OAuth success on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('github_linked') === 'true') {
      console.log('🎉 GitHub OAuth success detected on dev page');
      const username = urlParams.get('username');
      if (username) {
        console.log(`✅ Welcome GitHub @${username}!`);
      }
      
      // Refresh membership status and switch to GitHub tab
      setTimeout(() => {
        membership.refreshStatus();
        setActiveTab('github');
      }, 500);
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [membership]);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="developer_dashboard()" 
        subtitle="Manage your GitHub integration and claim coding rewards" 
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Developer Status Card */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm mb-8">
          <h2 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
            {'>'} Developer Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
              <h3 className="text-green-600 text-xs font-mono mb-1">Membership</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${membership.isMember ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                <p className="text-sm font-bold text-green-400">
                  {membership.isMember ? 'Active Member' : 'Not a Member'}
                </p>
              </div>
            </div>
            
            <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
              <h3 className="text-green-600 text-xs font-mono mb-1">GitHub</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${membership.hasGithub ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                <p className="text-sm font-bold text-green-400">
                  {membership.hasGithub ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            
            <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
              <h3 className="text-green-600 text-xs font-mono mb-1">Farcaster</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                <p className="text-sm font-bold text-green-400">
                  {user ? `@${user.username}` : 'Not Connected'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {!membership.isMember && (
            <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4 mb-4">
              <h4 className="text-blue-400 font-mono text-sm mb-2">🚀 Get Started</h4>
              <p className="text-green-600 font-mono text-xs mb-3">
                Join ABC DAO to start earning rewards for your commits. Pay 0.002 ETH membership fee to unlock developer features.
              </p>
              <a
                href="/onboarding"
                className="inline-block bg-green-900/50 hover:bg-green-800/60 text-green-400 font-mono px-4 py-2 rounded-lg border border-green-700/50 transition-all duration-300 matrix-button text-sm"
              >
                Join ABC DAO →
              </a>
            </div>
          )}

          {!membership.hasGithub && membership.isMember && (
            <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4">
              <h4 className="text-yellow-400 font-mono text-sm mb-2">⚡ Connect GitHub</h4>
              <p className="text-green-600 font-mono text-xs mb-3">
                Link your GitHub account to start earning $ABC rewards for every commit you make.
              </p>
            </div>
          )}
        </div>

        {/* Community Links Section */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm mb-8">
          <h2 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
            {'>'} Community & Resources
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Discord - Public with VIP sections */}
            <a
              href="https://discord.gg/HK62WQWJ"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-950/20 border border-indigo-900/50 hover:border-indigo-700/70 rounded-lg p-4 transition-all duration-300 matrix-button group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <h3 className="text-indigo-400 font-mono text-sm font-semibold group-hover:text-indigo-300">Discord</h3>
              </div>
              <p className="text-green-600 font-mono text-xs">Developer community chat</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-indigo-500 font-mono text-xs">
                  {membership.isMember ? 'Access VIP areas' : 'Public + VIP areas'}
                </span>
                <span className="text-indigo-400">→</span>
              </div>
            </a>

            {/* Farcaster - Public */}
            <a
              href="https://warpcast.com/abc-dao"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-950/20 border border-purple-900/50 hover:border-purple-700/70 rounded-lg p-4 transition-all duration-300 matrix-button group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="text-purple-400 font-mono text-sm font-semibold group-hover:text-purple-300">Farcaster</h3>
              </div>
              <p className="text-green-600 font-mono text-xs">Follow updates & announcements</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-purple-500 font-mono text-xs">@abc-dao</span>
                <span className="text-purple-400">→</span>
              </div>
            </a>

            {/* Base Explorer - Public */}
            <a
              href="https://basescan.org/address/0x5c0872b790bb73e2b3a9778db6e7704095624b07"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-950/20 border border-blue-900/50 hover:border-blue-700/70 rounded-lg p-4 transition-all duration-300 matrix-button group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2"/>
                  </svg>
                </div>
                <h3 className="text-blue-400 font-mono text-sm font-semibold group-hover:text-blue-300">Base Explorer</h3>
              </div>
              <p className="text-green-600 font-mono text-xs">View $ABC token on-chain</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-blue-500 font-mono text-xs">Basescan</span>
                <span className="text-blue-400">→</span>
              </div>
            </a>

            {/* GitHub - Public */}
            <a
              href="https://github.com/abc-dao"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-950/20 border border-gray-700/50 hover:border-gray-500/70 rounded-lg p-4 transition-all duration-300 matrix-button group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-gray-300 font-mono text-sm font-semibold group-hover:text-white">GitHub</h3>
              </div>
              <p className="text-green-600 font-mono text-xs">Open source repositories</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-400 font-mono text-xs">abc-dao</span>
                <span className="text-gray-300">→</span>
              </div>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-green-950/10 border border-green-900/30 p-1 rounded-lg font-mono mb-6 max-w-lg">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] ${
              activeTab === 'rewards' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./rewards
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] ${
              activeTab === 'github' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./github
          </button>
          <button
            onClick={() => setActiveTab('repositories')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 text-responsive-sm min-h-[44px] ${
              activeTab === 'repositories' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./repos
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'rewards' && (
            <div>
              {membership.isMember ? (
                <ClaimRewardsPanel />
              ) : (
                <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm text-center">
                  <h3 className="text-responsive-lg font-bold mb-3 text-green-400 matrix-glow font-mono">
                    {'>'} Membership Required
                  </h3>
                  <p className="text-green-600 font-mono text-sm mb-4">
                    Join ABC DAO to start earning $ABC rewards for your commits.
                  </p>
                  <a
                    href="/onboarding"
                    className="inline-block bg-green-900/50 hover:bg-green-800/60 text-green-400 font-mono px-6 py-3 rounded-lg border border-green-700/50 transition-all duration-300 matrix-button"
                  >
                    Join ABC DAO →
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'github' && (
            <div>
              <GitHubLinkPanel />
            </div>
          )}

          {activeTab === 'repositories' && (
            <div>
              {membership.hasGithub ? (
                <RepositoryManager />
              ) : (
                <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm text-center">
                  <h3 className="text-responsive-lg font-bold mb-3 text-green-400 matrix-glow font-mono">
                    {'>'} GitHub Required
                  </h3>
                  <p className="text-green-600 font-mono text-sm mb-4">
                    Connect your GitHub account to manage repository integrations.
                  </p>
                  <button
                    onClick={() => setActiveTab('github')}
                    className="bg-green-900/50 hover:bg-green-800/60 text-green-400 font-mono px-6 py-3 rounded-lg border border-green-700/50 transition-all duration-300 matrix-button"
                  >
                    Connect GitHub →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ContractAddressesFooter />
    </div>
  );
}