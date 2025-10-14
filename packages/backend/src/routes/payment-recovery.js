import express from 'express';
import { getPool } from '../services/database.js';

const router = express.Router();

// Get payment recoveries (admin only)
router.get('/payment-recoveries', async (req, res) => {
  const { status = 'pending_review' } = req.query;
  
  try {
    const pool = getPool();
    
    const recoveries = await pool.query(`
      SELECT 
        pr.*,
        u.farcaster_username,
        u.github_username,
        processor.farcaster_username as processed_by_username
      FROM payment_recoveries pr
      LEFT JOIN users u ON pr.matched_user_id = u.id
      LEFT JOIN users processor ON pr.processed_by_user_id = processor.id
      WHERE pr.status = $1
      ORDER BY pr.detected_at DESC
    `, [status]);
    
    res.json({
      recoveries: recoveries.rows,
      total: recoveries.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching payment recoveries:', error);
    res.status(500).json({ error: 'Failed to fetch payment recoveries' });
  }
});

// Process payment recovery (admin only)
router.post('/payment-recoveries/:id/process', async (req, res) => {
  const { id } = req.params;
  const { 
    action, // 'match', 'ignore', 'process'
    matched_user_id,
    admin_notes,
    farcaster_fid,
    farcaster_username
  } = req.body;

  if (!action || !['match', 'ignore', 'process'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get recovery record
      const recovery = await client.query(
        'SELECT * FROM payment_recoveries WHERE id = $1',
        [id]
      );

      if (recovery.rows.length === 0) {
        return res.status(404).json({ error: 'Payment recovery not found' });
      }

      const recoveryData = recovery.rows[0];

      if (action === 'ignore') {
        // Mark as ignored
        await client.query(`
          UPDATE payment_recoveries 
          SET 
            status = 'ignored',
            admin_notes = $1,
            processed_at = NOW()
          WHERE id = $2
        `, [admin_notes, id]);

        await client.query('COMMIT');
        return res.json({ success: true, message: 'Payment recovery ignored' });
      }

      if (action === 'match' && matched_user_id) {
        // Match to existing user
        await client.query(`
          UPDATE payment_recoveries 
          SET 
            status = 'matched',
            matched_user_id = $1,
            admin_notes = $2,
            processed_at = NOW()
          WHERE id = $3
        `, [matched_user_id, admin_notes, id]);

        await client.query('COMMIT');
        return res.json({ success: true, message: 'Payment recovery matched to user' });
      }

      if (action === 'process') {
        // Create user and membership
        let user_id = matched_user_id;

        if (!user_id && farcaster_fid && farcaster_username) {
          // Create new user
          const userResult = await client.query(`
            INSERT INTO users (
              farcaster_fid, 
              farcaster_username, 
              membership_status, 
              membership_paid_at, 
              membership_tx_hash,
              membership_amount
            ) VALUES ($1, $2, 'paid', NOW(), $3, $4)
            RETURNING id
          `, [
            farcaster_fid, 
            farcaster_username, 
            recoveryData.transaction_hash, 
            recoveryData.amount_eth
          ]);
          
          user_id = userResult.rows[0].id;
        } else if (user_id) {
          // Update existing user
          await client.query(`
            UPDATE users 
            SET 
              membership_status = 'paid',
              membership_paid_at = NOW(),
              membership_tx_hash = $1,
              membership_amount = $2,
              updated_at = NOW()
            WHERE id = $3
          `, [recoveryData.transaction_hash, recoveryData.amount_eth, user_id]);
        } else {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'User ID or Farcaster details required for processing' });
        }

        // Create membership record
        await client.query(`
          INSERT INTO memberships (
            user_id,
            payment_tx_hash,
            amount_eth,
            paid_at,
            status
          ) VALUES ($1, $2, $3, NOW(), 'active')
        `, [user_id, recoveryData.transaction_hash, recoveryData.amount_eth]);

        // Update recovery record
        await client.query(`
          UPDATE payment_recoveries 
          SET 
            status = 'processed',
            matched_user_id = $1,
            admin_notes = $2,
            processed_at = NOW()
          WHERE id = $3
        `, [user_id, admin_notes, id]);

        await client.query('COMMIT');
        return res.json({ 
          success: true, 
          message: 'Payment recovery processed and membership created',
          user_id 
        });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error processing payment recovery:', error);
    res.status(500).json({ error: 'Failed to process payment recovery' });
  }
});

// Search for users to match with payment recovery
router.get('/users/search', async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const pool = getPool();
    
    const users = await pool.query(`
      SELECT 
        id,
        farcaster_fid,
        farcaster_username,
        github_username,
        membership_status,
        created_at
      FROM users 
      WHERE 
        farcaster_username ILIKE $1 
        OR github_username ILIKE $1
        OR farcaster_fid::text = $2
      ORDER BY 
        CASE WHEN membership_status = 'free' THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 20
    `, [`%${query}%`, query]);
    
    res.json({
      users: users.rows
    });
    
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;