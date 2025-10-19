import { getPool } from './database.js';
import { ActionProcessorFactory } from './action-processor.js';
import { ethers } from 'ethers';

/**
 * Blockchain Verification Service
 * Handles background verification of blockchain transactions
 */
export class BlockchainVerificationService {
  constructor() {
    this.pool = getPool();
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    this.isRunning = false;
    this.verificationInterval = 15 * 1000; // Check every 15 seconds
  }

  /**
   * Start the verification service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Blockchain verification service already running');
      return;
    }

    this.isRunning = true;
    console.log('✅ Starting blockchain verification service');
    
    // Start the verification loop
    this.verificationLoop();
  }

  /**
   * Stop the verification service
   */
  stop() {
    this.isRunning = false;
    console.log('🛑 Blockchain verification service stopped');
  }

  /**
   * Main verification loop
   */
  async verificationLoop() {
    while (this.isRunning) {
      try {
        await this.processVerificationQueue();
        await this.sleep(this.verificationInterval);
      } catch (error) {
        console.error('❌ Verification loop error:', error.message);
        await this.sleep(5000); // Wait 5 seconds on error
      }
    }
  }

  /**
   * Process pending verifications
   */
  async processVerificationQueue() {
    const pendingVerifications = await this.getPendingVerifications();
    
    if (pendingVerifications.length === 0) {
      return; // Nothing to process
    }

    console.log(`🔍 Processing ${pendingVerifications.length} pending verifications`);

    for (const verification of pendingVerifications) {
      try {
        await this.processVerification(verification);
      } catch (error) {
        console.error(`❌ Failed to process verification ${verification.id}:`, error.message);
        await this.markVerificationFailed(verification.id, error.message);
      }
    }
  }

  /**
   * Get pending verifications that are ready to process
   */
  async getPendingVerifications() {
    const result = await this.pool.query(`
      SELECT 
        vq.*,
        ua.user_wallet,
        ua.action_type,
        ua.action_data,
        ua.tx_hash
      FROM verification_queue vq
      JOIN user_actions ua ON vq.action_id = ua.id
      WHERE vq.status = 'pending' 
        AND vq.scheduled_for <= NOW()
        AND vq.attempts < vq.max_attempts
      ORDER BY vq.scheduled_for ASC
      LIMIT 10
    `);

    return result.rows;
  }

  /**
   * Process a single verification
   */
  async processVerification(verification) {
    const { id, action_id, verification_type, tx_hash, action_data, user_wallet, attempts } = verification;

    console.log(`🔍 Verifying ${verification_type} transaction: ${tx_hash}`);

    // Mark as processing
    await this.pool.query(`
      UPDATE verification_queue 
      SET 
        status = 'processing',
        attempts = attempts + 1,
        last_attempt_at = NOW()
      WHERE id = $1
    `, [id]);

    try {
      // Verify the transaction based on type
      let verificationResult;
      
      switch (verification_type) {
        case 'stake':
        case 'unstake':
        case 'claim':
          verificationResult = await this.verifyStakingTransaction(tx_hash, action_data);
          break;
        
        default:
          throw new Error(`Unknown verification type: ${verification_type}`);
      }

      if (verificationResult.success) {
        await this.confirmVerification(action_id, verificationResult);
      } else {
        await this.rollbackVerification(action_id, verificationResult.error);
      }

      // Mark verification as completed
      await this.pool.query(`
        UPDATE verification_queue 
        SET 
          status = 'completed',
          error_message = NULL
        WHERE id = $1
      `, [id]);

    } catch (error) {
      // Mark verification as failed
      await this.markVerificationFailed(id, error.message);
      
      // If we've exhausted attempts, rollback the action
      if (attempts + 1 >= verification.max_attempts) {
        await this.rollbackVerification(action_id, `Verification failed after ${verification.max_attempts} attempts: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Verify a staking transaction
   */
  async verifyStakingTransaction(txHash, actionData) {
    try {
      // Wait for transaction receipt with confirmations
      const receipt = await this.provider.waitForTransaction(txHash, 2);

      if (!receipt) {
        return {
          success: false,
          error: 'Transaction not found or not confirmed'
        };
      }

      if (receipt.status !== 1) {
        return {
          success: false,
          error: 'Transaction reverted'
        };
      }

      // Parse transaction logs to verify amounts and events
      const verification = await this.parseStakingLogs(receipt, actionData);

      return {
        success: verification.isValid,
        error: verification.isValid ? null : verification.error,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        actualAmount: verification.actualAmount,
        expectedAmount: actionData.amount
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse staking contract logs to verify the transaction
   */
  async parseStakingLogs(receipt, actionData) {
    // For this implementation, we'll assume the transaction is valid if it didn't revert
    // In a real implementation, you would:
    // 1. Parse the contract's event logs
    // 2. Verify the staked amount matches expectations
    // 3. Verify the user address matches
    // 4. Check for any error conditions

    const expectedAmount = parseFloat(actionData.amount);
    
    // Simulate parsing contract logs
    // In reality, you'd use contract.interface.parseLog() on each log
    return {
      isValid: true, // Assume valid for now
      actualAmount: expectedAmount, // Would be parsed from logs
      error: null
    };
  }

  /**
   * Confirm a verification (action was successful on blockchain)
   */
  async confirmVerification(actionId, verificationResult) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Update action status to confirmed
      await client.query(`
        UPDATE user_actions 
        SET 
          status = 'confirmed',
          blockchain_verified = true,
          verification_result = $2,
          confirmed_at = NOW()
        WHERE id = $1
      `, [actionId, JSON.stringify(verificationResult)]);

      // Update staker position status if it's a staking action
      const actionResult = await client.query(`
        SELECT action_type, user_wallet FROM user_actions WHERE id = $1
      `, [actionId]);

      const action = actionResult.rows[0];
      
      if (['stake', 'unstake', 'claim'].includes(action.action_type)) {
        await client.query(`
          UPDATE staker_positions 
          SET status = 'confirmed'
          WHERE wallet_address = $1
        `, [action.user_wallet]);
      }

      await client.query('COMMIT');

      console.log(`✅ Action ${actionId} confirmed on blockchain`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rollback a verification (action failed on blockchain)
   */
  async rollbackVerification(actionId, errorReason) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get the action details
      const actionResult = await client.query(`
        SELECT * FROM user_actions WHERE id = $1
      `, [actionId]);

      if (actionResult.rows.length === 0) {
        throw new Error(`Action ${actionId} not found`);
      }

      const action = actionResult.rows[0];

      // Get the appropriate processor and rollback the action
      const processors = new Map([
        ['stake', 'StakingActionProcessor'],
        ['unstake', 'StakingActionProcessor'], 
        ['claim', 'StakingActionProcessor']
      ]);

      const processorName = processors.get(action.action_type);
      
      if (processorName) {
        // Import the specific processor
        let ProcessorClass;
        if (processorName === 'StakingActionProcessor') {
          const { StakingActionProcessor } = await import('./staking-action-processor.js');
          ProcessorClass = StakingActionProcessor;
        }

        if (ProcessorClass) {
          const processor = new ProcessorClass();
          await processor.rollbackAction(actionId, errorReason);
        }
      }

      await client.query('COMMIT');

      console.log(`🔄 Action ${actionId} rolled back: ${errorReason}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark verification as failed
   */
  async markVerificationFailed(verificationId, errorMessage) {
    await this.pool.query(`
      UPDATE verification_queue 
      SET 
        status = 'failed',
        error_message = $2,
        last_attempt_at = NOW()
      WHERE id = $1
    `, [verificationId, errorMessage]);
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(days = 7) {
    const result = await this.pool.query(`
      SELECT 
        vq.verification_type,
        vq.status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (vq.last_attempt_at - vq.created_at))) as avg_verification_time
      FROM verification_queue vq
      WHERE vq.created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY vq.verification_type, vq.status
      ORDER BY vq.verification_type, vq.status
    `);

    return result.rows;
  }

  /**
   * Get failed verifications that need attention
   */
  async getFailedVerifications(limit = 20) {
    const result = await this.pool.query(`
      SELECT 
        vq.*,
        ua.user_wallet,
        ua.action_type,
        ua.tx_hash,
        ua.created_at as action_created_at
      FROM verification_queue vq
      JOIN user_actions ua ON vq.action_id = ua.id
      WHERE vq.status = 'failed'
      ORDER BY vq.created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  /**
   * Retry a failed verification
   */
  async retryVerification(verificationId) {
    await this.pool.query(`
      UPDATE verification_queue 
      SET 
        status = 'pending',
        attempts = 0,
        error_message = NULL,
        scheduled_for = NOW()
      WHERE id = $1 AND status = 'failed'
    `, [verificationId]);

    console.log(`🔄 Retrying verification ${verificationId}`);
  }

  /**
   * Clean up old completed verifications
   */
  async cleanup(daysToKeep = 30) {
    const result = await this.pool.query(`
      DELETE FROM verification_queue 
      WHERE status = 'completed' 
        AND created_at < NOW() - INTERVAL '${daysToKeep} days'
    `);

    if (result.rowCount > 0) {
      console.log(`🧹 Cleaned up ${result.rowCount} old verifications`);
    }

    return result.rowCount;
  }
}

// Singleton instance
let verificationService = null;

export function getVerificationService() {
  if (!verificationService) {
    verificationService = new BlockchainVerificationService();
  }
  return verificationService;
}

export function startVerificationService() {
  const service = getVerificationService();
  service.start();
  return service;
}

export function stopVerificationService() {
  if (verificationService) {
    verificationService.stop();
  }
}