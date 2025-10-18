'use client';

import { useState, useCallback } from 'react';
import { mutate } from 'swr';
import { config } from '@/lib/config';

export interface UserActionOptions {
  optimistic?: boolean;
  showNotifications?: boolean;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export interface StakingActionData {
  action: 'stake' | 'unstake' | 'claim';
  amount: number;
  txHash: string;
}

export interface CommitActionData {
  commitHash: string;
  repository: string;
  commitMessage: string;
  githubUsername: string;
  commitUrl?: string;
  tags?: string[];
  priority?: 'normal' | 'high' | 'milestone' | 'experimental';
}

/**
 * Hook for processing user actions with optimistic updates
 */
export function useUserActions(userWallet?: string) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generic action processor
  const processAction = useCallback(async (
    actionType: string,
    actionData: any,
    options: UserActionOptions = {}
  ) => {
    const {
      optimistic = true,
      showNotifications = true,
      onSuccess,
      onError
    } = options;

    const actionKey = `${actionType}_${Date.now()}`;
    setLoading(prev => ({ ...prev, [actionKey]: true }));
    setErrors(prev => ({ ...prev, [actionKey]: '' }));

    try {
      let optimisticData: any = null;

      // Apply optimistic updates based on action type
      if (optimistic) {
        optimisticData = await applyOptimisticUpdate(actionType, actionData);
      }

      // Send action to backend
      const response = await fetch(`${config.backendUrl}/api/user-actions/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: actionType,
          userWallet,
          data: actionData.txHash ? { ...actionData } : actionData,
          txHash: actionData.txHash || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Action failed');
      }

      const result = await response.json();

      // Success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Show success notification
      if (showNotifications) {
        console.log(`✅ ${actionType} completed successfully`);
      }

      return result;

    } catch (error) {
      // Revert optimistic updates on error
      if (optimistic && actionType === 'stake' || actionType === 'unstake') {
        await revertOptimisticUpdate(actionType, actionData);
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, [actionKey]: errorMessage }));

      // Error callback
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }

      // Show error notification
      if (showNotifications) {
        console.error(`❌ ${actionType} failed:`, errorMessage);
      }

      throw error;

    } finally {
      setLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [userWallet]);

  // Apply optimistic updates
  const applyOptimisticUpdate = useCallback(async (
    actionType: string,
    actionData: any
  ) => {
    switch (actionType) {
      case 'stake':
        return await applyStakeOptimisticUpdate(actionData);
      case 'unstake':
        return await applyUnstakeOptimisticUpdate(actionData);
      case 'commit':
        return await applyCommitOptimisticUpdate(actionData);
      default:
        return null;
    }
  }, []);

  // Apply optimistic stake update
  const applyStakeOptimisticUpdate = useCallback(async (actionData: StakingActionData) => {
    const amount = parseFloat(actionData.amount.toString());

    // Update user's staking position
    mutate(`/api/user-actions/staking/position/${userWallet}`, (prev: any) => {
      if (!prev) return prev;
      
      return {
        ...prev,
        position: {
          ...prev.position,
          staked_amount: (parseFloat(prev.position?.staked_amount || '0') + amount).toString(),
          status: 'pending_confirmation',
          estimated_confirmation_time: new Date(Date.now() + 30000).toISOString()
        }
      };
    }, false);

    // Update staking overview (approximate)
    mutate('/api/user-actions/staking/overview', (prev: any) => {
      if (!prev) return prev;

      const currentTVL = parseFloat(prev.data?.globalMetrics?.total_staked || '0');
      const newTVL = currentTVL + amount;

      return {
        ...prev,
        data: {
          ...prev.data,
          globalMetrics: {
            ...prev.data.globalMetrics,
            total_staked: newTVL.toString(),
            pending_confirmations: (prev.data.globalMetrics.pending_confirmations || 0) + 1
          }
        }
      };
    }, false);

    return { type: 'stake', amount };
  }, [userWallet]);

  // Apply optimistic unstake update
  const applyUnstakeOptimisticUpdate = useCallback(async (actionData: StakingActionData) => {
    const amount = parseFloat(actionData.amount.toString());

    // Update user's staking position
    mutate(`/api/user-actions/staking/position/${userWallet}`, (prev: any) => {
      if (!prev) return prev;
      
      const currentAmount = parseFloat(prev.position?.staked_amount || '0');
      const newAmount = Math.max(0, currentAmount - amount);

      return {
        ...prev,
        position: {
          ...prev.position,
          staked_amount: newAmount.toString(),
          status: 'pending_confirmation',
          estimated_confirmation_time: new Date(Date.now() + 30000).toISOString()
        }
      };
    }, false);

    // Update staking overview
    mutate('/api/user-actions/staking/overview', (prev: any) => {
      if (!prev) return prev;

      const currentTVL = parseFloat(prev.data?.globalMetrics?.total_staked || '0');
      const newTVL = Math.max(0, currentTVL - amount);

      return {
        ...prev,
        data: {
          ...prev.data,
          globalMetrics: {
            ...prev.data.globalMetrics,
            total_staked: newTVL.toString(),
            pending_confirmations: (prev.data.globalMetrics.pending_confirmations || 0) + 1
          }
        }
      };
    }, false);

    return { type: 'unstake', amount };
  }, [userWallet]);

  // Apply optimistic commit update
  const applyCommitOptimisticUpdate = useCallback(async (actionData: CommitActionData) => {
    // Estimate reward (this will be corrected by real-time update)
    const estimatedReward = Math.floor(Math.random() * 10000) + 50000; // 50k-60k ABC

    // Add to user's commits list
    mutate(`/api/user-actions/commits/${userWallet}`, (prev: any) => {
      if (!prev) return prev;

      const newCommit = {
        id: Date.now(), // Temporary ID
        commit_hash: actionData.commitHash,
        repository: actionData.repository,
        commit_message: actionData.commitMessage,
        commit_url: actionData.commitUrl,
        reward_amount: estimatedReward,
        processed_at: new Date().toISOString(),
        tags: actionData.tags || [],
        priority: actionData.priority || 'normal'
      };

      return {
        ...prev,
        commits: [newCommit, ...prev.commits.slice(0, 19)]
      };
    }, false);

    // Update user profile stats
    mutate(`/api/users/profile/${userWallet}`, (prev: any) => {
      if (!prev) return prev;

      return {
        ...prev,
        total_commits: (prev.total_commits || 0) + 1,
        total_rewards_earned: (parseFloat(prev.total_rewards_earned || '0') + estimatedReward).toString(),
        last_commit_at: new Date().toISOString()
      };
    }, false);

    return { type: 'commit', estimatedReward };
  }, [userWallet]);

  // Revert optimistic updates
  const revertOptimisticUpdate = useCallback(async (
    actionType: string,
    actionData: any
  ) => {
    // Force refresh the affected data
    switch (actionType) {
      case 'stake':
      case 'unstake':
        mutate(`/api/user-actions/staking/position/${userWallet}`);
        mutate('/api/user-actions/staking/overview');
        break;
      case 'commit':
        mutate(`/api/user-actions/commits/${userWallet}`);
        mutate(`/api/users/profile/${userWallet}`);
        break;
    }
  }, [userWallet]);

  // Specific action methods
  const processStakingAction = useCallback(async (
    actionData: StakingActionData,
    options: UserActionOptions = {}
  ) => {
    return processAction(actionData.action, actionData, options);
  }, [processAction]);

  const processCommitAction = useCallback(async (
    actionData: CommitActionData,
    options: UserActionOptions = {}
  ) => {
    return processAction('commit', actionData, options);
  }, [processAction]);

  // Specialized staking methods
  const stake = useCallback(async (
    amount: number,
    txHash: string,
    options: UserActionOptions = {}
  ) => {
    return processStakingAction({ action: 'stake', amount, txHash }, options);
  }, [processStakingAction]);

  const unstake = useCallback(async (
    amount: number,
    txHash: string,
    options: UserActionOptions = {}
  ) => {
    return processStakingAction({ action: 'unstake', amount, txHash }, options);
  }, [processStakingAction]);

  const claimRewards = useCallback(async (
    amount: number,
    txHash: string,
    options: UserActionOptions = {}
  ) => {
    return processStakingAction({ action: 'claim', amount, txHash }, options);
  }, [processStakingAction]);

  // Submit commit manually (for testing or non-webhook commits)
  const submitCommit = useCallback(async (
    commitData: CommitActionData,
    options: UserActionOptions = {}
  ) => {
    return processCommitAction(commitData, options);
  }, [processCommitAction]);

  // Get action history
  const getActionHistory = useCallback(async (limit = 50, offset = 0) => {
    if (!userWallet) return [];

    try {
      const response = await fetch(
        `${config.backendUrl}/api/user-actions/history/${userWallet}?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch action history');
      }

      const data = await response.json();
      return data.actions;

    } catch (error) {
      console.error('Failed to fetch action history:', error);
      return [];
    }
  }, [userWallet]);

  // Check daily commit limit
  const checkDailyLimit = useCallback(async () => {
    if (!userWallet) return null;

    try {
      const response = await fetch(
        `${config.backendUrl}/api/user-actions/commits/daily-limit/${userWallet}`
      );

      if (!response.ok) {
        throw new Error('Failed to check daily limit');
      }

      const data = await response.json();
      return data.dailyLimit;

    } catch (error) {
      console.error('Failed to check daily limit:', error);
      return null;
    }
  }, [userWallet]);

  return {
    // State
    loading,
    errors,

    // Generic methods
    processAction,

    // Staking methods
    stake,
    unstake,
    claimRewards,
    processStakingAction,

    // Commit methods
    submitCommit,
    processCommitAction,

    // Utility methods
    getActionHistory,
    checkDailyLimit
  };
}