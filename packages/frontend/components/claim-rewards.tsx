'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { CONTRACTS } from '@/lib/contracts';
import { formatEther } from 'viem';

export function ClaimRewardsPanel() {
  const { address } = useAccount();
  const { user: profile } = useFarcaster();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Handle success in useEffect
  useEffect(() => {
    if (claimSuccess) {
      setRefreshTrigger(prev => prev + 1);
      refetchClaimable();
      refetchRewardInfo();
    }
  }, [claimSuccess, refetchClaimable, refetchRewardInfo]);

  const hasClaimableRewards = claimableAmount && claimableAmount > 0n;
  const claimableInEther = claimableAmount ? formatEther(claimableAmount) : '0';
  
  const rewardInfoParsed = rewardInfo ? {
    totalAllocated: formatEther(rewardInfo[0]),
    totalClaimed: formatEther(rewardInfo[1]),
    claimable: formatEther(rewardInfo[2]),
    lastUpdated: rewardInfo[3]
  } : null;

  const contractStatsParsed = contractStats ? {
    totalAllocated: formatEther(contractStats[0]),
    totalClaimed: formatEther(contractStats[1]),
    contractBalance: formatEther(contractStats[2]),
    batchCount: contractStats[3].toString()
  } : null;

  if (!address) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} claim_rewards()
        </h2>
        <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4 text-center">
          <p className="text-yellow-400 font-mono text-sm">
            Connect wallet to view claimable rewards
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
        {/* User Rewards Info */}
        <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-400 font-mono text-sm sm:text-base">Your Rewards</p>
            {profile && (
              <span className="text-green-600 font-mono text-xs sm:text-sm">@{profile.username}</span>
            )}
          </div>
          
          {rewardInfoParsed ? (
            <div className="space-y-2 text-xs sm:text-sm font-mono">
              <div className="flex justify-between text-green-600">
                <span>Total Allocated:</span>
                <span className="text-green-400">{parseFloat(rewardInfoParsed.totalAllocated).toLocaleString()} $ABC</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Total Claimed:</span>
                <span className="text-green-400">{parseFloat(rewardInfoParsed.totalClaimed).toLocaleString()} $ABC</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Available to Claim:</span>
                <span className="text-green-400 font-bold">{parseFloat(claimableInEther).toLocaleString()} $ABC</span>
              </div>
            </div>
          ) : (
            <div className="text-green-600 font-mono text-sm text-center">
              Loading reward info...
            </div>
          )}
        </div>

        {/* Claim Button */}
        {hasClaimableRewards ? (
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
        ) : (
          <div className="bg-gray-950/20 border border-gray-700/30 rounded-lg p-4 text-center">
            <p className="text-gray-400 font-mono text-sm">
              No rewards to claim yet
            </p>
            <p className="text-gray-600 font-mono text-xs mt-1">
              Ship code to earn $ABC rewards!
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

        {/* Contract Stats */}
        {contractStatsParsed && (
          <div className="bg-black/60 border border-green-900/30 rounded-lg p-3">
            <p className="text-green-600 font-mono text-xs mb-2">{"// Contract Stats:"}</p>
            <div className="grid grid-cols-2 gap-2 text-green-400 font-mono text-xs">
              <div>
                <span className="text-green-600">Total Allocated:</span>
                <br />
                <span>{parseFloat(contractStatsParsed.totalAllocated).toLocaleString()} $ABC</span>
              </div>
              <div>
                <span className="text-green-600">Total Claimed:</span>
                <br />
                <span>{parseFloat(contractStatsParsed.totalClaimed).toLocaleString()} $ABC</span>
              </div>
              <div>
                <span className="text-green-600">Contract Balance:</span>
                <br />
                <span>{parseFloat(contractStatsParsed.contractBalance).toLocaleString()} $ABC</span>
              </div>
              <div>
                <span className="text-green-600">Batches Processed:</span>
                <br />
                <span>{contractStatsParsed.batchCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}