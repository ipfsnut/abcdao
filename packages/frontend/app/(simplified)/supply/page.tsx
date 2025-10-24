/**
 * Token Supply Analytics Page (/supply)
 * 
 * Comprehensive view of ABC token distribution and supply analytics
 */

'use client';

import { BackNavigation } from '@/components/back-navigation';
import { TokenSupplyChart } from '@/components/token-supply-chart';

export default function SupplyAnalytics() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="Token Supply Analytics" 
        subtitle="ABC token distribution and supply breakdown" 
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Supply Overview Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">$ABC Token Supply</h1>
            <p className="text-green-600 text-sm max-w-2xl mx-auto">
              Real-time analytics of ABC token distribution, including circulating supply, 
              locked tokens, staking pools, and treasury allocations.
            </p>
          </div>

          {/* Token Supply Chart */}
          <div className="bg-gray-900/50 border border-green-900/30 rounded-lg p-6">
            <TokenSupplyChart />
          </div>

          {/* Additional Supply Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            
            <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-6">
              <div className="text-blue-400 text-xl mb-2">📊</div>
              <h3 className="text-lg font-bold text-blue-300 mb-2">Supply Health</h3>
              <p className="text-xs text-blue-600">
                Track token velocity, distribution fairness, and concentration metrics
                to ensure healthy tokenomics.
              </p>
            </div>

            <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-6">
              <div className="text-green-400 text-xl mb-2">🔒</div>
              <h3 className="text-lg font-bold text-green-300 mb-2">Locked Tokens</h3>
              <p className="text-xs text-green-600">
                View vesting schedules, staking locks, and other mechanisms that
                remove tokens from circulation.
              </p>
            </div>

            <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-6">
              <div className="text-purple-400 text-xl mb-2">💰</div>
              <h3 className="text-lg font-bold text-purple-300 mb-2">Treasury</h3>
              <p className="text-xs text-purple-600">
                Monitor protocol treasury holdings and their impact on
                total supply and market dynamics.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}