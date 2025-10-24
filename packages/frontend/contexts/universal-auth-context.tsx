'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { useFarcaster } from './unified-farcaster-context';
import { config } from '@/lib/config';

export interface UniversalUser {
  // Core identifiers
  wallet_address_primary: string;
  display_name: string;
  
  // Authentication context
  entry_context: 'webapp' | 'farcaster';
  
  // Social accounts
  farcaster_fid?: number;
  farcaster_username?: string;
  github_username?: string;
  discord_username?: string;
  
  // Account status
  is_member: boolean;
  has_github: boolean;
  has_farcaster: boolean;
  has_discord: boolean;
  can_earn_rewards: boolean;
  
  // Membership info
  membership_tx_hash?: string;
  joined_at?: string;
  
  // Stats
  total_commits?: number;
  total_earned?: number;
}

export interface UniversalAuthContextType {
  // Core state
  user: UniversalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Context detection
  entryContext: 'webapp' | 'farcaster' | null;
  
  // Actions
  authenticateByWallet: (walletAddress: string) => Promise<void>;
  linkGithub: (githubData: any) => Promise<void>;
  linkDiscord: (discordData: any) => Promise<void>;
  processMembershipPurchase: (txHash: string, amount: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UniversalAuthContext = createContext<UniversalAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'abc_universal_user';

export function UniversalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UniversalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entryContext, setEntryContext] = useState<'webapp' | 'farcaster' | null>(null);
  
  const { address } = useAccount();
  const { user: farcasterUser, isInMiniApp, isAuthenticated: farcasterAuthenticated } = useFarcaster();

  // Initialize authentication
  useEffect(() => {
    initializeAuth();
  }, [address, farcasterUser, isInMiniApp]);

  const initializeAuth = async () => {
    setIsLoading(true);
    setError(null);


    try {
      // Determine entry context
      if (isInMiniApp && farcasterUser) {
        console.log('📱 Using Farcaster authentication');
        setEntryContext('farcaster');
        await authenticateViaFarcaster();
      } else if (address) {
        console.log('💰 Using Wallet authentication');
        setEntryContext('webapp');
        await authenticateByWallet(address);
      } else {
        console.log('💾 Trying to restore from localStorage');
        // Try to restore from localStorage
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          await tryRestoreFromStorage();
        } else {
          console.log('🆕 No stored user, no wallet - setting default webapp context');
          // No stored user and no wallet connected - this is normal for first time visitors
          setEntryContext('webapp'); // Default to webapp context for web users
        }
      }
    } catch (err) {
      console.error('❌ Auth initialization error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateViaFarcaster = async () => {
    if (!farcasterUser) {
      console.log('❌ No Farcaster user available');
      return;
    }

    console.log('📱 Authenticating via Farcaster:', { fid: farcasterUser.fid });

    try {
      const response = await fetch(`${config.backendUrl}/api/universal-auth/farcaster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: farcasterUser.fid
        }),
      });

      console.log('📱 Farcaster auth response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📱 Farcaster auth success:', data);
        if (data.user) {
          const universalUser = mapToUniversalUser(data.user, 'farcaster');
          console.log('📱 Mapped Farcaster user:', universalUser);
          setUser(universalUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(universalUser));
        }
      } else {
        const errorData = await response.text();
        console.error('📱 Farcaster auth failed:', errorData);
        throw new Error('Farcaster authentication failed');
      }
    } catch (err) {
      console.error('❌ Farcaster auth error:', err);
      throw err;
    }
  };

  const authenticateByWallet = async (walletAddress: string) => {
    console.log('💰 Authenticating via Wallet:', walletAddress);
    
    try {
      const response = await fetch(`${config.backendUrl}/api/universal-auth/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress
        }),
      });
      
      console.log('💰 Wallet auth response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('💰 Wallet auth success:', data);
        
        if (data.action === 'authenticated' && data.user) {
          const universalUser = mapToUniversalUser(data.user, 'webapp');
          setUser(universalUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(universalUser));
        } else if (data.action === 'purchase_membership' || data.action === 'require_membership') {
          // User needs to purchase membership
          setUser(null);
          setError('Membership purchase required');
        }
      } else {
        const errorData = await response.text();
        console.error('UniversalAuth: API error response:', response.status, errorData);
        throw new Error(`Wallet authentication failed: ${response.status}`);
      }
    } catch (err) {
      console.error('UniversalAuth: Wallet auth error:', err);
      throw err;
    }
  };

  const tryRestoreFromStorage = async () => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setEntryContext(parsedUser.entry_context || 'webapp');
        
        // Verify user is still valid
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to restore user session:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const linkGithub = async (githubData: any) => {
    if (!user) throw new Error('No authenticated user');

    try {
      const response = await fetch(`${config.backendUrl}/api/universal-auth/github/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: user.wallet_address_primary,
          github_data: githubData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const updatedUser = mapToUniversalUser(data.user, user.entry_context);
          setUser(updatedUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        }
      } else {
        throw new Error('GitHub linking failed');
      }
    } catch (err) {
      console.error('GitHub linking error:', err);
      throw err;
    }
  };

  const linkDiscord = async (discordData: any) => {
    if (!user) throw new Error('No authenticated user');

    try {
      const response = await fetch(`${config.backendUrl}/api/universal-auth/discord/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: user.wallet_address_primary,
          discord_data: discordData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const updatedUser = mapToUniversalUser(data.user, user.entry_context);
          setUser(updatedUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        }
      } else {
        throw new Error('Discord linking failed');
      }
    } catch (err) {
      console.error('Discord linking error:', err);
      throw err;
    }
  };

  const processMembershipPurchase = async (txHash: string, amount: string) => {
    if (!address) throw new Error('No wallet connected');

    try {
      const response = await fetch(`${config.backendUrl}/api/universal-auth/membership/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
          tx_hash: txHash,
          amount: amount
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const universalUser = mapToUniversalUser(data.user, entryContext || 'webapp');
          setUser(universalUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(universalUser));
        }
      } else {
        throw new Error('Membership purchase processing failed');
      }
    } catch (err) {
      console.error('Membership purchase error:', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setEntryContext(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      if (user.entry_context === 'farcaster' && farcasterUser) {
        await authenticateViaFarcaster();
      } else if (user.wallet_address_primary) {
        await authenticateByWallet(user.wallet_address_primary);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // Helper function to map backend user data to UniversalUser
  const mapToUniversalUser = (backendUser: any, context: 'webapp' | 'farcaster'): UniversalUser => {
    return {
      wallet_address_primary: backendUser.wallet_address_primary || backendUser.wallet_address,
      display_name: backendUser.display_name || backendUser.farcaster_username || 'Anonymous',
      entry_context: context,
      farcaster_fid: backendUser.farcaster_fid,
      farcaster_username: backendUser.farcaster_username,
      github_username: backendUser.github_username,
      discord_username: backendUser.discord_username,
      is_member: backendUser.has_membership || backendUser.membership_status === 'paid' || !!backendUser.membership_tx_hash,
      has_github: backendUser.has_github || !!backendUser.github_username,
      has_farcaster: backendUser.has_farcaster || !!backendUser.farcaster_fid,
      has_discord: backendUser.has_discord || !!backendUser.discord_id,
      can_earn_rewards: backendUser.can_earn_rewards || (!!backendUser.github_username && !!backendUser.membership_tx_hash),
      membership_tx_hash: backendUser.membership_tx_hash,
      joined_at: backendUser.joined_at || backendUser.membership_paid_at,
      total_commits: backendUser.total_commits || 0,
      total_earned: parseInt(backendUser.total_earned || backendUser.total_rewards_earned || backendUser.total_abc_earned || '0'),
    };
  };

  const value: UniversalAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    entryContext,
    authenticateByWallet,
    linkGithub,
    linkDiscord,
    processMembershipPurchase,
    logout,
    refreshUser,
  };

  return (
    <UniversalAuthContext.Provider value={value}>
      {children}
    </UniversalAuthContext.Provider>
  );
}

export function useUniversalAuth() {
  const context = useContext(UniversalAuthContext);
  if (context === undefined) {
    throw new Error('useUniversalAuth must be used within a UniversalAuthProvider');
  }
  return context;
}