'use client';

import { useState, useEffect } from 'react';
import { TokenSupplyChart } from '@/components/token-supply-chart';
import { BuyABCSection } from '@/components/buy-abc-section';
import { config } from '@/lib/config';
import Link from 'next/link';

interface TokenSupplyData {
  total_supply: number;
  circulating_supply: number;
  breakdown: {
    [key: string]: {
      amount: number;
      percentage: number;
      color: string;
      label: string;
      description: string;
      locked: boolean;
    };
  };
  last_updated: string;
  data_sources: {
    [key: string]: string;
  };
}

export default function SupplyPage() {
  const [supplyData, setSupplyData] = useState<TokenSupplyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSupplyData();
  }, []);

  const fetchSupplyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.backendUrl}/api/stats/supply`);
      if (!response.ok) {
        throw new Error('Failed to fetch supply data');
      }
      const data = await response.json();
      setSupplyData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching supply data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatSupply = (amount: number): string => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M`;
    }
    return amount.toLocaleString();
  };

  const formatFullSupply = (amount: number): string => {
    return amount.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <img 
                  src="/abc-logo.png" 
                  alt="ABC Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                />
              </Link>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold matrix-glow">
                  {'>'} ABC_TOKEN_SUPPLY
                </h1>
                <p className="text-xs text-green-600 font-mono">
                  $ABC distribution breakdown
                </p>
              </div>
            </div>
            
            <Link 
              href="/"
              className="bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                         text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-mono 
                         transition-all duration-300 matrix-button text-sm"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="bg-green-950/20 border border-green-900/50 rounded-xl p-8">
              <p className="text-green-400 font-mono text-lg">Loading supply data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-8 text-center">
              <p className="text-red-400 font-mono text-lg mb-4">Failed to load supply data</p>
              <button
                onClick={fetchSupplyData}
                className="bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                           text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-mono 
                           transition-all duration-300 matrix-button text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        ) : supplyData ? (
          <>
            {/* Main Chart Section */}
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-8 mb-6 lg:mb-8">
              {/* Large Chart */}
              <div className="lg:col-span-2 bg-black/40 border border-green-900/50 rounded-xl p-4 lg:p-8 backdrop-blur-sm">
                <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-8 text-green-400 matrix-glow font-mono text-center">
                  {'>'} $ABC Token Distribution
                </h2>
                <div className="flex flex-col items-center">
                  <div className="w-full flex justify-center">
                    <div className="w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[450px]">
                      <TokenSupplyChart 
                        size={300} 
                        showCenter={true} 
                        interactive={true}
                      />
                    </div>
                  </div>
                  <div className="mt-4 lg:mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 lg:gap-3 w-full">
                    {Object.entries(supplyData.breakdown).map(([key, data]) => (
                      <div key={key} className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                        <div 
                          className="w-3 h-3 lg:w-4 lg:h-4 rounded-sm flex-shrink-0" 
                          style={{ backgroundColor: data.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-green-400 font-mono text-xs lg:text-sm font-bold truncate">
                            {data.label}
                          </p>
                          <p className="text-green-600 font-mono text-xs">
                            {data.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="space-y-3 lg:space-y-4">
                <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-bold mb-3 lg:mb-4 text-green-400 matrix-glow font-mono">
                    {'>'} Supply Overview
                  </h3>
                  <div className="space-y-2 lg:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-green-600 text-sm">Total Supply</span>
                      <span className="text-green-400 font-bold text-base lg:text-lg">
                        {formatFullSupply(supplyData.total_supply)} $ABC
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-green-600 text-sm">Circulating Supply</span>
                      <span className="text-green-400 font-bold text-base lg:text-lg">
                        {formatFullSupply(supplyData.circulating_supply)} $ABC
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-green-600 text-sm">Circulating %</span>
                      <span className="text-green-300 font-bold">
                        {((supplyData.circulating_supply / supplyData.total_supply) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
                    {'>'} Last Updated
                  </h3>
                  <p className="text-green-600 text-sm">
                    {new Date(supplyData.last_updated).toLocaleString()}
                  </p>
                  <button
                    onClick={fetchSupplyData}
                    className="mt-3 bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                               text-green-400 hover:text-green-300 px-3 py-1.5 rounded font-mono 
                               transition-all duration-300 matrix-button text-xs"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 lg:p-6 backdrop-blur-sm mb-6 lg:mb-8">
              <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-green-400 matrix-glow font-mono">
                {'>'} Detailed Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                {Object.entries(supplyData.breakdown).map(([key, data]) => (
                  <div 
                    key={key}
                    className="bg-green-950/10 border border-green-900/30 rounded-lg p-3 lg:p-4"
                  >
                    <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                      <div 
                        className="w-3 h-3 lg:w-4 lg:h-4 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: data.color }}
                      />
                      <h4 className="font-bold text-green-400 text-sm lg:text-base min-w-0 truncate">{data.label}</h4>
                      {data.locked && (
                        <span className="text-yellow-400 text-xs flex-shrink-0">🔒</span>
                      )}
                    </div>
                    <div className="space-y-1.5 lg:space-y-2">
                      <div>
                        <p className="text-green-300 font-bold text-base lg:text-lg">
                          {formatSupply(data.amount)}
                        </p>
                        <p className="text-green-600 text-xs lg:text-sm break-all">
                          {formatFullSupply(data.amount)} tokens
                        </p>
                      </div>
                      <div>
                        <p className="text-green-400 font-mono text-base lg:text-lg font-bold">
                          {data.percentage.toFixed(1)}%
                        </p>
                        <p className="text-green-600 text-xs">
                          of total supply
                        </p>
                      </div>
                      <p className="text-green-500 text-xs mt-2">
                        {data.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buy $ABC Section */}
            <BuyABCSection />
          </>
        ) : null}
      </div>
    </div>
  );
}