'use client';

import { useState, useEffect } from 'react';
import { useTokenSystematic } from '@/hooks/useTokenSystematic';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function ABCPriceWidget() {
  const { 
    tokenData, 
    isLoading: loading, 
    error, 
    formatPrice: formatPriceSystematic 
  } = useTokenSystematic('ABC');

  // Use the systematic formatter which already has proper decimal precision
  const formatPrice = (price: number | null) => {
    if (!price) return '$0.00';
    return `$${formatPriceSystematic(price)}`;
  };

  const formatLargeNumber = (num: number | null) => {
    if (!num) return '$0';
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (percent: number | null) => {
    if (percent === null) return '0.00%';
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const isPriceUp = tokenData?.priceChange24h && tokenData.priceChange24h > 0;
  const isPriceDown = tokenData?.priceChange24h && tokenData.priceChange24h < 0;

  if (error) {
    return (
      <Link href="/supply" className="block group">
        <div className="bg-black/40 border border-red-900/50 rounded-xl p-4 backdrop-blur-sm text-center max-w-6xl mx-auto hover:border-red-700/70 transition-all duration-300 cursor-pointer">
          <p className="text-red-400 font-mono text-sm group-hover:text-red-300 transition-colors">Failed to load $ABC price data • Click for more details</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/supply" className="block group">
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm max-w-6xl mx-auto hover:border-green-700/70 hover:bg-black/60 transition-all duration-300 cursor-pointer">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-green-400 matrix-glow font-mono mb-1 group-hover:text-green-300 transition-colors">
          $ABC Token
        </h2>
        <p className="text-green-600 font-mono text-sm group-hover:text-green-500 transition-colors">
          Live market data • Click for more details
        </p>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-4 bg-green-900/30 rounded mb-2"></div>
              <div className="h-8 bg-green-900/30 rounded mb-1"></div>
              <div className="h-3 bg-green-900/30 rounded"></div>
            </div>
            <div className="text-center">
              <div className="h-4 bg-green-900/30 rounded mb-2"></div>
              <div className="h-6 bg-green-900/30 rounded"></div>
            </div>
            <div className="text-center">
              <div className="h-4 bg-green-900/30 rounded mb-2"></div>
              <div className="h-6 bg-green-900/30 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Price */}
          <div className="text-center">
            <p className="text-green-600 font-mono text-sm mb-1">Price</p>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold text-green-400 matrix-glow font-mono">
                {formatPrice(tokenData?.price || 0)}
              </p>
              {tokenData && tokenData.priceChange24h !== null && (
                <div className={`flex items-center gap-1 mt-1 font-mono text-sm ${
                  isPriceUp ? 'text-green-400' : isPriceDown ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {isPriceUp && <ArrowUpIcon className="w-3 h-3" />}
                  {isPriceDown && <ArrowDownIcon className="w-3 h-3" />}
                  <span>{formatPercentage(tokenData.priceChange24h)} (24h)</span>
                </div>
              )}
            </div>
          </div>

          {/* Market Cap */}
          <div className="text-center">
            <p className="text-green-600 font-mono text-sm mb-1">Market Cap</p>
            <p className="text-xl font-bold text-green-400 font-mono">
              {formatLargeNumber(tokenData?.marketCap || 0)}
            </p>
          </div>

          {/* 24h Volume */}
          <div className="text-center">
            <p className="text-green-600 font-mono text-sm mb-1">24h Volume</p>
            <p className="text-xl font-bold text-green-400 font-mono">
              {formatLargeNumber(tokenData?.volume24h || 0)}
            </p>
          </div>
        </div>
      )}

      {/* CoinGecko Attribution */}
      <div className="text-center mt-4 pt-4 border-t border-green-900/30">
        <p className="text-green-600/70 font-mono text-xs">
          Powered by CoinGecko • Updates every 5 minutes
        </p>
      </div>
      </div>
    </Link>
  );
}