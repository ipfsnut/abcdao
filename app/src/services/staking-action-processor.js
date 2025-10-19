import { BaseActionProcessor, ActionProcessorUtils } from './action-processor.js';
import { ethers } from 'ethers';

/**
 * Staking Action Processor
 * Handles stake/unstake actions with optimistic updates and real-time broadcasting
 */
export class StakingActionProcessor extends BaseActionProcessor {
  constructor() {
    super();
    this.stakingContractAddress = process.env.STAKING_CONTRACT_ADDRESS;
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  }

  /**
   * Apply optimistic update for staking actions
   */
  async applyOptimisticUpdate(client, actionData) {
    const { type, userWallet, data } = actionData;
    const { amount, txHash } = data;

    switch (type) {
      case 'stake':
        return await this.applyStakeUpdate(client, userWallet, amount, txHash);
      case 'unstake':
        return await this.applyUnstakeUpdate(client, userWallet, amount, txHash);
      case 'claim':
        return await this.applyClaimUpdate(client, userWallet, amount, txHash);
      default:
        throw new Error(`Unknown staking action type: ${type}`);
    }
  }

  /**
   * Apply stake optimistic update
   */
  async applyStakeUpdate(client, userWallet, amount, txHash) {
    // 1. Update or create staker position
    const positionResult = await client.query(`
      INSERT INTO staker_positions (
        wallet_address, 
        staked_amount, 
        last_action_type,
        last_action_tx,
        last_action_at,
        status,
        estimated_confirmation_time
      ) VALUES ($1, $2, 'stake', $3, NOW(), 'pending_confirmation', NOW() + INTERVAL '30 seconds')
      ON CONFLICT (wallet_address) 
      DO UPDATE SET 
        staked_amount = staker_positions.staked_amount + EXCLUDED.staked_amount,
        last_action_type = EXCLUDED.last_action_type,
        last_action_tx = EXCLUDED.last_action_tx,
        last_action_at = EXCLUDED.last_action_at,
        status = EXCLUDED.status,
        estimated_confirmation_time = EXCLUDED.estimated_confirmation_time,
        updated_at = NOW()
      RETURNING *
    `, [userWallet, amount, txHash]);

    const updatedPosition = positionResult.rows[0];

    // 2. Calculate new APY with updated TVL
    const newAPY = await ActionProcessorUtils.calculateAPY(client);

    // 3. Get updated global metrics
    const metricsResult = await client.query(`
      SELECT * FROM get_current_staking_metrics()
    `);
    const globalMetrics = metricsResult.rows[0];

    return {
      userPosition: updatedPosition,
      globalMetrics: {
        ...globalMetrics,
        currentApy: newAPY.apy
      },
      apyData: newAPY,
      actionType: 'stake',
      amount: parseFloat(amount)
    };
  }

  /**
   * Apply unstake optimistic update
   */
  async applyUnstakeUpdate(client, userWallet, amount, txHash) {
    // 1. Update staker position
    const positionResult = await client.query(`
      UPDATE staker_positions 
      SET 
        staked_amount = GREATEST(staked_amount - $2, 0),
        last_action_type = 'unstake',
        last_action_tx = $3,
        last_action_at = NOW(),
        status = 'pending_confirmation',
        estimated_confirmation_time = NOW() + INTERVAL '30 seconds',
        updated_at = NOW()
      WHERE wallet_address = $1
      RETURNING *
    `, [userWallet, amount, txHash]);

    if (positionResult.rows.length === 0) {
      throw new Error(`No staking position found for wallet: ${userWallet}`);
    }

    const updatedPosition = positionResult.rows[0];

    // 2. Calculate new APY with updated TVL
    const newAPY = await ActionProcessorUtils.calculateAPY(client);

    // 3. Get updated global metrics
    const metricsResult = await client.query(`
      SELECT * FROM get_current_staking_metrics()
    `);
    const globalMetrics = metricsResult.rows[0];

    return {
      userPosition: updatedPosition,
      globalMetrics: {
        ...globalMetrics,
        currentApy: newAPY.apy
      },
      apyData: newAPY,
      actionType: 'unstake',
      amount: parseFloat(amount)
    };
  }

  /**
   * Apply claim rewards optimistic update
   */
  async applyClaimUpdate(client, userWallet, amount, txHash) {
    // 1. Update rewards earned and last claim time
    const positionResult = await client.query(`
      UPDATE staker_positions 
      SET 
        rewards_earned = rewards_earned + $2,
        last_action_type = 'claim',
        last_action_tx = $3,
        last_action_at = NOW(),
        last_claim_at = NOW(),
        status = 'pending_confirmation',
        estimated_confirmation_time = NOW() + INTERVAL '30 seconds',
        updated_at = NOW()
      WHERE wallet_address = $1
      RETURNING *
    `, [userWallet, amount, txHash]);

    if (positionResult.rows.length === 0) {
      throw new Error(`No staking position found for wallet: ${userWallet}`);
    }

    const updatedPosition = positionResult.rows[0];

    // 2. Get current global metrics (no APY change for claims)
    const metricsResult = await client.query(`
      SELECT * FROM get_current_staking_metrics()
    `);
    const globalMetrics = metricsResult.rows[0];

    return {
      userPosition: updatedPosition,
      globalMetrics,
      actionType: 'claim',
      amount: parseFloat(amount)
    };
  }

  /**
   * Prepare broadcast data for staking updates
   */
  async prepareBroadcastData(client, actionData, updateResult) {
    const { type, userWallet, data } = actionData;
    
    // Get top stakers for leaderboard updates (if needed)
    let topStakers = null;
    if (type === 'stake' || type === 'unstake') {
      const stakersResult = await client.query(`
        SELECT 
          wallet_address,
          staked_amount,
          rewards_earned,
          RANK() OVER (ORDER BY staked_amount DESC) as rank
        FROM staker_positions 
        WHERE is_active = true AND staked_amount > 0
        ORDER BY staked_amount DESC
        LIMIT 10
      `);
      topStakers = stakersResult.rows;
    }

    return {
      type: 'staking_update',
      rooms: ['global', 'staking', `user:${userWallet}`],
      data: {
        actionType: type,
        userWallet,
        amount: data.amount,
        txHash: data.txHash,
        userPosition: updateResult.userPosition,
        globalMetrics: updateResult.globalMetrics,
        apyData: updateResult.apyData,
        topStakers,
        timestamp: Date.now()
      },
      actionId: actionData.id
    };
  }

  /**
   * Apply rollback for failed staking actions
   */
  async applyRollback(client, actionData) {
    const { type, userWallet, data } = actionData;
    const { amount } = data;

    switch (type) {
      case 'stake':
        // Reverse the stake by reducing staked amount
        await client.query(`
          UPDATE staker_positions 
          SET 
            staked_amount = GREATEST(staked_amount - $2, 0),
            status = 'failed',
            updated_at = NOW()
          WHERE wallet_address = $1
        `, [userWallet, amount]);
        break;

      case 'unstake':
        // Reverse the unstake by adding back staked amount
        await client.query(`
          UPDATE staker_positions 
          SET 
            staked_amount = staked_amount + $2,
            status = 'failed',
            updated_at = NOW()
          WHERE wallet_address = $1
        `, [userWallet, amount]);
        break;

      case 'claim':
        // Reverse the claim by reducing rewards earned
        await client.query(`
          UPDATE staker_positions 
          SET 
            rewards_earned = GREATEST(rewards_earned - $2, 0),
            status = 'failed',
            updated_at = NOW()
          WHERE wallet_address = $1
        `, [userWallet, amount]);
        break;
    }

    // Recalculate APY after rollback
    await ActionProcessorUtils.calculateAPY(client);
  }

  /**
   * Prepare rollback broadcast data
   */
  async prepareRollbackBroadcastData(client, actionData) {
    const { type, userWallet } = actionData;

    // Get updated position after rollback
    const positionResult = await client.query(`
      SELECT * FROM staker_positions WHERE wallet_address = $1
    `, [userWallet]);

    const updatedPosition = positionResult.rows[0];

    // Get updated global metrics
    const metricsResult = await client.query(`
      SELECT * FROM get_current_staking_metrics()
    `);
    const globalMetrics = metricsResult.rows[0];

    return {
      type: 'staking_rollback',
      rooms: ['global', 'staking', `user:${userWallet}`],
      data: {
        actionType: type,
        userWallet,
        userPosition: updatedPosition,
        globalMetrics,
        message: `${type} transaction failed and has been rolled back`,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Verify staking transaction on blockchain
   */
  async verifyTransaction(txHash, expectedData) {
    try {
      // Wait for transaction confirmation
      const receipt = await this.provider.waitForTransaction(txHash, 2);

      if (!receipt || receipt.status !== 1) {
        return {
          success: false,
          error: 'Transaction failed or reverted'
        };
      }

      // Parse transaction logs to verify the action
      const verification = await this.parseStakingLogs(receipt, expectedData);
      
      return {
        success: true,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        actualAmount: verification.actualAmount,
        verified: verification.matches
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse staking contract logs to verify amounts
   */
  async parseStakingLogs(receipt, expectedData) {
    // This would parse the actual contract logs to verify amounts
    // For now, we'll assume the expected data is correct
    // In a real implementation, you'd parse the contract events here
    
    return {
      actualAmount: expectedData.amount,
      matches: true
    };
  }

  /**
   * Get user's staking position
   */
  async getUserPosition(userWallet) {
    const result = await this.pool.query(`
      SELECT * FROM staker_positions WHERE wallet_address = $1
    `, [userWallet]);

    return result.rows[0] || null;
  }

  /**
   * Get current staking overview
   */
  async getStakingOverview() {
    const client = await this.pool.connect();
    
    try {
      // Get global metrics
      const metricsResult = await client.query(`
        SELECT * FROM get_current_staking_metrics()
      `);
      const globalMetrics = metricsResult.rows[0];

      // Get latest APY calculation
      const apyResult = await client.query(`
        SELECT * FROM apy_calculations 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      const latestAPY = apyResult.rows[0];

      // Get top stakers
      const stakersResult = await client.query(`
        SELECT 
          wallet_address,
          staked_amount,
          rewards_earned,
          last_action_at,
          RANK() OVER (ORDER BY staked_amount DESC) as rank
        FROM staker_positions 
        WHERE is_active = true AND staked_amount > 0
        ORDER BY staked_amount DESC
        LIMIT 10
      `);
      const topStakers = stakersResult.rows;

      return {
        globalMetrics,
        currentAPY: latestAPY,
        topStakers,
        timestamp: Date.now()
      };

    } finally {
      client.release();
    }
  }
}