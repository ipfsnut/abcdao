import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import fs from 'fs/promises';
import FormData from 'form-data';
import fetch from 'node-fetch';

class FarcasterLeaderboardService {
  constructor() {
    this.neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    this.signerUuid = process.env.NEYNAR_SIGNER_UUID;
  }

  /**
   * Upload image to Neynar and get URL
   */
  async uploadImage(imagePath) {
    try {
      console.log(`📤 Uploading image: ${imagePath}`);
      
      const imageBuffer = await fs.readFile(imagePath);
      const form = new FormData();
      form.append('file', imageBuffer, {
        filename: 'leaderboard.png',
        contentType: 'image/png'
      });

      const response = await fetch('https://api.neynar.com/v2/farcaster/storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEYNAR_API_KEY}`,
          ...form.getHeaders()
        },
        body: form
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Image upload failed: ${error}`);
      }

      const result = await response.json();
      console.log(`✅ Image uploaded successfully: ${result.url}`);
      return result.url;

    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Create a leaderboard cast with image
   */
  async castLeaderboard(imagePath, leaderboardData) {
    try {
      if (!this.signerUuid) {
        throw new Error('NEYNAR_SIGNER_UUID not configured');
      }

      // Upload image first
      const imageUrl = await this.uploadImage(imagePath);

      // Create engaging cast text
      const topDev = leaderboardData[0];
      const totalCommits = leaderboardData.reduce((sum, dev) => sum + dev.total_commits, 0);
      
      const castText = this.generateCastText(topDev, totalCommits, leaderboardData.length);

      console.log('📡 Posting leaderboard cast...');
      console.log(`Text: ${castText}`);

      const castResponse = await this.neynar.publishCast({
        signerUuid: this.signerUuid,
        text: castText,
        embeds: [{ url: imageUrl }]
      });

      console.log(`✅ Leaderboard cast posted successfully!`);
      console.log(`🔗 Cast URL: https://warpcast.com/${castResponse.cast.author.username}/${castResponse.cast.hash}`);

      return {
        castHash: castResponse.cast.hash,
        castUrl: `https://warpcast.com/${castResponse.cast.author.username}/${castResponse.cast.hash}`,
        imageUrl
      };

    } catch (error) {
      console.error('❌ Failed to cast leaderboard:', error);
      throw error;
    }
  }

  /**
   * Generate engaging cast text
   */
  generateCastText(topDev, totalCommits, devCount) {
    const date = new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric'
    });

    const messages = [
      `🏆 ${date} ABC DAO Leaderboard is here!`,
      ``,
      `👑 Leading the pack: @${topDev.farcaster_username} with ${topDev.total_commits} commits!`,
      ``,
      `📊 ${devCount} developers shipped ${totalCommits} commits total`,
      `💰 Earning real $ABC rewards for building!`,
      ``,
      `Ready to join the builders? 👇`,
      `abcdao.xyz`
    ];

    return messages.join('\\n');
  }

  /**
   * Alternative simpler cast without image (backup)
   */
  async castSimpleLeaderboard(leaderboardData) {
    try {
      const topThree = leaderboardData.slice(0, 3);
      
      const castText = [
        `🏆 Daily ABC DAO Leaderboard`,
        ``,
        ...topThree.map((dev, i) => {
          const medal = ['🥇', '🥈', '🥉'][i];
          return `${medal} @${dev.farcaster_username}: ${dev.total_commits} commits`;
        }),
        ``,
        `Ship code → Earn $ABC → Build the future`,
        `abcdao.xyz`
      ].join('\\n');

      const castResponse = await this.neynar.publishCast({
        signerUuid: this.signerUuid,
        text: castText
      });

      console.log('✅ Simple leaderboard cast posted successfully!');
      return castResponse;

    } catch (error) {
      console.error('❌ Failed to cast simple leaderboard:', error);
      throw error;
    }
  }
}

export { FarcasterLeaderboardService };