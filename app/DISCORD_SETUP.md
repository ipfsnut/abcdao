# Discord Integration Setup

## Required Environment Variables

Add these to your `.env` file or Railway environment variables:

```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_APPLICATION_ID=your_application_id_here
DISCORD_GUILD_ID=your_server_id_here

# Discord Channel IDs (optional - will log warnings if not set)
DISCORD_COMMITS_CHANNEL_ID=channel_id_for_commit_rewards
DISCORD_ANNOUNCEMENTS_CHANNEL_ID=channel_id_for_announcements  
DISCORD_GENERAL_CHANNEL_ID=channel_id_for_general_messages
```

## Discord Bot Setup Steps

### 1. Create Discord Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "ABC DAO Bot"
4. Save the **Application ID**

### 2. Create Bot User
1. Go to "Bot" section in your application
2. Click "Add Bot"
3. Copy the **Bot Token** (keep this secret!)
4. Enable "Message Content Intent" under "Privileged Gateway Intents"

### 3. Set Bot Permissions
In the "Bot" section, give your bot these permissions:
- Send Messages
- Use Slash Commands
- Embed Links
- Add Reactions
- Read Message History
- Use External Emojis

### 4. Invite Bot to Server
1. Go to "OAuth2" → "URL Generator"
2. Select "bot" and "applications.commands" scopes
3. Select the permissions from step 3
4. Use the generated URL to invite bot to your Discord server

### 5. Get Server and Channel IDs
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click your server → "Copy Server ID" (this is your GUILD_ID)
3. Right-click channels → "Copy Channel ID" for each channel you want to use

## Testing the Integration

1. Set all environment variables
2. Restart your backend server
3. You should see: `✅ Discord bot initialized`
4. Your bot should appear online in your Discord server
5. Try `/rewards` command in Discord to test

## Features Included

### Slash Commands
- `/rewards [username]` - Check ABC rewards
- `/leaderboard [limit]` - Show top developers  
- `/stats` - ABC DAO statistics
- `/verify` - Account linking instructions
- `/price` - $ABC token price

### Automatic Announcements
- Commit rewards (with rich embeds)
- Weekly leaderboards  
- General announcements
- All existing Farcaster/Twitter posts now also go to Discord

### Rich Discord Features
- Embedded messages with proper formatting
- Reaction emojis on reward announcements
- Color-coded embeds (green for ABC branding)
- Proper error handling

## Integration Points

Discord is now integrated into your existing social media flow:

1. **Commit Rewards**: `socialMediaService.announceCommitReward()` now posts to Discord
2. **Leaderboards**: `socialMediaService.announceWeeklyLeaderboard()` includes Discord
3. **General Announcements**: `socialMediaService.broadcastMessage()` includes Discord

No changes needed to existing webhook or reward processing code - Discord announcements happen automatically alongside Farcaster and Twitter.