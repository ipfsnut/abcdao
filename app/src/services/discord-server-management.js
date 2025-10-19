import { ChannelType, PermissionFlagsBits, OverwriteType } from 'discord.js';

/**
 * Discord Server Management Service
 * Programmatically manage ABC DAO Discord server structure, channels, roles, and permissions
 */
export class DiscordServerManager {
  constructor(discordBot) {
    this.bot = discordBot;
    this.client = discordBot.client;
    this.guildId = process.env.DISCORD_GUILD_ID;
  }

  /**
   * Get the ABC DAO Discord guild/server
   */
  async getGuild() {
    if (!this.client || !this.client.isReady()) {
      throw new Error('Discord bot is not ready');
    }
    
    const guild = await this.client.guilds.fetch(this.guildId);
    if (!guild) {
      throw new Error('ABC DAO Discord server not found');
    }
    
    return guild;
  }

  // ============================================================================
  // CHANNEL MANAGEMENT
  // ============================================================================

  /**
   * Create or update ABC DAO server structure
   */
  async setupServerStructure() {
    console.log('🏗️ Setting up ABC DAO Discord server structure...');
    
    const guild = await this.getGuild();
    
    try {
      // Create roles first (needed for channel permissions)
      await this.setupRoles(guild);
      
      // Create channel categories and channels
      await this.setupChannelStructure(guild);
      
      // Set up welcome and verification system
      await this.setupWelcomeSystem(guild);
      
      console.log('✅ ABC DAO Discord server structure setup complete!');
      
    } catch (error) {
      console.error('❌ Server setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup server roles and permissions
   */
  async setupRoles(guild) {
    console.log('👥 Setting up Discord roles...');
    
    const rolesToCreate = [
      {
        name: 'ABC Founder',
        color: '#FFD700', // Gold
        permissions: [PermissionFlagsBits.Administrator],
        hoist: true,
        mentionable: true
      },
      {
        name: 'Core Developer',
        color: '#00FF88', // ABC Green
        permissions: [
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.MentionEveryone
        ],
        hoist: true,
        mentionable: true
      },
      {
        name: 'Gold Tier',
        color: '#FFD700',
        permissions: [PermissionFlagsBits.CreatePublicThreads],
        hoist: true,
        mentionable: true
      },
      {
        name: 'Silver Tier',
        color: '#C0C0C0',
        permissions: [PermissionFlagsBits.CreatePublicThreads],
        hoist: true,
        mentionable: true
      },
      {
        name: 'Bronze Tier',
        color: '#CD7F32',
        permissions: [],
        hoist: true,
        mentionable: true
      },
      {
        name: 'ABC Member',
        color: '#0099FF',
        permissions: [],
        hoist: false,
        mentionable: true
      },
      {
        name: 'Verified Developer',
        color: '#4CAF50',
        permissions: [PermissionFlagsBits.UseExternalEmojis],
        hoist: false,
        mentionable: true
      },
      {
        name: 'Bug Hunter',
        color: '#FF6B6B',
        permissions: [],
        hoist: false,
        mentionable: true
      },
      {
        name: 'Community Helper',
        color: '#9C27B0',
        permissions: [PermissionFlagsBits.ManageMessages],
        hoist: false,
        mentionable: true
      }
    ];

    for (const roleData of rolesToCreate) {
      try {
        // Check if role already exists
        let role = guild.roles.cache.find(r => r.name === roleData.name);
        
        if (!role) {
          role = await guild.roles.create({
            name: roleData.name,
            color: roleData.color,
            permissions: roleData.permissions,
            hoist: roleData.hoist,
            mentionable: roleData.mentionable,
            reason: 'ABC DAO server setup'
          });
          console.log(`✅ Created role: ${roleData.name}`);
        } else {
          // Update existing role
          await role.edit({
            color: roleData.color,
            permissions: roleData.permissions,
            hoist: roleData.hoist,
            mentionable: roleData.mentionable
          });
          console.log(`🔄 Updated role: ${roleData.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create/update role ${roleData.name}:`, error);
      }
    }
  }

  /**
   * Setup channel structure
   */
  async setupChannelStructure(guild) {
    console.log('📺 Setting up Discord channels...');
    
    const channelStructure = [
      {
        category: '🏛️ ABC DAO HQ',
        channels: [
          { name: '📢-announcements', type: ChannelType.GuildText, description: 'Official ABC DAO announcements' },
          { name: '📋-rules', type: ChannelType.GuildText, description: 'Server rules and guidelines' },
          { name: '🎯-roadmap', type: ChannelType.GuildText, description: 'ABC DAO development roadmap' },
          { name: '📊-stats', type: ChannelType.GuildText, description: 'Live platform statistics' }
        ]
      },
      {
        category: '💬 Community',
        channels: [
          { name: '👋-welcome', type: ChannelType.GuildText, description: 'Welcome new members' },
          { name: '💭-general', type: ChannelType.GuildText, description: 'General community discussion' },
          { name: '🎮-off-topic', type: ChannelType.GuildText, description: 'Non-ABC DAO chat' },
          { name: '🤝-intros', type: ChannelType.GuildText, description: 'Introduce yourself' },
          { name: '❓-support', type: ChannelType.GuildText, description: 'Get help with ABC DAO' }
        ]
      },
      {
        category: '🔨 Development',
        channels: [
          { name: '💻-dev-chat', type: ChannelType.GuildText, description: 'Development discussion' },
          { name: '🔄-commits', type: ChannelType.GuildText, description: 'GitHub commit notifications' },
          { name: '🐛-bug-reports', type: ChannelType.GuildText, description: 'Report bugs and issues' },
          { name: '💡-feature-requests', type: ChannelType.GuildText, description: 'Suggest new features' },
          { name: '📚-resources', type: ChannelType.GuildText, description: 'Development resources and guides' }
        ]
      },
      {
        category: '💰 Rewards & Trading',
        channels: [
          { name: '🎉-rewards', type: ChannelType.GuildText, description: 'Reward announcements' },
          { name: '📈-price-talk', type: ChannelType.GuildText, description: '$ABC price discussion' },
          { name: '💹-trading', type: ChannelType.GuildText, description: 'Trading discussion and alerts' },
          { name: '🏆-leaderboard', type: ChannelType.GuildText, description: 'Developer rankings' }
        ]
      },
      {
        category: '🎤 Voice Channels',
        channels: [
          { name: '🎙️-community-call', type: ChannelType.GuildVoice, description: 'Main community voice channel' },
          { name: '👥-dev-standup', type: ChannelType.GuildVoice, description: 'Developer standups' },
          { name: '🎵-music-lounge', type: ChannelType.GuildVoice, description: 'Music while coding' },
          { name: '🔇-focus-room', type: ChannelType.GuildVoice, description: 'Silent co-working space' }
        ]
      },
      {
        category: '⚙️ Bot Commands',
        channels: [
          { name: '🤖-bot-commands', type: ChannelType.GuildText, description: 'Use ABC DAO bot commands here' },
          { name: '🔗-verify', type: ChannelType.GuildText, description: 'Link your accounts' }
        ]
      },
      {
        category: '🔒 VIP (Gold+ Tier)',
        channels: [
          { name: '👑-vip-lounge', type: ChannelType.GuildText, description: 'Gold+ tier exclusive chat' },
          { name: '🔮-alpha-previews', type: ChannelType.GuildText, description: 'Early access to new features' },
          { name: '🎤-vip-voice', type: ChannelType.GuildVoice, description: 'VIP voice channel' }
        ],
        permissions: 'Gold Tier'
      }
    ];

    for (const categoryData of channelStructure) {
      try {
        // Create or get category
        let category = guild.channels.cache.find(c => 
          c.type === ChannelType.GuildCategory && c.name === categoryData.category
        );
        
        if (!category) {
          category = await guild.channels.create({
            name: categoryData.category,
            type: ChannelType.GuildCategory,
            reason: 'ABC DAO server setup'
          });
          console.log(`✅ Created category: ${categoryData.category}`);
        }

        // Set up category permissions if specified
        if (categoryData.permissions) {
          const role = guild.roles.cache.find(r => r.name === categoryData.permissions);
          if (role) {
            await category.permissionOverwrites.create(guild.roles.everyone, {
              ViewChannel: false
            });
            await category.permissionOverwrites.create(role, {
              ViewChannel: true
            });
          }
        }

        // Create channels in category
        for (const channelData of categoryData.channels) {
          let channel = guild.channels.cache.find(c => c.name === channelData.name);
          
          if (!channel) {
            channel = await guild.channels.create({
              name: channelData.name,
              type: channelData.type,
              parent: category.id,
              topic: channelData.description,
              reason: 'ABC DAO server setup'
            });
            console.log(`✅ Created channel: ${channelData.name}`);
          }

          // Set special permissions for specific channels
          await this.setChannelPermissions(channel, channelData.name, guild);
        }
        
      } catch (error) {
        console.error(`❌ Failed to create category/channels for ${categoryData.category}:`, error);
      }
    }
  }

  /**
   * Set specific channel permissions
   */
  async setChannelPermissions(channel, channelName, guild) {
    const everyoneRole = guild.roles.everyone;
    const memberRole = guild.roles.cache.find(r => r.name === 'ABC Member');
    const verifiedRole = guild.roles.cache.find(r => r.name === 'Verified Developer');

    try {
      switch (channelName) {
        case '📢-announcements':
          // Only allow admins and core devs to post
          await channel.permissionOverwrites.create(everyoneRole, {
            SendMessages: false,
            AddReactions: true
          });
          break;

        case '📋-rules':
          // Read-only for everyone
          await channel.permissionOverwrites.create(everyoneRole, {
            SendMessages: false,
            AddReactions: true
          });
          break;

        case '🔄-commits':
          // Bot-only posting
          await channel.permissionOverwrites.create(everyoneRole, {
            SendMessages: false,
            AddReactions: true
          });
          break;

        case '🤖-bot-commands':
          // Require verification to use bot commands
          if (verifiedRole) {
            await channel.permissionOverwrites.create(everyoneRole, {
              SendMessages: false
            });
            await channel.permissionOverwrites.create(verifiedRole, {
              SendMessages: true
            });
          }
          break;

        case '🔗-verify':
          // Allow everyone to verify
          await channel.permissionOverwrites.create(everyoneRole, {
            SendMessages: true
          });
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to set permissions for ${channelName}:`, error);
    }
  }

  /**
   * Setup welcome system and verification
   */
  async setupWelcomeSystem(guild) {
    console.log('👋 Setting up welcome system...');
    
    const welcomeChannel = guild.channels.cache.find(c => c.name === '👋-welcome');
    const rulesChannel = guild.channels.cache.find(c => c.name === '📋-rules');
    
    if (welcomeChannel && rulesChannel) {
      // Create welcome message
      const welcomeEmbed = {
        color: 0x00FF88,
        title: '🎉 Welcome to ABC DAO!',
        description: `Welcome to the **Always Be Coding DAO** Discord server!
        
**🚀 What is ABC DAO?**
ABC DAO rewards developers with $ABC tokens for contributing to open source projects. Every commit earns you rewards!

**📋 Get Started:**
1. Read the rules in ${rulesChannel}
2. Introduce yourself in <#intros>
3. Link your GitHub account at [abc.epicdylan.com](https://abc.epicdylan.com)
4. Start earning $ABC for your commits!

**🤖 Bot Commands:**
• \`/rewards\` - Check your earnings
• \`/leaderboard\` - See top developers  
• \`/stats\` - Platform statistics
• \`/verify\` - Link your accounts

**💎 Reputation Tiers:**
🥉 Bronze → 🥈 Silver → 🥇 Gold

Happy coding! 💻✨`,
        fields: [
          {
            name: '🔗 Important Links',
            value: `• [ABC DAO Platform](https://abc.epicdylan.com)
• [GitHub](https://github.com/ipfsnut/abcdao)
• [Documentation](https://abc.epicdylan.com/docs)`,
            inline: false
          }
        ],
        footer: {
          text: 'ABC DAO • Always Be Coding'
        },
        timestamp: new Date().toISOString()
      };

      try {
        // Clear existing messages and post welcome
        const messages = await welcomeChannel.messages.fetch({ limit: 10 });
        const botMessages = messages.filter(m => m.author.bot);
        
        if (botMessages.size === 0) {
          await welcomeChannel.send({ embeds: [welcomeEmbed] });
          console.log('✅ Welcome message posted');
        }
      } catch (error) {
        console.error('❌ Failed to setup welcome message:', error);
      }
    }
  }

  // ============================================================================
  // MEMBER MANAGEMENT
  // ============================================================================

  /**
   * Assign role based on ABC DAO reputation tier
   */
  async assignReputationRole(userId, reputationTier) {
    try {
      const guild = await this.getGuild();
      const member = await guild.members.fetch(userId);
      
      // Remove existing tier roles
      const tierRoles = ['Bronze Tier', 'Silver Tier', 'Gold Tier'];
      for (const roleName of tierRoles) {
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (role && member.roles.cache.has(role.id)) {
          await member.roles.remove(role);
        }
      }

      // Add new tier role
      const newRole = guild.roles.cache.find(r => r.name === `${reputationTier} Tier`);
      if (newRole) {
        await member.roles.add(newRole);
        console.log(`✅ Assigned ${reputationTier} Tier role to ${member.user.tag}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to assign reputation role:', error);
      return false;
    }
  }

  /**
   * Welcome new member with role assignment
   */
  async welcomeNewMember(member) {
    try {
      // Assign basic member role
      const memberRole = member.guild.roles.cache.find(r => r.name === 'ABC Member');
      if (memberRole) {
        await member.roles.add(memberRole);
      }

      // Send welcome DM
      const welcomeDM = `🎉 **Welcome to ABC DAO, ${member.user.username}!**

Thanks for joining our developer community! Here's how to get started:

**🔗 Connect Your Accounts:**
1. Visit https://abc.epicdylan.com
2. Connect your wallet and GitHub account
3. Start earning $ABC tokens for your commits!

**🤖 Try Our Bot Commands:**
• \`/rewards\` - Check your earnings
• \`/leaderboard\` - See top developers
• \`/verify\` - Link Discord to your ABC DAO account

**💬 Join the Conversation:**
Check out <#general> for community discussion and <#dev-chat> for development talk.

Happy coding! 💻✨

*ABC DAO Team*`;

      try {
        await member.send(welcomeDM);
      } catch (dmError) {
        console.log('Could not send welcome DM (user has DMs disabled)');
      }

      console.log(`👋 Welcomed new member: ${member.user.tag}`);
      
    } catch (error) {
      console.error('❌ Failed to welcome new member:', error);
    }
  }

  // ============================================================================
  // AUTOMATED NOTIFICATIONS
  // ============================================================================

  /**
   * Post commit reward notification to Discord
   */
  async announceCommitReward(rewardData) {
    try {
      const guild = await this.getGuild();
      const rewardsChannel = guild.channels.cache.find(c => c.name === '🎉-rewards');
      
      if (!rewardsChannel) {
        console.warn('Rewards channel not found');
        return false;
      }

      const embed = {
        color: 0x00FF88,
        title: '🎉 New Commit Reward!',
        description: `**@${rewardData.username}** earned **${rewardData.amount.toLocaleString()} $ABC** tokens!`,
        fields: [
          {
            name: '📝 Commit',
            value: rewardData.commitMessage.substring(0, 1000),
            inline: false
          },
          {
            name: '📂 Repository',
            value: rewardData.repoName,
            inline: true
          },
          {
            name: '💰 Reward',
            value: `${rewardData.amount.toLocaleString()} $ABC`,
            inline: true
          },
          {
            name: '🔗 View Commit',
            value: `[GitHub](${rewardData.commitUrl})`,
            inline: true
          }
        ],
        footer: {
          text: 'ABC DAO - Rewarding Open Source'
        },
        timestamp: new Date().toISOString()
      };

      const message = await rewardsChannel.send({ embeds: [embed] });
      
      // Add celebration reactions
      await message.react('🎉');
      await message.react('💰');
      await message.react('🚀');

      return { success: true, messageId: message.id };
      
    } catch (error) {
      console.error('❌ Failed to announce commit reward:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update server stats in stats channel
   */
  async updateServerStats() {
    try {
      const guild = await this.getGuild();
      const statsChannel = guild.channels.cache.find(c => c.name === '📊-stats');
      
      if (!statsChannel) return false;

      // Get latest stats from database
      const { WalletUser } = await import('../models/WalletUser.js');
      const stats = await WalletUser.getMembershipStats();

      const embed = {
        color: 0x00FF88,
        title: '📊 ABC DAO Live Statistics',
        description: 'Real-time platform metrics updated every hour',
        fields: [
          {
            name: '👥 Total Members',
            value: stats.total_users,
            inline: true
          },
          {
            name: '💰 Active Earners',
            value: stats.earning_members,
            inline: true
          },
          {
            name: '🎭 Farcaster Users',
            value: stats.farcaster_users,
            inline: true
          },
          {
            name: '🌐 Webapp Users',
            value: stats.webapp_users,
            inline: true
          },
          {
            name: '💵 Total Revenue',
            value: `${parseFloat(stats.total_revenue || 0).toFixed(3)} ETH`,
            inline: true
          },
          {
            name: '⭐ Avg Reputation',
            value: parseFloat(stats.avg_reputation || 0).toFixed(1),
            inline: true
          }
        ],
        footer: {
          text: 'Last updated'
        },
        timestamp: new Date().toISOString()
      };

      // Clear previous stats and post new ones
      const messages = await statsChannel.messages.fetch({ limit: 5 });
      const botMessages = messages.filter(m => m.author.bot);
      
      for (const msg of botMessages.values()) {
        try {
          await msg.delete();
        } catch (e) {
          // Ignore deletion errors
        }
      }

      await statsChannel.send({ embeds: [embed] });
      console.log('✅ Server stats updated');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to update server stats:', error);
      return false;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get server information and structure
   */
  async getServerInfo() {
    try {
      const guild = await this.getGuild();
      
      return {
        name: guild.name,
        memberCount: guild.memberCount,
        channels: guild.channels.cache.size,
        roles: guild.roles.cache.size,
        categories: guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size,
        textChannels: guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size,
        voiceChannels: guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size
      };
    } catch (error) {
      console.error('❌ Failed to get server info:', error);
      return null;
    }
  }

  /**
   * Backup server structure
   */
  async backupServerStructure() {
    try {
      const guild = await this.getGuild();
      
      const backup = {
        timestamp: new Date().toISOString(),
        guild: {
          name: guild.name,
          id: guild.id
        },
        roles: guild.roles.cache.map(role => ({
          name: role.name,
          color: role.color,
          permissions: role.permissions.toArray(),
          hoist: role.hoist,
          mentionable: role.mentionable
        })),
        channels: guild.channels.cache.map(channel => ({
          name: channel.name,
          type: channel.type,
          parent: channel.parent?.name,
          topic: channel.topic,
          permissions: channel.permissionOverwrites.cache.map(overwrite => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: overwrite.allow.toArray(),
            deny: overwrite.deny.toArray()
          }))
        }))
      };

      return backup;
    } catch (error) {
      console.error('❌ Failed to backup server structure:', error);
      return null;
    }
  }
}

export default DiscordServerManager;