'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/web3';
import { FarcasterProvider } from '@/contexts/farcaster-context';
import { FarcasterMiniAppProvider } from './farcaster-miniapp';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FarcasterMiniAppProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <FarcasterProvider>
              {children}
            </FarcasterProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </FarcasterMiniAppProvider>
  );
}