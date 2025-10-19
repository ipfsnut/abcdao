import { WalletUser } from '../models/WalletUser.js';
import jwt from 'jsonwebtoken';

/**
 * Universal Authentication Service
 * Handles both Farcaster mini-app and webapp authentication flows
 */
export class UniversalAuthService {
  
  /**
   * Authenticate user by wallet address with optional context
   */
  static async authenticateByWallet(wallet_address, context = {}) {
    try {
      // Validate wallet address format
      if (!WalletUser.isValidWalletAddress(wallet_address)) {
        throw new Error('Invalid wallet address format');
      }

      // Find existing user
      let user = await WalletUser.findByWallet(wallet_address);
      
      if (!user) {
        return {
          action: 'require_membership',
          step: 1,
          message: 'Wallet not found. Please purchase ABC DAO membership to continue.',
          wallet_address
        };
      }

      // Check onboarding completion
      if (user.onboarding_step < 2) {
        return {
          action: 'complete_onboarding',
          step: user.onboarding_step + 1,
          user: this.sanitizeUser(user),
          next_step: user.onboarding_step === 1 ? 'github_oauth' : 'unknown'
        };
      }

      // Auto-link additional social accounts if provided in context
      const updates = {};
      let hasUpdates = false;

      if (context.farcaster_fid && !user.farcaster_fid) {
        updates.farcaster_fid = context.farcaster_fid;
        updates.farcaster_username = context.farcaster_username;
        hasUpdates = true;
      }

      if (context.discord_id && !user.discord_id) {
        updates.discord_id = context.discord_id;
        updates.discord_username = context.discord_username;
        hasUpdates = true;
      }

      // Apply updates if any
      if (hasUpdates) {
        user = await WalletUser.updateByWallet(wallet_address, updates);
      }

      // Generate JWT token
      const token = this.generateToken(user);
      
      return {
        action: 'authenticated',
        user: this.sanitizeUser(user),
        token,
        available_features: WalletUser.getAvailableFeatures(user)
      };

    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Process membership purchase
   */
  static async processMembershipPurchase(payment_data) {
    const { wallet_address, tx_hash, amount, entry_context = 'webapp' } = payment_data;

    try {
      // Validate wallet address
      if (!WalletUser.isValidWalletAddress(wallet_address)) {
        throw new Error('Invalid wallet address format');
      }

      // Check if user already exists
      let user = await WalletUser.findByWallet(wallet_address);
      
      if (user) {
        // Update existing user with payment info
        user = await WalletUser.processMembershipPayment(wallet_address, {
          tx_hash,
          amount,
          block_number: payment_data.block_number
        });
      } else {
        // Create new user
        user = await WalletUser.createUser({
          wallet_address,
          entry_context,
          membership_tx_hash: tx_hash,
          membership_amount: amount
        });
      }

      return {
        success: true,
        user: this.sanitizeUser(user),
        next_step: 'github_oauth',
        message: 'Membership payment processed! Please connect your GitHub account to start earning rewards.'
      };

    } catch (error) {
      console.error('Membership purchase error:', error);
      throw new Error(`Membership purchase failed: ${error.message}`);
    }
  }

  /**
   * Link GitHub account to user
   */
  static async linkGithubAccount(wallet_address, github_data, oauth_code) {
    try {
      // Exchange OAuth code for GitHub data if needed
      let githubInfo = github_data;
      if (oauth_code && !github_data) {
        githubInfo = await this.exchangeGithubCode(oauth_code);
      }

      // Link GitHub account
      const user = await WalletUser.linkGithubAccount(wallet_address, githubInfo);
      
      // Generate token for authenticated user
      const token = this.generateToken(user);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        message: 'GitHub account linked successfully! You can now earn $ABC rewards for your commits.',
        available_features: WalletUser.getAvailableFeatures(user)
      };

    } catch (error) {
      console.error('GitHub linking error:', error);
      throw new Error(`GitHub linking failed: ${error.message}`);
    }
  }

  /**
   * Link Discord account to user
   */
  static async linkDiscordAccount(wallet_address, discord_data, oauth_code, redirect_uri) {
    try {
      // Exchange OAuth code for Discord data if needed
      let discordInfo = discord_data;
      if (oauth_code && !discord_data) {
        discordInfo = await this.exchangeDiscordCode(oauth_code, redirect_uri);
      }

      // Format Discord data for database
      const formattedDiscordData = {
        id: discordInfo.id,
        username: discordInfo.full_username || discordInfo.username
      };

      // Link Discord account
      const user = await WalletUser.linkDiscordAccount(wallet_address, formattedDiscordData);
      
      // Generate token for authenticated user
      const token = this.generateToken(user);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        message: 'Discord account linked successfully! You now have access to private ABC DAO channels.',
        enhanced_features: this.getEnhancedFeatures('discord'),
        available_features: WalletUser.getAvailableFeatures(user)
      };

    } catch (error) {
      console.error('Discord linking error:', error);
      throw new Error(`Discord linking failed: ${error.message}`);
    }
  }

  /**
   * Exchange GitHub OAuth code for user data
   */
  static async exchangeGithubCode(code) {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
      }

      // Get user info with access token
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const userData = await userResponse.json();

      return {
        username: userData.login,
        id: userData.id,
        access_token: tokenData.access_token,
        profile_data: userData
      };

    } catch (error) {
      console.error('GitHub OAuth exchange error:', error);
      throw new Error(`GitHub OAuth failed: ${error.message}`);
    }
  }

  /**
   * Exchange Discord OAuth code for user data
   */
  static async exchangeDiscordCode(code, redirect_uri) {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirect_uri,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(`Discord OAuth error: ${tokenData.error_description}`);
      }

      // Get user info with access token
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = await userResponse.json();

      if (userData.error) {
        throw new Error(`Discord API error: ${userData.message}`);
      }

      return {
        id: userData.id,
        username: userData.global_name || userData.username,
        discriminator: userData.discriminator,
        full_username: userData.discriminator !== '0' ? 
          `${userData.username}#${userData.discriminator}` : 
          userData.username,
        access_token: tokenData.access_token,
        profile_data: userData
      };

    } catch (error) {
      console.error('Discord OAuth exchange error:', error);
      throw new Error(`Discord OAuth failed: ${error.message}`);
    }
  }

  /**
   * Link additional social account
   */
  static async linkSocialAccount(wallet_address, platform, social_data) {
    try {
      const user = await WalletUser.findByWallet(wallet_address);
      
      if (!user) {
        throw new Error('User not found');
      }

      let updatedUser;
      
      switch (platform) {
        case 'farcaster':
          updatedUser = await WalletUser.linkFarcasterAccount(wallet_address, social_data);
          break;
        case 'discord':
          updatedUser = await WalletUser.linkDiscordAccount(wallet_address, social_data);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      return {
        success: true,
        user: this.sanitizeUser(updatedUser),
        message: `${platform} account linked successfully!`,
        enhanced_features: this.getEnhancedFeatures(platform)
      };

    } catch (error) {
      console.error(`${platform} linking error:`, error);
      throw new Error(`${platform} linking failed: ${error.message}`);
    }
  }

  /**
   * Legacy FID authentication (backward compatibility)
   */
  static async authenticateByFid(fid, context = {}) {
    try {
      const user = await WalletUser.findByFarcasterFid(fid);
      
      if (!user) {
        return {
          action: 'require_wallet_setup',
          fid,
          message: 'Please connect your wallet and complete ABC DAO membership.',
          context: 'farcaster'
        };
      }

      // If user exists, authenticate by wallet
      return await this.authenticateByWallet(user.wallet_address_primary, {
        ...context,
        farcaster_fid: fid
      });

    } catch (error) {
      console.error('FID authentication error:', error);
      throw new Error(`FID authentication failed: ${error.message}`);
    }
  }

  /**
   * Smart authentication (auto-detect identifier type)
   */
  static async authenticateByIdentifier(identifier, context = {}) {
    if (/^\d+$/.test(identifier)) {
      // Numeric - assume FID
      return await this.authenticateByFid(parseInt(identifier), context);
    } else if (identifier.startsWith('0x') && identifier.length === 42) {
      // Wallet address
      return await this.authenticateByWallet(identifier, context);
    } else {
      // String - try GitHub username
      const user = await WalletUser.findByGithubUsername(identifier);
      if (user) {
        return await this.authenticateByWallet(user.wallet_address_primary, context);
      } else {
        throw new Error('User not found');
      }
    }
  }

  /**
   * Generate JWT token for authenticated user
   */
  static generateToken(user) {
    const payload = {
      wallet_address: user.wallet_address_primary,
      github_username: user.github_username,
      farcaster_fid: user.farcaster_fid,
      can_earn_rewards: user.can_earn_rewards,
      reputation_tier: user.reputation_tier,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'abc-dao-secret', {
      expiresIn: '7d'
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'abc-dao-secret');
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Middleware for protecting routes
   */
  static requireAuth(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = this.verifyToken(token);
      req.user = decoded;
      next();

    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  /**
   * Remove sensitive data from user object
   */
  static sanitizeUser(user) {
    const sanitized = { ...user };
    delete sanitized.access_token;
    delete sanitized.github_access_token;
    return sanitized;
  }

  /**
   * Get enhanced features for social platform
   */
  static getEnhancedFeatures(platform) {
    const features = {
      farcaster: [
        'Social proof and mentions in reward announcements',
        'Access to Farcaster-specific channels and communities',
        'Enhanced profile visibility in the ecosystem'
      ],
      discord: [
        'Access to private ABC DAO Discord channels',
        'Direct communication with other developers',
        'Early access to new features and announcements'
      ]
    };

    return features[platform] || [];
  }

  /**
   * Get authentication context from request
   */
  static extractContext(req) {
    const context = {};
    
    // Extract Farcaster context from headers or body
    if (req.headers['x-farcaster-fid']) {
      context.farcaster_fid = parseInt(req.headers['x-farcaster-fid']);
      context.farcaster_username = req.headers['x-farcaster-username'];
    }
    
    // Extract from request body
    if (req.body.farcaster_fid) {
      context.farcaster_fid = req.body.farcaster_fid;
      context.farcaster_username = req.body.farcaster_username;
    }

    // Detect entry context
    const userAgent = req.headers['user-agent'] || '';
    const isInFarcaster = userAgent.includes('Warpcast') || 
                         req.headers['x-farcaster-context'] === 'true' ||
                         context.farcaster_fid;
    
    context.entry_context = isInFarcaster ? 'farcaster' : 'webapp';
    
    return context;
  }
}

export default UniversalAuthService;