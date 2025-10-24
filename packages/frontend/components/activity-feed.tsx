/**
 * Activity Feed Component
 * 
 * Displays recent user activity including commits, rewards, and social interactions
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'commit' | 'reward' | 'stake' | 'social' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  amount?: string;
  repository?: string;
  hash?: string;
  icon: string;
  link?: string;
}

interface ActivityFeedProps {
  walletAddress: string;
}

export function ActivityFeed({ walletAddress }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadActivityFeed();
  }, [walletAddress, filter]);

  const loadActivityFeed = async () => {
    setIsLoading(true);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
      const response = await fetch(`${backendUrl}/api/users-commits/activity/${walletAddress}?limit=20`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User not found - show empty state
          setActivities([]);
          setIsLoading(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filter activities based on selected filter
      const filteredActivities = filter === 'all' 
        ? data.activities 
        : data.activities.filter((activity: ActivityItem) => activity.type === filter);
      
      setActivities(filteredActivities);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load activity feed:', error);
      setActivities([]);
      setIsLoading(false);
    }
  };

  const getActivityTypeColor = (type: string) => {
    const colorMap = {
      commit: 'text-green-400 bg-green-950/20',
      reward: 'text-blue-400 bg-blue-950/20',
      stake: 'text-purple-400 bg-purple-950/20',
      social: 'text-orange-400 bg-orange-950/20',
      achievement: 'text-yellow-400 bg-yellow-950/20'
    };
    return colorMap[type as keyof typeof colorMap] || 'text-gray-400 bg-gray-950/20';
  };

  const filterOptions = [
    { value: 'all', label: 'All Activity', icon: '📋' },
    { value: 'commit', label: 'Commits', icon: '💻' },
    { value: 'reward', label: 'Rewards', icon: '💰' },
    { value: 'stake', label: 'Staking', icon: '🏦' },
    { value: 'social', label: 'Social', icon: '👥' }
  ];

  if (isLoading) {
    return (
      <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
        <h2 className="text-xl font-bold text-green-400 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-green-950/30 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-green-950/30 rounded mb-2"></div>
                <div className="h-3 bg-green-950/30 rounded w-2/3"></div>
              </div>
              <div className="w-16 h-4 bg-green-950/30 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-green-400">Recent Activity</h2>
        
        {/* Activity Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black/40 border border-green-900/50 rounded-lg px-3 py-1 text-green-400 font-mono text-sm focus:outline-none focus:border-green-700/50"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🌟</div>
          <h3 className="text-lg font-bold text-green-400 mb-2">No Activity Yet</h3>
          <p className="text-sm text-green-600 font-mono mb-4">
            Start by connecting GitHub or staking tokens to see activity here
          </p>
          <Link
            href="/developers"
            className="inline-block bg-green-900/50 text-green-400 px-4 py-2 rounded-lg font-mono text-sm hover:bg-green-800/60 transition-colors"
          >
            Get Started →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 bg-black/20 border border-green-900/20 rounded-lg hover:border-green-700/30 hover:bg-green-950/10 transition-all duration-200"
            >
              {/* Activity Icon */}
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getActivityTypeColor(activity.type)}`}>
                <span className="text-xl">{activity.icon}</span>
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-green-400 font-mono text-sm">
                    {activity.title}
                  </h3>
                  {activity.amount && (
                    <span className="text-green-300 font-mono text-sm font-bold">
                      +{activity.amount}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-green-600 mb-2">
                  {activity.description}
                </p>
                
                <div className="flex items-center gap-3 text-xs font-mono text-green-700">
                  <span>{activity.timestamp}</span>
                  
                  {activity.repository && (
                    <>
                      <span>•</span>
                      <span className="text-green-600">{activity.repository}</span>
                    </>
                  )}
                  
                  {activity.hash && (
                    <>
                      <span>•</span>
                      <span className="text-green-500 font-mono">#{activity.hash}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Link */}
              {activity.link && (
                <Link
                  href={activity.link}
                  className="text-green-600 hover:text-green-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          ))}
          
          {/* Load More */}
          {activities.length >= 5 && (
            <button
              onClick={() => loadActivityFeed()}
              className="w-full py-3 text-center text-green-600 hover:text-green-400 font-mono text-sm hover:bg-green-950/10 rounded-lg transition-colors"
            >
              Load More Activity →
            </button>
          )}
        </div>
      )}

      {/* Activity Summary */}
      <div className="mt-6 pt-4 border-t border-green-900/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">
              {activities.filter(a => a.type === 'commit').length}
            </div>
            <div className="text-xs text-green-600 font-mono">Commits</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">
              {activities.filter(a => a.type === 'reward').length}
            </div>
            <div className="text-xs text-green-600 font-mono">Rewards</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-400">
              {activities.filter(a => a.type === 'stake').length}
            </div>
            <div className="text-xs text-green-600 font-mono">Stakes</div>
          </div>
        </div>
      </div>
    </div>
  );
}