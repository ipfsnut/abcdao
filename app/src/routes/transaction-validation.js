import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

// Validate transaction hash for membership payment
router.post('/validate-transaction', async (req, res) => {
  const { transaction_hash, farcaster_fid, farcaster_username } = req.body;

  if (!transaction_hash || !farcaster_fid || !farcaster_username) {
    return res.status(400).json({ 
      error: 'Transaction hash, Farcaster FID, and username required' 
    });
  }

  // Validate transaction hash format
  if (!transaction_hash.match(/^0x[a-fA-F0-9]{64}$/)) {
    return res.status(400).json({ error: 'Invalid transaction hash format' });
  }

  try {
    const pool = getPool();
    
    // Check if transaction already processed
    const existingTx = await pool.query(
      'SELECT id FROM memberships WHERE payment_tx_hash = $1',
      [transaction_hash]
    );

    if (existingTx.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Transaction already processed' 
      });
    }

    // Check if user already exists
    let user = await pool.query(
      'SELECT id, membership_status FROM users WHERE farcaster_fid = $1',
      [farcaster_fid]
    );

    if (user.rows.length > 0 && user.rows[0].membership_status === 'paid') {
      return res.status(400).json({ 
        error: 'User already has paid membership' 
      });
    }

    // Validate transaction on blockchain
    const isValid = await validateTransactionOnchain(transaction_hash);
    
    if (!isValid.valid) {
      return res.status(400).json({ 
        error: isValid.error || 'Transaction validation failed' 
      });
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create or update user
      if (user.rows.length === 0) {
        // Create new user
        const userResult = await client.query(`
          INSERT INTO users (
            farcaster_fid, 
            farcaster_username, 
            membership_status, 
            membership_paid_at, 
            membership_tx_hash,
            membership_amount
          ) VALUES ($1, $2, 'paid', $3, $4, $5)
          RETURNING id
        `, [
          farcaster_fid, 
          farcaster_username, 
          isValid.timestamp, 
          transaction_hash, 
          isValid.amount
        ]);
        
        user = { rows: [{ id: userResult.rows[0].id }] };
      } else {
        // Update existing user
        await client.query(`
          UPDATE users 
          SET 
            membership_status = 'paid',
            membership_paid_at = $1,
            membership_tx_hash = $2,
            membership_amount = $3,
            updated_at = NOW()
          WHERE farcaster_fid = $4
        `, [isValid.timestamp, transaction_hash, isValid.amount, farcaster_fid]);
      }

      // Create membership record
      await client.query(`
        INSERT INTO memberships (
          user_id,
          payment_tx_hash,
          amount_eth,
          paid_at,
          status
        ) VALUES ($1, $2, $3, $4, 'active')
      `, [user.rows[0].id, transaction_hash, isValid.amount, isValid.timestamp]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Transaction validated and membership activated!',
        user_id: user.rows[0].id,
        payment_details: {
          transaction_hash,
          amount_eth: isValid.amount,
          paid_at: isValid.timestamp
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error validating transaction:', error);
    res.status(500).json({ error: 'Failed to validate transaction' });
  }
});

// Validate transaction on blockchain using Alchemy RPC
async function validateTransactionOnchain(txHash) {
  try {
    const alchemyUrl = process.env.ALCHEMY_RPC_URL;
    if (!alchemyUrl) {
      throw new Error('ALCHEMY_RPC_URL not configured');
    }

    const botWalletAddress = process.env.BOT_WALLET_ADDRESS;
    if (!botWalletAddress) {
      throw new Error('BOT_WALLET_ADDRESS not configured');
    }

    // Get transaction details
    const response = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return { valid: false, error: `RPC error: ${data.error.message}` };
    }

    const tx = data.result;
    if (!tx) {
      return { valid: false, error: 'Transaction not found' };
    }

    // Check if transaction is confirmed
    if (!tx.blockNumber) {
      return { valid: false, error: 'Transaction not yet confirmed' };
    }

    // Validate transaction details
    const expectedAmount = '0x71afd498d0000'; // 0.002 ETH in wei
    const actualAmount = tx.value;
    const recipient = tx.to?.toLowerCase();
    const expectedRecipient = botWalletAddress.toLowerCase();

    if (recipient !== expectedRecipient) {
      return { 
        valid: false, 
        error: `Invalid recipient. Expected ${expectedRecipient}, got ${recipient}` 
      };
    }

    if (actualAmount !== expectedAmount) {
      const actualEth = parseInt(actualAmount, 16) / 1e18;
      return { 
        valid: false, 
        error: `Invalid amount. Expected 0.002 ETH, got ${actualEth} ETH` 
      };
    }

    // Get block timestamp
    const blockResponse = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [tx.blockNumber, false],
        id: 2
      })
    });

    const blockData = await blockResponse.json();
    const timestamp = new Date(parseInt(blockData.result.timestamp, 16) * 1000);

    return {
      valid: true,
      amount: '0.002',
      timestamp,
      blockNumber: parseInt(tx.blockNumber, 16),
      from: tx.from,
      to: tx.to
    };

  } catch (error) {
    console.error('Blockchain validation error:', error);
    return { valid: false, error: `Validation failed: ${error.message}` };
  }
}

export default router;