'use client';

import { useState } from 'react';
import { useAPYCalculator } from '@/hooks/useAPYCalculator';

export function APYCalculator() {
  const { apyData, calculateProjectedEarnings, getAPYRange, getOptimalStakingAmount, isLoading } = useAPYCalculator();
  const [calculatorAmount, setCalculatorAmount] = useState('10000');
  const [targetMonthly, setTargetMonthly] = useState('100');

  const formatUSD = (amount: number) => {
    if (amount < 0.01) return '$0.00';
    if (amount < 1) return `$${amount.toFixed(3)}`;
    if (amount < 100) return `$${amount.toFixed(2)}`;
    if (amount < 10000) return `$${amount.toFixed(0)}`;
    if (amount < 1000000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  const formatETH = (amount: number) => {
    if (amount < 0.0001) return '0.0000';
    if (amount < 0.001) return amount.toFixed(6);
    if (amount < 0.01) return amount.toFixed(5);
    return amount.toFixed(4);
  };

  const getTrendIcon = () => {
    switch (apyData.trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = () => {
    switch (apyData.trend) {
      case 'increasing': return 'text-green-400';
      case 'decreasing': return 'text-red-400';
      default: return 'text-green-400';
    }
  };

  const projectedEarnings = calculateProjectedEarnings(parseFloat(calculatorAmount) || 0, 'month');
  const optimalAmount = getOptimalStakingAmount(parseFloat(targetMonthly) || 0);
  const apyRange = getAPYRange();

  if (isLoading) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-green-800/30 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-green-950/20 rounded-lg"></div>
              <div className="h-20 bg-green-950/20 rounded-lg"></div>
            </div>
            <div className="h-32 bg-green-950/20 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-green-400 matrix-glow font-mono">
          {'>'} APY_calculator()
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-mono text-xs">Trend:</span>
          <span className={`${getTrendColor()} font-mono text-sm`}>
            {getTrendIcon()} {apyData.trend}
          </span>
        </div>
      </div>

      {/* Current APY Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
          <p className="text-green-600 text-xs font-mono mb-1">Current APY</p>
          <p className="text-lg font-bold text-green-400 matrix-glow">
            {apyData.currentAPY.toFixed(1)}%
          </p>
          <p className="text-green-700 text-xs font-mono">This week</p>
        </div>
        
        <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
          <p className="text-green-600 text-xs font-mono mb-1">4-Week Avg</p>
          <p className="text-lg font-bold text-green-400 matrix-glow">
            {apyData.averageAPY.toFixed(1)}%
          </p>
          <p className="text-green-700 text-xs font-mono">Rolling average</p>
        </div>
        
        <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
          <p className="text-green-600 text-xs font-mono mb-1">ETH/ABC/Week</p>
          <p className="text-lg font-bold text-green-400 matrix-glow">
            {(apyData.weeklyETHPerABC * 1000000).toFixed(2)}
          </p>
          <p className="text-green-700 text-xs font-mono">Per 1M $ABC</p>
        </div>
        
        <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
          <p className="text-green-600 text-xs font-mono mb-1">APY Range</p>
          <p className="text-lg font-bold text-green-400 matrix-glow">
            {apyRange.min.toFixed(0)}-{apyRange.max.toFixed(0)}%
          </p>
          <p className="text-green-700 text-xs font-mono">Last 8 weeks</p>
        </div>
      </div>

      {/* Interactive Calculator */}
      <div className="space-y-6">
        <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
          <h4 className="text-green-400 font-mono text-sm mb-4">Earnings Projector</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-green-600 mb-2 font-mono">
                Staking Amount ($ABC)
              </label>
              <input
                type="number"
                value={calculatorAmount}
                onChange={(e) => setCalculatorAmount(e.target.value)}
                placeholder="10000"
                className="w-full bg-black border border-green-900/50 rounded-lg px-3 py-2 text-green-400 font-mono text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600
                         placeholder:text-green-800"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-green-600 font-mono">Projected Monthly Earnings</p>
              <div className="bg-black/40 border border-green-900/30 rounded p-3">
                <div className="text-green-400 font-mono text-sm font-bold">
                  {formatETH(projectedEarnings.eth)} ETH
                </div>
                <div className="text-green-700 font-mono text-xs">
                  ≈ {formatUSD(projectedEarnings.usd)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
          <h4 className="text-green-400 font-mono text-sm mb-4">Target Income Calculator</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-green-600 mb-2 font-mono">
                Target Monthly Income (USD)
              </label>
              <input
                type="number"
                value={targetMonthly}
                onChange={(e) => setTargetMonthly(e.target.value)}
                placeholder="100"
                className="w-full bg-black border border-green-900/50 rounded-lg px-3 py-2 text-green-400 font-mono text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600
                         placeholder:text-green-800"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-green-600 font-mono">Required Staking Amount</p>
              <div className="bg-black/40 border border-green-900/30 rounded p-3">
                <div className="text-green-400 font-mono text-sm font-bold">
                  {optimalAmount.toFixed(0)} $ABC
                </div>
                <div className="text-green-700 font-mono text-xs">
                  ≈ {formatUSD(optimalAmount * 0.0001)} {/* Assuming $ABC price */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
          <h4 className="text-green-400 font-mono text-sm mb-4">Current Week Performance</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-green-600">Your Projected Weekly:</span>
              <div className="text-green-400 mt-1">
                {formatETH(projectedEarnings.eth / 4.33)} ETH
              </div>
              <div className="text-green-700">
                {formatUSD(projectedEarnings.usd / 4.33)}
              </div>
            </div>
            
            <div>
              <span className="text-green-600">Efficiency Rate:</span>
              <div className="text-green-400 mt-1">
                {(apyData.stakingEfficiency * 1000000).toFixed(3)} ETH
              </div>
              <div className="text-green-700">per 1M $ABC/week</div>
            </div>
            
            <div>
              <span className="text-green-600">Yearly Projection:</span>
              <div className="text-green-400 mt-1">
                {formatETH(apyData.projectedYearlyETH)} ETH
              </div>
              <div className="text-green-700">
                {formatUSD(apyData.projectedYearlyUSD)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-green-900/30">
        <p className="text-green-600 font-mono text-xs">
          * Calculations based on historical data. Actual returns may vary based on ETH rewards, total staked amount, and market conditions.
        </p>
      </div>
    </div>
  );
}