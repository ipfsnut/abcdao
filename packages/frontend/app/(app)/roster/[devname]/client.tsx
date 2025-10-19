'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ArrowTopRightOnSquareIcon, FolderIcon, PlusIcon, CogIcon } from '@heroicons/react/24/outline';
import useProfileOwnership from '@/hooks/useProfileOwnership';

// Simple error boundary to catch any provider issues
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Something went wrong loading the page</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-900/50 hover:bg-green-800/60 text-green-400 px-4 py-2 rounded-lg border border-green-700/50"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

interface DeveloperProfile {
  id: string;
  identifiers: {
    walletAddress: string;
    farcasterFid: number;
    githubUsername: string;
    githubId: string;
  };
  profile: {
    farcasterUsername: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
  };
  stats: {
    totalCommits: number;
    totalRewardsEarned: number;
    lastCommitAt: string;
    currentStreakDays: number;
    longestStreakDays: number;
    firstCommitAt: string;
  };
  membership: {
    status: string;
    paidAt: string;
    amount: number;
    txHash: string;
  };
  meta: {
    isActive: boolean;
    verifiedAt: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface RepositoryData {
  repositories: Array<{
    id: number;
    repository_name: string;
    repository_url: string;
    is_active: boolean;
    added_at: string;
  }>;
  member_slots_used: number;
  member_slots_remaining: number;
  premium_staker: boolean;
  premium_benefits?: string[];
}

function DeveloperProfileClientInner({ devname }: { devname: string }) {
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [repositories, setRepositories] = useState<RepositoryData | null>(null);
  const [userCommits, setUserCommits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'repositories'>('overview');
  const [loading, setLoading] = useState(true);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add ownership detection
  const ownership = useProfileOwnership(devname);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Try to fetch by username (could be GitHub username or Farcaster username)
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
        const response = await fetch(`${backendUrl}/api/users-commits/profile/${devname}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Developer not found');
        }
        
        const data = await response.json();
        setProfile(data);
        
        // Also fetch repository data and user commits if we have a user ID
        if (data.identifiers?.farcasterFid) {
          try {
            const repoController = new AbortController();
            const repoTimeoutId = setTimeout(() => repoController.abort(), 8000);
            
            const repoResponse = await fetch(`${backendUrl}/api/repositories/${data.identifiers.farcasterFid}/repositories`, {
              signal: repoController.signal
            });
            
            clearTimeout(repoTimeoutId);
            
            if (repoResponse.ok) {
              const repoData = await repoResponse.json();
              setRepositories(repoData);
            }
          } catch (repoError) {
            if (repoError instanceof Error && repoError.name !== 'AbortError') {
              console.warn('Failed to fetch repository data:', repoError);
            }
          }
        }
        
        // Fetch user commits for the overview tab
        if (data.id) {
          try {
            setCommitsLoading(true);
            const commitsController = new AbortController();
            const commitsTimeoutId = setTimeout(() => commitsController.abort(), 8000);
            
            const commitsResponse = await fetch(`${backendUrl}/api/users-commits/commits/user/${data.id}?limit=10`, {
              signal: commitsController.signal
            });
            
            clearTimeout(commitsTimeoutId);
            
            if (commitsResponse.ok) {
              const commitsData = await commitsResponse.json();
              setUserCommits(commitsData.commits || []);
            }
          } catch (commitsError) {
            if (commitsError instanceof Error && commitsError.name !== 'AbortError') {
              console.warn('Failed to fetch user commits:', commitsError);
            }
          } finally {
            setCommitsLoading(false);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
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
                {'>'} @{profile.profile.farcasterUsername || profile.identifiers.githubUsername}
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
                    {(profile.profile.displayName || profile.identifiers.githubUsername || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-green-400 matrix-glow font-mono">
                  {profile.profile.displayName || `@${profile.identifiers.githubUsername}`}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    profile.meta.isActive ? 'bg-green-400 matrix-glow' : 'bg-gray-600'
                  }`}></div>
                  <span className="text-sm text-green-600 font-mono">
                    {profile.meta.isActive ? 'Active Developer' : 'Inactive'}
                  </span>
                  {profile.membership.status === 'paid' && (
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
                href={`https://github.com/${profile.identifiers.githubUsername}`}
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

        {/* Social Profile Containers */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* GitHub Profile Container */}
          {profile.identifiers.githubUsername && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-950/20 border border-green-900/50 rounded flex items-center justify-center">
                  <span className="text-xs font-mono text-green-400">GH</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-green-400 font-mono">GitHub Profile</h3>
                  <p className="text-xs text-green-600 font-mono">@{profile.identifiers.githubUsername}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-green-600">Profile:</span>
                  <a href={`https://github.com/${profile.identifiers.githubUsername}`} 
                     target="_blank" rel="noopener noreferrer"
                     className="text-green-400 hover:text-green-300 flex items-center gap-1">
                    View Profile <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Status:</span>
                  <span className="text-green-400">Connected</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Farcaster Profile Container */}
          {profile.profile.farcasterUsername && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-950/20 border border-purple-900/50 rounded flex items-center justify-center">
                  <span className="text-xs font-mono text-purple-400">FC</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-purple-400 font-mono">Farcaster Profile</h3>
                  <p className="text-xs text-purple-600 font-mono">@{profile.profile.farcasterUsername}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-purple-600">Profile:</span>
                  <a href={`https://warpcast.com/${profile.profile.farcasterUsername}`} 
                     target="_blank" rel="noopener noreferrer"
                     className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                    View Profile <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Status:</span>
                  <span className="text-purple-400">Connected</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-green-600 text-xs font-mono mb-1">Total_Commits</p>
            <p className="text-xl font-bold text-green-400 matrix-glow">{profile.stats.totalCommits}</p>
          </div>
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-green-600 text-xs font-mono mb-1">Total_Rewards</p>
            <p className="text-xl font-bold text-green-400 matrix-glow">{formatReward(profile.stats.totalRewardsEarned)}</p>
            <p className="text-green-700 text-xs font-mono">$ABC</p>
          </div>
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-green-600 text-xs font-mono mb-1">Streak_Days</p>
            <p className="text-xl font-bold text-green-400 matrix-glow">{profile.stats.currentStreakDays || 0}</p>
          </div>
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-green-600 text-xs font-mono mb-1">Member_Since</p>
            <p className="text-lg font-bold text-green-400 matrix-glow">{formatDate(profile.meta.createdAt)}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex gap-2 bg-green-950/10 border border-green-900/30 p-1 rounded-lg font-mono w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                activeTab === 'overview'
                  ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50'
                  : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('repositories')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                activeTab === 'repositories'
                  ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50'
                  : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
              }`}
            >
              Repositories ({repositories?.repositories?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
              {'>'} recent_commits.list()
            </h3>
            
            {commitsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mb-4"></div>
                <p className="text-green-600 font-mono">Loading commits...</p>
              </div>
            ) : userCommits && userCommits.length > 0 ? (
              <div className="space-y-3">
                {userCommits.slice(0, 10).map((commit) => (
                  <div
                    key={commit.id}
                    className="bg-green-950/10 border border-green-900/30 rounded-lg p-3 hover:bg-green-950/20 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-green-400 font-mono text-sm font-medium">
                          {formatCommitMessage(commit.commit.message)}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-green-600 font-mono">
                          <span>{commit.repository.name}</span>
                          <span>•</span>
                          <span>{formatDate(commit.commit.timestamp)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-green-400 matrix-glow font-mono">
                          +{commit.reward.amount.toLocaleString()} $ABC
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
        )}

        {/* Repositories Tab */}
        {activeTab === 'repositories' && (
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-400 matrix-glow font-mono">
                {'>'} connected_repositories.list()
              </h3>
              {ownership.isOwner && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 matrix-glow"></div>
                  <span className="text-xs font-mono text-green-600">You can manage these</span>
                </div>
              )}
            </div>
            
            {repositories?.premium_staker && (
              <div className="mb-4 p-3 bg-amber-950/20 border border-amber-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span className="text-sm font-mono text-amber-400">Premium Staker Benefits</span>
                </div>
                <div className="text-xs text-amber-600 font-mono space-y-1">
                  {repositories.premium_benefits?.map((benefit, index) => (
                    <p key={index}>• {benefit}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Repository Management Section - Only for owners */}
            {ownership.isOwner && (
              <div className="mb-6 p-4 bg-blue-950/20 border border-blue-900/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CogIcon className="w-5 h-5 text-blue-400" />
                  <h4 className="text-blue-400 font-mono font-semibold">Repository Management</h4>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      // TODO: Open add repository modal/form
                      alert('Add repository functionality coming soon!');
                    }}
                    className="flex items-center gap-2 bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 font-mono px-4 py-2 rounded-lg border border-blue-700/50 transition-all duration-300 hover:matrix-glow"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Repository
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Open repository settings modal
                      alert('Repository settings coming soon!');
                    }}
                    className="flex items-center gap-2 bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono px-4 py-2 rounded-lg border border-green-700/50 transition-all duration-300 hover:matrix-glow"
                  >
                    <CogIcon className="w-4 h-4" />
                    Settings
                  </button>
                </div>
                <p className="text-blue-600/70 font-mono text-xs mt-2">
                  Authenticated as: {ownership.authMethod} • {ownership.authUser?.username || ownership.authUser?.walletAddress?.slice(0, 8) + '...'}
                </p>
              </div>
            )}
            
            {repositories && repositories.repositories.length > 0 ? (
              <div className="space-y-3">
                {repositories.repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="bg-green-950/10 border border-green-900/30 rounded-lg p-4 hover:bg-green-950/20 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <FolderIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-green-400 font-mono text-sm font-medium mb-1">
                            {repo.repository_name}
                          </h4>
                          <a 
                            href={repo.repository_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:text-green-400 font-mono flex items-center gap-1 mb-2"
                          >
                            {repo.repository_url} <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          </a>
                          <div className="flex items-center gap-4 text-xs text-green-600 font-mono">
                            <span>Added {formatDate(repo.added_at)}</span>
                            <span>•</span>
                            <span className={repo.is_active ? 'text-green-400' : 'text-gray-500'}>
                              {repo.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${
                          repo.is_active ? 'bg-green-400 matrix-glow' : 'bg-gray-600'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderIcon className="w-12 h-12 text-green-600 mx-auto mb-3 opacity-50" />
                <p className="text-green-600 font-mono mb-2">No repositories connected</p>
                <p className="text-green-700 font-mono text-xs">
                  Repositories added to ABC DAO's reward stream will appear here
                </p>
              </div>
            )}
            
            {repositories && (
              <div className="mt-6 pt-4 border-t border-green-900/30">
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-green-600">Slots Used:</span>
                    <span className="text-green-400 ml-2">
                      {repositories.member_slots_used} / {repositories.premium_staker ? '∞' : repositories.member_slots_used + repositories.member_slots_remaining}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-600">Status:</span>
                    <span className="text-green-400 ml-2">
                      {repositories.premium_staker ? 'Premium' : 'Member'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DeveloperProfileClient({ devname }: { devname: string }) {
  return (
    <ErrorBoundary>
      <DeveloperProfileClientInner devname={devname} />
    </ErrorBoundary>
  );
}