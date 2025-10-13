'use client';

import { useState, useEffect, useCallback } from 'react';
import { config } from '@/lib/config';

export interface Developer {
  id: number;
  farcaster_username: string;
  github_username: string;
  created_at: string;
  last_commit_at: string | null;
  total_commits: number;
  total_rewards: number;
  membership_status: string | null;
  is_active: boolean;
}

export interface RosterPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

export interface RosterFilters {
  activeFilter: 'all' | 'active' | 'inactive';
  sortBy: 'commits' | 'rewards' | 'joined';
}

export interface RosterData {
  developers: Developer[];
  pagination: RosterPagination;
  filters: RosterFilters;
}

export interface UseRosterOptions {
  page?: number;
  limit?: number;
  filter?: 'all' | 'active' | 'inactive';
  sort?: 'commits' | 'rewards' | 'joined';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useRoster(options: UseRosterOptions = {}) {
  const {
    page = 1,
    limit = 8,
    filter = 'all',
    sort = 'commits',
    autoRefresh = false,
    refreshInterval = 60000 // 1 minute
  } = options;

  const [data, setData] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoster = useCallback(async () => {
    try {
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        filter,
        sort
      });

      const response = await fetch(`${config.backendUrl}/api/users/roster?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch roster: ${response.statusText}`);
      }

      const rosterData = await response.json();
      setData(rosterData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roster data';
      setError(errorMessage);
      console.error('Error fetching roster:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter, sort]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchRoster();
  }, [fetchRoster]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchRoster();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchRoster, autoRefresh, refreshInterval]);

  // Helper function to refetch data
  const refetch = useCallback(() => {
    setLoading(true);
    fetchRoster();
  }, [fetchRoster]);

  // Helper functions for pagination
  const goToPage = useCallback((newPage: number) => {
    if (!data?.pagination) return;
    
    const { totalPages } = data.pagination;
    if (newPage >= 1 && newPage <= totalPages) {
      // This will be handled by the parent component updating the page prop
      return newPage;
    }
    return page;
  }, [data?.pagination, page]);

  const nextPage = useCallback(() => {
    if (data?.pagination?.hasNextPage) {
      return goToPage(page + 1);
    }
    return page;
  }, [data?.pagination, goToPage, page]);

  const previousPage = useCallback(() => {
    if (data?.pagination?.hasPreviousPage) {
      return goToPage(page - 1);
    }
    return page;
  }, [data?.pagination, goToPage, page]);

  // Helper function to get formatted stats
  const getStats = useCallback(() => {
    if (!data?.developers) return null;

    const totalDevs = data.pagination.totalCount;
    const activeDevs = data.developers.filter(dev => dev.is_active).length;
    const totalCommits = data.developers.reduce((sum, dev) => sum + dev.total_commits, 0);
    const totalRewards = data.developers.reduce((sum, dev) => sum + dev.total_rewards, 0);

    return {
      totalDevelopers: totalDevs,
      activeDevelopers: activeDevs,
      inactiveDevelopers: totalDevs - activeDevs,
      totalCommits,
      totalRewards,
      averageCommits: totalDevs > 0 ? Math.round(totalCommits / totalDevs) : 0
    };
  }, [data]);

  return {
    data,
    developers: data?.developers || [],
    pagination: data?.pagination || null,
    filters: data?.filters || { activeFilter: filter, sortBy: sort },
    stats: getStats(),
    loading,
    error,
    refetch,
    goToPage,
    nextPage,
    previousPage
  };
}

// Hook for getting roster stats only (lighter weight)
export function useRosterStats() {
  const [stats, setStats] = useState({
    totalDevelopers: 0,
    activeDevelopers: 0,
    inactiveDevelopers: 0,
    totalCommits: 0,
    totalRewards: 0,
    averageCommits: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setError(null);
        
        // Fetch just a small sample to get total counts
        const response = await fetch(`${config.backendUrl}/api/users/roster?page=1&limit=1`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch roster stats: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Get actual stats from the users stats endpoint for total commits/rewards
        const statsResponse = await fetch(`${config.backendUrl}/api/users/stats`);
        const globalStats = statsResponse.ok ? await statsResponse.json() : {};

        setStats({
          totalDevelopers: data.pagination.totalCount || 0,
          activeDevelopers: globalStats.activeDevelopers || 0,
          inactiveDevelopers: (data.pagination.totalCount || 0) - (globalStats.activeDevelopers || 0),
          totalCommits: globalStats.totalCommits || 0,
          totalRewards: globalStats.totalRewards || 0,
          averageCommits: data.pagination.totalCount > 0 && globalStats.totalCommits 
            ? Math.round(globalStats.totalCommits / data.pagination.totalCount) 
            : 0
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roster stats';
        setError(errorMessage);
        console.error('Error fetching roster stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}