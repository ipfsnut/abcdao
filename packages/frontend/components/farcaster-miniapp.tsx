'use client';

import { useEffect } from 'react';
import { miniAppHost } from '@farcaster/miniapp-sdk';

export function FarcasterMiniAppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Farcaster miniapp SDK
    try {
      // Signal that the miniapp is ready (removes splash screen)
      miniAppHost.ready();
      
      // Store SDK instance globally for other components to use
      (window as unknown as Record<string, unknown>).farcasterSDK = miniAppHost;
      
      console.log('✅ Farcaster miniapp SDK initialized');
    } catch (error) {
      console.log('ℹ️ Running outside Farcaster context (normal for local dev):', error);
    }
  }, []);

  return <>{children}</>;
}

// Hook to use Farcaster SDK
export function useFarcasterSDK() {
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).farcasterSDK) {
    return (window as unknown as Record<string, unknown>).farcasterSDK;
  }
  return null;
}