import { NeynarAPIClient } from "@neynar/nodejs-sdk";

class FarcasterService {
  constructor() {
    this.client = null;
    this.signerUuid = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;
    
    if (!process.env.NEYNAR_API_KEY) {
      console.warn('⚠️ NEYNAR_API_KEY not configured - Farcaster features disabled');
      return;
    }

    console.log('🔑 Initializing with API key:', process.env.NEYNAR_API_KEY.substring(0, 10) + '...');
    this.client = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

    this.signerUuid = process.env.ABC_DEV_SIGNER_UUID || process.env.NEYNAR_SIGNER_UUID;

    if (!this.signerUuid) {
      console.warn('⚠️ ABC_DEV_SIGNER_UUID or NEYNAR_SIGNER_UUID not configured - Bot cannot post');
    }

    console.log('✅ Farcaster service initialized for @abcbot');
    this.initialized = true;
  }

  async publishCast(text, options = {}) {
    this.initialize();
    if (!this.client || !this.signerUuid) {
      console.error('❌ Cannot publish cast: Farcaster not configured properly');
      return null;
    }

    try {
      const response = await this.client.publishCast(
        this.signerUuid,
        text,
        options
      );
      
      console.log(`✅ Cast published: ${text.substring(0, 50)}...`);
      return response.cast;
    } catch (error) {
      console.error('❌ Failed to publish cast:', error.message);
      throw error;
    }
  }

  async replyToCast(parentHash, text) {
    if (!this.client || !this.signerUuid) {
      console.error('❌ Cannot reply: Farcaster not configured properly');
      return null;
    }

    try {
      const response = await this.client.publishCast(
        this.signerUuid,
        text,
        { parent: parentHash }
      );
      
      console.log(`✅ Reply published to cast ${parentHash}`);
      return response.cast;
    } catch (error) {
      console.error('❌ Failed to reply:', error.message);
      throw error;
    }
  }

  async getUserByFid(fid) {
    if (!this.client) {
      console.error('❌ Cannot fetch user: Neynar client not configured');
      return null;
    }

    try {
      const response = await this.client.fetchBulkUsers([fid]);
      return response.users?.[0] || null;
    } catch (error) {
      console.error(`❌ Failed to fetch user ${fid}:`, error.message);
      return null;
    }
  }

  /**
   * Get user's verified wallet addresses (not custody address)
   * Returns primary wallet address that user actually controls
   */
  async getUserVerifiedAddresses(fid) {
    const user = await this.getUserByFid(fid);
    if (!user) {
      return null;
    }

    const result = {
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      custody_address: user.custody_address,
      verified_addresses: [],
      primary_address: null
    };

    // Extract verified ETH addresses
    if (user.verified_addresses?.eth_addresses) {
      result.verified_addresses = user.verified_addresses.eth_addresses;
      // Use first verified address as primary (user's choice for verification order)
      result.primary_address = user.verified_addresses.eth_addresses[0] || null;
    }

    console.log(`📍 Farcaster user ${user.username} (${fid}):`);
    console.log(`   Custody: ${result.custody_address}`);
    console.log(`   Verified: ${result.verified_addresses.length} addresses`);
    console.log(`   Primary: ${result.primary_address || 'None'}`);

    return result;
  }

  /**
   * Check if a wallet address is the user's verified primary address
   * This helps distinguish between custody addresses and user-controlled addresses
   */
  async isVerifiedPrimaryAddress(fid, walletAddress) {
    const addressData = await this.getUserVerifiedAddresses(fid);
    if (!addressData) return false;

    // Check if the wallet address matches their primary verified address
    return addressData.primary_address && 
           addressData.primary_address.toLowerCase() === walletAddress.toLowerCase();
  }

  async announcePRMerged(githubUsername, prTitle, prUrl, rewardAmount) {
    const message = `🎉 PR Merged!\n\n` +
      `@${githubUsername} just earned ${rewardAmount} $ABC for:\n` +
      `"${prTitle}"\n\n` +
      `${prUrl}\n\n` +
      `Keep building! 🚀`;
    
    return this.publishCast(message);
  }

  async announceNewContributor(githubUsername, farcasterUsername) {
    const message = `👋 Welcome new contributor!\n\n` +
      `@${farcasterUsername} (GitHub: ${githubUsername}) has joined ABC DAO!\n\n` +
      `Ready to earn $ABC for your contributions 🔥`;
    
    return this.publishCast(message);
  }

  async announceWeeklyStats(stats) {
    const message = `📊 Weekly ABC Stats\n\n` +
      `• PRs Merged: ${stats.prCount}\n` +
      `• Total Rewards: ${stats.totalRewards} $ABC\n` +
      `• Active Contributors: ${stats.contributorCount}\n` +
      `• Top Contributor: @${stats.topContributor}\n\n` +
      `Keep shipping! 🚢`;
    
    return this.publishCast(message);
  }

  async followUser(targetFid) {
    this.initialize();
    if (!this.client || !this.signerUuid) {
      console.error('❌ Cannot follow user: Farcaster not configured properly');
      return null;
    }

    try {
      const response = await this.client.followUser(this.signerUuid, targetFid);
      console.log(`✅ ABC DAO bot now following user FID ${targetFid}`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to follow user ${targetFid}:`, error.message);
      // Don't throw error - following is a nice-to-have feature
      return null;
    }
  }

  async testPost() {
    return this.publishCast('🤖 Hello from @abcbot! Testing 1-2-3... 🚀');
  }

  isConfigured() {
    this.initialize();
    return this.client !== null && this.signerUuid !== undefined;
  }
}

export const farcasterService = new FarcasterService();
export default farcasterService;