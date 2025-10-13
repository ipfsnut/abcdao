'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/web3';
import { FarcasterProvider } from '@/contexts/farcaster-context';
import { FarcasterMiniAppProvider } from './farcaster-miniapp';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

// Custom matrix/terminal theme for RainbowKit
const matrixTheme = darkTheme({
  accentColor: '#10B981', // green-500
  accentColorForeground: '#000000',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Override specific colors to match matrix theme
const customMatrixTheme = {
  ...matrixTheme,
  colors: {
    ...matrixTheme.colors,
    accentColor: '#10B981',
    accentColorForeground: '#000000',
    actionButtonBorder: '#166534',
    actionButtonBorderMobile: '#166534',
    actionButtonSecondaryBackground: '#052e16',
    closeButton: '#065f46',
    closeButtonBackground: '#052e16',
    connectButtonBackground: '#052e16',
    connectButtonBackgroundError: '#7f1d1d',
    connectButtonInnerBackground: '#064e3b',
    connectButtonText: '#10B981',
    connectButtonTextError: '#ef4444',
    connectionIndicator: '#10B981',
    downloadBottomCardBackground: '#000000',
    downloadTopCardBackground: '#052e16',
    error: '#ef4444',
    generalBorder: '#166534',
    generalBorderDim: '#065f46',
    menuItemBackground: '#052e16',
    modalBackdrop: 'rgba(0, 0, 0, 0.8)',
    modalBackground: '#000000',
    modalBorder: '#166534',
    modalText: '#10B981',
    modalTextDim: '#059669',
    modalTextSecondary: '#047857',
    profileAction: '#052e16',
    profileActionHover: '#064e3b',
    profileForeground: '#000000',
    selectedOptionBorder: '#10B981',
    standby: '#059669',
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FarcasterMiniAppProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={customMatrixTheme}>
            <FarcasterProvider>
              {children}
            </FarcasterProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </FarcasterMiniAppProvider>
  );
}