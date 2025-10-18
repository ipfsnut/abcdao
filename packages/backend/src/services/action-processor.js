import { getPool } from './database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base Action Processor
 * Foundation for all user-triggered data updates
 */
export class BaseActionProcessor {
  constructor() {
    this.pool = getPool();
  }

  /**
   * Process a user action with optimistic updates and background verification
   * @param {Object} actionData - The action data
   * @param {string} actionData.type - Action type (stake, commit, payment, etc.)
   * @param {string} actionData.userWallet - User's wallet address
   * @param {Object} actionData.data - Action-specific data
   * @param {string} actionData.txHash - Optional transaction hash
   */
  async processAction(actionData) {
    const actionId = uuidv4();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Record the action for audit trail
      const actionRecord = await this.recordAction(client, {
        id: actionId,
        ...actionData
      });

      // 2. Apply optimistic database update
      const updateResult = await this.applyOptimisticUpdate(client, actionData);

      // 3. Get affected data for broadcasting
      const broadcastData = await this.prepareBroadcastData(client, actionData, updateResult);

      await client.query('COMMIT');

      // 4. Broadcast updates to connected clients
      await this.broadcastUpdate(broadcastData);

      // 5. Schedule background verification if needed
      if (actionData.txHash) {
        await this.scheduleVerification(actionRecord);
      }

      console.log(`✅ Action processed: ${actionData.type} for ${actionData.userWallet}`);
      return { success: true, actionId, data: updateResult };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Action processing failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async recordAction(client, actionData) {
    const result = await client.query(`
      INSERT INTO user_actions (
        id, user_wallet, action_type, action_data, tx_hash, 
        optimistic_update_applied, created_at
      ) VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING *
    `, [
      actionData.id,
      actionData.userWallet,
      actionData.type,
      JSON.stringify(actionData.data),
      actionData.txHash || null
    ]);

    return result.rows[0];
  }

  async scheduleVerification(actionRecord) {
    if (!actionRecord.tx_hash) return;

    // Schedule verification for 30 seconds from now (typical block time)
    const verificationTime = new Date(Date.now() + 30 * 1000);

    await this.pool.query(`
      INSERT INTO verification_queue (
        action_id, verification_type, scheduled_for
      ) VALUES ($1, $2, $3)
    `, [
      actionRecord.id,
      actionRecord.action_type,
      verificationTime
    ]);
  }

  // Abstract methods to be implemented by subclasses
  async applyOptimisticUpdate(client, actionData) {
    throw new Error('applyOptimisticUpdate must be implemented by subclass');
  }

  async prepareBroadcastData(client, actionData, updateResult) {
    throw new Error('prepareBroadcastData must be implemented by subclass');
  }

  async broadcastUpdate(broadcastData) {
    // Import here to avoid circular dependencies
    const { RealtimeBroadcastManager } = await import('./realtime-broadcast.js');
    const broadcaster = RealtimeBroadcastManager.getInstance();
    
    return broadcaster.broadcast(broadcastData);
  }

  /**
   * Rollback an optimistic update (used by verification system)
   */
  async rollbackAction(actionId, reason) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get the original action
      const actionResult = await client.query(`
        SELECT * FROM user_actions WHERE id = $1
      `, [actionId]);

      if (actionResult.rows.length === 0) {
        throw new Error(`Action ${actionId} not found`);
      }

      const action = actionResult.rows[0];
      const actionData = {
        type: action.action_type,
        userWallet: action.user_wallet,
        data: action.action_data,
        txHash: action.tx_hash
      };

      // Apply rollback (reverse the optimistic update)
      await this.applyRollback(client, actionData);

      // Update action status
      await client.query(`
        UPDATE user_actions 
        SET 
          status = 'failed',
          blockchain_verified = true,
          verification_result = $2,
          confirmed_at = NOW()
        WHERE id = $1
      `, [actionId, JSON.stringify({ error: reason })]);

      // Get updated data for broadcasting
      const rollbackBroadcastData = await this.prepareRollbackBroadcastData(client, actionData);

      await client.query('COMMIT');

      // Broadcast the rollback
      await this.broadcastUpdate(rollbackBroadcastData);

      console.log(`🔄 Action rolled back: ${actionId} - ${reason}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Confirm an optimistic update (used by verification system)
   */
  async confirmAction(actionId, verificationData) {
    await this.pool.query(`
      UPDATE user_actions 
      SET 
        status = 'confirmed',
        blockchain_verified = true,
        verification_result = $2,
        confirmed_at = NOW()
      WHERE id = $1
    `, [actionId, JSON.stringify(verificationData)]);

    console.log(`✅ Action confirmed: ${actionId}`);
  }

  // Abstract methods for rollback functionality
  async applyRollback(client, actionData) {
    throw new Error('applyRollback must be implemented by subclass');
  }

  async prepareRollbackBroadcastData(client, actionData) {
    throw new Error('prepareRollbackBroadcastData must be implemented by subclass');
  }
}

/**
 * Action Processor Factory
 * Creates the appropriate processor for each action type
 */
export class ActionProcessorFactory {
  static processors = new Map();

  static register(actionType, processorClass) {
    this.processors.set(actionType, processorClass);
  }

  static async process(actionData) {
    const ProcessorClass = this.processors.get(actionData.type);
    
    if (!ProcessorClass) {
      throw new Error(`No processor registered for action type: ${actionData.type}`);
    }

    const processor = new ProcessorClass();
    return await processor.processAction(actionData);
  }

  static getRegisteredTypes() {
    return Array.from(this.processors.keys());
  }
}

// Utility function for common database operations
export class ActionProcessorUtils {
  static async updateUserStats(client, userWallet) {
    const result = await client.query(`
      UPDATE users_master 
      SET 
        total_commits = (
          SELECT COUNT(*) FROM commits_master 
          WHERE author_wallet = $1 AND processed_at IS NOT NULL
        ),
        total_rewards_earned = (
          SELECT COALESCE(SUM(reward_amount), 0) FROM commits_master 
          WHERE author_wallet = $1 AND processed_at IS NOT NULL
        ),
        last_commit_at = (
          SELECT MAX(commit_timestamp) FROM commits_master 
          WHERE author_wallet = $1
        ),
        updated_at = NOW()
      WHERE wallet_address = $1
      RETURNING *
    `, [userWallet]);

    return result.rows[0];
  }

  static async calculateAPY(client) {
    // Get current total staked
    const stakingResult = await client.query(`
      SELECT COALESCE(SUM(staked_amount), 0) as total_staked
      FROM staker_positions 
      WHERE status IN ('confirmed', 'pending_confirmation') AND is_active = true
    `);

    const totalStaked = parseFloat(stakingResult.rows[0].total_staked) || 0;

    // Get average daily rewards (last 7 days)
    const rewardsResult = await client.query(`
      SELECT COALESCE(AVG(daily_rewards), 0) as avg_daily_rewards
      FROM (
        SELECT DATE(processed_at) as date, SUM(reward_amount) as daily_rewards
        FROM commits 
        WHERE processed_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(processed_at)
      ) daily_totals
    `);

    const avgDailyRewards = parseFloat(rewardsResult.rows[0].avg_daily_rewards) || 0;

    // Calculate APY
    const annualRewards = avgDailyRewards * 365;
    let apy = totalStaked > 0 ? (annualRewards / totalStaked) * 100 : 0;
    
    // Cap APY at 9999% to prevent database overflow
    apy = Math.min(Math.max(0, apy), 9999);

    // Store calculation
    await client.query(`
      INSERT INTO apy_calculations (
        calculation_method, tvl_amount, annual_rewards_estimate, 
        calculated_apy, calculation_trigger, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      'action_triggered',
      totalStaked,
      annualRewards,
      apy,
      'user_action'
    ]);

    return {
      apy: Math.max(0, apy),
      totalStaked,
      annualRewards,
      calculatedAt: new Date()
    };
  }

  static async getLeaderboardData(client, limit = 20) {
    const result = await client.query(`
      SELECT 
        u.wallet_address,
        u.github_username,
        u.display_name,
        u.total_commits,
        u.total_rewards_earned,
        u.last_commit_at,
        RANK() OVER (ORDER BY u.total_rewards_earned DESC, u.total_commits DESC) as rank
      FROM users_master u
      WHERE u.is_active = true
      ORDER BY u.total_rewards_earned DESC, u.total_commits DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }
}