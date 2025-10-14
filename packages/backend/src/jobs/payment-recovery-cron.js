import cron from 'node-cron';
import { getPool } from '../services/database.js';

export class PaymentRecoveryCron {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    console.log('🔄 Starting payment recovery cron job (every 12 hours)...');
    
    // Run every 12 hours at minute 0
    this.job = cron.schedule('0 */12 * * *', async () => {
      if (this.isRunning) {
        console.log('⏳ Payment recovery job already running, skipping...');
        return;
      }
      
      await this.processOrphanedPayments();
    }, {
      timezone: 'UTC'
    });

    // Also run once on startup after 2 minutes
    setTimeout(() => {
      this.processOrphanedPayments();
    }, 2 * 60 * 1000);
  }

  stop() {
    if (this.job) {
      this.job.stop();
      console.log('⏹️ Payment recovery cron job stopped');
    }
  }

  async processOrphanedPayments() {
    this.isRunning = true;
    
    try {
      console.log('🔍 Checking for orphaned payments...');
      
      const orphanedPayments = await this.findOrphanedPayments();
      
      if (orphanedPayments.length === 0) {
        console.log('✅ No orphaned payments found');
        return;
      }

      console.log(`📋 Found ${orphanedPayments.length} potential orphaned payments`);
      
      let processed = 0;
      let failed = 0;

      for (const payment of orphanedPayments) {
        try {
          const success = await this.processOrphanedPayment(payment);
          if (success) {
            processed++;
            console.log(`✅ Processed orphaned payment: ${payment.hash}`);
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          console.error(`❌ Failed to process payment ${payment.hash}:`, error.message);
        }
      }

      console.log(`📊 Payment recovery completed: ${processed} processed, ${failed} failed`);
      
    } catch (error) {
      console.error('❌ Payment recovery job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async findOrphanedPayments() {
    try {
      const alchemyUrl = process.env.ALCHEMY_RPC_URL;
      const botWalletAddress = process.env.BOT_WALLET_ADDRESS;
      
      if (!alchemyUrl || !botWalletAddress) {
        console.warn('⚠️ Missing ALCHEMY_RPC_URL or BOT_WALLET_ADDRESS, skipping payment recovery');
        return [];
      }

      // Get latest block number
      const latestBlockResponse = await fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });

      const latestBlockData = await latestBlockResponse.json();
      const latestBlock = parseInt(latestBlockData.result, 16);
      
      // Look back 1 week (approximately 50,400 blocks)
      const fromBlock = Math.max(0, latestBlock - 50400);

      // Get transactions to bot wallet
      const response = await fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: `0x${fromBlock.toString(16)}`,
            toBlock: 'latest',
            toAddress: botWalletAddress,
            category: ['external'],
            excludeZeroValue: true,
            maxCount: 100
          }],
          id: 2
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Alchemy API error: ${data.error.message}`);
      }

      const transfers = data.result?.transfers || [];
      
      // Filter for membership payments (0.002 ETH)
      const membershipPayments = transfers.filter(transfer => 
        transfer.value === 0.002 && transfer.asset === 'ETH'
      );

      // Check which payments are not in our database
      const pool = getPool();
      const orphaned = [];

      for (const payment of membershipPayments) {
        const existingPayment = await pool.query(
          'SELECT id FROM memberships WHERE payment_tx_hash = $1',
          [payment.hash]
        );

        if (existingPayment.rows.length === 0) {
          orphaned.push({
            hash: payment.hash,
            from: payment.from,
            to: payment.to,
            value: payment.value,
            blockNum: payment.blockNum
          });
        }
      }

      return orphaned;
      
    } catch (error) {
      console.error('Error finding orphaned payments:', error);
      return [];
    }
  }

  async processOrphanedPayment(payment) {
    try {
      // We can't automatically determine the Farcaster user from just the transaction
      // So we'll create a pending recovery record that admins can review
      const pool = getPool();
      
      // Check if we already have a recovery record for this transaction
      const existingRecovery = await pool.query(
        'SELECT id FROM payment_recoveries WHERE transaction_hash = $1',
        [payment.hash]
      );

      if (existingRecovery.rows.length > 0) {
        return false; // Already exists
      }

      // Create recovery record
      await pool.query(`
        INSERT INTO payment_recoveries (
          transaction_hash,
          from_address,
          amount_eth,
          block_number,
          status,
          detected_at
        ) VALUES ($1, $2, $3, $4, 'pending_review', NOW())
      `, [
        payment.hash,
        payment.from,
        payment.value,
        parseInt(payment.blockNum, 16)
      ]);

      return true;
      
    } catch (error) {
      console.error('Error processing orphaned payment:', error);
      return false;
    }
  }
}