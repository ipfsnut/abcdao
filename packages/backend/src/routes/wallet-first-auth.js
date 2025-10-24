/**
 * Wallet-First Authentication Routes
 * 
 * Simplified authentication endpoints focused on wallet-first approach:
 * 1. POST /api/auth/wallet - Primary wallet authentication
 * 2. POST /api/auth/profile/github - Add GitHub to wallet profile
 * 3. POST /api/auth/profile/discord - Add Discord to wallet profile  
 * 4. POST /api/auth/profile/farcaster - Add Farcaster to wallet profile
 * 5. GET /api/auth/profile - Get complete wallet profile
 * 6. PUT /api/auth/profile - Update profile settings
 */

import express from 'express';
import WalletFirstAuthService from '../services/wallet-first-auth.js';

const router = express.Router();

// ============================================================================
// PRIMARY WALLET AUTHENTICATION
// ============================================================================

/**
 * Authenticate by wallet address (primary authentication method)
 * POST /api/auth/wallet
 * 
 * Body: { wallet_address, entry_context?, referral_source? }
 * Returns: { user, token, features, next_steps }
 */
router.post('/wallet', async (req, res) => {
  try {
    const { wallet_address, entry_context, referral_source } = req.body;
    
    if (!wallet_address) {
      return res.status(400).json({ 
        error: 'Wallet address is required',
        code: 'WALLET_REQUIRED'
      });
    }

    const context = {
      entry_context: entry_context || 'web',
      referral_source,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    };
    
    const result = await WalletFirstAuthService.authenticateByWallet(wallet_address, context);
    
    res.json(result);

  } catch (error) {
    console.error('Wallet authentication error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'WALLET_AUTH_FAILED'
    });
  }
});

/**
 * Process membership purchase
 * POST /api/auth/membership/purchase
 * 
 * Body: { wallet_address, tx_hash, amount, block_number? }
 * Returns: { user, tier, features_unlocked }
 */
router.post('/membership/purchase', async (req, res) => {
  try {
    const { wallet_address, tx_hash, amount, block_number } = req.body;
    
    if (!wallet_address || !tx_hash || !amount) {
      return res.status(400).json({ 
        error: 'wallet_address, tx_hash, and amount are required',
        code: 'PAYMENT_DATA_REQUIRED'
      });
    }

    const paymentData = {
      tx_hash,
      amount: parseFloat(amount),
      block_number: block_number || null
    };
    
    const result = await WalletFirstAuthService.processMembershipPurchase(wallet_address, paymentData);
    
    res.json(result);

  } catch (error) {
    console.error('Membership purchase error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'MEMBERSHIP_PURCHASE_FAILED'
    });
  }
});

// ============================================================================
// PROGRESSIVE PROFILE BUILDING
// ============================================================================

/**
 * Add GitHub integration to wallet profile
 * POST /api/auth/profile/github
 * 
 * Body: { wallet_address, github_code?, github_data? }
 * Returns: { user, features_unlocked }
 */
router.post('/profile/github', async (req, res) => {
  try {
    const { wallet_address, github_code, github_data } = req.body;
    
    if (!wallet_address) {
      return res.status(400).json({ 
        error: 'Wallet address is required',
        code: 'WALLET_REQUIRED'
      });
    }

    if (!github_code && !github_data) {
      return res.status(400).json({ 
        error: 'GitHub OAuth code or data is required',
        code: 'GITHUB_DATA_REQUIRED'
      });
    }

    let githubData = github_data;
    let githubToken = null;

    // If we have OAuth code, exchange it for user data
    if (github_code) {
      const exchangeResult = await exchangeGitHubCode(github_code);
      githubData = exchangeResult.userData;
      githubToken = exchangeResult.accessToken;
    }
    
    const result = await WalletFirstAuthService.addGitHubIntegration(
      wallet_address, 
      githubData, 
      githubToken
    );
    
    res.json(result);

  } catch (error) {
    console.error('GitHub integration error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'GITHUB_INTEGRATION_FAILED'
    });
  }
});

/**
 * Add Discord integration to wallet profile
 * POST /api/auth/profile/discord
 * 
 * Body: { wallet_address, discord_code?, discord_data? }
 * Returns: { user, features_unlocked }
 */
router.post('/profile/discord', async (req, res) => {
  try {
    const { wallet_address, discord_code, discord_data, redirect_uri } = req.body;
    
    if (!wallet_address) {
      return res.status(400).json({ 
        error: 'Wallet address is required',
        code: 'WALLET_REQUIRED'
      });
    }

    if (!discord_code && !discord_data) {
      return res.status(400).json({ 
        error: 'Discord OAuth code or data is required',
        code: 'DISCORD_DATA_REQUIRED'
      });
    }

    let discordData = discord_data;
    let discordToken = null;

    // If we have OAuth code, exchange it for user data
    if (discord_code) {
      const exchangeResult = await exchangeDiscordCode(discord_code, redirect_uri);
      discordData = exchangeResult.userData;
      discordToken = exchangeResult.accessToken;
    }
    
    const result = await WalletFirstAuthService.addDiscordIntegration(
      wallet_address, 
      discordData, 
      discordToken
    );
    
    res.json(result);

  } catch (error) {
    console.error('Discord integration error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'DISCORD_INTEGRATION_FAILED'
    });
  }
});

/**
 * Add Farcaster integration to wallet profile
 * POST /api/auth/profile/farcaster
 * 
 * Body: { wallet_address, farcaster_data }
 * Returns: { user, features_unlocked }
 */
router.post('/profile/farcaster', async (req, res) => {
  try {
    const { wallet_address, farcaster_data } = req.body;
    
    if (!wallet_address || !farcaster_data) {
      return res.status(400).json({ 
        error: 'wallet_address and farcaster_data are required',
        code: 'FARCASTER_DATA_REQUIRED'
      });
    }
    
    const result = await WalletFirstAuthService.addFarcasterIntegration(
      wallet_address, 
      farcaster_data
    );
    
    res.json(result);

  } catch (error) {
    console.error('Farcaster integration error:', error);
    res.status(400).json({ 
      error: error.message,
      code: 'FARCASTER_INTEGRATION_FAILED'
    });
  }
});

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

/**
 * Get complete user profile
 * GET /api/auth/profile
 * 
 * Requires: Authorization header with wallet JWT
 * Returns: { user, features, next_steps }
 */
router.get('/profile', WalletFirstAuthService.requireWalletAuth, async (req, res) => {
  try {
    const userProfile = await WalletFirstAuthService.getUserProfile(req.user.wallet_address);
    
    if (!userProfile) {
      return res.status(404).json({ 
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    const features = WalletFirstAuthService.getAvailableFeatures(userProfile);
    const nextSteps = WalletFirstAuthService.getNextSteps(userProfile);
    
    res.json({
      user: WalletFirstAuthService.sanitizeUserProfile(userProfile),
      features,
      next_steps: nextSteps
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
});

/**
 * Update user profile settings
 * PUT /api/auth/profile
 * 
 * Body: { display_name?, bio?, notification_preferences?, privacy_settings? }
 * Returns: { user }
 */
router.put('/profile', WalletFirstAuthService.requireWalletAuth, async (req, res) => {
  try {
    const { display_name, bio, notification_preferences, privacy_settings } = req.body;
    
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    if (notification_preferences !== undefined) updates.notification_preferences = notification_preferences;
    if (privacy_settings !== undefined) updates.privacy_settings = privacy_settings;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No valid updates provided',
        code: 'NO_UPDATES'
      });
    }

    // Build dynamic query based on provided updates
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE user_profiles SET
        ${setClause},
        updated_at = NOW()
      WHERE wallet_address = $1
      RETURNING *
    `;
    
    const values = [req.user.wallet_address, ...Object.values(updates)];
    
    const pool = WalletFirstAuthService.pool;
    const result = await pool.query(query, values);
    const updatedProfile = result.rows[0];
    
    if (!updatedProfile) {
      return res.status(404).json({ 
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      user: WalletFirstAuthService.sanitizeUserProfile(updatedProfile),
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      code: 'PROFILE_UPDATE_FAILED'
    });
  }
});

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Refresh JWT token
 * POST /api/auth/refresh
 * 
 * Body: { refresh_token }
 * Returns: { token, user }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ 
        error: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Verify refresh token
    const decoded = WalletFirstAuthService.verifyToken(refresh_token);
    
    // Get fresh user data
    const userProfile = await WalletFirstAuthService.getUserProfile(decoded.wallet_address);
    
    if (!userProfile) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new token
    const newToken = WalletFirstAuthService.generateToken(userProfile);
    
    res.json({
      success: true,
      token: newToken,
      user: WalletFirstAuthService.sanitizeUserProfile(userProfile)
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

// ============================================================================
// OAUTH HELPERS
// ============================================================================

/**
 * Exchange GitHub OAuth code for user data and access token
 */
async function exchangeGitHubCode(code) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
    }

    // Get user data with access token
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const userData = await userResponse.json();
    
    return {
      userData,
      accessToken: tokenData.access_token
    };

  } catch (error) {
    console.error('GitHub OAuth exchange error:', error);
    throw new Error(`GitHub OAuth failed: ${error.message}`);
  }
}

/**
 * Exchange Discord OAuth code for user data and access token
 */
async function exchangeDiscordCode(code, redirectUri) {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Discord OAuth not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`Discord OAuth error: ${tokenData.error_description}`);
    }

    // Get user data with access token
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const userData = await userResponse.json();
    
    return {
      userData,
      accessToken: tokenData.access_token
    };

  } catch (error) {
    console.error('Discord OAuth exchange error:', error);
    throw new Error(`Discord OAuth failed: ${error.message}`);
  }
}

// ============================================================================
// SYSTEM STATUS
// ============================================================================

/**
 * Get authentication system status and statistics
 * GET /api/auth/status
 */
router.get('/status', async (req, res) => {
  try {
    const pool = WalletFirstAuthService.pool;
    
    // Get system statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_member = TRUE) as members,
        COUNT(*) FILTER (WHERE can_earn_rewards = TRUE) as earning_users,
        COUNT(*) FILTER (WHERE github_connected = TRUE) as github_users,
        COUNT(*) FILTER (WHERE discord_connected = TRUE) as discord_users,
        COUNT(*) FILTER (WHERE farcaster_connected = TRUE) as farcaster_users,
        COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '7 days') as active_users
      FROM user_profiles
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];
    
    res.json({
      system_status: 'operational',
      authentication_method: 'wallet_first_progressive',
      supported_integrations: ['github', 'discord', 'farcaster'],
      user_statistics: {
        total_users: parseInt(stats.total_users),
        members: parseInt(stats.members),
        earning_users: parseInt(stats.earning_users),
        github_users: parseInt(stats.github_users),
        discord_users: parseInt(stats.discord_users),
        farcaster_users: parseInt(stats.farcaster_users),
        active_users: parseInt(stats.active_users)
      },
      features: {
        wallet_authentication: true,
        progressive_profile_building: true,
        oauth_integrations: true,
        membership_tiers: true,
        jwt_tokens: true
      }
    });

  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ 
      error: 'Failed to get system status',
      code: 'STATUS_FETCH_FAILED'
    });
  }
});

export default router;