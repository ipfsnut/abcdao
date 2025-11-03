/**
 * Earning Tab Component
 * 
 * Main earning interface with quick setup, repository suggestions, and earning overview
 */

'use client';

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

export function EarningTab({ developerData, user, onDataUpdate }: EarningTabProps) {

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


      {/* Recent Activity Preview */}
      <div className="bg-black/40 border border-green-900/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-green-400">🕒 Recent Activity</h4>
          <Link 
            href="#history"
            className="text-sm font-mono text-green-600 hover:text-green-400 transition-colors"
          >
            View History →
          </Link>
        </div>
        
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📝</div>
          <h5 className="text-lg font-bold text-green-400 mb-2">Start Earning</h5>
          <p className="text-sm text-green-600 font-mono mb-4">
            Enable repositories and start making commits to see your activity here
          </p>
          <div className="text-xs text-green-700">
            Your commit history and rewards will appear once you start coding
          </div>
        </div>
      </div>
    </div>
  );
}