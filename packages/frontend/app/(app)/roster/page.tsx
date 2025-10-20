'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useLeaderboardSystematic, useUsersCommitsStatsSystematic } from '@/hooks/useUsersCommitsSystematic';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { VerificationBadge } from '@/components/verification-badge';

const DEVELOPERS_PER_PAGE = 8;

export default function RosterPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'commits' | 'rewards' | 'joined'>('commits');
  const { formatPrice } = useTokenPrice();

  // Fetch systematic leaderboard data
  const { 
    leaderboard: developers, 
    isLoading: loading, 
    isError: hasError,
    error: errorMessage
  } = useLeaderboardSystematic('all', DEVELOPERS_PER_PAGE * 10); // Get more data for client-side filtering

  // Fetch systematic stats for the header
  const { 
    totalUsers,
    paidMembers,
    totalCommits,
    isLoading: statsLoading 
  } = useUsersCommitsStatsSystematic();

  // Transform systematic data to match existing interface
  const error = hasError ? (errorMessage || 'Failed to load roster data') : null;
  
  // Client-side filtering and pagination since systematic API doesn't support complex filters yet
  const filteredDevelopers = developers.filter((dev: any) => {
    if (activeFilter === 'active') return dev.meta?.isActive;
    if (activeFilter === 'inactive') return !dev.meta?.isActive;
    return true; // 'all'
  });

  // Client-side sorting
  const sortedDevelopers = [...filteredDevelopers].sort((a: any, b: any) => {
    if (sortBy === 'commits') return (b.stats?.commits || 0) - (a.stats?.commits || 0);
    if (sortBy === 'rewards') return (parseFloat(b.stats?.totalRewards) || 0) - (parseFloat(a.stats?.totalRewards) || 0);
    if (sortBy === 'joined') return new Date(b.meta?.joinedAt || b.profile?.createdAt).getTime() - new Date(a.meta?.joinedAt || a.profile?.createdAt).getTime();
    return 0;
  });

  // Client-side pagination
  const totalCount = sortedDevelopers.length;
  const totalPages = Math.ceil(totalCount / DEVELOPERS_PER_PAGE);
  const startIndex = (currentPage - 1) * DEVELOPERS_PER_PAGE;
  const paginatedDevelopers = sortedDevelopers.slice(startIndex, startIndex + DEVELOPERS_PER_PAGE);

  // Create pagination object to match existing interface
  const pagination = {
    currentPage,
    totalPages,
    totalCount,
    limit: DEVELOPERS_PER_PAGE,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages
  };

  // Create rosterStats object to match existing interface
  const rosterStats = {
    totalDevelopers: totalUsers,
    activeDevelopers: paidMembers, // Using paid members as active for now
    inactiveDevelopers: totalUsers - paidMembers,
    totalCommits,
    averageCommits: totalUsers > 0 ? Math.round(totalCommits / totalUsers) : 0
  };

  // Use paginated developers for rendering
  const renderDevelopers = paginatedDevelopers;

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Handle filter changes - reset to page 1
  const handleFilterChange = useCallback((newFilter: 'all' | 'active' | 'inactive') => {
    setActiveFilter(newFilter);
    setCurrentPage(1);
  }, []);

  // Handle sort changes - reset to page 1
  const handleSortChange = useCallback((newSort: 'commits' | 'rewards' | 'joined') => {
    setSortBy(newSort);
    setCurrentPage(1);
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    // Check if date is valid and not epoch (1970-01-01)
    if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
      return 'Recently';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
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
                  {'>'} ABC_DAO_Roster
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Header Stats */}
        <div className="mb-6 bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-green-400 matrix-glow font-mono">
            {'>'} developer_registry.status()
          </h2>
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
                  <div className="animate-pulse">
                    <div className="h-3 bg-green-800/30 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-green-800/30 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
                <p className="text-green-600 text-xs font-mono">Total_Devs</p>
                <p className="text-lg font-bold text-green-400 matrix-glow">{rosterStats.totalDevelopers}</p>
              </div>
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
                <p className="text-green-600 text-xs font-mono">Active</p>
                <p className="text-lg font-bold text-green-400 matrix-glow">{rosterStats.activeDevelopers}</p>
              </div>
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
                <p className="text-green-600 text-xs font-mono">Total_Commits</p>
                <p className="text-lg font-bold text-green-400 matrix-glow">{rosterStats.totalCommits}</p>
              </div>
              <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-3">
                <p className="text-green-600 text-xs font-mono">Avg_Commits</p>
                <p className="text-lg font-bold text-green-400 matrix-glow">{rosterStats.averageCommits}</p>
              </div>
            </div>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Filter Buttons */}
          <div className="flex gap-2 bg-green-950/10 border border-green-900/30 p-1 rounded-lg font-mono w-fit">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                activeFilter === 'all'
                  ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50'
                  : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
              }`}
            >
              All ({rosterStats.totalDevelopers})
            </button>
            <button
              onClick={() => handleFilterChange('active')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                activeFilter === 'active'
                  ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50'
                  : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
              }`}
            >
              Active ({rosterStats.activeDevelopers})
            </button>
            <button
              onClick={() => handleFilterChange('inactive')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                activeFilter === 'inactive'
                  ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50'
                  : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
              }`}
            >
              Inactive ({rosterStats.inactiveDevelopers})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex gap-2 bg-green-950/10 border border-green-900/30 p-1 rounded-lg font-mono w-fit">
            <button
              onClick={() => handleSortChange('commits')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                sortBy === 'commits'
                  ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50'
                  : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
              }`}
            >
              By Commits
            </button>
            <button
              onClick={() => handleSortChange('rewards')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                sortBy === 'rewards'
                  ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50'
                  : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
              }`}
            >
              By Rewards
            </button>
            <button
              onClick={() => handleSortChange('joined')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                sortBy === 'joined'
                  ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50'
                  : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
              }`}
            >
              By Join Date
            </button>
          </div>
        </div>

        {/* Developer List */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm mb-6">
          <h3 className="text-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
            {'>'} roster.list({activeFilter})
          </h3>
          
          {error ? (
            <div className="text-center py-12">
              <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 mb-4">
                <p className="text-red-400 font-mono text-sm">Error: {error}</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="bg-green-900/50 hover:bg-green-800/60 text-green-400 font-mono px-4 py-2 rounded-lg border border-green-700/50 transition-all duration-300 matrix-button text-sm"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mb-4"></div>
              <p className="text-green-600 font-mono">Loading developers...</p>
            </div>
          ) : renderDevelopers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-green-600 font-mono">No developers found for this filter.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {renderDevelopers.map((dev) => (
                  <div
                    key={dev.id}
                    className="bg-green-950/10 border border-green-900/30 rounded-lg p-4 hover:bg-green-950/20 hover:border-green-700/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-950/20 border border-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                            {dev.profile?.avatarUrl ? (
                              <img 
                                src={dev.profile.avatarUrl} 
                                alt={dev.profile.displayName || dev.profile.farcasterUsername}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <span className="text-xs text-green-400 matrix-glow">
                                {(dev.profile?.displayName || dev.profile?.farcasterUsername || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            dev.meta?.isActive ? 'bg-green-400 matrix-glow' : 'bg-gray-600'
                          }`}></div>
                        </div>
                        <div>
                          <Link 
                            href={`/roster/${dev.profile?.farcasterUsername || dev.profile?.githubUsername || dev.id}`}
                            className="group"
                          >
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-green-400 font-mono group-hover:text-green-300 transition-colors duration-300">
                                @{dev.profile?.farcasterUsername || 'Unknown'}
                              </h4>
                              <VerificationBadge 
                                isVerified={!!dev.meta?.verifiedAt} 
                                githubUsername={dev.profile?.githubUsername}
                              />
                            </div>
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-green-600 font-mono">
                            <span>GitHub: @{dev.profile?.githubUsername || 'Unknown'}</span>
                            <span>•</span>
                            <span>Joined {formatDate(dev.meta?.joinedAt || dev.profile?.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400 matrix-glow font-mono">
                          {dev.stats?.commits || 0} commits
                        </p>
                        <div className="flex items-center gap-2 text-xs text-green-600 font-mono">
                          <div className="text-right">
                            <span>{(parseFloat(String(dev.stats?.totalRewards)) || 0).toFixed(2)} $ABC</span>
                            <div className="text-green-700 text-xs">
                              ≈ {formatPrice((parseFloat(String(dev.stats?.totalRewards)) || 0))}
                            </div>
                          </div>
                          <span>•</span>
                          <span className={dev.meta?.isActive ? 'text-green-400' : 'text-gray-500'}>
                            {dev.meta?.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-green-900/30">
                  <div className="text-sm text-green-600 font-mono">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      disabled={!pagination.hasPreviousPage}
                      className="p-2 rounded-lg border border-green-900/50 text-green-400 hover:bg-green-950/20 hover:border-green-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                        let pageNumber;
                        if (pagination.totalPages <= 7) {
                          pageNumber = i + 1;
                        } else if (pagination.currentPage <= 4) {
                          pageNumber = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 3) {
                          pageNumber = pagination.totalPages - 6 + i;
                        } else {
                          pageNumber = pagination.currentPage - 3 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`w-8 h-8 rounded-lg font-mono text-sm transition-all duration-300 ${
                              currentPage === pageNumber
                                ? 'bg-green-900/50 text-green-400 border border-green-700/50 matrix-glow'
                                : 'border border-green-900/50 text-green-600 hover:bg-green-950/20 hover:border-green-700/50 hover:text-green-400'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(Math.min(currentPage + 1, pagination.totalPages))}
                      disabled={!pagination.hasNextPage}
                      className="p-2 rounded-lg border border-green-900/50 text-green-400 hover:bg-green-950/20 hover:border-green-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Verification Info Panel */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm mb-6">
          <h3 className="text-lg font-bold mb-3 text-green-400 matrix-glow font-mono">
            {'>'} verification.info()
          </h3>
          <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-yellow-400 text-xl mt-1">⚠️</div>
              <div className="text-green-600 font-mono text-sm space-y-2">
                <p className="text-green-400 font-semibold">Profile Creation Notice:</p>
                <p>Only verified developers have full profiles that appear here. Users with ✓ badges have completed the verification process.</p>
                <p>To create a verified profile and start earning $ABC rewards:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2 text-xs pl-4">
                  <li>Pay 0.002 ETH membership fee</li>
                  <li>Link your GitHub account in the ABC DAO mini-app</li>
                  <li>Complete the verification process</li>
                  <li>Start making commits to earn 50k-1M $ABC per commit!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold mb-3 text-green-400 matrix-glow font-mono">
            {'>'} roster.info()
          </h3>
          <div className="text-green-600 font-mono text-sm space-y-2">
            <p>• Developers are ranked by GitHub commit activity</p>
            <p>• Active status based on commits in the last 30 days</p>
            <p>• ✓ badges indicate verified developers who can earn rewards</p>
            <p>• Click any badge to learn about the verification process</p>
          </div>
        </div>
      </div>
    </div>
  );
}