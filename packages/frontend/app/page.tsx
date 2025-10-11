'use client';

import { FarcasterAuth } from '@/components/farcaster-auth';
import { GitHubLinkPanel } from '@/components/github-link';
import { WhitepaperButton } from '@/components/whitepaper-modal';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'stake' | 'vote' | 'proposals'>('stake');

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold matrix-glow">
                {'>'} ABC_DAO.exe
              </h1>
              <p className="text-sm text-green-600 mt-1 font-mono">
                {/* Ship code. Earn rewards. Build the future. */}
                Ship code. Earn rewards. Build the future.
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <WhitepaperButton />
              <FarcasterAuth />
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-black/80 border-b border-green-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
              <p className="text-green-600 text-sm font-mono">Treasury_Balance</p>
              <p className="text-2xl font-bold text-green-400 matrix-glow">0 $ABC</p>
            </div>
            <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
              <p className="text-green-600 text-sm font-mono">Total_Staked</p>
              <p className="text-2xl font-bold text-green-400 matrix-glow">0 $ABC</p>
            </div>
            <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
              <p className="text-green-600 text-sm font-mono">ETH_Rewards</p>
              <p className="text-2xl font-bold text-green-400 matrix-glow">0 ETH</p>
            </div>
            <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4 matrix-button">
              <p className="text-green-600 text-sm font-mono">Active_Devs</p>
              <p className="text-2xl font-bold text-green-400 matrix-glow">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex space-x-1 bg-green-950/10 border border-green-900/30 p-1 rounded-lg w-fit font-mono">
          <button
            onClick={() => setActiveTab('stake')}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'stake' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./stake
          </button>
          <button
            onClick={() => setActiveTab('vote')}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'vote' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./rewards
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'proposals' 
                ? 'bg-green-900/50 text-green-400 matrix-glow border border-green-700/50' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-950/20'
            }`}
          >
            ./link_github
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'stake' && <StakePanel />}
          {activeTab === 'vote' && <VotePanel />}
          {activeTab === 'proposals' && <GitHubLinkPanel />}
        </div>
      </div>
    </div>
  );
}

function StakePanel() {
  const [amount, setAmount] = useState('');
  const [isStaking, setIsStaking] = useState(true);

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 max-w-2xl backdrop-blur-sm">
      <h2 className="text-xl font-bold mb-4 text-green-400 matrix-glow font-mono">
        {isStaking ? '> stake_ABC()' : '> unstake_ABC()'}
      </h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setIsStaking(true)}
            className={`px-4 py-2 rounded-lg font-medium font-mono transition-all duration-300 ${
              isStaking 
                ? 'bg-green-900/50 text-green-400 border border-green-700/50 matrix-glow' 
                : 'bg-green-950/20 text-green-600 border border-green-900/30 hover:text-green-400 hover:border-green-700/50'
            }`}
          >
            STAKE
          </button>
          <button
            onClick={() => setIsStaking(false)}
            className={`px-4 py-2 rounded-lg font-medium font-mono transition-all duration-300 ${
              !isStaking 
                ? 'bg-green-900/50 text-green-400 border border-green-700/50 matrix-glow' 
                : 'bg-green-950/20 text-green-600 border border-green-900/30 hover:text-green-400 hover:border-green-700/50'
            }`}
          >
            UNSTAKE
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Amount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button className="bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700">
              MAX
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Balance: 0 $ABC
          </p>
        </div>

        <button className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-medium transition-colors">
          {isStaking ? 'Stake $ABC' : 'Unstake $ABC'}
        </button>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your Position</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Staked Amount</span>
              <span>0 $ABC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total ETH Earned</span>
              <span>0 ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pending ETH</span>
              <span className="text-green-400">0 ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Voting Power</span>
              <span>0%</span>
            </div>
          </div>
          
          <button className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-medium transition-colors mt-4">
            Claim ETH Rewards (0 ETH)
          </button>
        </div>
      </div>
    </div>
  );
}

function VotePanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Active Proposals</h2>
      
      <div className="bg-gray-900/50 rounded-xl p-6">
        <p className="text-gray-400">No active proposals at the moment.</p>
      </div>
    </div>
  );
}

