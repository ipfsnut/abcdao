import express from 'express';
import UniversalAuthService from '../services/universal-auth.js';
import { WalletUser } from '../models/WalletUser.js';
import { getPool } from '../services/database.js';

const router = express.Router();

/**
 * Universal authentication routes supporting both webapp and Farcaster mini-app
 */

// ============================================================================
// WALLET-FIRST AUTHENTICATION (Primary Flow)
// ============================================================================

/**
 * Create basic user profile (development helper)
 * POST /api/universal-auth/create-basic-user
 */
router.post('/create-basic-user', async (req, res) => {
  try {
    const { wallet_address, display_name } = req.body;
    
    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const pool = getPool();
    
    // Check if user already exists
    const existingUser = await pool.query(`
      SELECT * FROM users WHERE wallet_address = $1
    `, [wallet_address.toLowerCase()]);
    
    if (existingUser.rows.length > 0) {
      return res.json({ 
        user: existingUser.rows[0], 
        message: 'User already exists' 
      });
    }
    
    // Create basic user with a generated FID (negative to avoid conflicts)
    const fakeFid = -Math.floor(Math.random() * 1000000);
    const result = await pool.query(`
      INSERT INTO users (
        farcaster_fid, 
        farcaster_username, 
        wallet_address,
        membership_status,
        verified_at,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
      RETURNING *
    `, [
      fakeFid,
      display_name || `wallet_${wallet_address.slice(2, 8)}`,
      wallet_address.toLowerCase(),
      'free'
    ]);
    
    res.json({ 
      user: result.rows[0], 
      message: 'Basic user created successfully' 
    });

  } catch (error) {
    console.error('Create basic user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Authenticate by wallet address
 * POST /api/auth/wallet
 */
router.post('/wallet', async (req, res) => {
  try {
    const { wallet_address } = req.body;
    const context = UniversalAuthService.extractContext(req);
    
    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const result = await UniversalAuthService.authenticateByWallet(wallet_address, context);
    
    res.json(result);

  } catch (error) {
    console.error('Wallet authentication error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Process membership purchase
 * POST /api/auth/membership/purchase
 */
router.post('/membership/purchase', async (req, res) => {
  try {
    const { wallet_address, tx_hash, amount, block_number } = req.body;
    const context = UniversalAuthService.extractContext(req);
    
    if (!wallet_address || !tx_hash || !amount) {
      return res.status(400).json({ 
        error: 'wallet_address, tx_hash, and amount are required' 
      });
    }

    const result = await UniversalAuthService.processMembershipPurchase({
      wallet_address,
      tx_hash,
      amount,
      block_number,
      entry_context: context.entry_context
    });
    
    res.json(result);

  } catch (error) {
    console.error('Membership purchase error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Link GitHub account
 * POST /api/auth/github/link
 */
router.post('/github/link', async (req, res) => {
  try {
    const { wallet_address, github_code, github_data } = req.body;
    
    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!github_code && !github_data) {
      return res.status(400).json({ error: 'GitHub OAuth code or data is required' });
    }

    const result = await UniversalAuthService.linkGithubAccount(
      wallet_address, 
      github_data, 
      github_code
    );
    
    res.json(result);

  } catch (error) {
    console.error('GitHub linking error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Link social account (Farcaster, Discord, etc.)
 * POST /api/auth/social/link
 */
router.post('/social/link', async (req, res) => {
  try {
    const { wallet_address, platform, social_data } = req.body;
    
    if (!wallet_address || !platform || !social_data) {
      return res.status(400).json({ 
        error: 'wallet_address, platform, and social_data are required' 
      });
    }

    const result = await UniversalAuthService.linkSocialAccount(
      wallet_address, 
      platform, 
      social_data
    );
    
    res.json(result);

  } catch (error) {
    console.error('Social linking error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// LEGACY AUTHENTICATION (Backward Compatibility)
// ============================================================================

/**
 * Authenticate by Farcaster FID (legacy support)
 * POST /api/auth/farcaster
 */
router.post('/farcaster', async (req, res) => {
  try {
    const { fid } = req.body;
    const context = UniversalAuthService.extractContext(req);
    
    if (!fid) {
      return res.status(400).json({ error: 'Farcaster FID is required' });
    }

    const result = await UniversalAuthService.authenticateByFid(fid, context);
    
    res.json(result);

  } catch (error) {
    console.error('Farcaster authentication error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GitHub OAuth callback (legacy support)
 * GET /api/auth/github/callback
 */
router.get('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'GitHub OAuth code is required' });
    }

    // Exchange code for GitHub data
    const githubData = await UniversalAuthService.exchangeGithubCode(code);
    
    // If state contains wallet address, link automatically
    if (state && state.startsWith('0x')) {
      const result = await UniversalAuthService.linkGithubAccount(state, githubData);
      return res.json(result);
    }
    
    // Otherwise, return GitHub data for manual linking
    res.json({
      success: true,
      github_data: githubData,
      message: 'GitHub OAuth successful. Please provide wallet address to complete linking.'
    });

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Link Discord account via OAuth
 * POST /api/auth/discord/link
 */
router.post('/discord/link', async (req, res) => {
  try {
    const { wallet_address, discord_code, discord_data, redirect_uri } = req.body;
    
    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!discord_code && !discord_data) {
      return res.status(400).json({ error: 'Discord OAuth code or data is required' });
    }

    const result = await UniversalAuthService.linkDiscordAccount(
      wallet_address, 
      discord_data, 
      discord_code,
      redirect_uri
    );
    
    res.json(result);

  } catch (error) {
    console.error('Discord linking error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Discord OAuth callback
 * GET /api/auth/discord/callback
 */
router.get('/discord/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Discord OAuth code is required' });
    }

    // Reconstruct redirect URI
    const redirect_uri = `${req.protocol}://${req.get('host')}/api/auth/discord/callback`;
    
    // Exchange code for Discord data
    const discordData = await UniversalAuthService.exchangeDiscordCode(code, redirect_uri);
    
    // If state contains wallet address, link automatically
    if (state && state.startsWith('0x')) {
      const result = await UniversalAuthService.linkDiscordAccount(state, discordData);
      return res.json(result);
    }
    
    // Otherwise, return Discord data for manual linking
    res.json({
      success: true,
      discord_data: discordData,
      message: 'Discord OAuth successful. Please provide wallet address to complete linking.'
    });

  } catch (error) {
    console.error('Discord OAuth callback error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// SMART/UNIVERSAL AUTHENTICATION
// ============================================================================

/**
 * Smart authentication - auto-detect identifier type
 * POST /api/auth/identify
 */
router.post('/identify', async (req, res) => {
  try {
    const { identifier } = req.body;
    const context = UniversalAuthService.extractContext(req);
    
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required' });
    }

    const result = await UniversalAuthService.authenticateByIdentifier(identifier, context);
    
    res.json(result);

  } catch (error) {
    console.error('Smart authentication error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// USER PROFILE & SESSION MANAGEMENT
// ============================================================================

/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get('/profile', UniversalAuthService.requireAuth, async (req, res) => {
  try {
    const user = await WalletUser.findByWallet(req.user.wallet_address);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: UniversalAuthService.sanitizeUser(user),
      available_features: WalletUser.getAvailableFeatures(user)
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put('/profile', UniversalAuthService.requireAuth, async (req, res) => {
  try {
    const { display_name, notification_preferences } = req.body;
    const updates = {};
    
    if (display_name) updates.display_name = display_name;
    if (notification_preferences) updates.notification_preferences = notification_preferences;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const user = await WalletUser.updateByWallet(req.user.wallet_address, updates);
    
    res.json({
      success: true,
      user: UniversalAuthService.sanitizeUser(user),
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Refresh JWT token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify and decode refresh token
    const decoded = UniversalAuthService.verifyToken(refresh_token);
    
    // Get fresh user data
    const user = await WalletUser.findByWallet(decoded.wallet_address);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new token
    const newToken = UniversalAuthService.generateToken(user);
    
    res.json({
      success: true,
      token: newToken,
      user: UniversalAuthService.sanitizeUser(user)
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ============================================================================
// SYSTEM STATUS & HEALTH
// ============================================================================

/**
 * Check authentication system status
 * GET /api/auth/status
 */
router.get('/status', async (req, res) => {
  try {
    const stats = await WalletUser.getMembershipStats();
    
    res.json({
      system_status: 'operational',
      supported_auth_methods: [
        'wallet_address',
        'farcaster_fid', 
        'github_username'
      ],
      supported_social_platforms: [
        'farcaster',
        'discord'
      ],
      user_statistics: {
        total_users: stats.total_users,
        active_members: stats.active_members,
        earning_members: stats.earning_members,
        farcaster_users: stats.farcaster_users,
        webapp_users: stats.webapp_users
      }
    });

  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

/**
 * Generate GitHub OAuth URL
 * GET /api/auth/github/url (legacy)
 * POST /api/auth/github/url (new)
 */
router.get('/github/url', (req, res) => {
  try {
    const { wallet_address, redirect_uri } = req.query;
    
    const client_id = process.env.GITHUB_CLIENT_ID;
    if (!client_id) {
      return res.status(500).json({ error: 'GitHub OAuth not configured' });
    }

    const state = wallet_address || 'webapp';
    const scope = 'user:email,read:user';
    const redirect = redirect_uri || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/github/callback`;
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=${scope}&state=${state}&redirect_uri=${encodeURIComponent(redirect)}`;
    
    res.json({
      auth_url: authUrl,
      state: state
    });

  } catch (error) {
    console.error('GitHub URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate GitHub OAuth URL' });
  }
});

router.post('/github/url', (req, res) => {
  try {
    const { 
      wallet_address, 
      farcaster_fid, 
      farcaster_username, 
      context,
      redirect_uri 
    } = req.body;
    
    const client_id = process.env.GITHUB_CLIENT_ID;
    if (!client_id) {
      return res.status(500).json({ error: 'GitHub OAuth not configured' });
    }

    // Create state object with context information
    let state;
    if (farcaster_fid && farcaster_username) {
      // Farcaster context - use FID and username
      state = JSON.stringify({
        type: 'farcaster',
        fid: farcaster_fid,
        username: farcaster_username,
        context: context || 'farcaster_miniapp'
      });
    } else if (wallet_address) {
      // Wallet context
      state = JSON.stringify({
        type: 'wallet',
        wallet_address: wallet_address,
        context: context || 'webapp'
      });
    } else {
      state = 'webapp';
    }
    
    const scope = 'user:email,read:user';
    const redirect = redirect_uri || `${process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app'}/api/auth/github/callback`;
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=${scope}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirect)}`;
    
    res.json({
      auth_url: authUrl,
      state: state,
      redirect_uri: redirect
    });

  } catch (error) {
    console.error('GitHub URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate GitHub OAuth URL' });
  }
});

/**
 * Generate Discord OAuth URL
 * GET /api/auth/discord/url (legacy)
 * POST /api/auth/discord/url (new)
 */
router.get('/discord/url', (req, res) => {
  try {
    const { wallet_address, redirect_uri } = req.query;
    
    const client_id = process.env.DISCORD_CLIENT_ID;
    if (!client_id) {
      return res.status(500).json({ error: 'Discord OAuth not configured' });
    }

    const state = wallet_address || 'webapp';
    const scope = 'identify';
    const redirect = redirect_uri || `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/discord/callback`;
    
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${scope}&state=${state}`;
    
    res.json({
      auth_url: authUrl,
      state: state,
      redirect_uri: redirect
    });

  } catch (error) {
    console.error('Discord URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate Discord OAuth URL' });
  }
});

router.post('/discord/url', (req, res) => {
  try {
    const { 
      wallet_address, 
      farcaster_fid, 
      farcaster_username, 
      context,
      redirect_uri 
    } = req.body;
    
    const client_id = process.env.DISCORD_CLIENT_ID;
    if (!client_id) {
      return res.status(500).json({ error: 'Discord OAuth not configured' });
    }

    // Create state object with context information
    let state;
    if (farcaster_fid && farcaster_username) {
      // Farcaster context - use FID and username
      state = JSON.stringify({
        type: 'farcaster',
        fid: farcaster_fid,
        username: farcaster_username,
        context: context || 'farcaster_miniapp'
      });
    } else if (wallet_address) {
      // Wallet context
      state = JSON.stringify({
        type: 'wallet',
        wallet_address: wallet_address,
        context: context || 'webapp'
      });
    } else {
      state = 'webapp';
    }
    
    const scope = 'identify';
    const redirect = redirect_uri || `${process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app'}/api/auth/discord/callback`;
    
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${scope}&state=${encodeURIComponent(state)}`;
    
    res.json({
      auth_url: authUrl,
      state: state,
      redirect_uri: redirect
    });

  } catch (error) {
    console.error('Discord URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate Discord OAuth URL' });
  }
});

export default router;