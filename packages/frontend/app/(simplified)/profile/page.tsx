/**
 * User Profile Page (/profile?address=0x...)
 * 
 * Displays comprehensive user profile information including:
 * - Basic profile data and wallet info
 * - Developer statistics and achievements  
 * - Staking position and rewards
 * - Commit history and repositories
 * - Social integrations status
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BackNavigation } from '@/components/back-navigation';
import { useUserProfileSystematic } from '@/hooks/useUsersCommitsSystematic';
import { useStakingPosition } from '@/hooks/useStakingSystematic';
import { ActivityFeed } from '@/components/activity-feed';
import Image from 'next/image';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address');
  
  // Get user data from systematic APIs
  const userProfile = useUserProfileSystematic(address || undefined);
  const stakingPosition = useStakingPosition(address || undefined);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'staking'>('overview');
  const [farcasterAvatar, setFarcasterAvatar] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Fetch Farcaster profile picture
  useEffect(() => {
    const fetchFarcasterAvatar = async () => {
      const profile = userProfile.profile;
      if (!profile?.farcaster_username && !userProfile.identifiers?.farcasterFid) return;
      
      setAvatarLoading(true);
      try {
        // Use Farcaster FID if available
        const fid = userProfile.identifiers?.farcasterFid;
        if (fid) {
          // Try multiple API approaches for Farcaster profile picture
          const apiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
          
          if (apiKey) {
            // Use Neynar API with API key
            const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
              headers: {
                'Accept': 'application/json',
                'api_key': apiKey
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              const user = data.users?.[0];
              if (user?.pfp_url) {
                setFarcasterAvatar(user.pfp_url);
                return;
              }
            }
          }
          
          // Fallback: Try Warpcast profile URL pattern
          if (profile.farcaster_username) {
            // This might work for some users - Warpcast profile pictures sometimes follow patterns
            const fallbackUrl = `https://res.cloudinary.com/merkle-manufactory/image/fetch/c_fill,f_png,w_256/${encodeURIComponent(`https://warpcast.com/~/profile-picture?username=${profile.farcaster_username}`)}`;
            setFarcasterAvatar(fallbackUrl);
          }
        }
      } catch (error) {
        console.log('Failed to fetch Farcaster avatar:', error);
        // Use a placeholder or default avatar
        setFarcasterAvatar(null);
      } finally {
        setAvatarLoading(false);
      }
    };

    if (userProfile.profile && !userProfile.isLoading) {
      fetchFarcasterAvatar();
    }
  }, [userProfile.profile, userProfile.identifiers, userProfile.isLoading]);

  // No address provided
  if (!address) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation title="User Profile" subtitle="Address required" />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h1 className="text-2xl font-bold text-green-400 mb-4">Address Required</h1>
            <p className="text-green-600 font-mono mb-6">
              Please provide a wallet address in the URL:
              <br />
              <span className="text-sm">/profile?address=0x...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (userProfile.isLoading) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation title="User Profile" subtitle="Loading profile data..." />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-green-950/20 rounded-xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-24 bg-green-950/20 rounded-lg"></div>
                <div className="h-24 bg-green-950/20 rounded-lg"></div>
                <div className="h-24 bg-green-950/20 rounded-lg"></div>
              </div>
              <div className="h-64 bg-green-950/20 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state  
  if (userProfile.isError || !userProfile.profile) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation title="User Profile" subtitle="Profile not found" />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h1 className="text-2xl font-bold text-green-400 mb-4">Profile Not Found</h1>
            <p className="text-green-600 font-mono mb-6">
              No profile data found for address: 
              <br />
              <span className="text-xs break-all">{address}</span>
            </p>
            
            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">Possible Reasons</h3>
              <ul className="space-y-2 text-sm text-green-600 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400">•</span>
                  User hasn't connected their wallet yet
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400">•</span>
                  User hasn't made any commits or interactions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400">•</span>
                  Invalid wallet address format
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400">•</span>
                  Profile data still being processed
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profile = userProfile.profile;
  const stats = userProfile.stats;
  const membership = userProfile.membership;

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title={`Welcome back, ${profile.farcaster_username || profile.display_name || formatAddress(address)}`}
        subtitle={`Developer Profile • ${stats?.totalCommits || 0} commits`}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex items-start gap-4">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {farcasterAvatar ? (
                    <div className="relative w-16 h-16 md:w-20 md:h-20">
                      <Image
                        src={farcasterAvatar}
                        alt={`${profile.farcaster_username || 'User'}'s profile`}
                        fill
                        className="rounded-full border-2 border-green-400/50 object-cover"
                        sizes="(max-width: 768px) 64px, 80px"
                        onError={() => setFarcasterAvatar(null)}
                      />
                    </div>
                  ) : avatarLoading ? (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-green-400/30 bg-green-950/20 animate-pulse flex items-center justify-center">
                      <span className="text-green-600 text-xs">...</span>
                    </div>
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-green-400/30 bg-green-950/20 flex items-center justify-center">
                      <span className="text-2xl md:text-3xl">
                        {profile.farcaster_username ? '🎭' : '👤'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-green-400 matrix-glow mb-2">
                    {profile.display_name || 'Anonymous Developer'}
                  </h1>
                  <div className="flex flex-col gap-2">
                    <div className="text-green-600 font-mono text-sm">
                      {formatAddress(address)}
                    </div>
                    {profile.ens_domain && (
                      <div className="text-green-500 font-mono text-sm">
                        🌐 {profile.ens_domain}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Membership Badge */}
              {membership?.status === 'active' && (
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-green-900/50 text-green-400 rounded-lg border border-green-700/50">
                    <div className="flex items-center gap-2">
                      <span>👑</span>
                      <span className="font-bold">{membership.tier?.toUpperCase()} MEMBER</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-4">
              {/* GitHub Profile Link */}
              {profile.github_username ? (
                <a 
                  href={`https://github.com/${profile.github_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-800/40 hover:text-green-300 transition-colors cursor-pointer"
                >
                  <span>🐙</span>
                  <span className="text-sm">@{profile.github_username}</span>
                  <span className="text-xs opacity-60">↗</span>
                </a>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-900/30 text-gray-500">
                  <span>🐙</span>
                  <span className="text-sm">GitHub not connected</span>
                </div>
              )}
              
              {/* Farcaster Profile Link */}
              {profile.farcaster_username ? (
                <a 
                  href={`https://warpcast.com/${profile.farcaster_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-900/30 text-purple-400 hover:bg-purple-800/40 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  <span>🎭</span>
                  <span className="text-sm">@{profile.farcaster_username}</span>
                  <span className="text-xs opacity-60">↗</span>
                </a>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-900/30 text-gray-500">
                  <span>🎭</span>
                  <span className="text-sm">Farcaster not connected</span>
                </div>
              )}
              
              {/* Discord (not clickable as Discord doesn't have public profiles) */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                profile.discord_username ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-900/30 text-gray-500'
              }`}>
                <span>💬</span>
                <span className="text-sm">
                  {profile.discord_username ? `@${profile.discord_username}` : 'Discord not connected'}
                </span>
              </div>

              {/* Website Link */}
              {profile.website_url ? (
                <a 
                  href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-900/30 text-cyan-400 hover:bg-cyan-800/40 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <span>🌐</span>
                  <span className="text-sm">Website</span>
                  <span className="text-xs opacity-60">↗</span>
                </a>
              ) : null}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
              <div className="text-sm font-mono text-green-600 mb-1">Total Commits</div>
              <div className="text-2xl font-bold text-green-400">
                {stats?.totalCommits || 0}
              </div>
              <div className="text-xs text-green-700">Code contributions</div>
            </div>
            
            <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
              <div className="text-sm font-mono text-blue-600 mb-1">Rewards Earned</div>
              <div className="text-2xl font-bold text-blue-400">
                {formatNumber(userProfile.totalRewards || 0)}
              </div>
              <div className="text-xs text-blue-700">$ABC tokens</div>
            </div>
            
            <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4">
              <div className="text-sm font-mono text-purple-600 mb-1">Repositories</div>
              <div className="text-2xl font-bold text-purple-400">
                {stats?.uniqueRepositories || 0}
              </div>
              <div className="text-xs text-purple-700">Active repos</div>
            </div>
            
            <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4">
              <div className="text-sm font-mono text-yellow-600 mb-1">Staked</div>
              <div className="text-2xl font-bold text-yellow-400">
                {formatNumber(parseFloat(stakingPosition.stakedAmount || '0'))}
              </div>
              <div className="text-xs text-yellow-700">$ABC staked</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-green-900/30">
              <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'activity', label: 'Activity', icon: '📈' },
                  { id: 'staking', label: 'Staking', icon: '🏦' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative px-4 sm:px-6 py-4 font-mono text-sm font-medium transition-all duration-200 min-w-fit whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-green-400 border-b-2 border-green-400 bg-green-950/20'
                        : 'text-green-600 hover:text-green-400 hover:bg-green-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-green-400 mb-4">Developer Journey</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-green-600">Member since:</span>
                      <span className="text-green-400">
                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600">Last activity:</span>
                      <span className="text-green-400">
                        {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'No recent activity'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600">Profile status:</span>
                      <span className={`${userProfile.isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                        {userProfile.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <ActivityFeed walletAddress={address} />
            )}

            {activeTab === 'staking' && (
              <div className="space-y-6">
                <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-green-400 mb-4">Staking Position</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-green-600 mb-2">Staked Amount</div>
                      <div className="text-3xl font-bold text-green-400">
                        {formatNumber(parseFloat(stakingPosition.stakedAmount || '0'))} $ABC
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-green-600 mb-2">Pending Rewards</div>
                      <div className="text-3xl font-bold text-yellow-400">
                        {parseFloat(stakingPosition.pendingRewards || '0').toFixed(4)} ETH
                      </div>
                    </div>
                  </div>
                  
                  {stakingPosition.lastStakeTime && (
                    <div className="mt-4 pt-4 border-t border-green-900/30">
                      <div className="text-sm text-green-600">Last stake: {new Date(stakingPosition.lastStakeTime).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}