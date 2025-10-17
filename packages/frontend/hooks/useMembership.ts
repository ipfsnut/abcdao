'use client';

import { useUniversalAuth } from '@/contexts/universal-auth-context';

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
  const { user, isLoading, error, refreshUser } = useUniversalAuth();

  // Map universal user to membership status interface
  const status: MembershipStatus = {
    isMember: user?.is_member || false,
    hasGithub: user?.has_github || false,
    githubUsername: user?.github_username,
    membershipTxHash: user?.membership_tx_hash,
    farcasterFid: user?.farcaster_fid,
    farcasterUsername: user?.farcaster_username,
    walletAddress: user?.wallet_address_primary,
    joinedAt: user?.joined_at,
    totalCommits: user?.total_commits || 0,
    totalEarned: user?.total_earned || 0,
  };

  return {
    ...status,
    loading: isLoading,
    error,
    refreshStatus: refreshUser,
    isConnected: !!user,
    walletConnected: !!user?.wallet_address_primary,
  };
}