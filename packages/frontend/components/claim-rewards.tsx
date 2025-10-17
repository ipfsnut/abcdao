'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { CONTRACTS } from '@/lib/contracts';
import { config } from '@/lib/config';
import { formatEther } from 'viem';
import { CommitTagsDocs } from './commit-tags-docs';

interface RewardSummary {
  totalPending: number;
  totalClaimable: number;
  pendingCount: number;
  claimableCount: number;
}

interface Reward {
  id: number;
  commitHash: string;
  repository: string;
  message: string;
  amount: number;
  processedAt: string;
  castUrl?: string;
  contractTxHash?: string;
  transferredAt?: string;
}

interface UserRewardsData {
  summary: RewardSummary;
  rewards: {
    pending: Reward[];
    claimable: Reward[];
  };
}

export function ClaimRewardsPanel() {
  const { address } = useAccount();
  const { user: profile, isInMiniApp } = useFarcaster();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userRewards, setUserRewards] = useState<UserRewardsData | null>(null);
  const [loadingRewards, setLoadingRewards] = useState(true);

  // Get user's claimable amount
  const { data: claimableAmount, refetch: refetchClaimable } = useReadContract({
    address: CONTRACTS.ABC_REWARDS.address,
    abi: CONTRACTS.ABC_REWARDS.abi,
    functionName: 'getClaimableAmount',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // Get user's reward info
  const { data: rewardInfo, refetch: refetchRewardInfo } = useReadContract({
    address: CONTRACTS.ABC_REWARDS.address,
    abi: CONTRACTS.ABC_REWARDS.abi,
    functionName: 'getUserRewardInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // Get contract stats
  const { data: contractStats } = useReadContract({
    address: CONTRACTS.ABC_REWARDS.address,
    abi: CONTRACTS.ABC_REWARDS.abi,
    functionName: 'getContractStats'
  });

  // Execute claim
  const { writeContract: claimRewards, data: claimTxData, isPending: isClaimPending } = useWriteContract();

  // Wait for claim transaction
  const { isLoading: isClaiming, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimTxData,
    query: {
      enabled: !!claimTxData
    }
  });

  // Fetch user rewards from API
  useEffect(() => {
    if (profile?.fid) {
      fetchUserRewards(profile.fid);
    }
  }, [profile, refreshTrigger]);

  const fetchUserRewards = async (fid: number) => {
    try {
      setLoadingRewards(true);
      const response = await fetch(`${config.backendUrl}/api/rewards/user/${fid}`);
      if (response.ok) {
        const data = await response.json();
        setUserRewards(data);
      } else {
        console.error('Failed to fetch user rewards');
        setUserRewards(null);
      }
    } catch (error) {
      console.error('Error fetching user rewards:', error);
      setUserRewards(null);
    } finally {
      setLoadingRewards(false);
    }
  };

  // Handle success in useEffect
  useEffect(() => {
    if (claimSuccess) {
      setRefreshTrigger(prev => prev + 1);
      refetchClaimable();
      refetchRewardInfo();
    }
  }, [claimSuccess, refetchClaimable, refetchRewardInfo]);

  const hasClaimableRewards = claimableAmount && claimableAmount > BigInt(0);
  const claimableInEther = claimableAmount ? formatEther(claimableAmount) : '0';
  
  const rewardInfoParsed = rewardInfo ? {
    totalAllocated: formatEther(rewardInfo[0]),
    totalClaimed: formatEther(rewardInfo[1]),
    claimable: formatEther(rewardInfo[2]),
    lastUpdated: rewardInfo[3]
  } : null;

  const contractStatsParsed = contractStats && Array.isArray(contractStats) && contractStats.length >= 4 ? {
    totalAllocated: formatEther(contractStats[0] || BigInt(0)),
    totalClaimed: formatEther(contractStats[1] || BigInt(0)),
    contractBalance: formatEther(contractStats[2] || BigInt(0)),
    batchCount: (contractStats[3] || BigInt(0)).toString()
  } : null;

  // Show rewards info even without Web3 wallet if user is authenticated via Farcaster
  if (!address && !profile) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} claim_rewards()
        </h2>
        <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4 text-center">
          <p className="text-yellow-400 font-mono text-sm">
            Connect Farcaster account to view rewards
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
        {'>'} claim_rewards()
      </h2>
      
      <div className="space-y-4">
        {/* Rewards Summary */}
        {loadingRewards ? (
          <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4 text-center">
            <p className="text-green-600 font-mono text-sm">Loading rewards...</p>
          </div>
        ) : userRewards ? (
          <>
            {/* Total Rewards Summary */}
            <div className="bg-gradient-to-r from-blue-950/20 to-purple-950/20 border border-blue-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-blue-400 font-mono text-sm font-bold">TOTAL REWARDS</h3>
                <span className="text-blue-600 font-mono text-xs">
                  {userRewards.summary.pendingCount + userRewards.summary.claimableCount} commits
                </span>
              </div>
              <p className="text-blue-300 font-mono text-xl font-bold">
                {(userRewards.summary.totalPending + userRewards.summary.totalClaimable).toLocaleString()} $ABC
              </p>
              <div className="flex justify-between text-xs font-mono mt-2">
                <span className="text-yellow-400">
                  {userRewards.summary.totalPending.toLocaleString()} pending
                </span>
                <span className="text-green-400">
                  {userRewards.summary.totalClaimable.toLocaleString()} claimable
                </span>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pending Rewards */}
              <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-yellow-400 font-mono text-sm font-bold">PENDING</h3>
                  <span className="text-yellow-600 font-mono text-xs">{userRewards.summary.pendingCount} commits</span>
                </div>
                <p className="text-yellow-300 font-mono text-lg font-bold">
                  {userRewards.summary.totalPending.toLocaleString()} $ABC
                </p>
                <p className="text-yellow-600/70 font-mono text-xs mt-1">
                  Awaiting contract transfer
                </p>
              </div>

              {/* Claimable Rewards */}
              <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-green-400 font-mono text-sm font-bold">CLAIMABLE</h3>
                  <span className="text-green-600 font-mono text-xs">{userRewards.summary.claimableCount} commits</span>
                </div>
                <p className="text-green-300 font-mono text-lg font-bold">
                  {userRewards.summary.totalClaimable.toLocaleString()} $ABC
                </p>
                <p className="text-green-600/70 font-mono text-xs mt-1">
                  Ready to claim on-chain
                </p>
              </div>
            </div>

            {/* Claim Button */}
            {hasClaimableRewards && address ? (
              <button
                onClick={() => claimRewards?.({
                  address: CONTRACTS.ABC_REWARDS.address,
                  abi: CONTRACTS.ABC_REWARDS.abi,
                  functionName: 'claimRewards'
                })}
                disabled={!claimRewards || isClaimPending || isClaiming}
                className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono py-2.5 sm:py-3 rounded-lg 
                         border border-green-700/50 transition-all duration-300 hover:matrix-glow
                         disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isClaiming 
                  ? '⏳ Claiming...' 
                  : isClaimPending 
                  ? '📝 Confirming...'
                  : `🎁 CLAIM ${parseFloat(claimableInEther).toLocaleString()} $ABC`
                }
              </button>
            ) : userRewards.summary.totalClaimable > 0 ? (
              <div className="bg-blue-950/20 border border-blue-700/30 rounded-lg p-4 text-center">
                <p className="text-blue-400 font-mono text-sm mb-3">
                  Connect wallet to claim {userRewards.summary.totalClaimable.toLocaleString()} $ABC
                </p>
                <p className="text-blue-600 font-mono text-xs">
                  {isInMiniApp 
                    ? "🔗 Your Farcaster wallet will connect when claiming"
                    : "💡 Use the ConnectButton in the header to link your wallet"
                  }
                </p>
              </div>
            ) : (
              <div className="bg-gray-950/20 border border-gray-700/30 rounded-lg p-4 text-center">
                <p className="text-gray-400 font-mono text-sm">
                  No rewards ready to claim
                </p>
                <p className="text-gray-600 font-mono text-xs mt-1">
                  {userRewards.summary.totalPending > 0 
                    ? `${userRewards.summary.totalPending.toLocaleString()} $ABC pending contract transfer`
                    : 'Ship code to earn $ABC rewards!'
                  }
                </p>
              </div>
            )}

            {/* Success Message */}
            {claimSuccess && (
              <div className="bg-green-950/40 border border-green-600/50 rounded-lg p-4 text-center">
                <p className="text-green-400 font-mono text-sm">
                  🎉 Rewards claimed successfully!
                </p>
                <p className="text-green-600 font-mono text-xs mt-1">
                  Transaction confirmed on Base
                </p>
              </div>
            )}

            {/* Recent Rewards List */}
            {(userRewards.rewards.pending.length > 0 || userRewards.rewards.claimable.length > 0) && (
              <div className="bg-black/60 border border-green-900/30 rounded-lg p-3">
                <p className="text-green-600 font-mono text-xs mb-3">{"// Recent Rewards:"}</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {/* Show claimable first, then pending */}
                  {userRewards.rewards.claimable.slice(0, 3).map((reward) => (
                    <div key={reward.id} className="flex justify-between items-center py-1">
                      <div className="flex-1">
                        <p className="text-green-400 font-mono text-xs truncate">
                          {reward.repository.split('/').pop()}: {reward.message.slice(0, 30)}...
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <span className="text-green-300 font-mono text-xs font-bold">
                          {reward.amount.toLocaleString()}
                        </span>
                        <span className="text-green-600 font-mono text-xs ml-1">✓</span>
                      </div>
                    </div>
                  ))}
                  {userRewards.rewards.pending.slice(0, 3).map((reward) => (
                    <div key={reward.id} className="flex justify-between items-center py-1">
                      <div className="flex-1">
                        <p className="text-yellow-400 font-mono text-xs truncate">
                          {reward.repository.split('/').pop()}: {reward.message.slice(0, 30)}...
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <span className="text-yellow-300 font-mono text-xs font-bold">
                          {reward.amount.toLocaleString()}
                        </span>
                        <span className="text-yellow-600 font-mono text-xs ml-1">⏳</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-950/20 border border-gray-700/30 rounded-lg p-4 text-center">
            <p className="text-gray-400 font-mono text-sm">
              No rewards found
            </p>
            <p className="text-gray-600 font-mono text-xs mt-1">
              Link GitHub and start committing to earn $ABC!
            </p>
          </div>
        )}

        {/* Commit Tags Documentation */}
        <div className="mt-6">
          <CommitTagsDocs />
        </div>
      </div>
    </div>
  );
}