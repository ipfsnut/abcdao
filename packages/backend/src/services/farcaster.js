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