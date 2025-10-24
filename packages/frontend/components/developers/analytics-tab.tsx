/**
 * Analytics Tab Component
 * 
 * Performance metrics and earning trends for developers
 */

'use client';

import { useState, useEffect } from 'react';

interface DeveloperAnalytics {
  earningTrends: {
    daily: { date: string; amount: number }[];
    weekly: { week: string; amount: number }[];
    monthly: { month: string; amount: number }[];
  };
  performanceMetrics: {
    averageRewardPerCommit: number;
    commitFrequency: number;
    codeQualityScore: number;
    consistencyScore: number;
    totalCodeImpact: number;
  };
  repositoryBreakdown: {
    repository: string;
    commits: number;
    earned: number;
    percentage: number;
  }[];
  languageStats: {
    language: string;
    commits: number;
    earned: number;
    avgReward: number;
  }[];
  achievements: {
    name: string;
    description: string;
    dateEarned: string;
    reward: number;
    icon: string;
  }[];
}

interface AnalyticsTabProps {
  developerData: {
    totalEarned: string;
    pendingRewards: string;
    activeRepos: number;
    totalCommits: number;
    averageReward: string;
    isLoading: boolean;
  };
  user: any;
}

export function AnalyticsTab({ developerData, user }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<DeveloperAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [viewMode, setViewMode] = useState<'overview' | 'trends' | 'breakdown'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe, developerData]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    
    // Simulate API call - replace with actual analytics API
    setTimeout(() => {
      const mockAnalytics: DeveloperAnalytics = {
        earningTrends: {
          daily: [
            { date: '2024-01-15', amount: 85000 },
            { date: '2024-01-16', amount: 72000 },
            { date: '2024-01-17', amount: 68000 },
            { date: '2024-01-18', amount: 92000 },
            { date: '2024-01-19', amount: 45000 },
            { date: '2024-01-20', amount: 78000 },
            { date: '2024-01-21', amount: 95000 }
          ],
          weekly: [
            { week: 'Week 1', amount: 425000 },
            { week: 'Week 2', amount: 380000 },
            { week: 'Week 3', amount: 510000 },
            { week: 'Week 4', amount: 445000 }
          ],
          monthly: [
            { month: 'Nov', amount: 1200000 },
            { month: 'Dec', amount: 1450000 },
            { month: 'Jan', amount: 1760000 }
          ]
        },
        performanceMetrics: {
          averageRewardPerCommit: parseInt(developerData.averageReward) || 75000,
          commitFrequency: 3.2, // commits per day
          codeQualityScore: 87,
          consistencyScore: 92,
          totalCodeImpact: 15420 // lines of code
        },
        repositoryBreakdown: [
          { repository: 'blockchain-explorer', commits: 45, earned: 3800000, percentage: 42 },
          { repository: 'my-awesome-project', commits: 38, earned: 2400000, percentage: 32 },
          { repository: 'python-data-analyzer', commits: 29, earned: 1600000, percentage: 18 },
          { repository: 'mobile-app-flutter', commits: 15, earned: 750000, percentage: 8 }
        ],
        languageStats: [
          { language: 'TypeScript', commits: 42, earned: 3200000, avgReward: 76190 },
          { language: 'Python', commits: 35, earned: 2100000, avgReward: 60000 },
          { language: 'JavaScript', commits: 28, earned: 1800000, avgReward: 64286 },
          { language: 'Dart', commits: 22, earned: 1450000, avgReward: 65909 }
        ],
        achievements: [
          {
            name: 'Commit Streak',
            description: '30-day consecutive commit streak',
            dateEarned: '2024-01-20',
            reward: 50000,
            icon: '🔥'
          },
          {
            name: 'Bug Hunter',
            description: 'Fixed 10 critical bugs in one month',
            dateEarned: '2024-01-15',
            reward: 100000,
            icon: '🐛'
          },
          {
            name: 'Documentation Master',
            description: 'Contributed 1000+ lines of documentation',
            dateEarned: '2024-01-10',
            reward: 75000,
            icon: '📚'
          }
        ]
      };
      
      setAnalytics(mockAnalytics);
      setIsLoading(false);
    }, 1000);
  };

  const getLanguageColor = (language: string) => {
    const colors = {
      'TypeScript': 'text-blue-400',
      'JavaScript': 'text-yellow-400',
      'Python': 'text-green-400',
      'Dart': 'text-cyan-400',
      'Go': 'text-cyan-400',
      'Rust': 'text-orange-400'
    };
    return colors[language as keyof typeof colors] || 'text-gray-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
              <div className="h-6 bg-green-950/30 rounded mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                {Array(3).fill(0).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 bg-green-950/30 rounded"></div>
                    <div className="h-8 bg-green-950/30 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-2">📊 Developer Analytics</h3>
            <p className="text-sm text-green-600 font-mono">
              Insights into your coding performance and earning patterns
            </p>
          </div>
          
          <div className="flex gap-2">
            {[
              { value: '7d', label: '7D' },
              { value: '30d', label: '30D' },
              { value: '90d', label: '90D' },
              { value: 'all', label: 'All' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value as any)}
                className={`px-3 py-1 rounded-lg font-mono text-sm transition-colors ${
                  timeframe === option.value
                    ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                    : 'bg-black/40 text-green-600 border border-green-900/30 hover:text-green-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex gap-2">
          {[
            { value: 'overview', label: 'Overview', icon: '📋' },
            { value: 'trends', label: 'Trends', icon: '📈' },
            { value: 'breakdown', label: 'Breakdown', icon: '🔍' }
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value as any)}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors flex items-center gap-2 ${
                viewMode === mode.value
                  ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                  : 'bg-black/40 text-green-600 border border-green-900/30 hover:text-green-400'
              }`}
            >
              <span>{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-green-400 mb-4">🎯 Performance Metrics</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-green-600 mb-1">Code Quality</div>
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {analytics.performanceMetrics.codeQualityScore}/100
                </div>
                <div className="w-full bg-green-950/30 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analytics.performanceMetrics.codeQualityScore}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-black/40 border border-blue-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-blue-600 mb-1">Consistency</div>
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  {analytics.performanceMetrics.consistencyScore}/100
                </div>
                <div className="w-full bg-blue-950/30 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analytics.performanceMetrics.consistencyScore}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-black/40 border border-purple-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-purple-600 mb-1">Commit Frequency</div>
                <div className="text-2xl font-bold text-purple-400">
                  {analytics.performanceMetrics.commitFrequency}
                </div>
                <div className="text-xs text-purple-700">commits/day</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
              <div className="text-sm font-mono text-green-600 mb-1">Avg. Reward</div>
              <div className="text-xl font-bold text-green-400">
                {formatNumber(analytics.performanceMetrics.averageRewardPerCommit)}
              </div>
              <div className="text-xs text-green-700">$ABC per commit</div>
            </div>
            
            <div className="bg-black/40 border border-blue-900/30 rounded-lg p-4">
              <div className="text-sm font-mono text-blue-600 mb-1">Code Impact</div>
              <div className="text-xl font-bold text-blue-400">
                {formatNumber(analytics.performanceMetrics.totalCodeImpact)}
              </div>
              <div className="text-xs text-blue-700">lines of code</div>
            </div>
            
            <div className="bg-black/40 border border-yellow-900/30 rounded-lg p-4">
              <div className="text-sm font-mono text-yellow-600 mb-1">Active Repos</div>
              <div className="text-xl font-bold text-yellow-400">
                {developerData.activeRepos}
              </div>
              <div className="text-xs text-yellow-700">repositories</div>
            </div>
            
            <div className="bg-black/40 border border-purple-900/30 rounded-lg p-4">
              <div className="text-sm font-mono text-purple-600 mb-1">Total Commits</div>
              <div className="text-xl font-bold text-purple-400">
                {developerData.totalCommits}
              </div>
              <div className="text-xs text-purple-700">this period</div>
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-purple-400 mb-4">🏆 Recent Achievements</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.achievements.map((achievement, i) => (
                <div key={i} className="bg-black/40 border border-purple-900/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <div className="font-semibold text-purple-400 font-mono text-sm">
                        {achievement.name}
                      </div>
                      <div className="text-xs text-green-600">{achievement.dateEarned}</div>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mb-2">
                    {achievement.description}
                  </p>
                  <div className="text-sm font-mono font-bold text-green-400">
                    +{formatNumber(achievement.reward)} $ABC
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trends Mode */}
      {viewMode === 'trends' && (
        <div className="space-y-6">
          {/* Earning Trends */}
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-blue-400 mb-4">📈 Earning Trends</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-mono text-blue-600 mb-3">Daily Earnings (Last 7 Days)</h5>
                <div className="space-y-2">
                  {analytics.earningTrends.daily.map((day, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-green-600">{day.date.split('-').slice(1).join('/')}</span>
                      <span className="font-mono text-blue-400">{formatNumber(day.amount)} $ABC</span>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-blue-950/30 rounded-full h-1">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-blue-400 h-1 rounded-full"
                            style={{ width: `${(day.amount / 100000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-mono text-blue-600 mb-3">Weekly Performance</h5>
                <div className="space-y-2">
                  {analytics.earningTrends.weekly.map((week, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-green-600">{week.week}</span>
                      <span className="font-mono text-blue-400">{formatNumber(week.amount)} $ABC</span>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-blue-950/30 rounded-full h-1">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-blue-400 h-1 rounded-full"
                            style={{ width: `${(week.amount / 600000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Trends */}
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-green-400 mb-4">📊 Performance Trends</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-mono text-green-600 mb-3">Improvement Areas</h5>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">📈</span>
                    <div className="text-xs">
                      <div className="text-green-400 font-mono">Commit Quality Up 15%</div>
                      <div className="text-green-600">Better documentation and testing</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400">⚡</span>
                    <div className="text-xs">
                      <div className="text-blue-400 font-mono">Consistency Improved</div>
                      <div className="text-green-600">More regular commit patterns</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-purple-400">🎯</span>
                    <div className="text-xs">
                      <div className="text-purple-400 font-mono">Higher Impact Commits</div>
                      <div className="text-green-600">Focus on meaningful changes</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-mono text-green-600 mb-3">Next Goals</h5>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400">🎯</span>
                    <div className="text-xs">
                      <div className="text-yellow-400 font-mono">100K+ Avg Reward</div>
                      <div className="text-green-600">Target: Higher complexity commits</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400">🔥</span>
                    <div className="text-xs">
                      <div className="text-orange-400 font-mono">60-Day Streak</div>
                      <div className="text-green-600">Current: 30 days</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400">⭐</span>
                    <div className="text-xs">
                      <div className="text-cyan-400 font-mono">5M Total Earned</div>
                      <div className="text-green-600">Progress: {((parseFloat(developerData.totalEarned) / 5) * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Mode */}
      {viewMode === 'breakdown' && (
        <div className="space-y-6">
          {/* Repository Breakdown */}
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-green-400 mb-4">📁 Repository Breakdown</h4>
            
            <div className="space-y-3">
              {analytics.repositoryBreakdown.map((repo, i) => (
                <div key={i} className="bg-black/40 border border-green-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-green-400">{repo.repository}</span>
                    <span className="text-sm font-mono text-green-300">
                      {formatNumber(repo.earned)} $ABC
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-green-600 mb-2">
                    <span>{repo.commits} commits</span>
                    <span>{repo.percentage}% of total earnings</span>
                  </div>
                  
                  <div className="w-full bg-green-950/30 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full"
                      style={{ width: `${repo.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language Statistics */}
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-blue-400 mb-4">💻 Language Statistics</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.languageStats.map((lang, i) => (
                <div key={i} className="bg-black/40 border border-blue-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-mono ${getLanguageColor(lang.language)}`}>
                      {lang.language}
                    </span>
                    <span className="text-sm font-mono text-blue-300">
                      {formatNumber(lang.earned)} $ABC
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-green-700">Commits</div>
                      <div className="text-green-400 font-mono">{lang.commits}</div>
                    </div>
                    <div>
                      <div className="text-green-700">Avg Reward</div>
                      <div className="text-green-400 font-mono">{formatNumber(lang.avgReward)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optimization Recommendations */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">🚀 Optimization Recommendations</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">💡 Immediate Actions</h5>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-400">⬆️</span>
                <div className="text-xs">
                  <div className="text-green-400 font-mono">Increase TypeScript Usage</div>
                  <div className="text-green-600">Higher rewards per commit ({formatNumber(analytics.languageStats[0]?.avgReward || 0)} avg)</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-blue-400">📝</span>
                <div className="text-xs">
                  <div className="text-blue-400 font-mono">Improve Commit Messages</div>
                  <div className="text-green-600">Better documentation increases reward multiplier</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-purple-400">🎯</span>
                <div className="text-xs">
                  <div className="text-purple-400 font-mono">Focus on High-Impact Repos</div>
                  <div className="text-green-600">Prioritize {analytics.repositoryBreakdown[0]?.repository} for max earnings</div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">📈 Long-term Strategy</h5>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-orange-400">🔄</span>
                <div className="text-xs">
                  <div className="text-orange-400 font-mono">Maintain Consistency</div>
                  <div className="text-green-600">Daily commits build streak multipliers</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-yellow-400">🌟</span>
                <div className="text-xs">
                  <div className="text-yellow-400 font-mono">Build Repository Popularity</div>
                  <div className="text-green-600">More stars = higher base rewards</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-cyan-400">🚀</span>
                <div className="text-xs">
                  <div className="text-cyan-400 font-mono">Explore New Languages</div>
                  <div className="text-green-600">Rust and Go offer premium rewards</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}