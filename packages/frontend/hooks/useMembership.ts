'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useFarcaster } from '@/components/farcaster-miniapp';
import { config } from '@/lib/config';

export interface MembershipStatus {
  isMember: boolean;
  hasGithub: boolean;
  githubUsername?: string;
  membershipTxHash?: string;
  farcasterFid?: number;
  farcasterUsername?: string;
  walletAddress?: string;
  joinedAt?: string;
  totalCommits?: number;
  totalEarned?: number;
}

export function useMembership() {
  const { address } = useAccount();
  const { user: profile } = useFarcaster();
  const [status, setStatus] = useState<MembershipStatus>({
    isMember: false,
    hasGithub: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.fid) {
      fetchMembershipStatus(profile.fid);
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchMembershipStatus = async (fid: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${config.backendUrl}/api/users/${fid}/status`);
      
      if (response.ok) {
        const data = await response.json();
        
        setStatus({
          isMember: !!data.membership_tx_hash,
          hasGithub: !!data.github_username,
          githubUsername: data.github_username,
          membershipTxHash: data.membership_tx_hash,
          farcasterFid: data.farcaster_fid,
          farcasterUsername: data.farcaster_username,
          walletAddress: data.wallet_address,
          joinedAt: data.joined_at,
          totalCommits: data.total_commits || 0,
          totalEarned: data.total_earned || 0,
        });
      } else if (response.status === 404) {
        // User not found - not a member yet
        setStatus({
          isMember: false,
          hasGithub: false,
        });
      } else {
        throw new Error('Failed to fetch membership status');
      }
    } catch (err) {
      console.error('Error fetching membership status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus({
        isMember: false,
        hasGithub: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = () => {
    if (profile?.fid) {
      fetchMembershipStatus(profile.fid);
    }
  };

  return {
    ...status,
    loading,
    error,
    refreshStatus,
    isConnected: !!profile,
    walletConnected: !!address,
  };
}