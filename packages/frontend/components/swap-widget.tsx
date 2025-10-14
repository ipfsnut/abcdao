'use client';

import { useState, useEffect } from 'react';
import { useFarcaster } from '@/contexts/unified-farcaster-context';

// Import Farcaster SDK
import { sdk } from '@farcaster/miniapp-sdk';

export function SwapWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const { isInMiniApp } = useFarcaster();

  const handleSwap = async () => {
    setIsLoading(true);
    setLastAction(null);

    try {
      // Method 1: Try official Farcaster SDK swap action
      if (isInMiniApp) {
        try {
          const result = await sdk.actions.swapToken({
            buyToken: 'eip155:8453/erc20:0x5c0872b790bb73e2b3a9778db6e7704095624b07', // $ABC on Base in CAIP-19 format
            // Optional: pre-fill ETH as sell token
            sellToken: 'eip155:8453/native', // ETH on Base
            // Optional: default sell amount (0.01 ETH = 10000000000000000 wei)
            sellAmount: '10000000000000000'
          });
          
          console.log('Swap result:', result);
          setLastAction('Farcaster swap opened successfully');
          return;
        } catch (error) {
          console.log('Farcaster SDK swap failed:', error);
          setLastAction('SDK swap failed - trying fallback');
        }
      }

      // Method 2: Try legacy window.fc approach (might be deprecated)
      if (typeof window !== 'undefined' && (window as any).fc?.actions?.swapToken) {
        try {
          await (window as any).fc.actions.swapToken({
            buyToken: 'eip155:8453/erc20:0x5c0872b790bb73e2b3a9778db6e7704095624b07',
            sellToken: 'eip155:8453/native'
          });
          setLastAction('Farcaster legacy swap opened');
          return;
        } catch (error) {
          console.log('Farcaster legacy swap failed:', error);
        }
      }

      // Method 3: Open Uniswap with token pre-filled as fallback
      const uniswapUrl = `https://app.uniswap.org/#/swap?chain=base&outputCurrency=0x5c0872b790bb73e2b3a9778db6e7704095624b07`;
      
      if (typeof window !== 'undefined') {
        window.open(uniswapUrl, '_blank');
        setLastAction('Opened Uniswap as fallback');
      }

    } catch (error) {
      console.error('All swap methods failed:', error);
      setLastAction('Swap unavailable - please try Uniswap directly');
    } finally {
      setIsLoading(false);
      // Clear status after 5 seconds
      setTimeout(() => setLastAction(null), 5000);
    }
  };

  const handleViewToken = async () => {
    setIsLoading(true);
    setLastAction(null);

    try {
      // Try Farcaster viewToken action first
      if (typeof window !== 'undefined' && (window as any).fc?.actions?.viewToken) {
        try {
          (window as any).fc.actions.viewToken({
            tokenAddress: '0x5c0872b790bb73e2b3a9778db6e7704095624b07',
            chainId: 8453
          });
          setLastAction('Token details opened');
          return;
        } catch (error) {
          console.log('Farcaster viewToken failed:', error);
        }
      }
      
      // Fallback to Basescan
      const basescanUrl = `https://basescan.org/token/0x5c0872b790bb73e2b3a9778db6e7704095624b07`;
      
      if (typeof window !== 'undefined' && (window as any).fc?.openUrl) {
        try {
          (window as any).fc.openUrl(basescanUrl);
          setLastAction('Opened Basescan in Farcaster');
          return;
        } catch (error) {
          console.log('Farcaster openUrl failed:', error);
        }
      }
      
      // Final fallback
      if (typeof window !== 'undefined') {
        window.open(basescanUrl, '_blank');
        setLastAction('Opened Basescan in new tab');
      }

    } catch (error) {
      console.error('View token failed:', error);
      setLastAction('Failed to open token details');
    } finally {
      setIsLoading(false);
      // Clear status after 3 seconds
      setTimeout(() => setLastAction(null), 3000);
    }
  };

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono text-center">
        {'>'} swap_tokens()
      </h2>
      
      <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4 mb-4">
        <p className="text-yellow-400 font-mono text-sm mb-2 text-center">
          💱 Trade $ABC
        </p>
        <p className="text-green-600 font-mono text-xs mb-4 text-center">
          {isInMiniApp ? 'Buy or sell $ABC tokens with native Farcaster wallet' : 'Buy or sell $ABC tokens on Uniswap'}
        </p>
        
        {/* Status Message */}
        {lastAction && (
          <div className="bg-green-950/30 border border-green-700/50 rounded-lg p-2 mb-4">
            <p className="text-green-400 font-mono text-xs text-center">
              ✅ {lastAction}
            </p>
          </div>
        )}
        
        {/* Native Farcaster Swap Widget */}
        <div className="bg-black/60 border border-green-900/30 rounded-lg p-4 min-h-[200px] flex flex-col items-center justify-center">
          <div className="w-full max-w-md text-center space-y-4">
            <div className="bg-green-950/30 border border-green-700/50 rounded-lg p-4">
              <p className="text-green-400 font-mono text-sm mb-2">$ABC Token</p>
              <p className="text-green-300 font-mono text-xs bg-black/50 p-2 rounded overflow-hidden">
                <span className="block truncate sm:hidden">0x5c08...4b07</span>
                <span className="hidden sm:block break-all">0x5c0872b790bb73e2b3a9778db6e7704095624b07</span>
              </p>
              <p className="text-green-500 font-mono text-xs mt-2">
                Base Network • {isInMiniApp ? 'Farcaster Compatible' : 'ERC-20'}
              </p>
            </div>
            
            <button
              onClick={handleSwap}
              disabled={isLoading}
              className="w-full bg-green-900/50 hover:bg-green-800/60 disabled:bg-green-950/30 text-green-400 font-mono px-6 py-4 rounded-lg border border-green-700/50 transition-all duration-300 matrix-button text-base font-semibold disabled:opacity-50 min-h-[48px] disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span>
                  Opening swap...
                </span>
              ) : (
                '💱 Swap for $ABC'
              )}
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={handleViewToken}
                disabled={isLoading}
                className="flex-1 bg-blue-900/50 hover:bg-blue-800/60 disabled:bg-blue-950/30 text-blue-300 font-mono px-4 py-3 rounded-lg border border-blue-700/50 transition-all duration-300 matrix-button text-sm disabled:opacity-50 min-h-[44px]"
              >
                👁️ View Token
              </button>
              
              <a
                href="https://www.geckoterminal.com/base/pools/0xc8038588bed93021fe8bffb0c9310da825a9a00faabab4a907f3b8328fa9f610"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-purple-900/50 hover:bg-purple-800/60 text-purple-300 font-mono px-4 py-3 rounded-lg border border-purple-700/50 transition-all duration-300 matrix-button text-sm text-center min-h-[44px] flex items-center justify-center"
              >
                📊 Charts
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-green-600/70 font-mono text-xs">
          {isInMiniApp ? 'Native Farcaster wallet integration. One-click swaps.' : 'Opens Uniswap for token swapping.'}
        </p>
        <p className="text-green-500/60 font-mono text-xs mt-1">
          Always verify contract address: 0x5c08...4b07
        </p>
      </div>
    </div>
  );
}