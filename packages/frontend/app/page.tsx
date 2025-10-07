'use client';

import { FarcasterAuth } from '@/components/farcaster-auth';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'stake' | 'vote' | 'proposals'>('stake');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                ABC DAO
              </h1>
              <p className="text-sm text-gray-400">Community Grants for Farcaster Builders</p>
            </div>
            <div className="flex gap-4 items-center">
              <FarcasterAuth />
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gray-900/50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Treasury Balance</p>
              <p className="text-2xl font-bold">0 $ABC</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Staked</p>
              <p className="text-2xl font-bold">0 $ABC</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">ETH Rewards Pool</p>
              <p className="text-2xl font-bold">0 ETH</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Active Proposals</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('stake')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'stake' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Stake
          </button>
          <button
            onClick={() => setActiveTab('vote')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'vote' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Vote
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'proposals' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create Proposal
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'stake' && <StakePanel />}
          {activeTab === 'vote' && <VotePanel />}
          {activeTab === 'proposals' && <ProposalPanel />}
        </div>
      </div>
    </div>
  );
}

function StakePanel() {
  const [amount, setAmount] = useState('');
  const [isStaking, setIsStaking] = useState(true);

  return (
    <div className="bg-gray-900/50 rounded-xl p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Stake $ABC</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setIsStaking(true)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isStaking ? 'bg-purple-600' : 'bg-gray-800'
            }`}
          >
            Stake
          </button>
          <button
            onClick={() => setIsStaking(false)}
            className={`px-4 py-2 rounded-lg font-medium ${
              !isStaking ? 'bg-purple-600' : 'bg-gray-800'
            }`}
          >
            Unstake
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

function ProposalPanel() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="bg-gray-900/50 rounded-xl p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Create Grant Proposal</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Recipient (Farcaster username or address)
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="@username or 0x..."
            className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Grant Amount ($ABC)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Proposal Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this grant is for..."
            rows={4}
            className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <button className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-medium transition-colors">
          Submit Proposal
        </button>
      </div>
    </div>
  );
}