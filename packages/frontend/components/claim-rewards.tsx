'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect, useReadContract } from 'wagmi';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { useUniversalAuth } from '@/contexts/universal-auth-context';
import { useRewardsSystematic } from '@/hooks/useRewardsSystematic';
import { CONTRACTS } from '@/lib/contracts';
import { CommitTagsDocs } from './commit-tags-docs';
import { formatUnits } from 'viem';

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
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  const { user: farcasterProfile, isInMiniApp } = useFarcaster();
  const { user: universalUser } = useUniversalAuth();
  
  // Use systematic rewards data instead of reactive contract calls
  const {
    userRewards,
    isUserRewardsLoading: loadingRewards,
    userRewardsError,
    refetchUserRewards
  } = useRewardsSystematic();

  // Enhanced wallet connection detection for Farcaster miniapp
  const isWalletConnected = isConnected || (isInMiniApp && farcasterProfile && address);
  const effectiveAddress = address;
  const hasGithub = universalUser?.has_github || false;

  // Get actual claimable amount from contract to avoid precision issues
  const { data: contractClaimableAmount, refetch: refetchClaimable } = useReadContract({
    address: CONTRACTS.ABC_REWARDS.address,
    abi: CONTRACTS.ABC_REWARDS.abi,
    functionName: 'getClaimableAmount',
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!effectiveAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  });

  // Check contract stats including balance
  const { data: contractStats } = useReadContract({
    address: CONTRACTS.ABC_REWARDS.address,
    abi: CONTRACTS.ABC_REWARDS.abi,
    functionName: 'getContractStats',
    query: {
      enabled: true,
      refetchInterval: 30000,
    }
  });

  // Use contract amount if available, fallback to backend data
  const contractClaimableTokens = contractClaimableAmount 
    ? parseFloat(formatUnits(contractClaimableAmount, 18))
    : 0;

  // Parse contract stats
  const contractBalance = contractStats 
    ? parseFloat(formatUnits(contractStats[2], 18)) // contractBalance is the 3rd element
    : 0;
  const totalAllocated = contractStats 
    ? parseFloat(formatUnits(contractStats[0], 18)) // totalAllocated is the 1st element
    : 0;
  const totalClaimed = contractStats 
    ? parseFloat(formatUnits(contractStats[1], 18)) // totalClaimed is the 2nd element
    : 0;

  // Show backend data in UI but use contract data for validation
  const displayClaimable = userRewards?.summary.totalClaimable || 0;
  const actualClaimable = contractClaimableTokens;
  
  // Check if contract has enough balance to pay this user
  const contractCanPay = contractBalance >= actualClaimable;
  
  const hasClaimableRewards = actualClaimable > 0 && contractCanPay;
  const claimableInTokens = actualClaimable;

  // Execute claim
  const { writeContract: claimRewards, data: claimTxData, isPending: isClaimPending } = useWriteContract();

  // Wait for claim transaction
  const { isLoading: isClaiming, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimTxData,
    query: {
      enabled: !!claimTxData
    }
  });

  // Auto-connect wallet for Farcaster miniapp users
  useEffect(() => {
    if (isInMiniApp && farcasterProfile && !isConnected && connectors.length > 0) {
      console.log('🔗 Auto-connecting Farcaster wallet for miniapp user...');
      const farcasterConnector = connectors.find(connector => 
        connector.name.toLowerCase().includes('farcaster') || 
        connector.id.includes('farcaster')
      );
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isInMiniApp, farcasterProfile, isConnected, connectors, connect]);

  // Handle success - refetch systematic data instead of individual contract calls

  // Handle success in useEffect
  useEffect(() => {
    if (claimSuccess) {
      refetchUserRewards();
      refetchClaimable();
    }
  }, [claimSuccess, refetchUserRewards, refetchClaimable]);

  // Show rewards info if user is authenticated (either wallet or Farcaster) AND has GitHub
  if (!universalUser || !hasGithub) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} claim_rewards()
        </h2>
        <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4 text-center">
          <p className="text-yellow-400 font-mono text-sm">
            {!universalUser ? 'Authentication required' : 'Connect GitHub account to view rewards'}
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
        {/* Debug Info for Mobile */}
        {isInMiniApp && (
          <div className="bg-gray-950/20 border border-gray-700/30 rounded-lg p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-xs">Wallet Status:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isWalletConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                  <span className="text-gray-300 font-mono text-xs">
                    {isWalletConnected ? `Connected: ${effectiveAddress?.slice(0, 6)}...${effectiveAddress?.slice(-4)}` : 'Not Connected'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-xs">Backend Claimable:</span>
                <span className="text-gray-300 font-mono text-xs">
                  {displayClaimable.toFixed(2)} $ABC
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-xs">Contract Claimable:</span>
                <span className="text-gray-300 font-mono text-xs">
                  {contractClaimableAmount ? `${actualClaimable.toFixed(6)} $ABC` : 'Loading...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-xs">Contract Balance:</span>
                <span className={`font-mono text-xs ${contractCanPay ? 'text-green-300' : 'text-red-300'}`}>
                  {contractBalance.toFixed(2)} $ABC
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-xs">Can Pay:</span>
                <span className={`font-mono text-xs ${contractCanPay ? 'text-green-300' : 'text-red-300'}`}>
                  {contractCanPay ? '✅ Yes' : '❌ Insufficient Funds'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-xs">Total Allocated:</span>
                <span className="text-gray-300 font-mono text-xs">
                  {totalAllocated.toFixed(0)} $ABC
                </span>
              </div>
            </div>
          </div>
        )}
        
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
                  {actualClaimable > 0 ? actualClaimable.toLocaleString() : displayClaimable.toLocaleString()} $ABC
                </p>
                <p className="text-green-600/70 font-mono text-xs mt-1">
                  {actualClaimable > 0 ? 'Contract-verified amount' : 'Ready to claim on-chain'}
                </p>
                {actualClaimable > 0 && Math.abs(actualClaimable - displayClaimable) > 1 && (
                  <p className="text-yellow-400 font-mono text-xs mt-1">
                    ⚠️ Contract: {actualClaimable.toFixed(2)} | Backend: {displayClaimable.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Contract Underfunded Warning */}
            {actualClaimable > 0 && !contractCanPay && (
              <div className="bg-red-950/20 border border-red-700/50 rounded-lg p-4 text-center">
                <h3 className="text-red-400 font-mono font-bold mb-2">⚠️ Contract Underfunded</h3>
                <p className="text-red-300 font-mono text-sm mb-2">
                  You have {actualClaimable.toFixed(2)} $ABC to claim, but the rewards contract only has {contractBalance.toFixed(2)} $ABC.
                </p>
                <p className="text-red-400 font-mono text-xs">
                  The admin needs to fund the contract before you can claim your rewards.
                </p>
              </div>
            )}

            {/* Claim Button */}
            {hasClaimableRewards && isWalletConnected && effectiveAddress ? (
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
                  : `🎁 CLAIM ${Math.floor(claimableInTokens).toLocaleString()} $ABC`
                }
              </button>
            ) : userRewards.summary.totalClaimable > 0 ? (
              <div className="bg-blue-950/20 border border-blue-700/30 rounded-lg p-4 text-center">
                <p className="text-blue-400 font-mono text-sm mb-3">
                  Connect wallet to claim {Math.floor(actualClaimable || displayClaimable).toLocaleString()} $ABC
                </p>
                {isInMiniApp ? (
                  <div className="space-y-3">
                    <p className="text-blue-600 font-mono text-xs mb-2">
                      🔗 Connect your Farcaster wallet to claim rewards
                    </p>
                    <button
                      onClick={() => {
                        const farcasterConnector = connectors.find(connector => 
                          connector.name.toLowerCase().includes('farcaster') || 
                          connector.id.includes('farcaster')
                        );
                        if (farcasterConnector) {
                          connect({ connector: farcasterConnector });
                        }
                      }}
                      disabled={isConnectPending}
                      className="bg-green-900/50 hover:bg-green-800/60 text-green-400 font-mono px-4 py-2 rounded-lg border border-green-700/50 transition-all duration-300 matrix-button text-sm disabled:opacity-50"
                    >
                      {isConnectPending ? '🔗 Connecting...' : '🔗 Connect Wallet'}
                    </button>
                  </div>
                ) : (
                  <p className="text-blue-600 font-mono text-xs">
                    💡 Use the ConnectButton in the header to link your wallet
                  </p>
                )}
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