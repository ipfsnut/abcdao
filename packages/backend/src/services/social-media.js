0x66950b11d43cff503709239a5da7f92b339da50932dbbf80da90f3f5ee4cbb4eimport { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { TwitterApi } from 'twitter-api-v2';
import TelegramBot from 'node-telegram-bot-api';

class SocialMediaService {
  constructor() {
    // Farcaster (already integrated)
    this.neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    this.botFid = process.env.NEYNAR_BOT_FID;
    
    // Twitter/X setup
    if (process.env.TWITTER_API_KEY) {
      this.twitter = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
      });
    }
    
    // Telegram setup
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
        polling: true
      });
      this.telegramChannelId = process.env.TELEGRAM_CHANNEL_ID;
      this.setupTelegramCommands();
    }
  }

  /**
   * Post commit reward announcement across all platforms
   */
  async announceCommitReward(username, amount, commitMessage, repoName) {
    const message = `🎉 @${username} just earned ${amount.toLocaleString()} $ABC tokens!\n\n` +
                   `Commit: "${commitMessage.substring(0, 100)}${commitMessage.length > 100 ? '...' : ''}"\n` +
                   `Repo: ${repoName}\n\n` +
                   `#ABCDao #DeveloperRewards #BuildAndEarn`;

    const results = {};

    // Farcaster
    try {
      if (this.neynar && this.botFid) {
        const farcasterResult = await this.neynar.publishCast(this.botFid, message);
        results.farcaster = { success: true, hash: farcasterResult.hash };
      }
    } catch (error) {
      results.farcaster = { success: false, error: error.message };
    }

    // Twitter
    try {
      if (this.twitter) {
        const tweet = await this.twitter.v2.tweet(message);
        results.twitter = { success: true, id: tweet.data.id };
      }
    } catch (error) {
      results.twitter = { success: false, error: error.message };
    }

    // Telegram
    try {
      if (this.telegram && this.telegramChannelId) {
        const telegramMessage = await this.telegram.sendMessage(this.telegramChannelId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
        results.telegram = { success: true, id: telegramMessage.message_id };
      }
    } catch (error) {
      results.telegram = { success: false, error: error.message };
    }

    console.log('📱 Social media announcement results:', results);
    return results;
  }

  /**
   * Post weekly leaderboard across platforms
   */
  async announceWeeklyLeaderboard(leaderboardData) {
    const topDev = leaderboardData[0];
    const totalRewards = leaderboardData.reduce((sum, dev) => sum + dev.total_rewards, 0);
    
    const message = `📊 Weekly ABC DAO Leaderboard:\n\n` +
                   `🥇 @${topDev.github_username}: ${topDev.total_rewards.toLocaleString()} $ABC\n` +
                   `📈 Total distributed: ${totalRewards.toLocaleString()} $ABC\n` +
                   `👥 Active developers: ${leaderboardData.length}\n\n` +
                   `Keep building and earning! 🚀\n` +
                   `#ABCDao #Leaderboard #DeveloperRewards`;

    return await this.broadcastMessage(message);
  }

  /**
   * Post supply/token updates
   */
  async announceSupplyUpdate(supplyData) {
    const liquid = supplyData.breakdown.liquid;
    const staked = supplyData.breakdown.staked;
    
    const message = `🪙 ABC Token Supply Update:\n\n` +
                   `💧 Liquid: ${this.formatTokens(liquid.amount)} (${liquid.percentage.toFixed(1)}%)\n` +
                   `🔒 Staked: ${this.formatTokens(staked.amount)} (${staked.percentage.toFixed(1)}%)\n` +
                   `📊 Circulating: ${this.formatTokens(supplyData.circulating_supply)}\n\n` +
                   `Data updates live at abcdao.app/supply\n` +
                   `#ABCDao #TokenSupply #DeFi`;

    return await this.broadcastMessage(message);
  }

  /**
   * Broadcast message to all platforms
   */
  async broadcastMessage(message) {
    const results = {};

    // Farcaster
    try {
      if (this.neynar && this.botFid) {
        const cast = await this.neynar.publishCast(this.botFid, message);
        results.farcaster = { success: true, hash: cast.hash };
      }
    } catch (error) {
      results.farcaster = { success: false, error: error.message };
    }

    // Twitter
    try {
      if (this.twitter) {
        const tweet = await this.twitter.v2.tweet(message);
        results.twitter = { success: true, id: tweet.data.id };
      }
    } catch (error) {
      results.twitter = { success: false, error: error.message };
    }

    // Telegram
    try {
      if (this.telegram && this.telegramChannelId) {
        const telegramMsg = await this.telegram.sendMessage(this.telegramChannelId, message);
        results.telegram = { success: true, id: telegramMsg.message_id };
      }
    } catch (error) {
      results.telegram = { success: false, error: error.message };
    }

    return results;
  }

  /**
   * Setup Telegram bot commands
   */
  setupTelegramCommands() {
    if (!this.telegram) return;

    // /rewards command
    this.telegram.onText(/\/rewards(?:\s+@?(\w+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const username = match[1] || msg.from.username;
      
      try {
        // Query user rewards from database
        const rewards = await this.getUserRewards(username);
        const response = rewards ? 
          `💰 @${username} has earned ${rewards.total.toLocaleString()} $ABC tokens!\n\n` +
          `🏆 Rank: #${rewards.rank}\n` +
          `📊 This week: ${rewards.weekly.toLocaleString()} $ABC` :
          `❌ No rewards found for @${username}`;
          
        await this.telegram.sendMessage(chatId, response);
      } catch (error) {
        await this.telegram.sendMessage(chatId, '❌ Error fetching rewards data');
      }
    });

    // /leaderboard command
    this.telegram.onText(/\/leaderboard/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const leaderboard = await this.getTopDevelopers(5);
        let response = '🏆 ABC DAO Leaderboard (Top 5):\n\n';
        
        leaderboard.forEach((dev, index) => {
          const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
          response += `${medal} @${dev.github_username}: ${dev.total_rewards.toLocaleString()} $ABC\n`;
        });
        
        response += '\nKeep building and climb the ranks! 🚀';
        await this.telegram.sendMessage(chatId, response);
      } catch (error) {
        await this.telegram.sendMessage(chatId, '❌ Error fetching leaderboard');
      }
    });

    // /supply command
    this.telegram.onText(/\/supply/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const supply = await fetch('http://localhost:3001/api/stats/supply').then(r => r.json());
        const response = `🪙 ABC Token Supply:\n\n` +
                        `📊 Total: ${this.formatTokens(supply.total_supply)}\n` +
                        `💧 Liquid: ${this.formatTokens(supply.breakdown.liquid.amount)}\n` +
                        `🔒 Staked: ${this.formatTokens(supply.breakdown.staked.amount)}\n\n` +
                        `View full breakdown: abcdao.app/supply`;
                        
        await this.telegram.sendMessage(chatId, response);
      } catch (error) {
        await this.telegram.sendMessage(chatId, '❌ Error fetching supply data');
      }
    });

    console.log('📱 Telegram bot commands setup complete');
  }

  /**
   * Helper: Format token amounts
   */
  formatTokens(amount) {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1)}B`;
    } else if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M`;
    }
    return amount.toLocaleString();
  }

  /**
   * Helper: Get user rewards (placeholder - implement with your DB)
   */
  async getUserRewards(username) {
    // TODO: Implement database query
    // This would query your users/commits tables
    return null;
  }

  /**
   * Helper: Get top developers (placeholder - implement with your DB)
   */
  async getTopDevelopers(limit = 10) {
    // TODO: Implement database query
    // This would query your leaderboard
    return [];
  }
}

export default new SocialMediaService();