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
    this.serverManager = null;
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
          // GuildMembers and GuildModeration require privileged intents
          // These need to be enabled in Discord Developer Portal
        ]
      });

      this.setupEventHandlers();
      await this.registerSlashCommands();
      
      // Login but don't wait for ready event to avoid hanging
      this.client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
        console.error('❌ Discord bot login failed:', error);
      });
      
      console.log('✅ Discord bot initialization started');
    } catch (error) {
      console.error('❌ Discord bot initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup Discord event handlers
   */
  setupEventHandlers() {
    this.client.once('ready', async () => {
      console.log(`🤖 Discord bot logged in as ${this.client.user.tag}`);
      this.isReady = true;
      
      // Initialize server manager
      try {
        const { DiscordServerManager } = await import('./discord-server-management.js');
        this.serverManager = new DiscordServerManager(this);
        console.log('✅ Discord server manager initialized');
      } catch (error) {
        console.error('❌ Failed to initialize server manager:', error);
      }
      
      // Set bot activity
      this.client.user.setActivity('Rewarding developers with $ABC', { type: 'WATCHING' });
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleSlashCommand(interaction);
    });

    this.client.on('guildMemberAdd', async (member) => {
      // Welcome new members
      if (this.serverManager) {
        await this.serverManager.welcomeNewMember(member);
      }
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
        .setDescription('Get current $ABC token price information'),
        
      new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for server management')
        .addSubcommand(subcommand =>
          subcommand
            .setName('setup')
            .setDescription('Setup Discord server structure'))
        .addSubcommand(subcommand =>
          subcommand
            .setName('info')
            .setDescription('Get server information'))
        .addSubcommand(subcommand =>
          subcommand
            .setName('backup')
            .setDescription('Backup server structure'))
        .addSubcommand(subcommand =>
          subcommand
            .setName('stats')
            .setDescription('Update server statistics'))
        .addSubcommand(subcommand =>
          subcommand
            .setName('role')
            .setDescription('Assign role to user')
            .addUserOption(option =>
              option.setName('user')
                .setDescription('User to assign role to')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('tier')
                .setDescription('Reputation tier')
                .setRequired(true)
                .addChoices(
                  { name: 'Bronze', value: 'Bronze' },
                  { name: 'Silver', value: 'Silver' },
                  { name: 'Gold', value: 'Gold' }
                )))
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
      // Handle admin commands differently (ephemeral)
      if (interaction.commandName === 'admin') {
        await interaction.deferReply({ ephemeral: true });
      } else {
        await interaction.deferReply();
      }

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
        case 'admin':
          await this.handleAdminCommand(interaction);
          break;
        default:
          await interaction.editReply('Unknown command!');
      }
    } catch (error) {
      console.error('Error handling slash command:', error);
      if (interaction.deferred) {
        await interaction.editReply('An error occurred while processing your command.');
      } else {
        await interaction.reply('An error occurred while processing your command.');
      }
    }
  }

  /**
   * Handle /rewards command
   */
  async handleRewardsCommand(interaction) {
    try {
      
      const username = interaction.options.getString('username');
      let searchUser = username;
      
      // If no username provided, try to find user by Discord ID
      if (!searchUser) {
        const discordId = interaction.user.id;
        const userByDiscord = await this.findUserByDiscordId(discordId);
        if (userByDiscord) {
          searchUser = userByDiscord.github_username || userByDiscord.display_name;
        } else {
          // Suggest linking Discord account
          const embed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle('🔗 Link Your Account First')
            .setDescription('To see your rewards, please link your Discord account to ABC DAO!')
            .addFields(
              { name: '1️⃣ Visit ABC DAO', value: '[abc.epicdylan.com](https://abc.epicdylan.com)', inline: false },
              { name: '2️⃣ Connect & Link Discord', value: 'Complete your profile setup', inline: false },
              { name: '3️⃣ Use Command', value: 'Try `/rewards` again or specify a GitHub username', inline: false }
            )
            .setFooter({ text: 'ABC DAO - Link your account to see personalized data' })
            .setTimestamp();
          
          return await interaction.editReply({ embeds: [embed] });
        }
      }

      // Look up user rewards
      const user = await this.findUserByGithubUsername(searchUser);
      
      if (!user) {
        const embed = new EmbedBuilder()
          .setColor('#ff4444')
          .setTitle('👤 User Not Found')
          .setDescription(`No ABC DAO user found with GitHub username: **${searchUser}**`)
          .addFields(
            { name: '💡 Try These', value: '• Check the spelling\\n• Use `/rewards username` with a valid GitHub username\\n• Ask the user to join ABC DAO first', inline: false },
            { name: '🔗 Join ABC DAO', value: '[abc.epicdylan.com](https://abc.epicdylan.com)', inline: false }
          )
          .setFooter({ text: 'ABC DAO - User lookup' })
          .setTimestamp();
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Calculate rank from leaderboard
      const leaderboard = await this.getLeaderboardData();
      const userRank = leaderboard.findIndex(u => u.github_username === user.github_username) + 1;
      
      // Format rewards numbers
      const formatRewards = (amount) => {
        if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M $ABC`;
        if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K $ABC`;
        return `${amount?.toLocaleString() || 0} $ABC`;
      };

      const embed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle('💰 ABC DAO Rewards')
        .setDescription(`Rewards for **${user.display_name}** (@${user.github_username})`)
        .addFields(
          { name: '💎 Total Earned', value: formatRewards(user.total_abc_earned), inline: true },
          { name: '📝 Total Commits', value: `${user.total_commits || 0}`, inline: true },
          { name: '🏆 Rank', value: userRank > 0 ? `#${userRank}` : 'Unranked', inline: true }
        )
        .addFields(
          { name: '⭐ Reputation', value: `${user.reputation_tier} (${parseFloat(user.reputation_score || 0).toFixed(1)})`, inline: true },
          { name: '🎯 Can Earn', value: user.can_earn_rewards ? '✅ Active' : '❌ Inactive', inline: true },
          { name: '🔗 Entry Via', value: user.entry_context === 'farcaster' ? '🎭 Farcaster' : '🌐 Webapp', inline: true }
        );

      // Add recent activity if available
      if (user.last_commit_at) {
        const lastCommit = new Date(user.last_commit_at);
        const daysAgo = Math.floor((Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24));
        embed.addFields(
          { name: '⏰ Last Commit', value: daysAgo === 0 ? 'Today' : `${daysAgo} days ago`, inline: false }
        );
      }

      embed.setFooter({ text: 'ABC DAO - Live from database' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error fetching rewards:', error);
      await interaction.editReply('❌ Error fetching rewards data. Please try again later.');
    }
  }

  /**
   * Handle /leaderboard command
   */
  async handleLeaderboardCommand(interaction) {
    try {
      
      const limit = interaction.options.getInteger('limit') || 10;
      const maxLimit = Math.min(limit, 20); // Cap at 20 for Discord embed limits
      
      const leaderboard = await this.getLeaderboardData(maxLimit);
      
      if (!leaderboard || leaderboard.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#ffaa00')
          .setTitle('🏆 ABC DAO Leaderboard')
          .setDescription('No developers found yet. Be the first to earn $ABC rewards!')
          .addFields(
            { name: '🚀 Get Started', value: '[Join ABC DAO](https://abc.epicdylan.com) and start earning!', inline: false }
          )
          .setFooter({ text: 'ABC DAO - Developer Rankings' })
          .setTimestamp();
        
        return await interaction.editReply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle('🏆 ABC DAO Developer Leaderboard')
        .setDescription(`Top ${maxLimit} developers earning $ABC tokens`)
        .setTimestamp();

      // Format leaderboard entries
      leaderboard.forEach((dev, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = medals[index] || `${index + 1}️⃣`;
        
        // Format rewards
        const formatRewards = (amount) => {
          if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M`;
          if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K`;
          return `${amount?.toLocaleString() || 0}`;
        };

        const name = `${medal} ${dev.display_name}`;
        const rewards = formatRewards(dev.total_abc_earned);
        const commits = dev.total_commits || 0;
        const tier = dev.reputation_tier || 'Bronze';
        
        let value = `**${rewards} $ABC** • ${commits} commits`;
        if (dev.github_username) {
          value += `\\n[GitHub](https://github.com/${dev.github_username})`;
        }
        if (tier !== 'Bronze') {
          value += ` • ${tier}`;
        }
        
        embed.addFields({
          name: name,
          value: value,
          inline: true
        });
      });

      // Add summary stats
      const totalRewards = leaderboard.reduce((sum, dev) => sum + (parseFloat(dev.total_abc_earned) || 0), 0);
      const totalCommits = leaderboard.reduce((sum, dev) => sum + (dev.total_commits || 0), 0);
      
      const formatNumber = (num) => {
        if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
        return num.toLocaleString();
      };

      embed.addFields({
        name: '📊 Leaderboard Stats',
        value: `💰 **${formatNumber(totalRewards)} $ABC** total distributed\\n📝 **${formatNumber(totalCommits)}** commits by top ${maxLimit}`,
        inline: false
      });

      embed.setFooter({ text: 'ABC DAO - Live developer rankings' });

      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      await interaction.editReply('❌ Error fetching leaderboard data. Please try again later.');
    }
  }

  /**
   * Fetch real ABC DAO statistics from the API
   */
  async fetchABCStats() {
    const baseUrl = process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app';
    
    try {
      const response = await fetch(`${baseUrl}/api/users/stats`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const stats = await response.json();
      
      // Validate required data exists
      if (typeof stats.totalDevelopers !== 'number' || 
          typeof stats.totalCommits !== 'number' || 
          typeof stats.totalRewards !== 'number') {
        throw new Error('Invalid data format received from API');
      }
      
      return {
        totalDevelopers: stats.totalDevelopers,
        totalCommits: stats.totalCommits,
        totalRewards: stats.totalRewards
      };
    } catch (error) {
      console.error('Error fetching ABC stats:', error);
      throw new Error(`Unable to fetch stats: ${error.message}`);
    }
  }

  /**
   * Handle /stats command
   */
  async handleStatsCommand(interaction) {
    try {
      
      const stats = await this.fetchABCStats();
      
      // Format large numbers
      const formatNumber = (num) => {
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toLocaleString();
      };

      // Format rewards with $ABC suffix
      const formatRewards = (rewards) => {
        if (rewards >= 1e6) return `${(rewards / 1e6).toFixed(1)}M $ABC`;
        if (rewards >= 1e3) return `${(rewards / 1e3).toFixed(1)}K $ABC`;
        return `${rewards.toLocaleString()} $ABC`;
      };

      const embed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle('📊 ABC DAO Live Statistics')
        .setDescription('*Real-time data from the database*')
        .addFields(
          { name: '👥 Total Developers', value: formatNumber(stats.totalDevelopers), inline: true },
          { name: '📝 Total Commits', value: formatNumber(stats.totalCommits), inline: true },
          { name: '💰 Rewards Distributed', value: formatRewards(stats.totalRewards), inline: true }
        );

      // Add additional calculated metrics if we have data
      if (stats.totalDevelopers > 0 && stats.totalCommits > 0) {
        const avgCommitsPerDev = (stats.totalCommits / stats.totalDevelopers).toFixed(1);
        const avgRewardPerCommit = (stats.totalRewards / stats.totalCommits).toFixed(0);
        
        embed.addFields(
          { name: '📈 Avg Commits/Dev', value: avgCommitsPerDev, inline: true },
          { name: '🎯 Avg Reward/Commit', value: `${avgRewardPerCommit} $ABC`, inline: true },
          { name: '🚀 Always Be Coding', value: '24/7 automation', inline: true }
        );
      }

      embed.addFields(
        { name: '🔗 Join ABC DAO', value: '[abc.epicdylan.com](https://abc.epicdylan.com)', inline: false }
      )
      .setFooter({ text: 'ABC DAO • Live from database' })
      .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error in stats command:', error);
      
      // Provide specific error message based on error type
      let errorMessage = '❌ **Statistics Unavailable**\n\n';
      
      if (error.message.includes('API returned')) {
        errorMessage += '🔧 **Backend API Error**\nThe ABC DAO backend is experiencing issues. Please try again in a few minutes.';
      } else if (error.message.includes('Invalid data format')) {
        errorMessage += '📊 **Data Format Error**\nReceived invalid data from the backend. The development team has been notified.';
      } else if (error.message.includes('fetch')) {
        errorMessage += '🌐 **Network Error**\nUnable to connect to ABC DAO servers. Please check your connection and try again.';
      } else {
        errorMessage += '⚠️ **Unknown Error**\nSomething went wrong while fetching statistics. Please try again later.';
      }
      
      errorMessage += '\n\n🔗 **ABC DAO Status**: [abc.epicdylan.com](https://abc.epicdylan.com)';
      
      await interaction.editReply(errorMessage);
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
   * Handle /admin command
   */
  async handleAdminCommand(interaction) {
    try {

      // Check if user has admin permissions
      const member = interaction.member;
      const isAdmin = member.permissions.has('Administrator') || 
                     member.roles.cache.some(role => ['ABC Founder', 'Core Developer'].includes(role.name));

      if (!isAdmin) {
        return await interaction.editReply('❌ You need admin permissions to use this command.');
      }

      if (!this.serverManager) {
        return await interaction.editReply('❌ Server manager not initialized. Try again in a moment.');
      }

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'setup':
          await interaction.editReply('🏗️ Setting up Discord server structure...');
          try {
            await this.serverManager.setupServerStructure();
            await interaction.editReply('✅ **Server Setup Complete!**\\n\\nServer structure has been created with:\\n• Roles and permissions\\n• Channel categories\\n• Welcome system\\n• Automated notifications');
          } catch (error) {
            await interaction.editReply(`❌ Setup failed: ${error.message}`);
          }
          break;

        case 'info':
          try {
            const info = await this.serverManager.getServerInfo();
            const embed = new EmbedBuilder()
              .setColor('#00ff88')
              .setTitle('📊 Discord Server Information')
              .addFields(
                { name: '🏛️ Server Name', value: info.name, inline: true },
                { name: '👥 Members', value: info.memberCount.toString(), inline: true },
                { name: '📺 Total Channels', value: info.channels.toString(), inline: true },
                { name: '📝 Text Channels', value: info.textChannels.toString(), inline: true },
                { name: '🎤 Voice Channels', value: info.voiceChannels.toString(), inline: true },
                { name: '📂 Categories', value: info.categories.toString(), inline: true },
                { name: '🎭 Roles', value: info.roles.toString(), inline: true },
                { name: '🤖 Bot Status', value: this.isReady ? '✅ Ready' : '❌ Not Ready', inline: true }
              )
              .setFooter({ text: 'ABC DAO Server Management' })
              .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
          } catch (error) {
            await interaction.editReply(`❌ Failed to get server info: ${error.message}`);
          }
          break;

        case 'backup':
          try {
            await interaction.editReply('💾 Creating server backup...');
            const backup = await this.serverManager.backupServerStructure();
            
            if (backup) {
              // Save backup to file system or database
              const fs = await import('fs/promises');
              const backupPath = `/tmp/discord-backup-${Date.now()}.json`;
              await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
              
              await interaction.editReply(`✅ **Backup Created!**\\n\\nBackup saved with:\\n• ${backup.roles.length} roles\\n• ${backup.channels.length} channels\\n• Full permission structure\\n\\nTimestamp: ${backup.timestamp}`);
            } else {
              await interaction.editReply('❌ Failed to create backup');
            }
          } catch (error) {
            await interaction.editReply(`❌ Backup failed: ${error.message}`);
          }
          break;

        case 'stats':
          try {
            await interaction.editReply('📊 Updating server statistics...');
            const success = await this.serverManager.updateServerStats();
            
            if (success) {
              await interaction.editReply('✅ **Statistics Updated!**\\n\\nThe #📊-stats channel has been updated with live platform data.');
            } else {
              await interaction.editReply('❌ Failed to update statistics. Make sure the stats channel exists.');
            }
          } catch (error) {
            await interaction.editReply(`❌ Stats update failed: ${error.message}`);
          }
          break;

        case 'role':
          try {
            const user = interaction.options.getUser('user');
            const tier = interaction.options.getString('tier');
            
            await interaction.editReply(`🎭 Assigning ${tier} tier role to ${user.tag}...`);
            
            const success = await this.serverManager.assignReputationRole(user.id, tier);
            
            if (success) {
              await interaction.editReply(`✅ **Role Assigned!**\\n\\n${user.tag} has been assigned the **${tier} Tier** role.`);
            } else {
              await interaction.editReply(`❌ Failed to assign role to ${user.tag}. Make sure they are in the server and the role exists.`);
            }
          } catch (error) {
            await interaction.editReply(`❌ Role assignment failed: ${error.message}`);
          }
          break;

        default:
          await interaction.editReply('❌ Unknown admin subcommand.');
      }

    } catch (error) {
      console.error('Error in admin command:', error);
      await interaction.editReply('❌ An error occurred while processing the admin command.');
    }
  }

  /**
   * Fetch real $ABC token price data
   */
  async fetchABCPriceData() {
    const ABC_CONTRACT = '0x5c0872b790bb73e2b3a9778db6e7704095624b07';
    
    try {
      // Try DEXScreener API first (free, no key required)
      const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ABC_CONTRACT}`);
      
      if (dexResponse.ok) {
        const dexData = await dexResponse.json();
        
        if (dexData.pairs && dexData.pairs.length > 0) {
          // Get the most liquid pair (highest volume)
          const bestPair = dexData.pairs.sort((a, b) => parseFloat(b.volume?.h24 || 0) - parseFloat(a.volume?.h24 || 0))[0];
          
          return {
            price: parseFloat(bestPair.priceUsd) || 0,
            priceChangePercent: parseFloat(bestPair.priceChange?.h24) || 0,
            marketCap: parseFloat(bestPair.marketCap) || 0,
            volume24h: parseFloat(bestPair.volume?.h24) || 0,
            liquidity: parseFloat(bestPair.liquidity?.usd) || 0,
            pairAddress: bestPair.pairAddress,
            dexName: bestPair.dexId
          };
        }
      }

      // Fallback: Direct blockchain query for basic token data
      const { ethers } = await import('ethers');
      const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
      
      const erc20Abi = [
        'function totalSupply() view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function balanceOf(address) view returns (uint256)'
      ];
      
      const contract = new ethers.Contract(ABC_CONTRACT, erc20Abi, provider);
      const [totalSupply, decimals] = await Promise.all([
        contract.totalSupply(),
        contract.decimals()
      ]);
      
      const formattedSupply = ethers.formatUnits(totalSupply, decimals);
      
      return {
        price: 0,
        priceChangePercent: 0,
        marketCap: 0,
        volume24h: 0,
        liquidity: 0,
        totalSupply: formattedSupply,
        fallbackData: true
      };
      
    } catch (error) {
      console.error('Error fetching ABC price data:', error);
      throw error;
    }
  }

  /**
   * Handle /price command
   */
  async handlePriceCommand(interaction) {
    try {
      
      const priceData = await this.fetchABCPriceData();

      // Format price with appropriate decimal places for micro-cap
      const formatPrice = (price) => {
        if (price === 0) return '0';
        
        // For extremely small numbers, use scientific notation
        if (price < 0.0000001) {
          return price.toExponential(2); // e.g., "1.23e-8"
        } else if (price < 0.000001) {
          return price.toFixed(10); // 10 decimal places for very small prices
        } else if (price < 0.01) {
          return price.toFixed(6);
        } else {
          return price.toFixed(4);
        }
      };

      // Format large numbers with appropriate suffixes
      const formatNumber = (num) => {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
      };

      // Format market cap with $ symbol
      const formatMarketCap = (marketCap) => {
        if (marketCap < 1000) {
          return `$${marketCap.toFixed(0)}`;
        }
        return `$${formatNumber(marketCap)}`;
      };

      // Price change emoji and formatting
      const changeEmoji = priceData.priceChangePercent >= 0 ? '📈' : '📉';
      const changeColor = priceData.priceChangePercent >= 0 ? '+' : '';
      const changeFormatted = `${changeEmoji} ${changeColor}${priceData.priceChangePercent.toFixed(2)}%`;

      let embed;
      
      if (priceData.fallbackData) {
        // Fallback embed when price data unavailable
        embed = new EmbedBuilder()
          .setColor('#ffaa00')
          .setTitle('💎 $ABC Token Info')
          .setDescription('*Clanker token on Base blockchain*')
          .addFields(
            { name: '💰 Price', value: 'No trading data', inline: true },
            { name: '🪙 Total Supply', value: `${formatNumber(parseFloat(priceData.totalSupply))}`, inline: true },
            { name: '⚠️ Status', value: 'Limited liquidity', inline: true }
          )
          .addFields(
            { name: '🔗 Trade $ABC', value: '[Uniswap V3](https://app.uniswap.org/#/swap?outputCurrency=0x5c0872b790bb73e2b3a9778db6e7704095624b07&chain=base) | [Clanker](https://clanker.world/clanker/0x5c0872b790bb73e2b3a9778db6e7704095624b07)', inline: false }
          )
          .setFooter({ text: 'ABC DAO • Always Be Coding • Data from blockchain' })
          .setTimestamp();
      } else {
        // Full embed with price data
        embed = new EmbedBuilder()
          .setColor(priceData.priceChangePercent >= 0 ? '#00ff88' : '#ff4444')
          .setTitle('💎 $ABC Token Price')
          .setDescription(`*Trading on ${priceData.dexName || 'DEX'} • Base blockchain*`)
          .addFields(
            { name: '💰 Price', value: priceData.price > 0 ? `$${formatPrice(priceData.price)}` : 'No price data', inline: true },
            { name: '📊 24h Change', value: changeFormatted, inline: true },
            { name: '🏦 Market Cap', value: formatMarketCap(priceData.marketCap), inline: true }
          )
          .addFields(
            { name: '📈 Volume (24h)', value: priceData.volume24h > 0 ? `$${formatNumber(priceData.volume24h)}` : 'No volume', inline: true },
            { name: '💧 Liquidity', value: priceData.liquidity > 0 ? `$${formatNumber(priceData.liquidity)}` : 'No data', inline: true },
            { name: '🪙 Supply', value: priceData.totalSupply ? formatNumber(parseFloat(priceData.totalSupply)) : '100B', inline: true }
          )
          .addFields(
            { name: '🔗 Trade $ABC', value: '[Uniswap V3](https://app.uniswap.org/#/swap?outputCurrency=0x5c0872b790bb73e2b3a9778db6e7704095624b07&chain=base) | [Clanker](https://clanker.world/clanker/0x5c0872b790bb73e2b3a9778db6e7704095624b07)', inline: false }
          )
          .setFooter({ text: `ABC DAO • Always Be Coding • Data from ${priceData.dexName || 'DEXScreener'}` })
          .setTimestamp();
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching price:', error);
      await interaction.editReply('❌ Error fetching price data. Try again later.');
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
   * Find user by Discord ID
   */
  async findUserByDiscordId(discordId) {
    try {
      const { initializeDatabase, getPool } = await import('../services/database.js');
      await initializeDatabase();
      const pool = getPool();
      
      const result = await pool.query(
        'SELECT * FROM users WHERE discord_id = $1',
        [discordId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by Discord ID:', error);
      return null;
    }
  }

  /**
   * Find user by GitHub username
   */
  async findUserByGithubUsername(username) {
    try {
      const { initializeDatabase } = await import('../services/database.js');
      const { WalletUser } = await import('../models/WalletUser.js');
      
      await initializeDatabase();
      return await WalletUser.findByGithubUsername(username);
    } catch (error) {
      console.error('Error finding user by GitHub username:', error);
      return null;
    }
  }

  /**
   * Get leaderboard data from database
   */
  async getLeaderboardData(limit = 10) {
    try {
      const { initializeDatabase } = await import('../services/database.js');
      const { WalletUser } = await import('../models/WalletUser.js');
      
      await initializeDatabase();
      return await WalletUser.getLeaderboard(limit);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      return [];
    }
  }

  /**
   * Create leaderboard embed (legacy method - kept for backwards compatibility)
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