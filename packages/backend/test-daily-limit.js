// Simulate what happens when epicdylan pushes an 11th commit
console.log('🧪 Testing Daily Limit Scenario');
console.log('═'.repeat(40));

// Current status from API: 10/10 commits today
const currentCommits = 10;
const dailyLimit = 10;

console.log(`Current commits today: ${currentCommits}`);
console.log(`Daily limit: ${dailyLimit}`);
console.log(`Limit reached: ${currentCommits >= dailyLimit ? 'YES' : 'NO'}`);

if (currentCommits >= dailyLimit) {
  console.log('\n🔴 DAILY LIMIT REACHED SCENARIO:');
  console.log('');
  
  // This is what the cast should look like
  const farcasterUsername = 'epicdylan';
  const repoName = 'abc-dao';
  const cleanMessage = 'Testing daily limit - this is the 11th commit today';
  const commitUrl = 'https://github.com/ipfsnut/abc-dao/commit/test11th';
  
  const rewardText = '🔴 MAX DAILY REWARDS REACHED (10/10)';
  
  const castText = `🚀 New commit!\n\n@${farcasterUsername} just pushed to ${repoName}:\n\n"${cleanMessage}"\n\n${rewardText}\n\n🔗 ${commitUrl}\n\n📱 Want rewards? Add our miniapp:\nfarcaster.xyz/miniapps/S1edg9PycxZP/abcdao\n\n#ABCDAO #AlwaysBeCoding`;
  
  console.log('📝 Expected Cast Content:');
  console.log('─'.repeat(30));
  console.log(castText);
  
} else {
  console.log('\n🟢 Normal reward scenario would apply');
}

console.log('\n✅ Test completed!');