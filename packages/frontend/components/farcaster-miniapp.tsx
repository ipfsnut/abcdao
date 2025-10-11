'use client';

import { useEffect } from 'react';
import { MiniAppSDK } from '@farcaster/miniapp-sdk';

export function FarcasterMiniAppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Farcaster miniapp SDK
    try {
      const sdk = new MiniAppSDK();
      
      // Signal that the miniapp is ready (removes splash screen)
      sdk.actions.ready();
      
      // Store SDK instance globally for other components to use
      (window as any).farcasterSDK = sdk;
      
      console.log('✅ Farcaster miniapp SDK initialized');
    } catch (error) {
      console.log('ℹ️ Running outside Farcaster context (normal for local dev):', error);
    }
  }, []);

  return <>{children}</>;
}

// Hook to use Farcaster SDK
export function useFarcasterSDK() {
  if (typeof window !== 'undefined' && (window as any).farcasterSDK) {
    return (window as any).farcasterSDK as MiniAppSDK;
  }
  return null;
}