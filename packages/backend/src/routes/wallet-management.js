import express from 'express';
import { Farcaster } from '../services/farcaster.js';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * User-Controlled Wallet Management API
 * 
 * Provides endpoints for users to manage their Primary wallet addresses
 * with maximum control and safety features.
 */

/**
 * GET /api/wallet/status
 * 
 * Returns comprehensive wallet status for the authenticated user
 * including database state, live Farcaster state, and sync status
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user?.id;
    const farcasterFid = req.user?.farcaster_fid;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to view wallet status' 
      });
    }

    const pool = getPool();
    
    // Get user's current wallet information from database
    const userResult = await pool.query(`
      SELECT 
        id,
        farcaster_fid,
        farcaster_username,
        wallet_address,
        wallet_address_primary,
        legacy_wallets,
        updated_at
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User profile not found in database' 
      });
    }
    
    const user = userResult.rows[0];
    
    // Initialize response object
    const walletStatus = {
      user_info: {
        id: user.id,
        farcaster_username: user.farcaster_username,
        farcaster_fid: user.farcaster_fid
      },
      our_database: {
        primary: user.wallet_address_primary,
        legacy: user.wallet_address,
        legacy_wallets: user.legacy_wallets || [],
        last_updated: user.updated_at,
        source: 'database'
      },
      farcaster_live: null,
      sync_status: 'checking',
      staking_positions: {},
      nft_holdings: {},
      recommendations: []
    };

    // Fetch live Farcaster data if FID available
    if (farcasterFid) {
      try {
        const farcaster = new Farcaster();
        const addressData = await farcaster.getUserVerifiedAddresses(farcasterFid);
        
        if (addressData) {
          walletStatus.farcaster_live = {
            primary: addressData.primary_address,
            all_addresses: addressData.verified_addresses || [],
            last_checked: new Date().toISOString(),
            custody_address: addressData.custody_address
          };
          
          // Determine sync status
          const dbPrimary = user.wallet_address_primary?.toLowerCase();
          const fcPrimary = addressData.primary_address?.toLowerCase();
          
          if (!fcPrimary) {
            walletStatus.sync_status = 'no_farcaster_wallet';
            walletStatus.recommendations.push({
              type: 'warning',
              title: 'No Primary Wallet on Farcaster',
              message: 'Connect a wallet to your Farcaster profile to enable full functionality',
              actions: ['connect_wallet_farcaster']
            });
          } else if (dbPrimary === fcPrimary) {
            walletStatus.sync_status = 'synced';
          } else {
            walletStatus.sync_status = 'out_of_sync';
            walletStatus.recommendations.push({
              type: 'info',
              title: 'Primary Wallet Changed',
              message: `Your Farcaster Primary wallet (${addressData.primary_address}) differs from our records (${user.wallet_address_primary})`,
              actions: ['sync_from_farcaster', 'keep_current', 'review_options']
            });
          }
        }
      } catch (farcasterError) {
        console.error('Farcaster lookup error:', farcasterError);
        walletStatus.farcaster_live = {
          error: 'Failed to fetch from Farcaster',
          message: farcasterError.message,
          last_checked: new Date().toISOString()
        };
        walletStatus.sync_status = 'farcaster_error';
      }
    } else {
      walletStatus.sync_status = 'no_farcaster_connection';
      walletStatus.recommendations.push({
        type: 'warning',
        title: 'No Farcaster Connection',
        message: 'Connect your Farcaster account to enable Primary wallet detection',
        actions: ['connect_farcaster']
      });
    }

    // Get staking positions for all user wallets
    const allWallets = [
      user.wallet_address_primary,
      user.wallet_address,
      ...(user.legacy_wallets || [])
    ].filter(Boolean);

    if (allWallets.length > 0) {
      const stakingResult = await pool.query(`
        SELECT 
          wallet_address,
          staked_amount,
          rewards_earned,
          pending_rewards,
          is_active,
          last_stake_time
        FROM staker_positions 
        WHERE LOWER(wallet_address) = ANY($1::text[]) 
          AND is_active = true
      `, [allWallets.map(w => w.toLowerCase())]);
      
      stakingResult.rows.forEach(row => {
        walletStatus.staking_positions[row.wallet_address] = {
          staked_amount: row.staked_amount,
          rewards_earned: parseFloat(row.rewards_earned) || 0,
          pending_rewards: parseFloat(row.pending_rewards) || 0,
          last_stake_time: row.last_stake_time
        };
      });
    }

    // Get NFT holdings (placeholder for when NFT system is active)
    // This will be populated when users start minting NFTs
    walletStatus.nft_holdings = {
      note: 'NFT holdings will appear here when October NFTs are minted'
    };

    // Add user control recommendations
    if (walletStatus.sync_status === 'synced') {
      walletStatus.recommendations.push({
        type: 'success',
        title: 'Wallet Synced',
        message: 'Your Primary wallet is synchronized with Farcaster',
        actions: []
      });
    }

    // Check for split assets that could be consolidated
    const stakingWallets = Object.keys(walletStatus.staking_positions);
    if (stakingWallets.length > 1) {
      walletStatus.recommendations.push({
        type: 'info',
        title: 'Multiple Staking Wallets',
        message: `You have staking positions on ${stakingWallets.length} different wallets`,
        actions: ['review_consolidation', 'keep_separate']
      });
    }

    res.json({
      success: true,
      wallet_status: walletStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Wallet status error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve wallet status'
    });
  }
});

/**
 * POST /api/wallet/sync-from-farcaster
 * 
 * User-initiated sync of Primary wallet from Farcaster
 * Provides preview mode and migration options
 */
router.post('/sync-from-farcaster', async (req, res) => {
  try {
    const userId = req.user?.id;
    const farcasterFid = req.user?.farcaster_fid;
    const { preview = true, confirm = false, migration_options = {} } = req.body;
    
    if (!userId || !farcasterFid) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in with Farcaster to sync wallet' 
      });
    }

    const pool = getPool();
    
    // Get current user data
    const userResult = await pool.query(`
      SELECT wallet_address_primary, wallet_address, farcaster_username
      FROM users WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Fetch current Primary wallet from Farcaster
    const farcaster = new Farcaster();
    const addressData = await farcaster.getUserVerifiedAddresses(farcasterFid);
    
    if (!addressData?.primary_address) {
      return res.status(400).json({
        error: 'No Primary wallet found',
        message: 'Please connect a wallet to your Farcaster profile first'
      });
    }
    
    const newPrimary = addressData.primary_address;
    const currentPrimary = user.wallet_address_primary;
    
    // Check if already synced
    if (currentPrimary?.toLowerCase() === newPrimary.toLowerCase()) {
      return res.json({
        success: true,
        message: 'Primary wallet is already synced',
        no_changes_needed: true,
        current_primary: currentPrimary
      });
    }
    
    // PREVIEW MODE - show what would change
    if (preview) {
      // Get staking data for impact analysis
      const stakingData = await pool.query(`
        SELECT staked_amount, rewards_earned, pending_rewards
        FROM staker_positions 
        WHERE LOWER(wallet_address) = $1 AND is_active = true
      `, [currentPrimary?.toLowerCase()]);
      
      const impact = {
        current_primary: currentPrimary,
        new_primary: newPrimary,
        changes: {
          database_primary_wallet: {
            from: currentPrimary,
            to: newPrimary
          }
        },
        affected_data: {
          staking_positions: stakingData.rows.length > 0 ? {
            wallet: currentPrimary,
            staked: stakingData.rows[0].staked_amount,
            earned: stakingData.rows[0].rewards_earned,
            pending: stakingData.rows[0].pending_rewards,
            migration_note: 'Staking positions will remain on current wallet unless migrated'
          } : null,
          nft_holdings: 'NFT holdings will remain on current wallet unless migrated'
        },
        migration_options: {
          keep_separate: {
            description: 'New Primary for future activities, keep existing assets on current wallet',
            safe: true,
            recommended: true
          },
          migrate_all: {
            description: 'Move all staking positions and assets to new Primary wallet',
            safe: false,
            requires_gas: true,
            complex: true
          }
        }
      };
      
      return res.json({
        success: true,
        preview: true,
        impact,
        next_steps: 'Send request with confirm: true to apply changes'
      });
    }
    
    // CONFIRM MODE - actually perform the sync
    if (confirm) {
      const timestamp = new Date().toISOString();
      
      // Update user's Primary wallet
      const updateResult = await pool.query(`
        UPDATE users SET 
          wallet_address_primary = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING wallet_address_primary, updated_at
      `, [newPrimary, userId]);
      
      // Record wallet change history
      await pool.query(`
        INSERT INTO user_wallet_history (
          user_id, 
          wallet_address, 
          wallet_type, 
          valid_from, 
          migration_reason
        ) VALUES ($1, $2, 'primary', NOW(), 'farcaster_sync')
      `, [userId, newPrimary]);
      
      // TODO: Handle migration options if specified
      // This would involve moving staking positions, updating NFT records, etc.
      
      return res.json({
        success: true,
        message: 'Primary wallet synced successfully',
        updated: {
          new_primary: newPrimary,
          updated_at: updateResult.rows[0].updated_at
        },
        rollback_available_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // Default to preview mode
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Specify preview: true or confirm: true'
    });

  } catch (error) {
    console.error('Wallet sync error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to sync wallet from Farcaster'
    });
  }
});

/**
 * POST /api/wallet/set-primary
 * 
 * User-controlled Primary wallet setting with custom address
 */
router.post('/set-primary', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { new_primary, source = 'manual', preview = true, confirm = false } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!new_primary || !/^0x[a-fA-F0-9]{40}$/.test(new_primary)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        message: 'Please provide a valid Ethereum address'
      });
    }
    
    const pool = getPool();
    
    // Get current user data
    const userResult = await pool.query(`
      SELECT wallet_address_primary, farcaster_fid, farcaster_username
      FROM users WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const currentPrimary = user.wallet_address_primary;
    
    // Validate if address is in user's Farcaster verified addresses
    if (source === 'farcaster' && user.farcaster_fid) {
      try {
        const farcaster = new Farcaster();
        const addressData = await farcaster.getUserVerifiedAddresses(user.farcaster_fid);
        
        if (addressData?.verified_addresses) {
          const isVerified = addressData.verified_addresses
            .map(addr => addr.toLowerCase())
            .includes(new_primary.toLowerCase());
          
          if (!isVerified) {
            return res.status(400).json({
              error: 'Address not verified',
              message: 'This address is not in your Farcaster verified addresses',
              verified_addresses: addressData.verified_addresses
            });
          }
        }
      } catch (farcasterError) {
        console.warn('Could not validate against Farcaster:', farcasterError.message);
      }
    }
    
    if (preview) {
      return res.json({
        success: true,
        preview: true,
        changes: {
          current_primary: currentPrimary,
          new_primary: new_primary,
          source: source
        },
        warnings: source === 'manual' ? [
          'Manual wallet addresses are not verified against Farcaster',
          'Ensure you control this wallet address'
        ] : [],
        next_steps: 'Send request with confirm: true to apply changes'
      });
    }
    
    if (confirm) {
      // Update Primary wallet
      await pool.query(`
        UPDATE users SET 
          wallet_address_primary = $1,
          updated_at = NOW()
        WHERE id = $2
      `, [new_primary, userId]);
      
      // Record change history
      await pool.query(`
        INSERT INTO user_wallet_history (
          user_id, 
          wallet_address, 
          wallet_type, 
          valid_from, 
          migration_reason
        ) VALUES ($1, $2, 'primary', NOW(), $3)
      `, [userId, new_primary, `manual_set_${source}`]);
      
      return res.json({
        success: true,
        message: 'Primary wallet updated successfully',
        new_primary: new_primary,
        source: source
      });
    }
    
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Specify preview: true or confirm: true'
    });

  } catch (error) {
    console.error('Set primary wallet error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to set Primary wallet'
    });
  }
});

export default router;