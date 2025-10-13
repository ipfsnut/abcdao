'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useConnect, useAccount } from 'wagmi';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
}

interface FarcasterContextType {
  // User state
  user: FarcasterUser | null;
  isAuthenticated: boolean;
  
  // Context state
  isInMiniApp: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (user: FarcasterUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

const STORAGE_KEY = 'abc_farcaster_user';

export function UnifiedFarcasterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Wagmi hooks for wallet connection
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First, try to get user from Farcaster SDK (miniapp context)
        const isMiniApp = await tryMiniAppAuth();
        
        if (!isMiniApp) {
          // If not in miniapp, try to restore from localStorage (web context)
          tryWebAuth();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Try to authenticate via Farcaster miniapp SDK
  const tryMiniAppAuth = async (): Promise<boolean> => {
    try {
      console.log('🔍 Checking for Farcaster miniapp context...');
      
      // Check if SDK is available
      if (!sdk) {
        console.log('❌ SDK not available');
        return false;
      }

      // Get context from SDK
      const context = await sdk.context;
      console.log('✅ SDK Context received:', context);

      if (context?.user) {
        const miniAppUser: FarcasterUser = {
          fid: context.user.fid,
          username: context.user.username || '',
          displayName: context.user.displayName || context.user.username || '',
          pfpUrl: context.user.pfpUrl || ''
        };

        console.log('✅ Miniapp user authenticated:', miniAppUser);
        setUser(miniAppUser);
        setIsInMiniApp(true);
        
        // Store in localStorage for consistency
        localStorage.setItem(STORAGE_KEY, JSON.stringify(miniAppUser));
        
        // Auto-connect wallet in miniapp
        if (!isConnected && connectors.length > 0) {
          try {
            console.log('🔗 Auto-connecting Farcaster wallet...');
            connect({ connector: connectors[0] });
          } catch (error) {
            console.log('ℹ️ Auto-connect failed:', error);
          }
        }
        
        // Call SDK ready
        await sdk.actions.ready();
        
        return true;
      }

      console.log('ℹ️ No user in SDK context');
      return false;
    } catch (error) {
      console.log('ℹ️ Not in miniapp context:', error);
      return false;
    }
  };

  // Try to authenticate from stored web session
  const tryWebAuth = () => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ Restored user from storage:', parsedUser);
        setUser(parsedUser);
        setIsInMiniApp(false);
      } else {
        console.log('ℹ️ No stored user session');
      }
    } catch (error) {
      console.error('Failed to restore user session:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Login function for web authentication
  const login = (userData: FarcasterUser) => {
    console.log('🔐 Logging in user:', userData);
    setUser(userData);
    setIsInMiniApp(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  // Logout function
  const logout = () => {
    console.log('👋 Logging out user');
    setUser(null);
    setIsInMiniApp(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Refresh user data
  const refreshUser = async () => {
    if (isInMiniApp) {
      // Refresh from SDK
      await tryMiniAppAuth();
    } else if (user) {
      // Refresh from backend API
      try {
        const response = await fetch(`/api/users/${user.fid}/status`);
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            const refreshedUser: FarcasterUser = {
              fid: data.user.farcaster_fid,
              username: data.user.farcaster_username,
              displayName: data.user.farcaster_username,
              pfpUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${data.user.farcaster_username}`
            };
            setUser(refreshedUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshedUser));
          }
        }
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const value: FarcasterContextType = {
    user,
    isAuthenticated: !!user,
    isInMiniApp,
    isLoading,
    error,
    login,
    logout,
    refreshUser
  };

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  );
}

// Hook to use the Farcaster context
export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error('useFarcaster must be used within a UnifiedFarcasterProvider');
  }
  return context;
}

// Backward compatibility exports
export const FarcasterProvider = UnifiedFarcasterProvider;
export const useFarcasterUser = useFarcaster;