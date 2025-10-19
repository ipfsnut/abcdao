'use client';

import { useTokenSystematic } from '@/hooks/useTokenSystematic';

export function BuyABCSection() {
  const { tokenData, isLoading, error, formatPrice, formatVolume, formatMarketCap } = useTokenSystematic('ABC');

  return (
    <div className="bg-gradient-to-r from-green-950/30 via-black/60 to-green-950/30 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-green-400 matrix-glow font-mono mb-2">
          {'>'} Buy $ABC Tokens
        </h3>
        <p className="text-green-600 font-mono text-sm">
          Get $ABC to participate in the developer rewards ecosystem
        </p>
      </div>

      {/* Price Information */}
      {isLoading ? (
        <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-green-400 font-mono text-sm">Loading price data...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 mb-6">
          <p className="text-red-400 font-mono text-sm text-center">
            ⚠️ Price data unavailable
          </p>
        </div>
      ) : tokenData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 text-center">
            <p className="text-green-600 font-mono text-xs mb-1">Current Price</p>
            <p className="text-green-400 font-mono text-lg font-bold">
              ${formatPrice(tokenData.price)}
            </p>
            <p className={`font-mono text-xs mt-1 ${
              tokenData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {tokenData.priceChange24h >= 0 ? '↗' : '↘'} {Math.abs(tokenData.priceChange24h).toFixed(2)}%
            </p>
          </div>
          <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 text-center">
            <p className="text-green-600 font-mono text-xs mb-1">24h Volume</p>
            <p className="text-green-400 font-mono text-lg font-bold">
              {formatVolume(tokenData.volume24h)}
            </p>
          </div>
          <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 text-center">
            <p className="text-green-600 font-mono text-xs mb-1">Market Cap</p>
            <p className="text-green-400 font-mono text-lg font-bold">
              {formatMarketCap(tokenData.marketCap)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Buy Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="https://app.uniswap.org/#/swap?outputCurrency=0x5c0872b790bb73e2b3a9778db6e7704095624b07&chain=base"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-pink-900/30 hover:bg-pink-800/40 border border-pink-700/50 hover:border-pink-600/70 
                   text-pink-400 hover:text-pink-300 px-6 py-4 rounded-lg font-mono text-center
                   transition-all duration-300 matrix-button group"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-2xl">🦄</div>
            <span className="text-lg font-bold">Uniswap</span>
          </div>
          <p className="text-pink-500 text-sm">
            Best liquidity • Lowest slippage
          </p>
          <p className="text-pink-600 text-xs mt-1">
            Official DEX with deepest pools
          </p>
        </a>

        <a
          href="https://www.dextools.io/app/en/base/pair-explorer/0x5c0872b790bb73e2b3a9778db6e7704095624b07"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-900/30 hover:bg-blue-800/40 border border-blue-700/50 hover:border-blue-600/70 
                   text-blue-400 hover:text-blue-300 px-6 py-4 rounded-lg font-mono text-center
                   transition-all duration-300 matrix-button"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-2xl">📊</div>
            <span className="text-lg font-bold">DexTools</span>
          </div>
          <p className="text-blue-500 text-sm">
            Advanced charts • Analytics
          </p>
          <p className="text-blue-600 text-xs mt-1">
            Professional trading interface
          </p>
        </a>
      </div>

      {/* Important Notice */}
      <div className="mt-6 bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-yellow-400 text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="text-yellow-400 font-mono text-sm font-semibold mb-2">
              Important Trading Information
            </p>
            <ul className="text-yellow-500 font-mono text-xs space-y-1">
              <li>• $ABC is on Base Network - ensure you&apos;re using the correct network</li>
              <li>• Contract: 0x5c0872b790bb73e2b3a9778db6e7704095624b07</li>
              <li>• Always verify the contract address before trading</li>
              <li>• Consider price impact for large orders</li>
            </ul>
          </div>
        </div>
      </div>

      {/* What You Can Do */}
      <div className="mt-4 bg-green-950/10 border border-green-900/20 rounded-lg p-4">
        <p className="text-green-400 font-mono text-sm font-semibold mb-2">
          💎 What You Can Do With $ABC:
        </p>
        <ul className="text-green-600 font-mono text-xs space-y-1">
          <li>• Stake tokens to earn ETH rewards from trading fees</li>
          <li>• Pay 0.002 ETH membership to earn rewards for commits</li>
          <li>• Access token-gated community features</li>
          <li>• Participate in DAO governance (coming soon)</li>
        </ul>
      </div>
    </div>
  );
}