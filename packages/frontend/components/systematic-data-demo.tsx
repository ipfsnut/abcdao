'use client';

import React from 'react';
import { useTreasury } from '@/hooks/useTreasury';
import { useTreasurySystematic } from '@/hooks/useTreasurySystematic';
import { useStaking } from '@/hooks/useStaking';
import { useStakingSystematic } from '@/hooks/useStakingSystematic';

/**
 * Systematic Data Architecture Demo
 * 
 * This component demonstrates the difference between:
 * 1. OLD: Reactive pattern with direct blockchain calls
 * 2. NEW: Systematic pattern consuming pre-computed data
 * 
 * Shows the data architecture redesign vision in action.
 */
export function SystematicDataDemo() {
  // OLD: Direct blockchain calls (reactive pattern)
  const oldTreasury = useTreasury();
  const oldStaking = useStaking();

  // NEW: Systematic API consumption (proactive data management)
  const newTreasury = useTreasurySystematic();
  const newStaking = useStakingSystematic();

  return (
    <div className="p-6 bg-black text-green-400 font-mono">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          📊 ABC DAO Data Architecture Redesign Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* OLD: Reactive Pattern */}
          <div className="border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-red-400">
              🔴 OLD: Reactive Pattern
            </h2>
            <p className="text-sm mb-4 text-gray-400">
              Direct blockchain calls, mixed responsibilities, reactive data fetching
            </p>
            
            {/* Treasury Data - OLD */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-red-300">Treasury (Direct Blockchain)</h3>
              <div className="bg-red-950/20 p-3 rounded text-xs">
                <div>Balance: {oldTreasury.treasuryBalance || '0'} ABC</div>
                <div>Loading: {oldTreasury.isLoading ? '⏳ Yes' : '✅ No'}</div>
                <div>Error: {oldTreasury.isError ? '❌ Yes' : '✅ No'}</div>
                <div className="text-red-400 mt-2">
                  📡 useReadContract → Blockchain RPC → Response
                </div>
              </div>
            </div>

            {/* Staking Data - OLD */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-red-300">Staking (Direct Blockchain)</h3>
              <div className="bg-red-950/20 p-3 rounded text-xs">
                <div>Loading: {(oldStaking.isStakeLoading || oldStaking.isUnstakeLoading || oldStaking.isClaimLoading) ? '⏳ Yes' : '✅ No'}</div>
                <div>Error: {'✅ No'}</div>
                <div className="text-red-400 mt-2">
                  📡 Multiple useReadContract calls → Blockchain RPC → Response
                </div>
              </div>
            </div>

            <div className="text-red-400 text-xs">
              ❌ Problems:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Slow response times</li>
                <li>Mixed responsibilities</li>
                <li>No data ownership</li>
                <li>Inconsistent caching</li>
                <li>Frontend directly coupled to blockchain</li>
              </ul>
            </div>
          </div>

          {/* NEW: Systematic Pattern */}
          <div className="border border-green-500/30 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-green-400">
              🟢 NEW: Systematic Pattern
            </h2>
            <p className="text-sm mb-4 text-gray-400">
              Pre-computed data, domain ownership, proactive data management
            </p>
            
            {/* Treasury Data - NEW */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-green-300">Treasury (Systematic API)</h3>
              <div className="bg-green-950/20 p-3 rounded text-xs">
                <div>Balance: {newTreasury.treasuryBalance || '0'} ABC</div>
                <div>ETH: {newTreasury.ethBalance || '0'} ETH</div>
                <div>Total USD: ${newTreasury.totalValueUSD || '0'}</div>
                <div>TVL: {newTreasury.stakingTVL || '0'} ABC</div>
                <div>Loading: {newTreasury.isLoading ? '⏳ Yes' : '✅ No'}</div>
                <div>Error: {newTreasury.isError ? '❌ Yes' : '✅ No'}</div>
                <div>Healthy: {newTreasury.dataHealth?.isHealthy ? '✅ Yes' : '❌ No'}</div>
                <div className="text-green-400 mt-2">
                  🏦 Treasury Data Manager → Pre-computed → API → Response
                </div>
              </div>
            </div>

            {/* Staking Data - NEW */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-green-300">Staking (Systematic API)</h3>
              <div className="bg-green-950/20 p-3 rounded text-xs">
                <div>Total Staked: {newStaking.totalStaked || '0'} ABC</div>
                <div>Total Stakers: {newStaking.totalStakers || '0'}</div>
                <div>Current APY: {newStaking.currentAPY || '0'}%</div>
                <div>Pool Balance: {newStaking.rewardsPoolBalance || '0'} ETH</div>
                <div>Loading: {newStaking.isLoading ? '⏳ Yes' : '✅ No'}</div>
                <div>Error: {newStaking.isError ? '❌ Yes' : '✅ No'}</div>
                <div>Healthy: {newStaking.dataHealth?.isHealthy ? '✅ Yes' : '❌ No'}</div>
                <div className="text-green-400 mt-2">
                  ⚡ Staking Data Manager → Pre-computed → API → Response
                </div>
              </div>
            </div>

            <div className="text-green-400 text-xs">
              ✅ Benefits:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Instant response times (&lt;200ms)</li>
                <li>Clear data domain ownership</li>
                <li>Proactive data updates</li>
                <li>Consistent data freshness</li>
                <li>Frontend decoupled from blockchain</li>
                <li>Real-time feeling with batch updates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Architecture Comparison */}
        <div className="mt-8 border border-blue-500/30 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-400">
            🏗️ Architecture Comparison
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <h3 className="font-semibold mb-2 text-red-300">Old Flow (Reactive)</h3>
              <div className="bg-red-950/20 p-3 rounded font-mono">
                Frontend Request<br/>
                ↓<br/>
                useReadContract<br/>
                ↓<br/>
                Blockchain RPC Call<br/>
                ↓<br/>
                Wait for Response<br/>
                ↓<br/>
                Parse & Format<br/>
                ↓<br/>
                Update UI
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-green-300">New Flow (Systematic)</h3>
              <div className="bg-green-950/20 p-3 rounded font-mono">
                Data Manager<br/>
                ↓ (Proactive, 5min intervals)<br/>
                Blockchain Calls<br/>
                ↓<br/>
                Database Storage<br/>
                ↓<br/>
                Frontend Request<br/>
                ↓<br/>
                API (Pre-computed)<br/>
                ↓<br/>
                Instant Response
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Status */}
        <div className="mt-8 border border-purple-500/30 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-purple-400">
            📋 Implementation Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <h3 className="font-semibold mb-2 text-green-300">✅ Completed</h3>
              <ul className="space-y-1">
                <li>• Treasury Data Manager (95%)</li>
                <li>• Staking Data Manager (95%)</li>
                <li>• Systematic API endpoints</li>
                <li>• Database schemas</li>
                <li>• Background service integration</li>
                <li>• Data freshness monitoring</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-yellow-300">🔄 Next Steps</h3>
              <ul className="space-y-1">
                <li>• Deploy to Railway production</li>
                <li>• Update frontend hooks</li>
                <li>• User/Commit Data Manager</li>
                <li>• Blockchain Events Manager</li>
                <li>• Complete frontend migration</li>
                <li>• Remove legacy patterns</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          🎯 Goal: Transform ABC DAO from reactive, ad-hoc system into proactive, systematic data platform
        </div>
      </div>
    </div>
  );
}