import commitTagParser from './src/services/commit-tags.js';

console.log('🧪 Testing commit tag parsing...\n');

// Test cases
const testCases = [
  'fix: update database schema #silent',
  'feat: add user profiles #milestone',
  'experiment: try new algorithm #experiment #private',
  'taking a break for a few days #devoff',
  'back to coding! #devon',
  'refactor: cleanup code #priority #norew',
  'docs: update README #silent #private',
  'regular commit without tags',
  'multiple #priority tags #experiment #milestone in one commit',
  'case #SILENT #Private #DEVON test'
];

testCases.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1}: "${testCase}" ---`);
  
  const parsed = commitTagParser.parseCommitMessage(testCase);
  
  console.log('📝 Original:', parsed.originalMessage);
  console.log('🧹 Cleaned:', parsed.cleanedMessage);
  console.log('🏷️  Tags:', parsed.tags.join(', ') || 'none');
  console.log('📢 Should cast:', parsed.shouldCast);
  console.log('💰 Should reward:', parsed.shouldReward);
  console.log('🔒 Is private:', parsed.isPrivate);
  console.log('👨‍💻 Dev status change:', parsed.devStatusChange || 'none');
  console.log('⭐ Priority:', parsed.priority);
});

console.log('\n\n📚 Tag Documentation:');
console.log(commitTagParser.getHelpText());

console.log('\n✅ All tests completed!');