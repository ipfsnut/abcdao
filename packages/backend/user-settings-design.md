# ABC DAO User Settings System

## Cast Notification Preferences

### Database Schema Addition
```sql
-- Add notification settings to users table
ALTER TABLE users ADD COLUMN notification_settings JSONB DEFAULT '{
  "commit_casts": {
    "enabled": true,
    "tag_me": true,
    "include_repo_name": true,
    "include_commit_message": true,
    "max_message_length": 100
  },
  "daily_limit_casts": {
    "enabled": true,
    "tag_me": true,
    "custom_message": null
  },
  "welcome_casts": {
    "enabled": true,
    "tag_me": true,
    "custom_message": null
  },
  "privacy": {
    "show_github_username": true,
    "show_real_name": false
  }
}';
```

### User Settings Options

#### 1. **Commit Celebration Casts**
- ✅ `enabled` - Receive casts for commits (default: true)
- ✅ `tag_me` - Tag my @username in casts (default: true)
- ✅ `include_repo_name` - Show repository name (default: true)
- ✅ `include_commit_message` - Show commit message (default: true)
- ✅ `max_message_length` - Truncate commit message length (default: 100)

#### 2. **Daily Limit Casts**
- ✅ `enabled` - Receive casts when hitting daily limit (default: true)
- ✅ `tag_me` - Tag me in daily limit casts (default: true)
- ✅ `custom_message` - Custom message instead of "MAX DAILY REWARDS REACHED" (optional)

#### 3. **Welcome Casts**
- ✅ `enabled` - Receive welcome cast when joining (default: true)
- ✅ `tag_me` - Tag me in welcome cast (default: true)
- ✅ `custom_message` - Custom welcome message (optional)

#### 4. **Privacy Settings**
- ✅ `show_github_username` - Display GitHub username in casts (default: true)
- ✅ `show_real_name` - Use real name if available (default: false)

### API Endpoints

#### GET /api/users/:fid/settings
```json
{
  "notification_settings": {
    "commit_casts": {
      "enabled": true,
      "tag_me": true,
      "include_repo_name": true,
      "include_commit_message": true,
      "max_message_length": 100
    },
    "daily_limit_casts": {
      "enabled": true,
      "tag_me": true,
      "custom_message": "🔥 Dylan's on fire today! Max rewards earned!"
    },
    "welcome_casts": {
      "enabled": true,
      "tag_me": true,
      "custom_message": null
    },
    "privacy": {
      "show_github_username": true,
      "show_real_name": false
    }
  }
}
```

#### PUT /api/users/:fid/settings
```json
{
  "notification_settings": {
    "commit_casts": {
      "tag_me": false,
      "max_message_length": 50
    },
    "daily_limit_casts": {
      "custom_message": "🎯 Hit my daily coding target!"
    }
  }
}
```

### Frontend Implementation

#### Mini-App Settings Tab
```typescript
// New tab: ./settings
{activeTab === 'settings' && <UserSettingsPanel />}
```

#### Settings UI Components
- **Toggle switches** for enable/disable options
- **Checkbox** for tagging preferences
- **Text inputs** for custom messages
- **Slider** for message length limits
- **Preview** showing how casts would look

### Cast Logic Updates

#### Updated Cast Templates
```javascript
// Respect user settings when creating casts
function createCommitCast(user, commit, settings) {
  const tagText = settings.tag_me ? `@${user.farcaster_username}` : user.farcaster_username;
  const repoText = settings.include_repo_name ? commit.repository : 'their repo';
  const messageText = settings.include_commit_message 
    ? commit.message.substring(0, settings.max_message_length) 
    : 'some awesome code';
  
  return `🚀 New commit!\n\n${tagText} just pushed to ${repoText}:\n\n"${messageText}"\n\n💰 Earned: ${rewardAmount} $ABC`;
}

function createDailyLimitCast(user, commit, settings) {
  const tagText = settings.tag_me ? `@${user.farcaster_username}` : user.farcaster_username;
  const limitText = settings.custom_message || '🔴 MAX DAILY REWARDS REACHED (10/10)';
  
  return `🚀 New commit!\n\n${tagText} just pushed to ${commit.repository}:\n\n"${commit.message}"\n\n${limitText}`;
}
```

## Implementation Priority

### Phase 1: Basic Settings
1. Add `notification_settings` column to users table
2. Create GET/PUT endpoints for settings
3. Update cast logic to check `enabled` flags
4. Add basic settings UI in mini-app

### Phase 2: Tagging Preferences
1. Implement `tag_me` preference in cast templates
2. Add toggle in settings UI
3. Test with existing users

### Phase 3: Custom Messages
1. Implement custom message support
2. Add text input fields in UI
3. Add message preview functionality

### Phase 4: Privacy Controls
1. Implement privacy settings
2. Add advanced settings section
3. Add bulk settings management

## Default Behavior
- **New users**: All notifications enabled, tagging enabled
- **Existing users**: Migrate with current behavior (all enabled)
- **Opt-out friendly**: Easy to disable any notification type