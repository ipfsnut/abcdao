import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } from 'discord.js';

class DiscordBotService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.guildId = process.env.DISCORD_GUILD_ID;
    this.channelIds = {
      commits: process.env.DISCORD_COMMITS_CHANNEL_ID,
      announcements: process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID,
      general: process.env.DISCORD_GENERAL_CHANNEL_ID
    };
  }

  /**
   * Initialize Discord bot
   */
  async initialize() {
    if (!process.env.DISCORD_BOT_TOKEN) {
      console.warn('⚠️ Discord bot token not configured, skipping Discord integration');
      return;
    }

    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ]
      });

      this.setupEventHandlers();
      await this.registerSlashCommands();
      
      await this.client.login(process.env.DISCORD_BOT_TOKEN);
      
      console.log('✅ Discord bot initialized successfully');
    } catch (error) {
      console.error('❌ Discord bot initialization failed:', error);
    }
  }

  /**
   * Setup Discord event handlers
   */
  setupEventHandlers() {
    this.client.once('ready', () => {
      console.log(`🤖 Discord bot logged in as ${this.client.user.tag}`);
      this.isReady = true;
      
      // Set bot activity
      this.client.user.setActivity('Rewarding developers with $ABC', { type: 'WATCHING' });
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleSlashCommand(interaction);
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });
  }

  /**
   * Register slash commands
   */
  async registerSlashCommands() {
    if (!process.env.DISCORD_APPLICATION_ID) {
      console.warn('⚠️ Discord application ID not configured, skipping command registration');
      return;
    }

    const commands = [
      new SlashCommandBuilder()
        .setName('rewards')
        .setDescription('Check ABC DAO rewards for a user')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('GitHub username to check (leave empty for yourself)')
        ),
      
      new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the ABC DAO developer leaderboard')
        .addIntegerOption(option =>
          option.setName('limit')
            .setDescription('Number of top developers to show (default: 10)')
            .setMinValue(1)
            .setMaxValue(20)
        ),
      
      new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show ABC DAO statistics'),
      
      new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Link your Discord account to ABC DAO'),
        
      new SlashCommandBuilder()
        .setName('price')
        .setDescription('Get current $ABC token price information')
    ];

    try {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
      
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
        { body: commands }
      );
      
      console.log('✅ Discord slash commands registered');
    } catch (error) {
      console.error('❌ Failed to register Discord commands:', error);
    }
  }

  /**
   * Handle slash command interactions
   */
  async handleSlashCommand(interaction) {
    try {
      await interaction.deferReply();

      switch (interaction.commandName) {
        case 'rewards':
          await this.handleRewardsCommand(interaction);
          break;
        case 'leaderboard':
          await this.handleLeaderboardCommand(interaction);
          break;
        case 'stats':
          await this.handleStatsCommand(interaction);
          break;
        case 'verify':
          await this.handleVerifyCommand(interaction);
          break;
        case 'price':
          await this.handlePriceCommand(interaction);
          break;
        default:
          await interaction.editReply('Unknown command!');
      }
    } catch (error) {
      console.error('Error handling slash command:', error);
      await interaction.editReply('An error occurred while processing your command.');
    }
  }

  /**
   * Handle /rewards command
   */
  async handleRewardsCommand(interaction) {
    const username = interaction.options.getString('username') || interaction.user.username;
    
    try {
      // TODO: Query user rewards from database
      // For now, return placeholder
      const embed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle('💰 ABC DAO Rewards')
        .setDescription(`Rewards for @${username}`)
        .addFields(
          { name: 'Total Earned', value: '0 $ABC', inline: true },
          { name: 'This Week', value: '0 $ABC', inline: true },
          { name: 'Rank', value: 'N/A', inline: true }
        )
        .setFooter({ text: 'ABC DAO - Rewarding Open Source' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching rewards:', error);
      await interaction.editReply('❌ Error fetching rewards data');
    }
  }

  /**
   * Handle /leaderboard command
   */
  async handleLeaderboardCommand(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    
    try {
      // TODO: Query leaderboard from database
      // For now, return placeholder
      const embed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle('🏆 ABC DAO Leaderboard')
        .setDescription(`Top ${limit} developers`)
        .addFields(
          { name: '🥇 Coming Soon', value: 'Leaderboard will show top contributors', inline: false }
        )
        .setFooter({ text: 'ABC DAO - Developer Rankings' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      await interaction.editReply('❌ Error fetching leaderboard data');
    }
  }

  /**
   * Handle /stats command
   */
  async handleStatsCommand(interaction) {
    try {
      // TODO: Query stats from database/API
      const embed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle('📊 ABC DAO Statistics')
        .addFields(
          { name: '👥 Total Members', value: '0', inline: true },
          { name: '💰 Total Rewards', value: '0 $ABC', inline: true },
          { name: '📝 Total Commits', value: '0', inline: true }
        )
        .setFooter({ text: 'ABC DAO - Live Statistics' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching stats:', error);
      await interaction.editReply('❌ Error fetching statistics');
    }
  }

  /**
   * Handle /verify command
   */
  async handleVerifyCommand(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#00ff88')
      .setTitle('🔗 Link Your ABC DAO Account')
      .setDescription('Connect your Discord account to ABC DAO to track rewards and participate in the community!')
      .addFields(
        { name: '1️⃣ Visit ABC DAO', value: '[abc.epicdylan.com](https://abc.epicdylan.com)', inline: false },
        { name: '2️⃣ Connect GitHub', value: 'Link your GitHub account and join ABC DAO', inline: false },
        { name: '3️⃣ Discord Integration', value: 'Coming soon: Link Discord for personalized commands', inline: false }
      )
      .setFooter({ text: 'ABC DAO - Account Verification' });

    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * Handle /price command
   */
  async handlePriceCommand(interaction) {
    try {
      // TODO: Fetch real price data
      const embed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle('💎 $ABC Token Price')
        .addFields(
          { name: 'Current Price', value: '$0.00', inline: true },
          { name: '24h Change', value: '0%', inline: true },
          { name: 'Market Cap', value: 'N/A', inline: true }
        )
        .addFields(
          { name: '🔗 Trade $ABC', value: '[Uniswap](https://app.uniswap.org/#/swap?outputCurrency=0x5c0872b790bb73e2b3a9778db6e7704095624b07&chain=base)', inline: false }
        )
        .setFooter({ text: 'ABC DAO - Token Information' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching price:', error);
      await interaction.editReply('❌ Error fetching price data');
    }
  }

  /**
   * Send commit reward announcement to Discord
   */
  async announceCommitReward(username, amount, commitMessage, repoName, commitUrl) {
    if (!this.isReady || !this.channelIds.commits) {
      return { success: false, error: 'Discord not ready or channel not configured' };
    }

    try {
      const embed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle('🎉 New Commit Reward!')
        .setDescription(`**@${username}** earned **${amount.toLocaleString()} $ABC** tokens!`)
        .addFields(
          { name: '📝 Commit', value: commitMessage.substring(0, 1000), inline: false },
          { name: '📂 Repository', value: repoName, inline: true },
          { name: '💰 Reward', value: `${amount.toLocaleString()} $ABC`, inline: true },
          { name: '🔗 View Commit', value: `[GitHub](${commitUrl})`, inline: true }
        )
        .setFooter({ text: 'ABC DAO - Rewarding Open Source' })
        .setTimestamp();

      const channel = this.client.channels.cache.get(this.channelIds.commits);
      if (!channel) {
        throw new Error('Commits channel not found');
      }

      const message = await channel.send({ embeds: [embed] });
      
      // Add celebration reactions
      await message.react('🎉');
      await message.react('💰');
      await message.react('🚀');

      return { success: true, messageId: message.id };
    } catch (error) {
      console.error('Error announcing commit reward to Discord:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send general announcement to Discord
   */
  async sendAnnouncement(message, channelType = 'announcements') {
    if (!this.isReady) {
      return { success: false, error: 'Discord not ready' };
    }

    try {
      const channelId = this.channelIds[channelType];
      if (!channelId) {
        throw new Error(`Channel ID not configured for type: ${channelType}`);
      }

      const channel = this.client.channels.cache.get(channelId);
      if (!channel) {
        throw new Error(`Channel not found: ${channelId}`);
      }

      const sentMessage = await channel.send(message);
      return { success: true, messageId: sentMessage.id };
    } catch (error) {
      console.error('Error sending Discord announcement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send embed message to Discord
   */
  async sendEmbed(embed, channelType = 'announcements') {
    if (!this.isReady) {
      return { success: false, error: 'Discord not ready' };
    }

    try {
      const channelId = this.channelIds[channelType];
      if (!channelId) {
        throw new Error(`Channel ID not configured for type: ${channelType}`);
      }

      const channel = this.client.channels.cache.get(channelId);
      if (!channel) {
        throw new Error(`Channel not found: ${channelId}`);
      }

      const sentMessage = await channel.send({ embeds: [embed] });
      return { success: true, messageId: sentMessage.id };
    } catch (error) {
      console.error('Error sending Discord embed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create leaderboard embed
   */
  createLeaderboardEmbed(leaderboardData) {
    const embed = new EmbedBuilder()
      .setColor('#00ff88')
      .setTitle('🏆 ABC DAO Weekly Leaderboard')
      .setDescription('Top developers earning $ABC tokens')
      .setTimestamp();

    leaderboardData.slice(0, 10).forEach((dev, index) => {
      const medals = ['🥇', '🥈', '🥉'];
      const medal = medals[index] || `${index + 1}️⃣`;
      
      embed.addFields({
        name: `${medal} ${dev.github_username}`,
        value: `**${dev.total_rewards.toLocaleString()}** $ABC\n${dev.commits_count} commits`,
        inline: true
      });
    });

    return embed;
  }
}

export default new DiscordBotService();