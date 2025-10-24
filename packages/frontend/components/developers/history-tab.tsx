/**
 * History Tab Component
 * 
 * View commit history and reward transactions
 */

'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface CommitRecord {
  id: string;
  hash: string;
  message: string;
  repository: string;
  timestamp: string;
  reward: string;
  tags: string[];
  branch: string;
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
  status: 'rewarded' | 'pending' | 'rejected';
}

interface HistoryTabProps {
  user: any;
  totalCommits: number;
}

export function HistoryTab({ user, totalCommits }: HistoryTabProps) {
  const [commits, setCommits] = useState<CommitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'rewarded' | 'pending' | 'rejected'>('all');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [sortBy, setSortBy] = useState<'date' | 'reward' | 'impact'>('date');

  useEffect(() => {
    loadCommitHistory();
  }, [filter, timeframe, sortBy]);

  const loadCommitHistory = async () => {
    setIsLoading(true);
    
    try {
      if (!user?.wallet_address) {
        setCommits([]);
        setIsLoading(false);
        return;
      }

      // Fetch real commit history from backend API
      const response = await fetch(`${config.backendUrl}/api/users-commits/commits/user/${user.wallet_address}`);
      
      if (response.ok) {
        const data = await response.json();
        let commitsData = data.commits || [];
        
        // Transform backend data to CommitRecord format
        const transformedCommits: CommitRecord[] = commitsData.map((commit: any) => ({
          id: commit.id?.toString() || commit.hash,
          hash: commit.hash || commit.sha || 'unknown',
          message: commit.message || commit.commit_message || 'No message',
          repository: commit.repository || commit.repo_name || 'Unknown repo',
          timestamp: commit.timestamp || commit.commit_date || commit.created_at || 'Unknown date',
          reward: commit.reward?.toString() || commit.abc_earned?.toString() || '0',
          tags: commit.tags || commit.categories || ['general'],
          branch: commit.branch || 'main',
          linesAdded: commit.lines_added || commit.additions || 0,
          linesRemoved: commit.lines_removed || commit.deletions || 0,
          filesChanged: commit.files_changed || commit.changed_files || 0,
          status: commit.status || (parseInt(commit.reward || '0') > 0 ? 'rewarded' : 'pending')
        }));
        
        // Apply status filter
        let filteredCommits = transformedCommits;
        if (filter !== 'all') {
          filteredCommits = filteredCommits.filter(commit => commit.status === filter);
        }
        
        // Apply sorting
        filteredCommits.sort((a, b) => {
          switch (sortBy) {
            case 'reward':
              return parseInt(b.reward) - parseInt(a.reward);
            case 'impact':
              return (b.linesAdded + b.linesRemoved) - (a.linesAdded + a.linesRemoved);
            case 'date':
            default:
              // Parse timestamps if they're strings, otherwise use as-is
              const aTime = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : 0;
              const bTime = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : 0;
              return bTime - aTime;
          }
        });
        
        setCommits(filteredCommits);
      } else {
        console.error('Failed to fetch commit history:', response.status);
        setCommits([]);
      }
    } catch (error) {
      console.error('Error loading commit history:', error);
      setCommits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rewarded':
        return 'text-green-400 bg-green-950/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-950/20';
      case 'rejected':
        return 'text-red-400 bg-red-950/20';
      default:
        return 'text-gray-400 bg-gray-950/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rewarded':
        return '✅';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '❌';
      default:
        return '❓';
    }
  };

  const getTagColor = (tag: string) => {
    const colorMap = {
      'feature': 'text-green-400 bg-green-950/20',
      'bugfix': 'text-red-400 bg-red-950/20',
      'refactor': 'text-blue-400 bg-blue-950/20',
      'documentation': 'text-purple-400 bg-purple-950/20',
      'testing': 'text-yellow-400 bg-yellow-950/20',
      'performance': 'text-orange-400 bg-orange-950/20',
      'security': 'text-cyan-400 bg-cyan-950/20'
    };
    return colorMap[tag as keyof typeof colorMap] || 'text-gray-400 bg-gray-950/20';
  };

  const totalEarned = commits
    .filter(commit => commit.status === 'rewarded')
    .reduce((sum, commit) => sum + parseInt(commit.reward), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-green-950/30 rounded mb-2"></div>
                  <div className="h-3 bg-green-950/30 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-green-950/30 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-6 bg-green-950/30 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* History Overview */}
      <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-green-400 mb-4">📊 Commit History Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-green-600 mb-1">Total Commits</div>
            <div className="text-2xl font-bold text-green-400">{totalCommits}</div>
            <div className="text-xs text-green-700">This period</div>
          </div>
          
          <div className="bg-black/40 border border-blue-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-blue-600 mb-1">Rewarded</div>
            <div className="text-2xl font-bold text-blue-400">
              {commits.filter(c => c.status === 'rewarded').length}
            </div>
            <div className="text-xs text-blue-700">Approved commits</div>
          </div>
          
          <div className="bg-black/40 border border-yellow-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-yellow-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">
              {commits.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-xs text-yellow-700">Under review</div>
          </div>
          
          <div className="bg-black/40 border border-purple-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-purple-600 mb-1">Total Earned</div>
            <div className="text-2xl font-bold text-purple-400">
              {(totalEarned / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-purple-700">$ABC tokens</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All Commits', count: commits.length },
            { value: 'rewarded', label: 'Rewarded', count: commits.filter(c => c.status === 'rewarded').length },
            { value: 'pending', label: 'Pending', count: commits.filter(c => c.status === 'pending').length },
            { value: 'rejected', label: 'Rejected', count: commits.filter(c => c.status === 'rejected').length }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as any)}
              className={`px-3 py-1 rounded-lg font-mono text-sm transition-colors flex items-center gap-2 ${
                filter === option.value
                  ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                  : 'bg-black/40 text-green-600 border border-green-900/30 hover:text-green-400'
              }`}
            >
              {option.label}
              <span className="text-xs bg-black/40 px-1 rounded">{option.count}</span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 font-mono">Period:</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="bg-black/40 border border-green-900/50 rounded-lg px-3 py-1 text-green-400 font-mono text-sm focus:outline-none focus:border-green-700/50"
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 font-mono">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/40 border border-green-900/50 rounded-lg px-3 py-1 text-green-400 font-mono text-sm focus:outline-none focus:border-green-700/50"
            >
              <option value="date">Date</option>
              <option value="reward">Reward</option>
              <option value="impact">Impact</option>
            </select>
          </div>
        </div>
      </div>

      {/* Commit List */}
      <div className="space-y-4">
        {commits.map((commit) => (
          <div
            key={commit.id}
            className={`border rounded-lg p-4 transition-all duration-200 ${
              commit.status === 'rewarded' 
                ? 'bg-green-950/10 border-green-700/50' 
                : commit.status === 'pending'
                ? 'bg-yellow-950/10 border-yellow-700/50'
                : 'bg-red-950/10 border-red-700/50'
            } hover:border-green-700/70`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{getStatusIcon(commit.status)}</span>
                  <span className="font-mono text-sm text-green-400">
                    #{commit.hash}
                  </span>
                  <span className="text-sm text-green-600">
                    {commit.repository}
                  </span>
                  <span className="text-xs text-green-700">
                    {commit.branch}
                  </span>
                </div>
                
                <h4 className="font-semibold text-green-400 mb-2">
                  {commit.message}
                </h4>
                
                <div className="flex items-center gap-4 text-xs text-green-600 mb-3">
                  <span>📅 {commit.timestamp}</span>
                  <span>📁 {commit.filesChanged} files</span>
                  <span className="text-green-400">+{commit.linesAdded}</span>
                  <span className="text-red-400">-{commit.linesRemoved}</span>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {commit.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-1 rounded text-xs font-mono ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="ml-4 text-right">
                <div className={`px-3 py-1 rounded-lg text-sm font-mono ${getStatusColor(commit.status)}`}>
                  {commit.status.toUpperCase()}
                </div>
                
                {commit.status === 'rewarded' && (
                  <div className="mt-2 text-green-400 font-mono font-bold">
                    +{(parseInt(commit.reward) / 1000).toFixed(0)}K $ABC
                  </div>
                )}
                
                {commit.status === 'pending' && (
                  <div className="mt-2 text-xs text-yellow-600">
                    Processing...
                  </div>
                )}
                
                {commit.status === 'rejected' && (
                  <div className="mt-2 text-xs text-red-600">
                    Not eligible
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {commits.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <h5 className="text-lg font-bold text-green-400 mb-2">No Commits Found</h5>
          <p className="text-sm text-green-600 font-mono">
            {filter === 'all' ? 'No commits recorded yet' : `No ${filter} commits found`}
          </p>
        </div>
      )}

      {/* Commit Statistics */}
      <div className="bg-black/40 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">📈 Commit Statistics</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">Activity Breakdown</h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Features:</span>
                <span className="text-green-400 font-mono">
                  {commits.filter(c => c.tags.includes('feature')).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Bug Fixes:</span>
                <span className="text-red-400 font-mono">
                  {commits.filter(c => c.tags.includes('bugfix')).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Documentation:</span>
                <span className="text-purple-400 font-mono">
                  {commits.filter(c => c.tags.includes('documentation')).length}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">Code Impact</h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Lines Added:</span>
                <span className="text-green-400 font-mono">
                  {commits.reduce((sum, c) => sum + c.linesAdded, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Lines Removed:</span>
                <span className="text-red-400 font-mono">
                  {commits.reduce((sum, c) => sum + c.linesRemoved, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Files Changed:</span>
                <span className="text-blue-400 font-mono">
                  {commits.reduce((sum, c) => sum + c.filesChanged, 0)}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">Success Rate</h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Approval Rate:</span>
                <span className="text-green-400 font-mono">
                  {commits.length > 0 ? 
                    Math.round((commits.filter(c => c.status === 'rewarded').length / commits.length) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Avg. Reward:</span>
                <span className="text-purple-400 font-mono">
                  {commits.filter(c => c.status === 'rewarded').length > 0 ?
                    Math.round(totalEarned / commits.filter(c => c.status === 'rewarded').length / 1000) : 0}K $ABC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Total Earned:</span>
                <span className="text-green-400 font-mono">
                  {(totalEarned / 1000000).toFixed(2)}M $ABC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}