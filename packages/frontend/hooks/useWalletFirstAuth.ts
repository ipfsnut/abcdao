/**
 * Wallet-First Authentication Hook
 * 
 * Manages wallet-first progressive authentication:
 * 1. Wallet connection (required)
 * 2. Profile building (GitHub, Discord, Farcaster)
 * 3. Feature unlocking based on integrations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { config } from '@/lib/config';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import { CONTRACTS } from '@/lib/contracts';

interface UserProfile {
  wallet_address: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
  
  // Membership - matches backend database fields
  membership_status: 'free' | 'member' | 'premium' | 'paid';
  membership_tier?: 'free' | 'member' | 'premium'; // Legacy compatibility field
  is_member?: boolean; // Computed field (optional for compatibility)
  
  // Integrations
  github_connected: boolean;
  github_username?: string;
  discord_connected: boolean;
  discord_username?: string;
  farcaster_connected: boolean;
  farcaster_username?: string;
  
  // Features
  can_earn_rewards: boolean;
  community_access: boolean;
  social_features: boolean;
  premium_features: boolean;
  
  // Stats
  total_commits: number;
  total_earned_tokens: number;
  total_staked_tokens: number;
  last_active_at: string;
}

interface AvailableFeatures {
  token_operations: boolean;
  earning_rewards: boolean;
  repository_management: boolean;
  community_access: boolean;
  social_features: boolean;
  premium_features: boolean;
  staking: boolean;
}

interface NextStep {
  action: string;
  title: string;
  description: string;
  benefits: string[];
  priority: 'high' | 'medium' | 'low';
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  features: AvailableFeatures | null;
  nextSteps: NextStep[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Helper function to fetch user's staked amount
const fetchUserStakedAmount = async (walletAddress: string): Promise<number> => {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http()
    });

    const stakeInfo = await client.readContract({
      address: CONTRACTS.ABC_STAKING.address,
      abi: CONTRACTS.ABC_STAKING.abi,
      functionName: 'getStakeInfo',
      args: [walletAddress as `0x${string}`]
    });

    if (stakeInfo && Array.isArray(stakeInfo) && stakeInfo[0]) {
      return parseFloat(formatEther(stakeInfo[0] as bigint));
    }
    return 0;
  } catch (error) {
    console.warn('Failed to fetch staking data:', error);
    return 0;
  }
};

export function useWalletFirstAuth() {
  const { address, isConnected } = useAccount();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    features: null,
    nextSteps: [],
    isLoading: false,
    isAuthenticated: false,
    error: null
  });

  /**
   * Resolve display name with priority: ENS > Farcaster > Wallet
   */
  const resolveDisplayName = useCallback(async (walletAddress: string): Promise<string> => {
    try {
      // Try to resolve ENS name
      const response = await fetch(`https://api.ensideas.com/ens/resolve/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.name) {
          return data.name;
        }
      }
    } catch (error) {
      console.log('ENS resolution failed:', error);
    }
    
    // Fallback to shortened wallet address
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  }, []);

  /**
   * Authenticate with wallet address
   */
  const authenticateWallet = useCallback(async (walletAddress: string, context?: any) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Authenticate wallet with new endpoint
      const authResponse = await fetch(`${config.backendUrl}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress })
      });
      const authData = await authResponse.json();

      if (authResponse.ok && authData.success && authData.user) {
        // User authenticated successfully, get additional staking data
        const stakedAmount = await fetchUserStakedAmount(walletAddress);
        
        const user = {
          wallet_address: authData.user.wallet_address,
          display_name: authData.user.farcaster_username || authData.user.github_username,
          farcaster_username: authData.user.farcaster_username,
          github_username: authData.user.github_username,
          github_connected: !!authData.user.github_username,
          farcaster_connected: !!authData.user.farcaster_fid,
          discord_connected: !!authData.user.discord_username,
          discord_username: authData.user.discord_username,
          membership_status: authData.user.membership_status || 'free',
          is_member: authData.user.membership_status === 'member' || authData.user.membership_status === 'premium',
          membership_tier: authData.user.membership_status as 'free' | 'member' | 'premium',
          can_earn_rewards: !!authData.user.github_username,
          community_access: true,
          social_features: !!authData.user.farcaster_fid,
          premium_features: authData.user.membership_status === 'premium',
          total_commits: authData.user.total_commits || 0,
          total_earned_tokens: parseFloat(authData.user.total_abc_earned || '0'),
          total_staked_tokens: stakedAmount,
          last_active_at: authData.user.updated_at || new Date().toISOString(),
          bio: authData.user.display_name,
          avatar_url: undefined,
          website_url: undefined
        };
        // Use backend-provided features and next steps
        const features = authData.features || {
          token_operations: true,
          earning_rewards: user.github_connected || false,
          repository_management: user.github_connected || false,
          community_access: true,
          social_features: user.discord_connected || user.farcaster_connected || false,
          premium_features: user.is_member || false,
          staking: true,
        };

        const nextSteps = authData.next_steps || [];

        setAuthState({
          user,
          token: authData.token, // Use JWT token from backend
          features,
          nextSteps,
          isLoading: false,
          isAuthenticated: true,
          error: null
        });

        return { user, features, nextSteps };
      } else {
        // Authentication failed
        throw new Error(authData.error || 'Authentication failed');
      }

    } catch (error) {
      console.error('Wallet authentication error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Refresh user profile from server
   */
  const refreshProfile = useCallback(async () => {
    if (!authState.token) return;

    try {
      const response = await fetch(`${config.backendUrl}/api/users-commits/profile/${authState.token}`);
      const data = await response.json();

      if (response.ok && data.id) {
        // Transform API response to expected format
        // Fetch staking data
        const stakedAmount = await fetchUserStakedAmount(authState.token);
        
        const user = {
          wallet_address: data.identifiers.walletAddress,
          display_name: data.profile.displayName,
          farcaster_username: data.profile.farcasterUsername,
          github_username: data.identifiers.githubUsername,
          github_connected: !!data.identifiers.githubUsername,
          farcaster_connected: !!data.identifiers.farcasterFid,
          discord_connected: false, // Not in current API response
          discord_username: undefined,
          membership_status: data.membership.status === 'paid' ? 'member' as const : 'free' as const,
          is_member: data.membership.status === 'paid',
          membership_tier: data.membership.status === 'paid' ? 'member' as const : 'free' as const,
          can_earn_rewards: !!data.identifiers.githubUsername,
          community_access: true,
          social_features: !!data.identifiers.farcasterFid,
          premium_features: data.membership.status === 'paid',
          total_commits: data.stats.totalCommits,
          total_earned_tokens: data.stats.totalRewardsEarned,
          total_staked_tokens: stakedAmount,
          last_active_at: new Date().toISOString(),
          bio: data.profile.bio,
          avatar_url: data.profile.avatarUrl,
          website_url: data.profile.websiteUrl
        };
        const features = {
          token_operations: true,
          earning_rewards: user.github_connected || false,
          repository_management: user.github_connected || false,
          community_access: true,
          social_features: user.discord_connected || user.farcaster_connected || false,
          premium_features: user.is_member || false,
          staking: true,
        };

        const nextSteps: NextStep[] = [];
        if (!user.github_connected) {
          nextSteps.push({
            action: 'connect_github',
            title: 'Connect GitHub',
            description: 'Connect your GitHub account to earn rewards for commits',
            benefits: ['Earn $ABC tokens for commits', 'Track your coding activity', 'Repository management'],
            priority: 'high' as const
          });
        }
        // Check membership status correctly - backend sends membership_status field
        const isMember = user.membership_status === 'member' || user.is_member;
        
        if (!isMember) {
          nextSteps.push({
            action: 'purchase_membership',
            title: 'Become a Member',
            description: 'Pay 0.002 ETH to unlock full features',
            benefits: ['Premium features', 'Community status', 'Priority support'],
            priority: 'medium' as const
          });
        }

        setAuthState(prev => ({
          ...prev,
          user,
          features,
          nextSteps,
          isLoading: false
        }));
      }

    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  }, [authState.token]);

  /**
   * Add GitHub integration to profile
   */
  const addGitHubIntegration = useCallback(async (githubCode?: string, githubData?: any) => {
    if (!authState.user) throw new Error('User not authenticated');

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Use the existing GitHub OAuth endpoint
      const response = await fetch(`${config.backendUrl}/api/auth/github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: authState.user.wallet_address,
          code: githubCode,
          ...githubData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'GitHub integration failed');
      }

      // Refresh user profile
      await refreshProfile();

      return data;

    } catch (error) {
      console.error('GitHub integration error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'GitHub integration failed'
      }));
      throw error;
    }
  }, [authState.user, authState.token, refreshProfile]);

  /**
   * Add Discord integration to profile
   */
  const addDiscordIntegration = useCallback(async (discordCode?: string, discordData?: any) => {
    if (!authState.user) throw new Error('User not authenticated');

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${config.backendUrl}/api/auth/profile/discord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          wallet_address: authState.user.wallet_address,
          discord_code: discordCode,
          discord_data: discordData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Discord integration failed');
      }

      // Refresh user profile
      await refreshProfile();

      return data;

    } catch (error) {
      console.error('Discord integration error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Discord integration failed'
      }));
      throw error;
    }
  }, [authState.user, authState.token, refreshProfile]);

  /**
   * Add Farcaster integration to profile
   */
  const addFarcasterIntegration = useCallback(async (farcasterData: any) => {
    if (!authState.user) throw new Error('User not authenticated');

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${config.backendUrl}/api/auth/profile/farcaster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          wallet_address: authState.user.wallet_address,
          farcaster_data: farcasterData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Farcaster integration failed');
      }

      // Refresh user profile
      await refreshProfile();

      return data;

    } catch (error) {
      console.error('Farcaster integration error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Farcaster integration failed'
      }));
      throw error;
    }
  }, [authState.user, authState.token, refreshProfile]);

  /**
   * Process membership purchase
   */
  const processMembershipPurchase = useCallback(async (paymentData: any) => {
    if (!authState.user) throw new Error('User not authenticated');

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${config.backendUrl}/api/auth/membership/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          wallet_address: authState.user.wallet_address,
          ...paymentData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Membership purchase failed');
      }

      // Refresh user profile
      await refreshProfile();

      return data;

    } catch (error) {
      console.error('Membership purchase error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Membership purchase failed'
      }));
      throw error;
    }
  }, [authState.user, authState.token, refreshProfile]);

  /**
   * Update profile settings
   */
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!authState.token) throw new Error('User not authenticated');

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${config.backendUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Profile update failed');
      }

      setAuthState(prev => ({
        ...prev,
        user: data.user,
        isLoading: false
      }));

      return data;

    } catch (error) {
      console.error('Profile update error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Profile update failed'
      }));
      throw error;
    }
  }, [authState.token]);

  /**
   * Logout and clear authentication state
   */
  const logout = useCallback(() => {
    localStorage.removeItem('abc_dao_token');
    setAuthState({
      user: null,
      token: null,
      features: null,
      nextSteps: [],
      isLoading: false,
      isAuthenticated: false,
      error: null
    });
  }, []);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && address && !authState.isAuthenticated && !authState.isLoading) {
      authenticateWallet(address);
    }
  }, [isConnected, address, authState.isAuthenticated, authState.isLoading, authenticateWallet]);

  // Try to restore authentication from stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('abc_dao_token');
    if (storedToken && !authState.isAuthenticated && !authState.isLoading) {
      // For now, we'll skip automatic restoration since the token is just the wallet address
      // The wallet connection will trigger authentication automatically
      localStorage.removeItem('abc_dao_token');
    }
  }, [authState.isAuthenticated, authState.isLoading]);

  return {
    ...authState,
    authenticateWallet,
    addGitHubIntegration,
    addDiscordIntegration, 
    addFarcasterIntegration,
    processMembershipPurchase,
    refreshProfile,
    updateProfile,
    logout
  };
}