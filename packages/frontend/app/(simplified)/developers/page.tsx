/**
 * Unified Developer Hub Page (/developers)
 * 
 * Consolidates previous developer-related pages into single tabbed interface:
 * - Earning Tab: Repository setup, commit tracking, rewards
 * - Repositories Tab: Manage enabled repos, scoring, auto-detection
 * - History Tab: Commit history, reward transactions
 * - Analytics Tab: Performance metrics, earning trends
 */

'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useWalletFirstAuth } from '@/hooks/useWalletFirstAuth';
import { useUsersCommitsStatsSystematic } from '@/hooks/useUsersCommitsSystematic';
import { useUserStatsFixed } from '@/hooks/useUserStatsFixed';
import { BackNavigation } from '@/components/back-navigation';

// Import tabbed components
import { EarningTab } from '@/components/developers/earning-tab';
import { RepositoriesTab } from '@/components/developers/repositories-tab';
import { HistoryTab } from '@/components/developers/history-tab';
import { AnalyticsTab } from '@/components/developers/analytics-tab';

type TabId = 'earning' | 'repositories' | 'history' | 'analytics';

export default function UnifiedDeveloperHub() {
  const { user, isAuthenticated, features } = useWalletFirstAuth();
  const [activeTab, setActiveTab] = useState<TabId>('earning');
  
  // Use working user stats endpoint for consistency with home page
  const userStats = useUserStatsFixed((user as any)?.farcaster_fid, (user as any)?.wallet_address);
  const systemStats = useUsersCommitsStatsSystematic();
  
  // Get repositories data for active repo count
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  
  const { data: reposData } = useSWR(
    (user as any)?.farcaster_fid ? `${BACKEND_URL}/api/repositories/${(user as any).farcaster_fid}/repositories` : null,
    fetcher
  );
  
  const activeReposCount = reposData?.repositories?.filter((r: any) => r.status === 'active' && r.webhook_configured)?.length || 0;
  
  // Derive developer data from working API endpoint (same as home page)
  const developerData = {
    totalEarned: userStats.totalRewardsEarnedFormatted,
    pendingRewards: '0',
    activeRepos: activeReposCount,
    totalCommits: userStats.totalCommits,
    averageReward: userStats.totalCommits > 0 ? Math.round(userStats.totalRewardsEarned / userStats.totalCommits).toString() : '0',
    isLoading: userStats.isLoading || systemStats.isLoading
  };

  // Average reward calculation now handled by unified hook

  const tabs = [
    {
      id: 'earning' as TabId,
      label: 'Earning',
      icon: '💰',
      description: 'Setup repositories and start earning',
      count: user?.github_connected ? null : '!',
      priority: !user?.github_connected
    },
    {
      id: 'repositories' as TabId,
      label: 'Repositories',
      icon: '📁',
      description: 'Manage your earning repositories',
      count: developerData.activeRepos > 0 ? developerData.activeRepos.toString() : null,
      priority: false
    },
    {
      id: 'history' as TabId,
      label: 'History',
      icon: '📊',
      description: 'View commit and reward history',
      count: developerData.totalCommits > 0 ? developerData.totalCommits.toString() : null,
      priority: false
    },
    {
      id: 'analytics' as TabId,
      label: 'Analytics',
      icon: '📈',
      description: 'Performance metrics and trends',
      count: null,
      priority: false
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation title="Developer Hub" subtitle="Earn ABC tokens for your code contributions" />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="text-4xl mb-6">💻</div>
            <h1 className="text-2xl font-bold text-green-400 matrix-glow mb-4">
              ABC DAO Developer Hub
            </h1>
            <p className="text-green-600 font-mono mb-6">
              Connect your wallet to start earning ABC tokens for your code contributions
            </p>
            
            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">Developer Benefits</h3>
              <ul className="space-y-3 text-sm text-green-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Earn ABC tokens for every commit
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Auto-repository detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Smart reward calculation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Real-time notifications
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.github_connected) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation title="Developer Hub" subtitle="Connect GitHub to start earning" />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔗</div>
              <h1 className="text-3xl font-bold text-green-400 matrix-glow mb-4">
                Connect Your GitHub
              </h1>
              <p className="text-lg text-green-600 font-mono mb-8">
                Link your GitHub account to start earning ABC tokens for your commits
              </p>
            </div>

            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-bold text-green-400 mb-6">How It Works</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-900/50 rounded-lg flex items-center justify-center text-green-400 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-400 mb-2">Connect GitHub</h4>
                    <p className="text-sm text-green-600">
                      Authorize ABC DAO to access your public repositories and commit history
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-900/50 rounded-lg flex items-center justify-center text-green-400 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-400 mb-2">Auto-Detection</h4>
                    <p className="text-sm text-green-600">
                      We automatically find and suggest your most active repositories
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-900/50 rounded-lg flex items-center justify-center text-green-400 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-400 mb-2">Start Earning</h4>
                    <p className="text-sm text-green-600">
                      Earn ABC tokens for every meaningful commit you make
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={() => {
                  // Handle GitHub connection
                  console.log('Connect GitHub');
                }}
                className="bg-green-900/50 text-green-400 px-8 py-4 rounded-xl font-mono font-bold text-lg hover:bg-green-800/60 hover:matrix-glow transition-all duration-200"
              >
                🔗 Connect GitHub Account
              </button>
              
              <p className="text-xs text-green-600 mt-4">
                We only access public repositories and commit metadata
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation title="Developer Hub" subtitle="Earn ABC • Manage Repos • Track Performance" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Developer Overview Header */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-green-600 mb-1">Total Earned</div>
                <div className="text-2xl font-bold text-green-400">
                  {developerData.isLoading ? '...' : `${developerData.totalEarned}M`}
                </div>
                <div className="text-xs text-green-700">$ABC tokens</div>
              </div>
              
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-blue-600 mb-1">Active Repos</div>
                <div className="text-2xl font-bold text-blue-400">
                  {developerData.isLoading ? '...' : developerData.activeRepos}
                </div>
                <div className="text-xs text-blue-700">Earning repositories</div>
              </div>
              
              <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-yellow-600 mb-1">Total Commits</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {developerData.isLoading ? '...' : developerData.totalCommits}
                </div>
                <div className="text-xs text-yellow-700">Rewarded commits</div>
              </div>
              
              <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-purple-600 mb-1">Avg. Reward</div>
                <div className="text-2xl font-bold text-purple-400">
                  {developerData.isLoading ? '...' : `${(parseInt(developerData.averageReward) / 1000).toFixed(0)}K`}
                </div>
                <div className="text-xs text-purple-700">$ABC per commit</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-green-900/30">
              <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 sm:px-6 py-4 font-mono text-sm font-medium transition-all duration-200 min-w-fit whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-green-400 border-b-2 border-green-400 bg-green-950/20'
                        : 'text-green-600 hover:text-green-400 hover:bg-green-950/10'
                    } ${tab.priority ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.count && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          tab.count === '!' 
                            ? 'bg-red-900/50 text-red-400' 
                            : 'bg-green-900/50 text-green-400'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </div>
                    
                    {activeTab === tab.id && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-green-600 to-green-400"></div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Description */}
            <div className="mt-4 text-sm text-green-600 font-mono">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === 'earning' && (
              <EarningTab 
                developerData={developerData}
                user={user}
                onDataUpdate={() => userStats.refreshData()}
              />
            )}
            
            {activeTab === 'repositories' && (
              <RepositoriesTab 
                user={user}
                activeRepos={developerData.activeRepos}
                onRepoUpdate={() => userStats.refreshData()}
              />
            )}
            
            {activeTab === 'history' && (
              <HistoryTab 
                user={user}
                totalCommits={developerData.totalCommits}
              />
            )}
            
            {activeTab === 'analytics' && (
              <AnalyticsTab 
                developerData={developerData}
                user={user}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}