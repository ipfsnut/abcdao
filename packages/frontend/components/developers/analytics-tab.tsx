/**
 * Developer Analytics Tab Component
 * 
 * Displays comprehensive analytics for developer activity including earning trends,
 * performance metrics, repository breakdown, language stats, and achievements
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
    rarity: string;
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

  useEffect(() => {
    loadAnalytics();
  }, [timeframe, developerData]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    
    try {
      if (!user?.wallet_address) {
        // No wallet address available, use fallback data
        const fallbackAnalytics: DeveloperAnalytics = {
          earningTrends: { daily: [], weekly: [], monthly: [] },
          performanceMetrics: {
            averageRewardPerCommit: parseInt(developerData.averageReward) || 0,
            commitFrequency: 0,
            codeQualityScore: 0,
            totalCodeImpact: 0
          },
          repositoryBreakdown: [],
          languageStats: [],
          achievements: []
        };
        setAnalytics(fallbackAnalytics);
        setIsLoading(false);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
      const response = await fetch(`${backendUrl}/api/users-commits/analytics/${user.wallet_address}?timeframe=${timeframe}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User not found - use fallback based on current data
          const fallbackAnalytics: DeveloperAnalytics = {
            earningTrends: { daily: [], weekly: [], monthly: [] },
            performanceMetrics: {
              averageRewardPerCommit: parseInt(developerData.averageReward) || 0,
              commitFrequency: 0,
              codeQualityScore: 50,
              totalCodeImpact: 0
            },
            repositoryBreakdown: [],
            languageStats: [],
            achievements: []
          };
          setAnalytics(fallbackAnalytics);
          setIsLoading(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform API response to match component interface
      const transformedAnalytics: DeveloperAnalytics = {
        earningTrends: {
          daily: data.earningTrends.daily,
          weekly: data.earningTrends.weekly,
          monthly: data.earningTrends.monthly
        },
        performanceMetrics: {
          averageRewardPerCommit: data.performanceMetrics.averageRewardPerCommit,
          commitFrequency: data.performanceMetrics.commitFrequency,
          codeQualityScore: data.performanceMetrics.codeQualityScore,
          totalCodeImpact: data.performanceMetrics.totalCodeImpact
        },
        repositoryBreakdown: data.repositoryBreakdown.map((repo: any) => ({
          repository: repo.repository,
          commits: repo.commits,
          earned: Math.round(repo.earned),
          percentage: Math.round(repo.percentage)
        })),
        languageStats: data.languageStats.map((lang: any) => ({
          language: lang.language,
          commits: lang.commits,
          earned: Math.round(lang.earned),
          avgReward: Math.round(lang.avgReward)
        })),
        achievements: data.achievements.map((achievement: any) => ({
          name: achievement.name,
          description: achievement.description,
          dateEarned: achievement.dateEarned,
          rarity: achievement.rarity
        }))
      };
      
      setAnalytics(transformedAnalytics);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load developer analytics:', error);
      
      // Fallback to basic analytics on error
      const fallbackAnalytics: DeveloperAnalytics = {
        earningTrends: { daily: [], weekly: [], monthly: [] },
        performanceMetrics: {
          averageRewardPerCommit: parseInt(developerData.averageReward) || 0,
          commitFrequency: 0,
          codeQualityScore: 50,
          totalCodeImpact: 0
        },
        repositoryBreakdown: [],
        languageStats: [],
        achievements: []
      };
      setAnalytics(fallbackAnalytics);
      setIsLoading(false);
    }
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
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
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

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 mb-2">📊</div>
        <div className="text-green-400">Loading analytics...</div>
      </div>
    );
  }

  const timeframeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-green-400 font-mono">Developer Analytics</h3>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '90d' | 'all')}
          className="bg-black/40 border border-green-900/50 rounded-lg px-3 py-2 text-green-400 font-mono text-sm focus:outline-none focus:border-green-700/50"
        >
          {timeframeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Performance Metrics */}
      <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4 font-mono">Performance Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{formatNumber(analytics.performanceMetrics.averageRewardPerCommit)}</div>
            <div className="text-xs text-green-600 font-mono">Avg Reward/Commit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{analytics.performanceMetrics.commitFrequency.toFixed(1)}</div>
            <div className="text-xs text-green-600 font-mono">Commits/Day</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{analytics.performanceMetrics.codeQualityScore}%</div>
            <div className="text-xs text-green-600 font-mono">Quality Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{analytics.performanceMetrics.totalCodeImpact}</div>
            <div className="text-xs text-green-600 font-mono">Consistency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{formatNumber(analytics.performanceMetrics.totalCodeImpact)}</div>
            <div className="text-xs text-green-600 font-mono">Lines Changed</div>
          </div>
        </div>
      </div>

      {/* Repository Breakdown */}
      {analytics.repositoryBreakdown.length > 0 && (
        <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
          <h4 className="text-lg font-bold text-green-400 mb-4 font-mono">Repository Breakdown</h4>
          <div className="space-y-3">
            {analytics.repositoryBreakdown.map((repo, index) => (
              <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                <div className="flex-1">
                  <div className="font-mono text-green-400 text-sm">{repo.repository}</div>
                  <div className="text-xs text-green-600">{repo.commits} commits</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-green-400">{formatNumber(repo.earned)} ABC</div>
                  <div className="text-xs text-green-600">{repo.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Stats */}
      {analytics.languageStats.length > 0 && (
        <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
          <h4 className="text-lg font-bold text-green-400 mb-4 font-mono">Language Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.languageStats.map((lang, index) => (
              <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getLanguageColor(lang.language)}`}></div>
                  <div>
                    <div className={`font-mono text-sm ${getLanguageColor(lang.language)}`}>{lang.language}</div>
                    <div className="text-xs text-green-600">{lang.commits} commits</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-green-400">{formatNumber(lang.earned)} ABC</div>
                  <div className="text-xs text-green-600">{formatNumber(lang.avgReward)} avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {analytics.achievements.length > 0 && (
        <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
          <h4 className="text-lg font-bold text-green-400 mb-4 font-mono">Recent Achievements</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.achievements.map((achievement, index) => (
              <div key={index} className="bg-black/20 border border-green-900/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🏆</div>
                  <div className="flex-1">
                    <div className="font-mono text-green-400 text-sm font-bold">{achievement.name}</div>
                    <div className="text-xs text-green-600 mb-2">{achievement.description}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-700">{achievement.dateEarned}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        achievement.rarity === 'legendary' ? 'bg-purple-900/30 text-purple-400' :
                        achievement.rarity === 'epic' ? 'bg-orange-900/30 text-orange-400' :
                        achievement.rarity === 'rare' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-gray-900/30 text-gray-400'
                      }`}>
                        {achievement.rarity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {analytics.repositoryBreakdown.length === 0 && analytics.languageStats.length === 0 && analytics.achievements.length === 0 && (
        <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-bold text-green-400 mb-2">No Analytics Data Yet</h3>
          <p className="text-sm text-green-600 font-mono">
            Start making commits to see your developer analytics and insights
          </p>
        </div>
      )}
    </div>
  );
}