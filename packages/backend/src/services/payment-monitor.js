import { ethers } from 'ethers';
import { getPool } from './database.js';
import { farcasterService } from './farcaster.js';
import dotenv from 'dotenv';

dotenv.config();

class PaymentMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.botWalletAddress = process.env.BOT_WALLET_ADDRESS || '0x475579e65E140B11bc4656dD4b05e0CADc8366eB';
    this.expectedAmount = ethers.parseEther('0.002'); // 0.002 ETH membership fee
    this.isMonitoring = false;
    this.lastCheckedBlock = null;
  }

  /**
   * Start monitoring payments to bot wallet
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ Payment monitor already running');
      return;
    }

    this.isMonitoring = true;
    console.log('👁️ Starting payment monitor...');
    console.log(`   Watching: ${this.botWalletAddress}`);
    console.log(`   Expected amount: ${ethers.formatEther(this.expectedAmount)} ETH`);

    // Get current block to start monitoring from
    this.lastCheckedBlock = await this.provider.getBlockNumber();
    console.log(`   Starting from block: ${this.lastCheckedBlock}\n`);

    // Set up event listener for new blocks
    this.provider.on('block', (blockNumber) => {
      this.processNewBlock(blockNumber);
    });

    // Also run a periodic check every 30 seconds as backup
    this.intervalCheck = setInterval(() => {
      this.checkMissedPayments();
    }, 30000);

    console.log('✅ Payment monitor started');
  }

  /**
   * Stop monitoring payments
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.provider.removeAllListeners('block');
    
    if (this.intervalCheck) {
      clearInterval(this.intervalCheck);
    }

    console.log('🛑 Payment monitor stopped');
  }

  /**
   * Process a new block for payments
   */
  async processNewBlock(blockNumber) {
    if (!this.isMonitoring || blockNumber <= this.lastCheckedBlock) return;

    try {
      const block = await this.provider.getBlock(blockNumber, true);
      if (!block || !block.transactions) return;

      // Check each transaction in the block
      for (const tx of block.transactions) {
        if (tx.to && tx.to.toLowerCase() === this.botWalletAddress.toLowerCase()) {
          await this.processPaymentTransaction(tx);
        }
      }

      this.lastCheckedBlock = blockNumber;
    } catch (error) {
      console.error(`❌ Error processing block ${blockNumber}:`, error.message);
    }
  }

  /**
   * Process a potential payment transaction
   */
  async processPaymentTransaction(tx) {
    try {
      console.log(`💰 Potential payment detected: ${tx.hash}`);
      console.log(`   From: ${tx.from}`);
      console.log(`   Amount: ${ethers.formatEther(tx.value)} ETH`);

      // Verify payment amount (allow slight variations due to gas)
      const paymentAmount = tx.value;
      const minAmount = this.expectedAmount * 99n / 100n; // 99% tolerance
      const maxAmount = this.expectedAmount * 101n / 100n; // 101% tolerance

      if (paymentAmount < minAmount || paymentAmount > maxAmount) {
        console.log(`   ❌ Invalid amount (expected ~${ethers.formatEther(this.expectedAmount)} ETH)`);
        return;
      }

      // Extract FID from transaction data
      const fid = this.extractFIDFromData(tx.data);
      if (!fid) {
        console.log(`   ❌ No valid FID found in transaction data`);
        return;
      }

      console.log(`   ✅ Valid payment for FID: ${fid}`);

      // Update user membership status
      await this.updateUserMembership(fid, tx.hash, paymentAmount, tx.from);

    } catch (error) {
      console.error(`❌ Error processing payment transaction ${tx.hash}:`, error.message);
    }
  }

  /**
   * Extract Farcaster ID from transaction data
   */
  extractFIDFromData(data) {
    try {
      if (!data || data === '0x') return null;

      // Remove 0x prefix and convert hex to string
      const hexString = data.slice(2);
      const bytes = Buffer.from(hexString, 'hex');
      const dataString = bytes.toString('utf-8');

      // Look for FID pattern: ABC_DAO_MEMBERSHIP_FID:123456
      const fidMatch = dataString.match(/ABC_DAO_MEMBERSHIP_FID:(\d+)/);
      return fidMatch ? parseInt(fidMatch[1]) : null;

    } catch (error) {
      console.error('Error extracting FID from data:', error.message);
      return null;
    }
  }

  /**
   * Update user membership status in database
   */
  async updateUserMembership(fid, txHash, amount, fromAddress) {
    try {
      const pool = getPool();
      
      console.log(`📝 Updating membership for FID ${fid}...`);

      // Check if user exists
      const userResult = await pool.query(
        'SELECT id, farcaster_username FROM users WHERE farcaster_fid = $1',
        [fid]
      );

      if (userResult.rows.length === 0) {
        console.log(`   ❌ User with FID ${fid} not found in database`);
        return;
      }

      const user = userResult.rows[0];
      console.log(`   Found user: @${user.farcaster_username}`);

      // Update membership status
      await pool.query(`
        UPDATE users 
        SET 
          membership_status = 'paid',
          membership_paid_at = NOW(),
          membership_tx_hash = $1,
          membership_amount = $2,
          updated_at = NOW()
        WHERE farcaster_fid = $3
      `, [txHash, ethers.formatEther(amount), fid]);

      // Insert membership record
      await pool.query(`
        INSERT INTO memberships (user_id, payment_tx_hash, amount_eth, paid_at, status, payment_method)
        VALUES ($1, $2, $3, NOW(), 'active', 'ethereum')
        ON CONFLICT (payment_tx_hash) DO NOTHING
      `, [user.id, txHash, ethers.formatEther(amount)]);

      console.log(`   ✅ Membership activated for @${user.farcaster_username}`);
      console.log(`   Transaction: ${txHash}`);
      console.log(`   Amount: ${ethers.formatEther(amount)} ETH`);

      // Post welcome cast for new member
      try {
        await farcasterService.announceNewContributor(user.github_username || user.farcaster_username, user.farcaster_username);
        console.log(`   🎉 Welcome cast posted for @${user.farcaster_username}`);
      } catch (castError) {
        console.error(`   ⚠️ Failed to post welcome cast:`, castError.message);
      }
      console.log('');

      return true;

    } catch (error) {
      console.error(`❌ Database error updating FID ${fid}:`, error.message);
      return false;
    }
  }

  /**
   * Check for any missed payments (backup method)
   */
  async checkMissedPayments() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      // Check last 10 blocks for any missed transactions
      const startBlock = Math.max(this.lastCheckedBlock + 1, currentBlock - 10);
      
      if (startBlock > currentBlock) return;

      for (let blockNum = startBlock; blockNum <= currentBlock; blockNum++) {
        await this.processNewBlock(blockNum);
      }

    } catch (error) {
      console.error('❌ Error in missed payments check:', error.message);
    }
  }

  /**
   * Manual check for recent payments (for testing)
   */
  async checkRecentPayments(hours = 24) {
    console.log(`🔍 Checking for payments in last ${hours} hours...`);
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      // Estimate blocks (Base ~2s per block)
      const blocksToCheck = Math.floor((hours * 60 * 60) / 2);
      const startBlock = Math.max(0, currentBlock - blocksToCheck);
      
      console.log(`   Checking blocks ${startBlock} to ${currentBlock}`);
      
      let paymentsFound = 0;
      
      for (let blockNum = startBlock; blockNum <= currentBlock; blockNum++) {
        const block = await this.provider.getBlock(blockNum, true);
        if (!block || !block.transactions) continue;

        for (const tx of block.transactions) {
          if (tx.to && tx.to.toLowerCase() === this.botWalletAddress.toLowerCase()) {
            await this.processPaymentTransaction(tx);
            paymentsFound++;
          }
        }
        
        // Progress indicator for large ranges
        if (blockNum % 1000 === 0) {
          console.log(`   Processed block ${blockNum}...`);
        }
      }
      
      console.log(`✅ Manual payment check complete. Found ${paymentsFound} payments.`);
      
    } catch (error) {
      console.error('❌ Manual payment check failed:', error.message);
    }
  }
}

export { PaymentMonitor };