/**
 * Governance Tab Component
 * 
 * DAO proposals, voting, and governance participation
 */

'use client';

import { useState, useEffect } from 'react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: 'protocol' | 'treasury' | 'governance' | 'feature';
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed';
  author: string;
  created: string;
  endDate: string;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorumRequired: number;
  userVote?: 'for' | 'against' | null;
  requiredStake: number;
}

interface GovernanceTabProps {
  user: any;
  activeProposals: number;
  canVote: boolean;
}

export function GovernanceTab({ user, activeProposals, canVote }: GovernanceTabProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'rejected'>('all');
  const [isVoting, setIsVoting] = useState<string | null>(null);

  useEffect(() => {
    loadProposals();
  }, [filter]);

  const loadProposals = async () => {
    setIsLoading(true);
    
    // Simulate API call - replace with actual governance API
    setTimeout(() => {
      const mockProposals: Proposal[] = [
        {
          id: 'PROP-001',
          title: 'Increase TypeScript Reward Multiplier to 30%',
          description: 'Proposal to increase the reward multiplier for TypeScript commits from 25% to 30% to incentivize type-safe development practices across the ecosystem.',
          type: 'protocol',
          status: 'active',
          author: '0x1234...5678',
          created: '2024-01-20',
          endDate: '2024-01-27',
          votesFor: 2847592,
          votesAgainst: 394857,
          totalVotes: 3242449,
          quorumRequired: 5000000,
          userVote: null,
          requiredStake: 100000
        },
        {
          id: 'PROP-002',
          title: 'Treasury Allocation for Developer Events',
          description: 'Allocate 50 ETH from the treasury to fund developer conferences, hackathons, and community events throughout 2024.',
          type: 'treasury',
          status: 'active',
          author: '0x2345...6789',
          created: '2024-01-18',
          endDate: '2024-01-25',
          votesFor: 1894756,
          votesAgainst: 1205843,
          totalVotes: 3100599,
          quorumRequired: 5000000,
          userVote: 'for',
          requiredStake: 250000
        },
        {
          id: 'PROP-003',
          title: 'Add Rust Language Premium Rewards',
          description: 'Introduce premium rewards for Rust commits with a 40% multiplier to attract systems programming talent to the ecosystem.',
          type: 'feature',
          status: 'passed',
          author: '0x3456...7890',
          created: '2024-01-10',
          endDate: '2024-01-17',
          votesFor: 6247891,
          votesAgainst: 892345,
          totalVotes: 7140236,
          quorumRequired: 5000000,
          userVote: 'for',
          requiredStake: 100000
        },
        {
          id: 'PROP-004',
          title: 'Governance Voting Period Extension',
          description: 'Extend the standard voting period from 7 days to 10 days to allow more participation from the global community.',
          type: 'governance',
          status: 'rejected',
          author: '0x4567...8901',
          created: '2024-01-05',
          endDate: '2024-01-12',
          votesFor: 1894756,
          votesAgainst: 4567890,
          totalVotes: 6462646,
          quorumRequired: 5000000,
          userVote: 'against',
          requiredStake: 50000
        }
      ];
      
      // Filter proposals based on selected filter
      const filteredProposals = filter === 'all' 
        ? mockProposals 
        : mockProposals.filter(proposal => proposal.status === filter);
      
      setProposals(filteredProposals);
      setIsLoading(false);
    }, 1000);
  };

  const handleVote = async (proposalId: string, vote: 'for' | 'against') => {
    if (!canVote) return;
    
    setIsVoting(proposalId);
    
    // Simulate voting transaction
    setTimeout(() => {
      setProposals(prev => 
        prev.map(proposal => 
          proposal.id === proposalId 
            ? { 
                ...proposal, 
                userVote: vote,
                votesFor: vote === 'for' ? proposal.votesFor + 100000 : proposal.votesFor,
                votesAgainst: vote === 'against' ? proposal.votesAgainst + 100000 : proposal.votesAgainst,
                totalVotes: proposal.totalVotes + 100000
              }
            : proposal
        )
      );
      setIsVoting(null);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'draft': 'text-gray-400 bg-gray-950/20',
      'active': 'text-green-400 bg-green-950/20',
      'passed': 'text-blue-400 bg-blue-950/20',
      'rejected': 'text-red-400 bg-red-950/20',
      'executed': 'text-purple-400 bg-purple-950/20'
    };
    return colorMap[status as keyof typeof colorMap] || colorMap.draft;
  };

  const getTypeIcon = (type: string) => {
    const iconMap = {
      'protocol': '⚙️',
      'treasury': '💰',
      'governance': '🗳️',
      'feature': '✨'
    };
    return iconMap[type as keyof typeof iconMap] || '📝';
  };

  const calculateProgress = (proposal: Proposal) => {
    return Math.min((proposal.totalVotes / proposal.quorumRequired) * 100, 100);
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  if (!canVote) {
    return (
      <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-xl p-8 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">
          Governance Access Locked
        </h3>
        <p className="text-yellow-600 font-mono mb-6 max-w-md mx-auto">
          You need to be a DAO member with staked ABC tokens to participate in governance. 
          Stake tokens to unlock voting rights and proposal creation.
        </p>
        
        <div className="bg-black/40 border border-yellow-900/30 rounded-xl p-6 mb-6">
          <h4 className="text-lg font-bold text-yellow-400 mb-4">Requirements for Governance</h4>
          <ul className="space-y-2 text-sm text-yellow-600">
            <li className="flex items-center gap-2">
              <span className="text-red-400">❌</span>
              Minimum 50,000 $ABC staked
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-400">❌</span>
              Active membership status
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-400">❌</span>
              Connected wallet verification
            </li>
          </ul>
        </div>
        
        <a
          href="/staking"
          className="inline-block bg-yellow-900/50 text-yellow-400 px-6 py-3 rounded-lg font-mono font-bold hover:bg-yellow-800/60 transition-colors"
        >
          🏦 Start Staking →
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
              <div className="h-6 bg-green-950/30 rounded mb-4"></div>
              <div className="h-4 bg-green-950/30 rounded mb-2"></div>
              <div className="h-4 bg-green-950/30 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Governance Overview */}
      <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-2">🗳️ Governance Dashboard</h3>
            <p className="text-sm text-green-600 font-mono">
              Participate in DAO decisions and shape the protocol's future
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {activeProposals}
            </div>
            <div className="text-sm text-green-600">Active proposals</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-green-600 mb-1">Your Voting Power</div>
            <div className="text-xl font-bold text-green-400">
              {formatNumber(850000)}
            </div>
            <div className="text-xs text-green-700">$ABC staked</div>
          </div>
          
          <div className="bg-black/40 border border-blue-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-blue-600 mb-1">Proposals Voted</div>
            <div className="text-xl font-bold text-blue-400">
              {proposals.filter(p => p.userVote).length}
            </div>
            <div className="text-xs text-blue-700">Participation rate</div>
          </div>
          
          <div className="bg-black/40 border border-purple-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-purple-600 mb-1">Total Proposals</div>
            <div className="text-xl font-bold text-purple-400">
              {proposals.length}
            </div>
            <div className="text-xs text-purple-700">All time</div>
          </div>
          
          <div className="bg-black/40 border border-yellow-900/30 rounded-lg p-4">
            <div className="text-sm font-mono text-yellow-600 mb-1">Success Rate</div>
            <div className="text-xl font-bold text-yellow-400">
              {Math.round((proposals.filter(p => p.status === 'passed').length / proposals.length) * 100)}%
            </div>
            <div className="text-xs text-yellow-700">Passed proposals</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'All Proposals', count: proposals.length },
          { value: 'active', label: 'Active', count: proposals.filter(p => p.status === 'active').length },
          { value: 'passed', label: 'Passed', count: proposals.filter(p => p.status === 'passed').length },
          { value: 'rejected', label: 'Rejected', count: proposals.filter(p => p.status === 'rejected').length }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors flex items-center gap-2 ${
              filter === tab.value
                ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                : 'bg-black/40 text-green-600 border border-green-900/30 hover:text-green-400'
            }`}
          >
            {tab.label}
            <span className="text-xs bg-black/40 px-1 rounded">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 hover:border-green-700/50 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="text-2xl">{getTypeIcon(proposal.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-green-400 font-mono">
                      {proposal.title}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-mono ${getStatusColor(proposal.status)}`}>
                      {proposal.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-green-600 mb-3">
                    {proposal.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-green-700">
                    <span>#{proposal.id}</span>
                    <span>by {proposal.author.slice(0, 6)}...{proposal.author.slice(-4)}</span>
                    <span>Created: {proposal.created}</span>
                    <span>Ends: {proposal.endDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Voting Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-green-600">Voting Progress</span>
                <span className="text-sm font-mono text-green-400">
                  {formatNumber(proposal.totalVotes)} / {formatNumber(proposal.quorumRequired)} votes
                </span>
              </div>
              
              <div className="w-full bg-green-950/30 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-green-600 to-green-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${calculateProgress(proposal)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-green-700">
                <span>Quorum: {Math.round(calculateProgress(proposal))}%</span>
                <span>Required stake: {formatNumber(proposal.requiredStake)} $ABC</span>
              </div>
            </div>

            {/* Vote Results */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-950/30 border border-green-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono text-green-400">For</span>
                  <span className="text-sm font-mono text-green-400">
                    {getVotePercentage(proposal.votesFor, proposal.totalVotes)}%
                  </span>
                </div>
                <div className="text-lg font-bold text-green-300">
                  {formatNumber(proposal.votesFor)}
                </div>
              </div>
              
              <div className="bg-red-950/30 border border-red-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono text-red-400">Against</span>
                  <span className="text-sm font-mono text-red-400">
                    {getVotePercentage(proposal.votesAgainst, proposal.totalVotes)}%
                  </span>
                </div>
                <div className="text-lg font-bold text-red-300">
                  {formatNumber(proposal.votesAgainst)}
                </div>
              </div>
            </div>

            {/* Voting Actions */}
            {proposal.status === 'active' && (
              <div className="flex items-center justify-between">
                {proposal.userVote ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-green-600">
                      You voted: 
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-mono ${
                      proposal.userVote === 'for' 
                        ? 'bg-green-950/30 text-green-400' 
                        : 'bg-red-950/30 text-red-400'
                    }`}>
                      {proposal.userVote.toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote(proposal.id, 'for')}
                      disabled={isVoting === proposal.id}
                      className="px-4 py-2 bg-green-900/50 text-green-400 rounded-lg font-mono text-sm hover:bg-green-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isVoting === proposal.id ? '🔄 Voting...' : '✅ Vote For'}
                    </button>
                    
                    <button
                      onClick={() => handleVote(proposal.id, 'against')}
                      disabled={isVoting === proposal.id}
                      className="px-4 py-2 bg-red-900/50 text-red-400 rounded-lg font-mono text-sm hover:bg-red-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isVoting === proposal.id ? '🔄 Voting...' : '❌ Vote Against'}
                    </button>
                  </div>
                )}
                
                <button className="text-sm font-mono text-green-600 hover:text-green-400 transition-colors">
                  View Details →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {proposals.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🗳️</div>
          <h4 className="text-lg font-bold text-green-400 mb-2">No Proposals Found</h4>
          <p className="text-sm text-green-600 font-mono">
            {filter === 'all' ? 'No governance proposals available' : `No ${filter} proposals found`}
          </p>
        </div>
      )}

      {/* Governance Info */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">📋 Governance Guidelines</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">🗳️ Voting Process</h5>
            <ul className="space-y-2 text-xs text-green-700">
              <li className="flex items-start gap-2">
                <span className="text-green-400">1.</span>
                Proposals require minimum stake to be submitted
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">2.</span>
                7-day voting period for community participation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">3.</span>
                Quorum of 5M votes required for validity
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">4.</span>
                Simple majority determines outcome
              </li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">⚡ Quick Actions</h5>
            <div className="space-y-2">
              <button className="w-full py-2 bg-green-900/50 text-green-400 rounded-lg font-mono text-sm hover:bg-green-800/60 transition-colors">
                📝 Create Proposal
              </button>
              <button className="w-full py-2 bg-blue-900/50 text-blue-400 rounded-lg font-mono text-sm hover:bg-blue-800/60 transition-colors">
                📊 View Analytics
              </button>
              <button className="w-full py-2 bg-purple-900/50 text-purple-400 rounded-lg font-mono text-sm hover:bg-purple-800/60 transition-colors">
                📚 Governance Docs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}