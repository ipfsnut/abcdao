// Test how user settings would affect cast generation
console.log('🧪 Testing User Settings Cast Customization');
console.log('═'.repeat(50));

// Sample user data
const users = [
  {
    username: 'epicdylan',
    settings: {
      commit_casts: { enabled: true, tag_me: true, include_repo_name: true, include_commit_message: true, max_message_length: 100 },
      daily_limit_casts: { enabled: true, tag_me: true, custom_message: null }
    },
    scenario: 'Default settings'
  },
  {
    username: 'braza1', 
    settings: {
      commit_casts: { enabled: true, tag_me: false, include_repo_name: true, include_commit_message: true, max_message_length: 50 },
      daily_limit_casts: { enabled: true, tag_me: true, custom_message: '🔥 Braza hit the daily coding limit!' }
    },
    scenario: 'No tagging for commits, custom daily limit message'
  },
  {
    username: 'kompreni',
    settings: {
      commit_casts: { enabled: true, tag_me: true, include_repo_name: false, include_commit_message: false, max_message_length: 100 },
      daily_limit_casts: { enabled: false, tag_me: true, custom_message: null }
    },
    scenario: 'Minimal commit info, daily limit casts disabled'
  }
];

// Test commit data
const commit = {
  repository: 'abc-dao',
  message: 'Add user settings system for cast customization - users can now control tagging preferences',
  url: 'https://github.com/ipfsnut/abc-dao/commit/abc123',
  rewardAmount: 750000
};

console.log('📝 Original Commit:');
console.log(`   Repo: ${commit.repository}`);
console.log(`   Message: ${commit.message}`);
console.log(`   Reward: ${commit.rewardAmount.toLocaleString()} $ABC\n`);

// Test each user's settings
users.forEach((user, i) => {
  console.log(`${i + 1}. Testing @${user.username} (${user.scenario}):`);
  console.log('─'.repeat(40));
  
  // Simulate cast generation logic
  const settings = user.settings;
  
  // Regular commit cast
  if (settings.commit_casts.enabled) {
    const usernameText = settings.commit_casts.tag_me ? `@${user.username}` : user.username;
    const repoText = settings.commit_casts.include_repo_name ? commit.repository : 'their repo';
    const messageText = settings.commit_casts.include_commit_message 
      ? commit.message.substring(0, settings.commit_casts.max_message_length)
      : 'some awesome code';
    const rewardText = `💰 Earned: ${commit.rewardAmount.toLocaleString()} $ABC`;
    
    const commitCast = `🚀 New commit!\n\n${usernameText} just pushed to ${repoText}:\n\n"${messageText}"\n\n${rewardText}\n\n🔗 ${commit.url}`;
    
    console.log('✅ Regular Commit Cast:');
    console.log(commitCast);
    console.log('');
  } else {
    console.log('⏭️ Regular commit casts disabled');
  }
  
  // Daily limit cast
  if (settings.daily_limit_casts.enabled) {
    const usernameText = settings.daily_limit_casts.tag_me ? `@${user.username}` : user.username;
    const rewardText = settings.daily_limit_casts.custom_message || '🔴 MAX DAILY REWARDS REACHED (10/10)';
    
    const limitCast = `🚀 New commit!\n\n${usernameText} just pushed to ${commit.repository}:\n\n"${commit.message.substring(0, 100)}"\n\n${rewardText}\n\n🔗 ${commit.url}`;
    
    console.log('🔴 Daily Limit Cast:');
    console.log(limitCast);
    console.log('');
  } else {
    console.log('⏭️ Daily limit casts disabled');
  }
  
  console.log('');
});

console.log('🎉 Settings system allows full customization!');
console.log('💡 Users can control: tagging, message length, custom text, and cast types');