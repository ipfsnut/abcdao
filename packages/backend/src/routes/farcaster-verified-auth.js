/**
 * Farcaster Verified Address Authentication Routes
 * 
 * Handles authentication using Farcaster verified wallet addresses
 * instead of requiring manual wallet connection
 */

import express from 'express';
import { farcasterService } from '../services/farcaster.js';
import { UniversalAuthService } from '../services/universal-auth.js';

const router = express.Router();

/**
 * POST /api/farcaster-auth/verify-address
 * 
 * Authenticate user using their Farcaster FID and automatically detect
 * their verified primary wallet address
 */
router.post('/verify-address', async (req, res) => {
  try {
    const { farcaster_fid, context = {} } = req.body;

    if (!farcaster_fid) {
      return res.status(400).json({
        success: false,
        error: 'Farcaster FID is required'
      });
    }

    console.log(`🔍 Verifying addresses for Farcaster FID ${farcaster_fid}...`);

    // Get user's verified addresses from Farcaster
    const addressData = await farcasterService.getUserVerifiedAddresses(farcaster_fid);

    if (!addressData) {
      return res.status(404).json({
        success: false,
        error: 'Farcaster user not found'
      });
    }

    if (!addressData.primary_address) {
      return res.status(400).json({
        success: false,
        error: 'No verified wallet addresses found for this Farcaster account',
        custody_address: addressData.custody_address,
        message: 'Please verify a wallet address in your Farcaster settings to use this feature'
      });
    }

    console.log(`✅ Found verified primary address: ${addressData.primary_address}`);

    // Authenticate using the verified primary address
    const authResult = await UniversalAuthService.authenticateByWallet(
      addressData.primary_address,
      {
        ...context,
        farcaster_fid: addressData.fid,
        farcaster_username: addressData.username,
        entry_context: 'farcaster_verified'
      }
    );

    // Add Farcaster-specific metadata to response
    const response = {
      ...authResult,
      farcaster_data: {
        fid: addressData.fid,
        username: addressData.username,
        display_name: addressData.display_name,
        verified_addresses: addressData.verified_addresses,
        primary_address: addressData.primary_address,
        custody_address: addressData.custody_address
      }
    };

    return res.json({
      success: true,
      ...response
    });

  } catch (error) {
    console.error('❌ Farcaster verified auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to authenticate with Farcaster verified address',
      message: error.message
    });
  }
});

/**
 * GET /api/farcaster-auth/addresses/:fid
 * 
 * Get verified addresses for a Farcaster user (for debugging/info)
 */
router.get('/addresses/:fid', async (req, res) => {
  try {
    const { fid } = req.params;

    const addressData = await farcasterService.getUserVerifiedAddresses(parseInt(fid));

    if (!addressData) {
      return res.status(404).json({
        success: false,
        error: 'Farcaster user not found'
      });
    }

    return res.json({
      success: true,
      data: addressData
    });

  } catch (error) {
    console.error('❌ Error fetching addresses:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch verified addresses',
      message: error.message
    });
  }
});

/**
 * POST /api/farcaster-auth/check-primary
 * 
 * Check if a given wallet address is the user's verified primary address
 */
router.post('/check-primary', async (req, res) => {
  try {
    const { farcaster_fid, wallet_address } = req.body;

    if (!farcaster_fid || !wallet_address) {
      return res.status(400).json({
        success: false,
        error: 'Both farcaster_fid and wallet_address are required'
      });
    }

    const isPrimary = await farcasterService.isVerifiedPrimaryAddress(
      farcaster_fid, 
      wallet_address
    );

    return res.json({
      success: true,
      is_primary: isPrimary,
      farcaster_fid,
      wallet_address
    });

  } catch (error) {
    console.error('❌ Error checking primary address:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check primary address',
      message: error.message
    });
  }
});

export default router;