/**
 * Earning Tab Component
 * 
 * Main earning interface with quick setup, repository suggestions, and earning overview
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EarningTabProps {
  developerData: {
    totalEarned: string;
    pendingRewards: string;
    activeRepos: number;
    totalCommits: number;
    averageReward: string;
    isLoading: boolean;
  };
  user: any;
  onDataUpdate: () => void;
}

interface SuggestedRepo {
  name: string;
  description: string;
  language: string;
  stars: number;
  commits: number;
  lastActivity: string;
  estimatedEarning: string;
}

export function EarningTab({ developerData, user, onDataUpdate }: EarningTabProps) {
  const [suggestedRepos, setSuggestedRepos] = useState<SuggestedRepo[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [isEnablingRepo, setIsEnablingRepo] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestedRepos();
  }, []);

  const loadSuggestedRepos = async () => {
    setIsLoadingSuggestions(true);
    
    // Simulate API call for repository suggestions
    setTimeout(() => {
      const mockSuggestions: SuggestedRepo[] = [
        {
          name: 'my-awesome-project',
          description: 'A React-based web application with TypeScript',
          language: 'TypeScript',
          stars: 45,
          commits: 127,
          lastActivity: '2 days ago',
          estimatedEarning: '95000'
        },
        {
          name: 'python-data-analyzer',
          description: 'Data analysis tool for processing large datasets',
          language: 'Python',
          stars: 23,
          commits: 89,
          lastActivity: '1 week ago',
          estimatedEarning: '75000'
        },
        {
          name: 'blockchain-explorer',
          description: 'Ethereum blockchain explorer and analytics dashboard',
          language: 'JavaScript',
          stars: 67,
          commits: 201,
          lastActivity: '3 days ago',
          estimatedEarning: '120000'
        }
      ];
      
      setSuggestedRepos(mockSuggestions);
      setIsLoadingSuggestions(false);
    }, 800);
  };

  const handleEnableRepo = async (repoName: string) => {
    setIsEnablingRepo(repoName);
    
    // Simulate enabling repository
    setTimeout(() => {
      setIsEnablingRepo(null);
      onDataUpdate();
      // Remove from suggestions after enabling
      setSuggestedRepos(suggestedRepos.filter(repo => repo.name !== repoName));
    }, 2000);
  };

  const getLanguageColor = (language: string) => {
    const colors = {
      'TypeScript': 'text-blue-400',
      'JavaScript': 'text-yellow-400',
      'Python': 'text-green-400',
      'Go': 'text-cyan-400',
      'Rust': 'text-orange-400',
      'Java': 'text-red-400'
    };
    return colors[language as keyof typeof colors] || 'text-gray-400';
  };

  const getLanguageIcon = (language: string) => {
    const icons = {
      'TypeScript': '🔷',
      'JavaScript': '🟨',
      'Python': '🐍',
      'Go': '🐹',
      'Rust': '🦀',
      'Java': '☕'
    };
    return icons[language as keyof typeof icons] || '💻';
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Overview */}
      <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-2">🚀 Earning Overview</h3>
            <p className="text-sm text-green-600 font-mono">
              Your current earning status and quick actions
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {developerData.totalEarned}M $ABC
            </div>
            <div className="text-sm text-green-600">Total earned</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400">📁</span>
              <span className="text-sm font-mono text-green-600">Active Repositories</span>
            </div>
            <div className="text-xl font-bold text-green-400">
              {developerData.activeRepos}
            </div>
            <div className="text-xs text-green-700">Currently earning</div>
          </div>
          
          <div className="bg-black/40 border border-blue-900/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400">💻</span>
              <span className="text-sm font-mono text-blue-600">Rewarded Commits</span>
            </div>
            <div className="text-xl font-bold text-blue-400">
              {developerData.totalCommits}
            </div>
            <div className="text-xs text-blue-700">This month</div>
          </div>
          
          <div className="bg-black/40 border border-purple-900/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-400">⭐</span>
              <span className="text-sm font-mono text-purple-600">Average Reward</span>
            </div>
            <div className="text-xl font-bold text-purple-400">
              {(parseInt(developerData.averageReward) / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-purple-700">$ABC per commit</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">⚡ Quick Actions</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="#repositories"
            onClick={() => {}} // Will be handled by parent component tab switching
            className="p-4 bg-black/40 border border-green-900/30 rounded-lg hover:border-green-700/50 hover:bg-green-950/10 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📁</span>
              <span className="font-semibold text-green-400">Manage Repositories</span>
            </div>
            <p className="text-xs text-green-600 mb-2">
              Enable/disable repositories and view earning potential
            </p>
            <div className="text-xs text-green-500 group-hover:text-green-400 transition-colors">
              View all repositories →
            </div>
          </Link>
          
          <Link 
            href="#history"
            onClick={() => {}} // Will be handled by parent component tab switching
            className="p-4 bg-black/40 border border-blue-900/30 rounded-lg hover:border-blue-700/50 hover:bg-blue-950/10 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <span className="font-semibold text-blue-400">View Commit History</span>
            </div>
            <p className="text-xs text-green-600 mb-2">
              See your recent commits and reward transactions
            </p>
            <div className="text-xs text-blue-500 group-hover:text-blue-400 transition-colors">
              View commit history →
            </div>
          </Link>
        </div>
      </div>

      {/* Repository Suggestions */}
      <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-blue-400">🎯 Suggested Repositories</h4>
          <button
            onClick={loadSuggestedRepos}
            className="text-sm font-mono text-blue-600 hover:text-blue-400 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
        
        <p className="text-sm text-green-600 font-mono mb-6">
          We've detected these active repositories in your GitHub account that could earn you ABC tokens
        </p>

        {isLoadingSuggestions ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse bg-black/20 border border-blue-900/20 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-5 bg-blue-950/30 rounded mb-2"></div>
                    <div className="h-3 bg-blue-950/30 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-blue-950/30 rounded w-1/2"></div>
                  </div>
                  <div className="w-24 h-8 bg-blue-950/30 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : suggestedRepos.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎉</div>
            <h5 className="text-lg font-bold text-green-400 mb-2">All Set!</h5>
            <p className="text-sm text-green-600 font-mono">
              You've enabled all your active repositories for earning
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestedRepos.map((repo) => (
              <div
                key={repo.name}
                className="bg-black/20 border border-blue-900/20 rounded-lg p-4 hover:border-blue-700/30 hover:bg-blue-950/10 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{getLanguageIcon(repo.language)}</span>
                      <h5 className="font-semibold text-blue-400 font-mono">
                        {repo.name}
                      </h5>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`font-mono ${getLanguageColor(repo.language)}`}>
                          {repo.language}
                        </span>
                        <span className="text-yellow-400">⭐ {repo.stars}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-green-600 mb-3">
                      {repo.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-green-700">
                      <span>💻 {repo.commits} commits</span>
                      <span>⏰ {repo.lastActivity}</span>
                      <span className="text-green-400 font-mono">
                        ~{(parseInt(repo.estimatedEarning) / 1000).toFixed(0)}K $ABC potential
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleEnableRepo(repo.name)}
                    disabled={isEnablingRepo === repo.name}
                    className="ml-4 px-4 py-2 bg-blue-900/50 text-blue-400 rounded-lg font-mono text-sm hover:bg-blue-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isEnablingRepo === repo.name ? '🔄 Enabling...' : '✅ Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earning Tips */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">💡 Maximize Your Earnings</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">🎯 Best Practices</h5>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-400">📝</span>
                <div className="text-xs">
                  <div className="text-green-400 font-mono">Meaningful Commits</div>
                  <div className="text-green-600">Write clear commit messages and make substantial changes</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-blue-400">🔄</span>
                <div className="text-xs">
                  <div className="text-blue-400 font-mono">Consistent Activity</div>
                  <div className="text-green-600">Regular commits receive higher reward multipliers</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-purple-400">🏷️</span>
                <div className="text-xs">
                  <div className="text-purple-400 font-mono">Smart Tagging</div>
                  <div className="text-green-600">Use relevant tags and keywords in your commits</div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">⚡ Pro Tips</h5>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-orange-400">🚀</span>
                <div className="text-xs">
                  <div className="text-orange-400 font-mono">High-Value Languages</div>
                  <div className="text-green-600">TypeScript, Rust, and Go commits earn bonus rewards</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-yellow-400">🌟</span>
                <div className="text-xs">
                  <div className="text-yellow-400 font-mono">Open Source Bonus</div>
                  <div className="text-green-600">Public repositories with stars earn additional rewards</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-cyan-400">🔗</span>
                <div className="text-xs">
                  <div className="text-cyan-400 font-mono">Link Issues</div>
                  <div className="text-green-600">Reference GitHub issues in commits for extra points</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="bg-black/40 border border-green-900/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-green-400">🕒 Recent Activity</h4>
          <Link 
            href="#history"
            className="text-sm font-mono text-green-600 hover:text-green-400 transition-colors"
          >
            View all →
          </Link>
        </div>
        
        <div className="space-y-3">
          {[
            { commit: 'feat: add user authentication system', repo: 'my-awesome-project', reward: '85K', time: '2 hours ago' },
            { commit: 'fix: resolve memory leak in data processor', repo: 'python-data-analyzer', reward: '72K', time: '1 day ago' },
            { commit: 'docs: update API documentation', repo: 'blockchain-explorer', reward: '45K', time: '2 days ago' }
          ].map((activity, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-green-950/10 border border-green-900/20 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-mono text-green-400 mb-1">
                  {activity.commit}
                </div>
                <div className="text-xs text-green-600">
                  {activity.repo} • {activity.time}
                </div>
              </div>
              <div className="text-sm font-mono font-bold text-green-300">
                +{activity.reward} $ABC
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}