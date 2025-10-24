/**
 * Repositories Tab Component
 * 
 * Manage enabled repositories, view scoring, and configure auto-detection
 */

'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  isEnabled: boolean;
  isPrivate: boolean;
  lastCommit: string;
  commits: number;
  totalEarned: string;
  score: number;
  url: string;
}

interface RepositoriesTabProps {
  user: any;
  activeRepos: number;
  onRepoUpdate: () => void;
}

export function RepositoriesTab({ user, activeRepos, onRepoUpdate }: RepositoriesTabProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'stars' | 'commits' | 'earned'>('score');
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    setIsLoading(true);
    
    try {
      if (!user?.wallet_address) {
        setRepositories([]);
        setIsLoading(false);
        return;
      }

      // Fetch real repositories from backend API
      const response = await fetch(`${config.backendUrl}/api/users-commits/repositories/${user.wallet_address}`);
      
      if (response.ok) {
        const data = await response.json();
        const repositoriesData = data.repositories || [];
        
        // Transform backend data to Repository format
        const transformedRepos: Repository[] = repositoriesData.map((repo: any) => ({
          id: repo.id?.toString() || repo.full_name,
          name: repo.name || repo.repo_name || 'Unknown Repository',
          fullName: repo.full_name || repo.repository || repo.name || 'Unknown',
          description: repo.description || 'No description available',
          language: repo.language || repo.primary_language || 'Unknown',
          stars: repo.stargazers_count || repo.stars || 0,
          forks: repo.forks_count || repo.forks || 0,
          isEnabled: repo.is_enabled || repo.enabled || false,
          isPrivate: repo.private || repo.is_private || false,
          lastCommit: repo.updated_at ? new Date(repo.updated_at).toLocaleDateString() : 'Unknown',
          commits: repo.commits_count || repo.total_commits || 0,
          totalEarned: repo.total_earned?.toString() || repo.abc_earned?.toString() || '0',
          score: repo.score || repo.earning_score || 0,
          url: repo.html_url || repo.url || `https://github.com/${repo.full_name || repo.name}`
        }));
        
        setRepositories(transformedRepos);
      } else {
        console.error('Failed to fetch repositories:', response.status);
        setRepositories([]);
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
      setRepositories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRepository = async (repoId: string) => {
    setIsToggling(repoId);
    
    try {
      const repo = repositories.find(r => r.id === repoId);
      if (!repo) return;

      // Toggle repository status via API
      const endpoint = repo.isEnabled ? 'disable' : 'enable';
      const response = await fetch(`${config.backendUrl}/api/users-commits/repositories/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet_address: user?.wallet_address,
          repository: repo.fullName || repo.name,
          repository_id: repoId
        })
      });
      
      if (response.ok) {
        // Update local state
        setRepositories(repos => 
          repos.map(r => 
            r.id === repoId 
              ? { ...r, isEnabled: !r.isEnabled }
              : r
          )
        );
        onRepoUpdate();
      } else {
        console.error('Failed to toggle repository:', response.status);
      }
    } catch (error) {
      console.error('Error toggling repository:', error);
    } finally {
      setIsToggling(null);
    }
  };

  const getFilteredRepositories = () => {
    let filtered = repositories;
    
    // Apply filter
    if (filter === 'enabled') {
      filtered = filtered.filter(repo => repo.isEnabled);
    } else if (filter === 'disabled') {
      filtered = filtered.filter(repo => !repo.isEnabled);
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'stars':
          return b.stars - a.stars;
        case 'commits':
          return b.commits - a.commits;
        case 'earned':
          return parseFloat(b.totalEarned) - parseFloat(a.totalEarned);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const getLanguageColor = (language: string) => {
    const colors = {
      'TypeScript': 'text-blue-400',
      'JavaScript': 'text-yellow-400',
      'Python': 'text-green-400',
      'Dart': 'text-cyan-400',
      'HTML': 'text-orange-400',
      'Go': 'text-cyan-400',
      'Rust': 'text-orange-400'
    };
    return colors[language as keyof typeof colors] || 'text-gray-400';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Low';
  };

  const filteredRepos = getFilteredRepositories();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-green-950/30 rounded mb-2"></div>
                  <div className="h-3 bg-green-950/30 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-green-950/30 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-8 bg-green-950/30 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Repository Management Header */}
      <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-2">📁 Repository Management</h3>
            <p className="text-sm text-green-600 font-mono">
              Enable repositories to start earning ABC tokens for your commits
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {repositories.filter(r => r.isEnabled).length}
            </div>
            <div className="text-sm text-green-600">Active repositories</div>
          </div>
        </div>

        {/* Auto-Detection Toggle */}
        <div className="flex items-center justify-between p-4 bg-black/40 border border-green-900/30 rounded-lg">
          <div>
            <div className="font-semibold text-green-400 font-mono text-sm mb-1">
              🤖 Auto-Detection
            </div>
            <div className="text-xs text-green-600">
              Automatically suggest new repositories based on your activity
            </div>
          </div>
          
          <button
            onClick={() => setAutoDetectionEnabled(!autoDetectionEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              autoDetectionEnabled ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
              autoDetectionEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}></div>
          </button>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All Repos' },
            { value: 'enabled', label: 'Enabled' },
            { value: 'disabled', label: 'Disabled' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as any)}
              className={`px-3 py-1 rounded-lg font-mono text-sm transition-colors ${
                filter === option.value
                  ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                  : 'bg-black/40 text-green-600 border border-green-900/30 hover:text-green-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600 font-mono">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black/40 border border-green-900/50 rounded-lg px-3 py-1 text-green-400 font-mono text-sm focus:outline-none focus:border-green-700/50"
          >
            <option value="score">Score</option>
            <option value="stars">Stars</option>
            <option value="commits">Commits</option>
            <option value="earned">Earned</option>
          </select>
        </div>
      </div>

      {/* Repository List */}
      <div className="space-y-4">
        {filteredRepos.map((repo) => (
          <div
            key={repo.id}
            className={`border rounded-lg p-4 transition-all duration-200 ${
              repo.isEnabled
                ? 'bg-green-950/10 border-green-700/50'
                : 'bg-black/20 border-green-900/30 hover:border-green-700/30'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-green-400 font-mono hover:text-green-300 transition-colors"
                  >
                    {repo.name}
                  </a>
                  
                  <span className={`font-mono text-xs ${getLanguageColor(repo.language)}`}>
                    {repo.language}
                  </span>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-yellow-400">⭐ {repo.stars}</span>
                    <span className="text-blue-400">🍴 {repo.forks}</span>
                  </div>
                  
                  {repo.isPrivate && (
                    <span className="bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded text-xs">
                      Private
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-green-600 mb-3">
                  {repo.description}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-green-700">Score</div>
                    <div className={`font-mono font-bold ${getScoreColor(repo.score)}`}>
                      {repo.score}/100 ({getScoreDescription(repo.score)})
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-green-700">Commits</div>
                    <div className="font-mono text-green-400">{repo.commits}</div>
                  </div>
                  
                  <div>
                    <div className="text-green-700">Earned</div>
                    <div className="font-mono text-green-400">
                      {repo.totalEarned === '0' ? 'None' : `${repo.totalEarned} $ABC`}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-green-700">Last Commit</div>
                    <div className="font-mono text-green-400">{repo.lastCommit}</div>
                  </div>
                </div>
              </div>
              
              <div className="ml-4 flex flex-col items-end gap-2">
                <button
                  onClick={() => handleToggleRepository(repo.id)}
                  disabled={isToggling === repo.id}
                  className={`px-4 py-2 rounded-lg font-mono text-sm font-semibold transition-all duration-200 ${
                    repo.isEnabled
                      ? 'bg-red-900/50 text-red-400 hover:bg-red-800/60'
                      : 'bg-green-900/50 text-green-400 hover:bg-green-800/60'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isToggling === repo.id ? '🔄 ...' : 
                   repo.isEnabled ? '❌ Disable' : '✅ Enable'}
                </button>
                
                {repo.isEnabled && (
                  <div className="text-xs text-green-600 text-center">
                    🟢 Earning active
                  </div>
                )}
              </div>
            </div>
            
            {/* Repository Score Breakdown */}
            {repo.isEnabled && (
              <div className="mt-4 pt-4 border-t border-green-900/30">
                <div className="text-sm font-mono text-green-600 mb-2">Score Breakdown</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-green-700">Activity (40%)</div>
                    <div className="text-green-400">85/100</div>
                  </div>
                  <div>
                    <div className="text-green-700">Quality (30%)</div>
                    <div className="text-green-400">78/100</div>
                  </div>
                  <div>
                    <div className="text-green-700">Popularity (20%)</div>
                    <div className="text-green-400">92/100</div>
                  </div>
                  <div>
                    <div className="text-green-700">Language (10%)</div>
                    <div className="text-green-400">88/100</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredRepos.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📁</div>
          <h5 className="text-lg font-bold text-green-400 mb-2">No Repositories Found</h5>
          <p className="text-sm text-green-600 font-mono">
            {filter === 'enabled' ? 'No repositories are currently enabled for earning' :
             filter === 'disabled' ? 'All repositories are enabled for earning' :
             'No repositories detected in your GitHub account'}
          </p>
        </div>
      )}

      {/* Repository Tips */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">💡 Repository Optimization Tips</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">🎯 Improve Your Score</h5>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-400">📈</span>
                <div className="text-xs">
                  <div className="text-green-400 font-mono">Consistent Activity</div>
                  <div className="text-green-600">Regular commits improve your activity score</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-blue-400">⭐</span>
                <div className="text-xs">
                  <div className="text-blue-400 font-mono">Build Popularity</div>
                  <div className="text-green-600">More stars and forks increase earning potential</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-purple-400">📝</span>
                <div className="text-xs">
                  <div className="text-purple-400 font-mono">Quality Commits</div>
                  <div className="text-green-600">Well-documented commits earn higher rewards</div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">🚀 Maximize Earnings</h5>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-orange-400">🔥</span>
                <div className="text-xs">
                  <div className="text-orange-400 font-mono">High-Value Languages</div>
                  <div className="text-green-600">TypeScript, Rust, Go earn bonus multipliers</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-yellow-400">🌟</span>
                <div className="text-xs">
                  <div className="text-yellow-400 font-mono">Open Source Projects</div>
                  <div className="text-green-600">Public repos with community engagement earn more</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-cyan-400">🔄</span>
                <div className="text-xs">
                  <div className="text-cyan-400 font-mono">Enable All Active Repos</div>
                  <div className="text-green-600">More repositories = more earning opportunities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}