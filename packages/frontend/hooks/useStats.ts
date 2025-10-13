'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface Stats {
  activeDevelopers: number;
  totalCommits: number;
  totalRewards: number;
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({
    activeDevelopers: 0,
    totalCommits: 0,
    totalRewards: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`${config.backendUrl}/api/users/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError('Failed to fetch stats');
        }
      } catch (err) {
        setError('Failed to fetch stats');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}