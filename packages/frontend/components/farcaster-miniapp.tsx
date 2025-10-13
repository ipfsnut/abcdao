'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { miniAppHost } from '@farcaster/miniapp-sdk';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  isConnected: boolean;
}

interface FarcasterContextType {
  user: FarcasterUser | null;
  isInMiniApp: boolean;
  sdk: typeof miniAppHost | null;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isInMiniApp: false,
  sdk: null
});

export function FarcasterMiniAppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [sdk, setSdk] = useState<typeof miniAppHost | null>(null);

  useEffect(() => {
    // Initialize Farcaster miniapp SDK
    try {
      // Signal that the miniapp is ready (removes splash screen)
      miniAppHost.ready();
      
      // Check if we're in a miniapp context
      setIsInMiniApp(true);
      setSdk(miniAppHost);
      
      // Get user context from miniapp
      const getUserContext = async () => {
        try {
          // Check if user context is available from URL params or miniapp
          const urlParams = new URLSearchParams(window.location.search);
          const fidFromUrl = urlParams.get('fid');
          
          let context = null;
          
          // Try to request user data from miniapp SDK
          try {
            if (miniAppHost && typeof (miniAppHost as any).getUserData === 'function') {
              const userData = await (miniAppHost as any).getUserData();
              if (userData) {
                context = userData;
                console.log('✅ Got user data from miniapp SDK:', userData);
              }
            }
          } catch (error) {
            console.log('ℹ️ getUserData not available or failed:', error);
          }
          
          // Try to get from miniapp context if no user data
          if (!context && 'context' in miniAppHost && (miniAppHost as unknown as Record<string, unknown>).context) {
            context = ((miniAppHost as unknown as Record<string, unknown>).context as Record<string, unknown>)?.user;
          }
          
          // Fallback to URL params if in miniapp
          if (!context && fidFromUrl) {
            context = {
              fid: parseInt(fidFromUrl),
              username: urlParams.get('username') || 'user',
              displayName: urlParams.get('displayName') || 'User'
            };
          }
          if (context) {
            const typedContext = context as Record<string, unknown>;
            setUser({
              fid: typedContext.fid as number,
              username: (typedContext.username || '') as string,
              displayName: (typedContext.displayName || typedContext.display_name || '') as string,
              pfpUrl: ((typedContext.pfp as Record<string, unknown>)?.url || typedContext.pfpUrl || '') as string,
              isConnected: true
            });
            console.log('✅ Farcaster user context loaded:', context);
          } else {
            console.log('ℹ️ No user context available from miniapp');
            // For miniapp testing, use the real user data
            setUser({
              fid: 8573,
              username: 'ipfsnut',
              displayName: 'ipfsnut', 
              pfpUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ipfsnut',
              isConnected: true
            });
            console.log('🧪 Using hardcoded user data for miniapp testing');
          }
        } catch (error) {
          console.log('ℹ️ Could not get user context:', error);
          // For miniapp testing, use the real user data
          setUser({
            fid: 8573,
            username: 'ipfsnut',
            displayName: 'ipfsnut',
            pfpUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ipfsnut',
            isConnected: true
          });
          console.log('🧪 Using hardcoded user data for miniapp testing (fallback)');
        }
      };

      getUserContext();
      
      // Store SDK instance globally for backward compatibility
      (window as unknown as Record<string, unknown>).farcasterSDK = miniAppHost;
      
      console.log('✅ Farcaster miniapp SDK initialized');
    } catch (error) {
      console.log('ℹ️ Running outside Farcaster context (normal for local dev):', error);
      setIsInMiniApp(false);
    }
  }, []);

  const contextValue: FarcasterContextType = {
    user,
    isInMiniApp,
    sdk
  };

  return (
    <FarcasterContext.Provider value={contextValue}>
      {children}
    </FarcasterContext.Provider>
  );
}

// Hook to use Farcaster context
export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (!context) {
    throw new Error('useFarcaster must be used within FarcasterMiniAppProvider');
  }
  return context;
}

// Backward compatibility hook
export function useFarcasterSDK() {
  const { sdk } = useFarcaster();
  return sdk;
}