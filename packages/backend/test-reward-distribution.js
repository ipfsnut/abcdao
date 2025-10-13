// Test the new weighted reward distribution
console.log('🎲 Testing New Reward Distribution');
console.log('═'.repeat(50));

// Simulate 1000 commits to see the distribution
const results = {
  baseline: 0,    // 50-60k
  bonus: 0,       // 60-100k  
  jackpot: 0,     // 100k-999k
  totalRewards: 0,
  rewards: []
};

for (let i = 0; i < 1000; i++) {
  const rand = Math.random();
  let rewardAmount;
  
  if (rand < 0.95) {
    // 95% chance: 50k-60k ABC (baseline rewards)
    rewardAmount = Math.floor(Math.random() * 10000) + 50000;
    results.baseline++;
  } else if (rand < 0.975) {
    // 2.5% chance: 60k-100k ABC (small bonus)
    rewardAmount = Math.floor(Math.random() * 40000) + 60000;
    results.bonus++;
  } else {
    // 2.5% chance: 100k-999k ABC (rare big rewards)
    rewardAmount = Math.floor(Math.random() * 899000) + 100000;
    results.jackpot++;
  }
  
  results.totalRewards += rewardAmount;
  results.rewards.push(rewardAmount);
}

// Calculate statistics
const avgReward = results.totalRewards / 1000;
const minReward = Math.min(...results.rewards);
const maxReward = Math.max(...results.rewards);

// Find some example jackpots
const jackpots = results.rewards.filter(r => r >= 100000).slice(0, 5);

console.log('📊 Distribution Results (1000 commits):');
console.log('─'.repeat(40));
console.log(`🟢 Baseline (50-60k):  ${results.baseline} commits (${(results.baseline/10).toFixed(1)}%)`);
console.log(`🟡 Bonus (60-100k):    ${results.bonus} commits (${(results.bonus/10).toFixed(1)}%)`);
console.log(`🔥 Jackpot (100k+):    ${results.jackpot} commits (${(results.jackpot/10).toFixed(1)}%)`);

console.log('\n💰 Reward Statistics:');
console.log('─'.repeat(30));
console.log(`Average per commit: ${avgReward.toLocaleString()} $ABC`);
console.log(`Total distributed: ${results.totalRewards.toLocaleString()} $ABC`);
console.log(`Min reward: ${minReward.toLocaleString()} $ABC`);
console.log(`Max reward: ${maxReward.toLocaleString()} $ABC`);

if (jackpots.length > 0) {
  console.log('\n🎰 Sample Jackpots:');
  console.log('─'.repeat(20));
  jackpots.forEach((amount, i) => {
    console.log(`${i+1}. ${amount.toLocaleString()} $ABC`);
  });
}

console.log('\n📈 Comparison to Old System:');
console.log('─'.repeat(35));
console.log(`Old average: ~525,000 $ABC per commit`);
console.log(`New average: ~${Math.round(avgReward).toLocaleString()} $ABC per commit`);
const savings = ((525000 - avgReward) / 525000) * 100;
console.log(`💡 Cost reduction: ${savings.toFixed(1)}% less expensive!`);

console.log('\n🏗️ Scaling Projection:');
console.log('─'.repeat(25));
console.log(`10 devs × 5 commits/day = 50 commits/day`);
console.log(`Old cost: ${(50 * 525000).toLocaleString()} $ABC/day`);
console.log(`New cost: ~${(50 * avgReward).toLocaleString()} $ABC/day`);
console.log(`Annual savings: ~${((50 * (525000 - avgReward)) * 365).toLocaleString()} $ABC`);

console.log('\n✅ New system is much more sustainable for scaling!');