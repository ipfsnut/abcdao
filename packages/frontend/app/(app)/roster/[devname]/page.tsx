'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useParams } from 'next/navigation';

interface DeveloperProfile {
  id: string;
  profile: {
    farcasterUsername: string;
    githubUsername: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
  };
  stats: {
    commits: number;
    totalRewards: string;
    lastCommitAt: string;
    streakDays: number;
  };
  meta: {
    isActive: boolean;
    joinedAt: string;
    isPaidMember: boolean;
  };
  recentCommits: Array<{
    hash: string;
    message: string;
    timestamp: string;
    repository: string;
    reward: number;
  }>;
}

export default function DeveloperProfilePage() {
  const params = useParams();
  const devname = params.devname as string;
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch by username (could be GitHub username or Farcaster username)
        const response = await fetch(`/api/users-commits/profile/${devname}`);
        
        if (!response.ok) {
          throw new Error('Developer not found');
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (devname) {
      fetchProfile();
    }
  }, [devname]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
      return 'Recently';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatReward = (reward: string | number) => {
    const num = typeof reward === 'string' ? parseFloat(reward) : reward;
    return (num || 0).toFixed(2);
  };

  const formatCommitMessage = (message: string) => {
    return message.length > 60 ? `${message.substring(0, 60)}...` : message;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mb-4"></div>
          <p className="text-green-600 font-mono">Loading developer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm">
          <div className="px-4 py-3">
            <div className="flex items-center gap-4">
              <Link 
                href="/roster"
                className="text-green-400 hover:text-green-300 transition-colors duration-300"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold matrix-glow">
                {'>'} Developer_Not_Found
              </h1>
            </div>
          </div>
        </header>
        
        <div className="px-4 py-6 text-center">
          <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-400 font-mono mb-4">Error: {error}</p>
            <Link 
              href="/roster"
              className="bg-green-900/50 hover:bg-green-800/60 text-green-400 font-mono px-4 py-2 rounded-lg border border-green-700/50 transition-all duration-300 matrix-button text-sm"
            >
              Back to Roster
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-4">
            <Link 
              href="/roster"
              className="text-green-400 hover:text-green-300 transition-colors duration-300"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-2">
              <img 
                src="/abc-logo.png" 
                alt="ABC Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
              <h1 className="text-lg sm:text-2xl font-bold matrix-glow">
                {'>'} @{profile.profile.farcasterUsername || profile.profile.githubUsername}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Profile Header */}
        <div className="mb-6 bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-950/20 border border-green-900/50 rounded-lg flex items-center justify-center">
                {profile.profile.avatarUrl ? (
                  <img 
                    src={profile.profile.avatarUrl} 
                    alt={profile.profile.displayName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl text-green-400 matrix-glow">
                    {(profile.profile.displayName || profile.profile.githubUsername || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-green-400 matrix-glow font-mono">
                  {profile.profile.displayName || `@${profile.profile.githubUsername}`}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    profile.meta.isActive ? 'bg-green-400 matrix-glow' : 'bg-gray-600'
                  }`}></div>
                  <span className="text-sm text-green-600 font-mono">
                    {profile.meta.isActive ? 'Active Developer' : 'Inactive'}
                  </span>
                  {profile.meta.isPaidMember && (
                    <>
                      <span className="text-green-700">•</span>
                      <span className="text-sm text-green-400 font-mono">Paid Member</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-col gap-2 sm:ml-auto">
              <a
                href={`https://github.com/${profile.profile.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-950/10 border border-green-900/30 rounded-lg px-3 py-2 hover:bg-green-950/20 hover:border-green-700/50 transition-all duration-300 group"
              >
                <span className="text-sm font-mono text-green-400">GitHub</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-green-600 group-hover:text-green-400" />
              </a>
              {profile.profile.farcasterUsername && (
                <a
                  href={`https://warpcast.com/${profile.profile.farcasterUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-950/10 border border-green-900/30 rounded-lg px-3 py-2 hover:bg-green-950/20 hover:border-green-700/50 transition-all duration-300 group"
                >
                  <span className="text-sm font-mono text-green-400">Farcaster</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-green-600 group-hover:text-green-400" />
                </a>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.profile.bio && (
            <div className="mt-4 pt-4 border-t border-green-900/30">
              <p className="text-green-600 font-mono text-sm">{profile.profile.bio}</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-green-600 text-xs font-mono mb-1">Total_Commits</p>
            <p className="text-xl font-bold text-green-400 matrix-glow">{profile.stats.commits}</p>
          </div>
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-green-600 text-xs font-mono mb-1">Total_Rewards</p>
            <p className="text-xl font-bold text-green-400 matrix-glow">{formatReward(profile.stats.totalRewards)}</p>
            <p className="text-green-700 text-xs font-mono">$ABC</p>
          </div>
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-green-600 text-xs font-mono mb-1">Streak_Days</p>
            <p className="text-xl font-bold text-green-400 matrix-glow">{profile.stats.streakDays || 0}</p>
          </div>
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-green-600 text-xs font-mono mb-1">Member_Since</p>
            <p className="text-lg font-bold text-green-400 matrix-glow">{formatDate(profile.meta.joinedAt)}</p>
          </div>
        </div>

        {/* Recent Commits */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
            {'>'} recent_commits.list()
          </h3>
          
          {profile.recentCommits && profile.recentCommits.length > 0 ? (
            <div className="space-y-3">
              {profile.recentCommits.slice(0, 10).map((commit, index) => (
                <div
                  key={commit.hash}
                  className="bg-green-950/10 border border-green-900/30 rounded-lg p-3 hover:bg-green-950/20 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-green-400 font-mono text-sm font-medium">
                        {formatCommitMessage(commit.message)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-green-600 font-mono">
                        <span>{commit.repository}</span>
                        <span>•</span>
                        <span>{formatDate(commit.timestamp)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-400 matrix-glow font-mono">
                        +{commit.reward.toLocaleString()} $ABC
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-green-600 font-mono">No recent commits found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}