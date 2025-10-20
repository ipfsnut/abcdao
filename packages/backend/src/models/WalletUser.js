import { getPool } from '../services/database.js';

/**
 * Wallet-First User Model for ABC DAO
 * 
 * Primary identifier: wallet_address_primary
 * Supports both Farcaster and webapp users through progressive enhancement
 */
export class WalletUser {
  
  // ============================================================================
  // CORE WALLET-FIRST OPERATIONS
  // ============================================================================
  
  /**
   * Find user by wallet address (primary lookup method)
   */
  static async findByWallet(wallet_address) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(wallet_address_primary) = LOWER($1)',
      [wallet_address]
    );
    
    if (result.rows[0]) {
      return this.enrichUserObject(result.rows[0]);
    }
    return null;
  }

  /**
   * Create new user with wallet-first identity
   */
  static async createUser(userData) {
    const pool = getPool();
    const {
      wallet_address,
      entry_context = 'webapp',
      membership_tx_hash = null,
      membership_amount = null,
      github_username = null,
      github_id = null,
      github_access_token = null,
      farcaster_fid = null,
      farcaster_username = null,
      discord_id = null
    } = userData;

    // Validate required fields
    if (!wallet_address) {
      throw new Error('Wallet address is required for user creation');
    }

    // Determine onboarding step based on provided data
    let onboarding_step = 1; // Payment completed
    if (github_username) {
      onboarding_step = 2; // GitHub linked
    }

    // Determine display name
    const display_name = github_username || farcaster_username || `User-${wallet_address.slice(-6)}`;
    const membership_status = membership_tx_hash ? 'active' : 'pending';
    const can_earn_rewards = github_username !== null;

    // Create base user with core fields using fixed query structure
    const baseQuery = `
      INSERT INTO users (
        wallet_address_primary, wallet_address, entry_context, onboarding_step,
        membership_status, membership_paid_at, membership_tx_hash, membership_amount,
        display_name, can_earn_rewards, created_at, updated_at,
        github_username, github_id, access_token,
        farcaster_fid, farcaster_username,
        discord_id
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, NOW(), NOW(), $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const baseValues = [
      wallet_address,          // $1
      wallet_address,          // $2  
      entry_context,           // $3
      onboarding_step,         // $4
      membership_status,       // $5
      membership_tx_hash,      // $6
      membership_amount,       // $7
      display_name,            // $8
      can_earn_rewards,        // $9
      github_username,         // $10
      github_id,               // $11
      github_access_token,     // $12
      farcaster_fid,          // $13
      farcaster_username,      // $14
      discord_id               // $15
    ];
    
    const result = await pool.query(baseQuery, baseValues);
    return this.enrichUserObject(result.rows[0]);
  }

  /**
   * Update user by wallet address
   */
  static async updateByWallet(wallet_address, updates) {
    const pool = getPool();
    
    // Build dynamic UPDATE query
    const fields = [];
    const values = [wallet_address];
    let paramIndex = 2;

    // Handle each possible update field
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Always update updated_at
    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE wallet_address_primary = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rows[0]) {
      return this.enrichUserObject(result.rows[0]);
    }
    
    throw new Error('User not found');
  }

  // ============================================================================
  // PROGRESSIVE SOCIAL ACCOUNT LINKING
  // ============================================================================

  /**
   * Link GitHub account to existing user
   */
  static async linkGithubAccount(wallet_address, github_data) {
    const { username, id, access_token } = github_data;

    // Check if GitHub username is already taken by another user
    const existingUser = await this.findByGithubUsername(username);
    if (existingUser && existingUser.wallet_address_primary !== wallet_address) {
      throw new Error('GitHub account already linked to different wallet');
    }

    return await this.updateByWallet(wallet_address, {
      github_username: username,
      github_id: id,
      access_token: access_token,
      onboarding_step: 2,
      can_earn_rewards: true,
      display_name: username
    });
  }

  /**
   * Link Farcaster account to existing user
   */
  static async linkFarcasterAccount(wallet_address, farcaster_data) {
    const { fid, username } = farcaster_data;

    // Check if FID is already taken by another user
    const existingUser = await this.findByFarcasterFid(fid);
    if (existingUser && existingUser.wallet_address_primary !== wallet_address) {
      throw new Error('Farcaster account already linked to different wallet');
    }

    return await this.updateByWallet(wallet_address, {
      farcaster_fid: fid,
      farcaster_username: username,
      display_name: username // Update display name if not set
    });
  }

  /**
   * Link Discord account to existing user
   */
  static async linkDiscordAccount(wallet_address, discord_data) {
    const { id, username } = discord_data;

    return await this.updateByWallet(wallet_address, {
      discord_id: id,
      discord_username: username
    });
  }

  // ============================================================================
  // LEGACY COMPATIBILITY LOOKUPS
  // ============================================================================

  /**
   * Find user by Farcaster FID (backward compatibility)
   */
  static async findByFarcasterFid(fid) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE farcaster_fid = $1',
      [fid]
    );
    
    if (result.rows[0]) {
      return this.enrichUserObject(result.rows[0]);
    }
    return null;
  }

  /**
   * Find user by GitHub username (secondary lookup)
   */
  static async findByGithubUsername(username) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE github_username = $1',
      [username]
    );
    
    if (result.rows[0]) {
      return this.enrichUserObject(result.rows[0]);
    }
    return null;
  }

  /**
   * Smart identifier lookup (FID if numeric, GitHub username if string)
   */
  static async findByIdentifier(identifier) {
    if (/^\d+$/.test(identifier)) {
      // Numeric identifier - try FID
      return await this.findByFarcasterFid(parseInt(identifier));
    } else if (identifier.startsWith('0x') && identifier.length === 42) {
      // Looks like wallet address
      return await this.findByWallet(identifier);
    } else {
      // String identifier - try GitHub username
      return await this.findByGithubUsername(identifier);
    }
  }

  // ============================================================================
  // MEMBERSHIP & PAYMENT OPERATIONS
  // ============================================================================

  /**
   * Process membership payment
   */
  static async processMembershipPayment(wallet_address, payment_data) {
    const { tx_hash, amount, block_number } = payment_data;

    return await this.updateByWallet(wallet_address, {
      membership_status: 'active',
      membership_paid_at: new Date(),
      membership_tx_hash: tx_hash,
      membership_amount: amount,
      onboarding_step: Math.max(1, await this.getCurrentStep(wallet_address))
    });
  }

  /**
   * Get user's current onboarding step
   */
  static async getCurrentStep(wallet_address) {
    const user = await this.findByWallet(wallet_address);
    return user ? user.onboarding_step : 0;
  }

  // ============================================================================
  // REPUTATION & REWARDS OPERATIONS  
  // ============================================================================

  /**
   * Update user's reputation metrics
   */
  static async updateReputation(wallet_address, reputation_data) {
    const {
      total_abc_earned,
      reputation_score, 
      reputation_tier,
      voting_power,
      quality_score_avg
    } = reputation_data;

    return await this.updateByWallet(wallet_address, {
      total_abc_earned,
      reputation_score,
      reputation_tier,
      voting_power,
      quality_score_avg
    });
  }

  /**
   * Increment commit statistics
   */
  static async incrementCommitStats(wallet_address, reward_amount) {
    const pool = getPool();
    
    const result = await pool.query(`
      UPDATE users 
      SET 
        total_commits = total_commits + 1,
        total_rewards_earned = total_rewards_earned + $2,
        total_abc_earned = total_abc_earned + $2,
        last_commit_at = NOW(),
        updated_at = NOW()
      WHERE wallet_address_primary = $1
      RETURNING *
    `, [wallet_address, reward_amount]);

    if (result.rows[0]) {
      return this.enrichUserObject(result.rows[0]);
    }
    
    throw new Error('User not found');
  }

  // ============================================================================
  // COMMUNITY & GOVERNANCE OPERATIONS
  // ============================================================================

  /**
   * Increment governance participation
   */
  static async incrementGovernanceParticipation(wallet_address, action_type) {
    const updates = { updated_at: new Date() };

    switch (action_type) {
      case 'vote':
        updates.governance_votes_cast = 'governance_votes_cast + 1';
        break;
      case 'proposal':
        updates.repositories_proposed = 'repositories_proposed + 1';
        break;
      case 'referral':
        updates.referral_count = 'referral_count + 1';
        break;
    }

    const pool = getPool();
    const result = await pool.query(`
      UPDATE users 
      SET ${Object.keys(updates).map(key => 
        key === 'updated_at' ? `${key} = NOW()` : `${key} = ${updates[key]}`
      ).join(', ')}
      WHERE wallet_address_primary = $1
      RETURNING *
    `, [wallet_address]);

    if (result.rows[0]) {
      return this.enrichUserObject(result.rows[0]);
    }
    
    throw new Error('User not found');
  }

  // ============================================================================
  // QUERY & ANALYTICS OPERATIONS
  // ============================================================================

  /**
   * Get users by reputation tier
   */
  static async getUsersByTier(tier, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT * FROM users 
      WHERE reputation_tier = $1 AND can_earn_rewards = true
      ORDER BY reputation_score DESC, total_abc_earned DESC
      LIMIT $2 OFFSET $3
    `, [tier, limit, offset]);

    return result.rows.map(user => this.enrichUserObject(user));
  }

  /**
   * Get leaderboard users
   */
  static async getLeaderboard(limit = 100, offset = 0) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        wallet_address_primary, display_name, github_username, farcaster_username,
        total_abc_earned, reputation_score, reputation_tier, total_commits,
        entry_context, can_earn_rewards, last_commit_at
      FROM users 
      WHERE can_earn_rewards = true
      ORDER BY reputation_score DESC, total_abc_earned DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return result.rows.map(user => this.enrichUserObject(user));
  }

  /**
   * Search users by display name or GitHub username
   */
  static async searchUsers(query, limit = 20) {
    const pool = getPool();
    const searchTerm = `%${query}%`;
    
    const result = await pool.query(`
      SELECT * FROM users 
      WHERE 
        (display_name ILIKE $1 OR github_username ILIKE $1 OR farcaster_username ILIKE $1)
        AND can_earn_rewards = true
      ORDER BY 
        reputation_score DESC,
        total_abc_earned DESC
      LIMIT $2
    `, [searchTerm, limit]);

    return result.rows.map(user => this.enrichUserObject(user));
  }

  /**
   * Get membership statistics
   */
  static async getMembershipStats() {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN membership_status = 'active' THEN 1 END) as active_members,
        COUNT(CASE WHEN can_earn_rewards = true THEN 1 END) as earning_members,
        COUNT(CASE WHEN entry_context = 'farcaster' THEN 1 END) as farcaster_users,
        COUNT(CASE WHEN entry_context = 'webapp' THEN 1 END) as webapp_users,
        SUM(CASE WHEN membership_status = 'active' THEN membership_amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
        AVG(reputation_score) as avg_reputation
      FROM users
    `);

    return result.rows[0];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Enrich user object with computed properties
   */
  static enrichUserObject(user) {
    if (!user) return null;

    return {
      ...user,
      // Computed properties
      has_farcaster: !!user.farcaster_fid,
      has_github: !!user.github_username,
      has_discord: !!user.discord_id,
      is_fully_onboarded: user.onboarding_step >= 2,
      primary_display_name: user.display_name || user.github_username || user.farcaster_username || `User-${user.wallet_address_primary?.slice(-6)}`,
      
      // Social profiles
      social_profiles: {
        farcaster: user.farcaster_username ? {
          fid: user.farcaster_fid,
          username: user.farcaster_username,
          url: `https://warpcast.com/${user.farcaster_username}`
        } : null,
        github: user.github_username ? {
          username: user.github_username,
          url: `https://github.com/${user.github_username}`
        } : null,
        discord: user.discord_id ? {
          id: user.discord_id,
          username: user.discord_username
        } : null
      },

      // Reputation info
      reputation_info: {
        score: parseFloat(user.reputation_score || 0),
        tier: user.reputation_tier || 'Bronze',
        voting_power: parseFloat(user.voting_power || 0),
        total_earned: parseFloat(user.total_abc_earned || 0)
      }
    };
  }

  /**
   * Validate wallet address format
   */
  static isValidWalletAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get user's available features based on onboarding status
   */
  static getAvailableFeatures(user) {
    const features = {
      basic_profile: true,
      membership_paid: user.membership_status === 'active',
      github_integration: user.onboarding_step >= 2,
      earning_rewards: user.can_earn_rewards,
      farcaster_features: user.has_farcaster,
      discord_access: user.has_discord,
      governance_voting: user.reputation_score >= 10,
      repository_proposals: user.reputation_score >= 50
    };

    return features;
  }
}

export default WalletUser;