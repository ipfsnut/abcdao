/**
 * Wallet-First Authentication Service
 * 
 * Single authentication system that builds user profiles progressively:
 * 1. Wallet connection (required) - creates base profile
 * 2. GitHub integration (optional) - enables earning features  
 * 3. Discord integration (optional) - enables community features
 * 4. Farcaster integration (optional) - enables social features
 */

import { getPool } from './database.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class WalletFirstAuthService {
  constructor() {
    this.pool = null; // Initialize lazily to avoid startup crash
    this.JWT_SECRET = process.env.JWT_SECRET || 'abc-dao-wallet-auth-secret';
    this.JWT_EXPIRES_IN = '7d';
  }

  // Lazy database connection initialization
  getPool() {
    if (!this.pool) {
      try {
        this.pool = getPool();
      } catch (error) {
        throw new Error(`Database not available: ${error.message}. Ensure server initialization is complete.`);
      }
    }
    return this.pool;
  }

  // ============================================================================
  // CORE WALLET AUTHENTICATION
  // ============================================================================

  /**
   * Authenticate user by wallet address (primary authentication method)
   * Creates profile if doesn't exist, returns existing profile if it does
   */
  async authenticateByWallet(walletAddress, context = {}) {
    try {
      const normalizedWallet = this.normalizeWalletAddress(walletAddress);
      
      // Get or create user profile
      let userProfile = await this.getUserProfile(normalizedWallet);
      
      if (!userProfile) {
        // Create new profile for first-time wallet connection
        userProfile = await this.createWalletProfile(normalizedWallet, context);
      } else {
        // Update last active and context if needed
        await this.updateLastActive(normalizedWallet, context);
      }

      // Generate JWT token
      const token = this.generateToken(userProfile);
      
      // Get available features based on current integrations
      const availableFeatures = this.getAvailableFeatures(userProfile);
      
      return {
        success: true,
        user: this.sanitizeUserProfile(userProfile),
        token,
        features: availableFeatures,
        next_steps: this.getNextSteps(userProfile)
      };

    } catch (error) {
      console.error('Wallet authentication error:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Create new wallet-based user profile
   */
  async createWalletProfile(walletAddress, context = {}) {
    // Generate a fake FID to avoid conflicts (negative number)
    const fakeFid = -Math.floor(Math.random() * 1000000);
    
    const query = `
      INSERT INTO users (
        farcaster_fid,
        farcaster_username,
        wallet_address,
        wallet_address_primary,
        membership_status,
        verified_at,
        created_at,
        updated_at,
        entry_context
      ) VALUES ($1, $2, $3, $3, $4, NOW(), NOW(), NOW(), $5)
      RETURNING *
    `;
    
    const values = [
      fakeFid,
      `wallet_${walletAddress.slice(2, 8)}`, // Username from wallet
      walletAddress,
      'free', // Default to free - can stake but no commit rewards
      context.entry_context || 'webapp'
    ];
    
    const result = await this.getPool().query(query, values);
    return result.rows[0];
  }

  /**
   * Get user profile by wallet address
   */
  async getUserProfile(walletAddress) {
    const query = `
      SELECT * FROM users 
      WHERE wallet_address = $1
    `;
    
    const result = await this.getPool().query(query, [walletAddress]);
    return result.rows[0] || null;
  }

  // ============================================================================
  // PROGRESSIVE PROFILE BUILDING
  // ============================================================================

  /**
   * Add GitHub integration to existing wallet profile
   */
  async addGitHubIntegration(walletAddress, githubData, githubToken = null) {
    try {
      const encryptedToken = githubToken ? this.encryptToken(githubToken) : null;
      
      const query = `
        UPDATE users SET
          github_username = $2,
          github_id = $3,
          access_token = $4,
          updated_at = NOW()
        WHERE wallet_address = $1
        RETURNING *
      `;
      
      const values = [
        walletAddress,
        githubData.login || githubData.username,
        githubData.id,
        encryptedToken
      ];
      
      const result = await this.getPool().query(query, values);
      const updatedProfile = result.rows[0];
      
      if (!updatedProfile) {
        throw new Error('User profile not found');
      }

      // Auto-detect and register user's repositories
      await this.autoDetectRepositories(walletAddress, githubData.login);
      
      return {
        success: true,
        user: this.sanitizeUserProfile(updatedProfile),
        message: 'GitHub integration added successfully',
        features_unlocked: ['earning_rewards', 'repository_management']
      };

    } catch (error) {
      console.error('GitHub integration error:', error);
      throw new Error(`GitHub integration failed: ${error.message}`);
    }
  }

  /**
   * Add Discord integration to existing wallet profile
   */
  async addDiscordIntegration(walletAddress, discordData, discordToken = null) {
    try {
      const encryptedToken = discordToken ? this.encryptToken(discordToken) : null;
      
      const query = `
        UPDATE users SET
          discord_connected = TRUE,
          discord_username = $2,
          discord_user_id = $3,
          discord_access_token = $4,
          discord_connected_at = NOW(),
          updated_at = NOW()
        WHERE wallet_address = $1
        RETURNING *
      `;
      
      const values = [
        walletAddress,
        discordData.username + '#' + discordData.discriminator,
        discordData.id,
        encryptedToken
      ];
      
      const result = await this.getPool().query(query, values);
      const updatedProfile = result.rows[0];
      
      if (!updatedProfile) {
        throw new Error('User profile not found');
      }

      return {
        success: true,
        user: this.sanitizeUserProfile(updatedProfile),
        message: 'Discord integration added successfully',
        features_unlocked: ['community_access', 'role_management', 'notifications']
      };

    } catch (error) {
      console.error('Discord integration error:', error);
      throw new Error(`Discord integration failed: ${error.message}`);
    }
  }

  /**
   * Add Farcaster integration to existing wallet profile
   */
  async addFarcasterIntegration(walletAddress, farcasterData) {
    try {
      const query = `
        UPDATE users SET
          farcaster_connected = TRUE,
          farcaster_fid = $2,
          farcaster_username = $3,
          farcaster_display_name = $4,
          farcaster_pfp_url = $5,
          farcaster_connected_at = NOW(),
          updated_at = NOW()
        WHERE wallet_address = $1
        RETURNING *
      `;
      
      const values = [
        walletAddress,
        farcasterData.fid,
        farcasterData.username,
        farcasterData.displayName || farcasterData.display_name,
        farcasterData.pfpUrl || farcasterData.pfp_url
      ];
      
      const result = await this.getPool().query(query, values);
      const updatedProfile = result.rows[0];
      
      if (!updatedProfile) {
        throw new Error('User profile not found');
      }

      return {
        success: true,
        user: this.sanitizeUserProfile(updatedProfile),
        message: 'Farcaster integration added successfully',
        features_unlocked: ['social_features', 'cast_integration', 'miniapp_enhanced_ux']
      };

    } catch (error) {
      console.error('Farcaster integration error:', error);
      throw new Error(`Farcaster integration failed: ${error.message}`);
    }
  }

  // ============================================================================
  // MEMBERSHIP AND TIER MANAGEMENT
  // ============================================================================

  /**
   * Process membership purchase and upgrade tier
   */
  async processMembershipPurchase(walletAddress, paymentData) {
    try {
      const query = `
        UPDATE users SET
          is_member = TRUE,
          membership_tier = $2,
          membership_paid_at = NOW(),
          membership_tx_hash = $3,
          membership_amount = $4,
          updated_at = NOW()
        WHERE wallet_address = $1
        RETURNING *
      `;
      
      const tier = paymentData.amount >= 0.002 ? 'member' : 'free';
      const values = [
        walletAddress,
        tier,
        paymentData.tx_hash,
        paymentData.amount
      ];
      
      const result = await this.getPool().query(query, values);
      const updatedProfile = result.rows[0];
      
      if (!updatedProfile) {
        throw new Error('User profile not found');
      }

      return {
        success: true,
        user: this.sanitizeUserProfile(updatedProfile),
        message: 'Membership upgraded successfully',
        tier: tier,
        features_unlocked: this.getMembershipFeatures(tier)
      };

    } catch (error) {
      console.error('Membership purchase error:', error);
      throw new Error(`Membership purchase failed: ${error.message}`);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Normalize wallet address to lowercase with 0x prefix
   */
  normalizeWalletAddress(address) {
    if (!address) throw new Error('Wallet address is required');
    
    const normalized = address.toLowerCase();
    if (!normalized.startsWith('0x')) {
      throw new Error('Invalid wallet address format');
    }
    
    if (!/^0x[a-f0-9]{40}$/.test(normalized)) {
      throw new Error('Invalid wallet address format');
    }
    
    return normalized;
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateToken(userProfile) {
    const payload = {
      wallet_address: userProfile.wallet_address,
      is_member: userProfile.is_member,
      can_earn_rewards: userProfile.can_earn_rewards,
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, this.JWT_SECRET, { 
      expiresIn: this.JWT_EXPIRES_IN 
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Remove sensitive data from user profile
   */
  sanitizeUserProfile(profile) {
    const sanitized = { ...profile };
    delete sanitized.github_access_token;
    delete sanitized.discord_access_token;
    return sanitized;
  }

  /**
   * Get available features based on current integrations
   */
  getAvailableFeatures(profile) {
    // Derive features from actual database fields
    const hasGitHub = !!(profile.github_username || profile.github_id);
    const hasDiscord = !!(profile.discord_username || profile.discord_id);
    const hasFarcaster = !!(profile.farcaster_username || profile.farcaster_fid);
    const isMember = profile.membership_status === 'member' || profile.membership_status === 'premium' || profile.membership_status === 'paid';
    
    return {
      token_operations: true, // Always available with wallet
      earning_rewards: hasGitHub, // Can earn if GitHub connected
      repository_management: hasGitHub,
      community_access: hasDiscord || hasFarcaster || isMember,
      social_features: hasFarcaster,
      premium_features: profile.membership_status === 'premium',
      staking: true, // Always available with wallet
      governance: isMember
    };
  }

  /**
   * Get next recommended steps for user
   */
  getNextSteps(profile) {
    const steps = [];
    
    // Derive connection status from actual database fields
    const hasGitHub = !!(profile.github_username || profile.github_id);
    const hasDiscord = !!(profile.discord_username || profile.discord_id);
    const hasFarcaster = !!(profile.farcaster_username || profile.farcaster_fid);
    const isMember = profile.membership_status === 'member' || profile.membership_status === 'premium' || profile.membership_status === 'paid';
    
    if (!hasGitHub) {
      steps.push({
        action: 'connect_github',
        title: 'Connect GitHub',
        description: 'Start earning $ABC tokens for your code contributions',
        benefits: ['Earn 50k-1M $ABC per commit', 'Auto-track your repositories'],
        priority: 'high'
      });
    }
    
    if (!isMember && hasGitHub) {
      steps.push({
        action: 'upgrade_membership',
        title: 'Upgrade to Member',
        description: 'Unlock unlimited earning and premium features',
        benefits: ['Unlimited daily commits', 'Priority reward processing'],
        priority: 'medium'
      });
    }
    
    if (!hasDiscord) {
      steps.push({
        action: 'connect_discord',
        title: 'Join Discord Community',
        description: 'Connect with other developers and get community support',
        benefits: ['Community access', 'Role-based features', 'Direct support'],
        priority: 'low'
      });
    }
    
    if (!hasFarcaster) {
      steps.push({
        action: 'connect_farcaster',
        title: 'Connect Farcaster',
        description: 'Enable social features and cast integration',
        benefits: ['Social proof', 'Achievement announcements', 'Mini-app features'],
        priority: 'low'
      });
    }
    
    return steps;
  }

  /**
   * Get features unlocked by membership tier
   */
  getMembershipFeatures(tier) {
    const features = {
      free: ['basic_earning', 'community_viewing'],
      member: ['unlimited_earning', 'premium_support', 'priority_processing'],
      premium: ['all_features', 'governance_voting', 'early_access']
    };
    
    return features[tier] || features.free;
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(walletAddress, context = {}) {
    const query = `
      UPDATE users SET
        updated_at = NOW()
      WHERE wallet_address = $1
    `;
    
    await this.getPool().query(query, [walletAddress]);
  }

  /**
   * Auto-detect user repositories after GitHub integration
   */
  async autoDetectRepositories(walletAddress, githubUsername) {
    // This would integrate with your existing repository detection service
    // For now, just log that we should implement this
    console.log(`TODO: Auto-detect repositories for ${githubUsername} (wallet: ${walletAddress})`);
    
    // Future implementation:
    // - Fetch user's repositories from GitHub API
    // - Filter for recently active, non-fork repositories
    // - Auto-register public repositories for earning
    // - Suggest private repositories for manual setup
  }

  /**
   * Encrypt sensitive tokens before storing
   */
  encryptToken(token) {
    const algorithm = 'aes-256-gcm';
    const secretKey = crypto.createHash('sha256').update(this.JWT_SECRET).digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, secretKey);
    cipher.setAAD(iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt stored tokens
   */
  decryptToken(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const secretKey = crypto.createHash('sha256').update(this.JWT_SECRET).digest();
    
    const decipher = crypto.createDecipher(algorithm, secretKey);
    decipher.setAAD(Buffer.from(encryptedData.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Middleware for protecting routes (requires wallet authentication)
   */
  requireWalletAuth = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Wallet authentication required' });
      }
      
      const token = authHeader.substring(7);
      const decoded = this.verifyToken(token);
      
      req.user = decoded;
      next();
      
    } catch (error) {
      return res.status(401).json({ error: 'Invalid wallet authentication' });
    }
  };
}

export default new WalletFirstAuthService();