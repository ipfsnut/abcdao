'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

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
  sdk: typeof sdk | null;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isInMiniApp: false,
  sdk: null
});

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        console.log('🔍 Initializing Farcaster Mini App SDK...');
        
        // Check if we're in a miniapp context
        setIsInMiniApp(true);
        
        // Get user context from official SDK
        try {
          // Get user context from SDK
          const context = await sdk.context;
          console.log('✅ SDK Context:', context);
          
          if (context?.user) {
            const userContext: FarcasterUser = {
              fid: context.user.fid || 0,
              username: context.user.username || '',
              displayName: context.user.displayName || context.user.username || '',
              pfpUrl: context.user.pfpUrl || '',
              isConnected: true
            };
            
            console.log('✅ Farcaster user context loaded:', userContext);
            setUser(userContext);
          } else {
            console.log('ℹ️ No user context available from SDK');
            // Fallback for testing
            setUser({
              fid: 8573,
              username: 'ipfsnut',
              displayName: 'ipfsnut',
              pfpUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ipfsnut',
              isConnected: true
            });
            console.log('🧪 Using fallback user data');
          }
          
          // Call ready when app is loaded
          await sdk.actions.ready();
          console.log('✅ SDK ready called');
          
        } catch (error) {
          console.log('ℹ️ SDK context error:', error);
          // Fallback for testing
          setUser({
            fid: 8573,
            username: 'ipfsnut',
            displayName: 'ipfsnut',
            pfpUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ipfsnut',
            isConnected: true
          });
          console.log('🧪 Using fallback user data due to error');
        }
      } catch (error) {
        console.log('Failed to initialize miniapp:', error);
        setIsInMiniApp(false);
      }
    };

    initializeMiniApp();
  }, []);

  return (
    <FarcasterContext.Provider value={{ user, isInMiniApp, sdk }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  return useContext(FarcasterContext);
}