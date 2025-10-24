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

interface UserProfile {
  wallet_address: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  
  // Membership
  is_member: boolean;
  membership_tier: 'free' | 'member' | 'premium';
  
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
  governance: boolean;
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
   * Authenticate with wallet address
   */
  const authenticateWallet = useCallback(async (walletAddress: string, context?: any) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // First try to get user profile by wallet address
      const profileResponse = await fetch(`${config.backendUrl}/api/users-commits/profile/${walletAddress}`);
      const profileData = await profileResponse.json();

      if (profileResponse.ok && profileData.user) {
        // User exists, set up authentication state
        const user = profileData.user;
        const features = {
          token_operations: true,
          earning_rewards: user.github_connected || false,
          repository_management: user.github_connected || false,
          community_access: true,
          social_features: user.discord_connected || user.farcaster_connected || false,
          premium_features: user.is_member || false,
          staking: true,
          governance: user.is_member || false
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
        if (!user.is_member) {
          nextSteps.push({
            action: 'purchase_membership',
            title: 'Become a Member',
            description: 'Pay 0.002 ETH to unlock full features',
            benefits: ['Premium features', 'Governance voting', 'Priority support'],
            priority: 'medium' as const
          });
        }

        setAuthState({
          user,
          token: walletAddress, // Use wallet address as token for now
          features,
          nextSteps,
          isLoading: false,
          isAuthenticated: true,
          error: null
        });

        return { user, features, nextSteps };
      } else {
        // User doesn't exist, create a basic profile
        const newUser = {
          wallet_address: walletAddress,
          display_name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          is_member: false,
          membership_tier: 'free' as const,
          github_connected: false,
          discord_connected: false,
          farcaster_connected: false,
          can_earn_rewards: false,
          community_access: true,
          social_features: false,
          premium_features: false,
          total_commits: 0,
          total_earned_tokens: 0,
          total_staked_tokens: 0,
          last_active_at: new Date().toISOString()
        };

        const features = {
          token_operations: true,
          earning_rewards: false,
          repository_management: false,
          community_access: true,
          social_features: false,
          premium_features: false,
          staking: true,
          governance: false
        };

        const nextSteps = [
          {
            action: 'connect_github',
            title: 'Connect GitHub',
            description: 'Connect your GitHub account to start earning rewards',
            benefits: ['Earn $ABC tokens for commits', 'Track your coding activity', 'Repository management'],
            priority: 'high' as const
          },
          {
            action: 'purchase_membership',
            title: 'Become a Member',
            description: 'Pay 0.002 ETH to unlock premium features',
            benefits: ['Premium features', 'Governance voting', 'Priority support'],
            priority: 'medium' as const
          }
        ];

        setAuthState({
          user: newUser,
          token: walletAddress,
          features,
          nextSteps,
          isLoading: false,
          isAuthenticated: true,
          error: null
        });

        return { user: newUser, features, nextSteps };
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

      if (response.ok && data.user) {
        const user = data.user;
        const features = {
          token_operations: true,
          earning_rewards: user.github_connected || false,
          repository_management: user.github_connected || false,
          community_access: true,
          social_features: user.discord_connected || user.farcaster_connected || false,
          premium_features: user.is_member || false,
          staking: true,
          governance: user.is_member || false
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
        if (!user.is_member) {
          nextSteps.push({
            action: 'purchase_membership',
            title: 'Become a Member',
            description: 'Pay 0.002 ETH to unlock full features',
            benefits: ['Premium features', 'Governance voting', 'Priority support'],
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