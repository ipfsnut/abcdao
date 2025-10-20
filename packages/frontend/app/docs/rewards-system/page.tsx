'use client';

import Link from 'next/link';

export default function RewardsSystemPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💰</span>
          <h1 className="text-4xl font-bold text-white">Rewards System</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Understanding how ABC DAO calculates rewards, treasury-aware tiers, and the economics behind developer incentives.
        </p>
      </div>

      {/* Quick Reference */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">🚀 Quick Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/40 border border-green-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-400">50k-999k $ABC</div>
            <div className="text-sm text-gray-400">Per commit reward range</div>
          </div>
          <div className="bg-black/40 border border-blue-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-400">10 commits/day</div>
            <div className="text-sm text-gray-400">Daily earning limit</div>
          </div>
          <div className="bg-black/40 border border-purple-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-400">1.5x max</div>
            <div className="text-sm text-gray-400">Milestone tag multiplier</div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Reward Calculation */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🧮 Reward Calculation System</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Treasury-Aware Adaptive Rewards</h3>
              <p className="text-gray-300 mb-4">
                ABC DAO uses a dynamic 3-tier reward system that automatically adjusts based on the protocol treasury balance to ensure long-term sustainability.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                  <h4 className="text-green-400 font-semibold mb-2">🟢 Standard Tier</h4>
                  <p className="text-gray-400 text-sm mb-2">&gt;250M $ABC in treasury</p>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Small commits: 50k-60k $ABC</li>
                    <li>• Medium commits: 75k-150k $ABC</li>
                    <li>• Large commits: 200k-1M $ABC</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-semibold mb-2">🟡 Reduced Tier</h4>
                  <p className="text-gray-400 text-sm mb-2">100-250M $ABC in treasury</p>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Small commits: 25k-30k $ABC</li>
                    <li>• Medium commits: 37.5k-75k $ABC</li>
                    <li>• Large commits: 100k-250k $ABC</li>
                  </ul>
                </div>
                
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                  <h4 className="text-red-400 font-semibold mb-2">🔴 Emergency Tier</h4>
                  <p className="text-gray-400 text-sm mb-2">&lt;100M $ABC in treasury</p>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• All commits: 1k-50k $ABC</li>
                    <li>• Maximum conservation mode</li>
                    <li>• Ensures longevity</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">🎲 Randomization Distribution</h3>
              <p className="text-gray-300 mb-3">
                Each commit reward is randomly selected within the tier range to prevent gaming while ensuring fairness:
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-400">95%</div>
                  <div className="text-sm text-gray-400">Lower range</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-400">2.5%</div>
                  <div className="text-sm text-gray-400">Mid range</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-400">2.5%</div>
                  <div className="text-sm text-gray-400">Upper range</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Commit Tags Link */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">🏷️ Want to Boost Your Rewards?</h2>
          <p className="text-gray-300 mb-4">
            Learn how to use commit tags like #priority and #milestone to multiply your rewards by up to 1.5x!
          </p>
          <Link
            href="/docs/commit-tags"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Master Commit Tags →
          </Link>
        </div>

        {/* Limits and Schedules */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📊 Limits & Processing Schedule</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-semibold mb-4">🕐 Daily Limits</h3>
              <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">•</span>
                    <span><strong>10 commits per day maximum</strong> earn rewards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">•</span>
                    <span>Resets at midnight UTC daily</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">•</span>
                    <span>Excess commits still tracked, no rewards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">•</span>
                    <span>Notification when limit reached</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">📅 Processing Schedule</h3>
              <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex justify-between">
                    <span>Immediate</span>
                    <span className="text-green-400">Commit processing</span>
                  </li>
                  <li className="flex justify-between">
                    <span>11:30 PM UTC</span>
                    <span className="text-blue-400">Clanker rewards</span>
                  </li>
                  <li className="flex justify-between">
                    <span>11:59 PM UTC</span>
                    <span className="text-purple-400">Daily leaderboard</span>
                  </li>
                  <li className="flex justify-between">
                    <span>2:00 PM UTC</span>
                    <span className="text-yellow-400">Token statistics</span>
                  </li>
                  <li className="flex justify-between">
                    <span>10:00 AM UTC</span>
                    <span className="text-cyan-400">Staking statistics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Membership and Premium */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">👑 Membership & Premium Benefits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">💳 Standard Membership</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Membership Fee</span>
                  <span className="text-green-400 font-mono">0.002 ETH</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Repository Limit</span>
                  <span className="text-blue-400">3 repositories</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Daily Commits</span>
                  <span className="text-purple-400">10 per day</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Priority Tags</span>
                  <span className="text-yellow-400">5 per week</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-700/50 rounded-lg p-4">
              <h3 className="text-yellow-300 font-semibold mb-3">⭐ Premium Staking Benefits</h3>
              <p className="text-yellow-100 text-sm mb-3">
                Stake <strong>5M+ $ABC tokens</strong> to unlock premium benefits:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-yellow-100">Unlimited repository registrations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-yellow-100">No 0.002 ETH fee for new repos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-yellow-100">Same daily/weekly limits apply</span>
                </div>
              </div>
              <Link 
                href="/staking" 
                className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-4"
              >
                Stake $ABC →
              </Link>
            </div>
          </div>
        </div>

        {/* Optimization Tips */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">💡 Optimization Strategies</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-semibold mb-3">📈 Maximize Earnings</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Commit consistently to hit the daily 10-commit limit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Use #priority and #milestone tags strategically (5 each/week)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Focus on meaningful commits rather than spam</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Register up to 3 active repositories</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Consider premium staking for unlimited repos</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-3">🎯 Best Practices</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Write clear, descriptive commit messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Save priority tags for genuinely important work</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Use #silent for minor updates to reduce noise</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Connect Farcaster for reward announcements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Monitor treasury status for reward tier awareness</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Documentation */}
        <div className="border-t border-gray-700 pt-8">
          <h3 className="text-lg font-semibold text-white mb-4">📚 Related Documentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/docs/commit-tags"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">🏷️ Commit Tags</h4>
              <p className="text-gray-400 text-sm">Master commit tags to multiply your rewards</p>
            </Link>
            
            <Link
              href="/docs/getting-started"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">🚀 Getting Started</h4>
              <p className="text-gray-400 text-sm">Complete setup guide from registration to first rewards</p>
            </Link>
            
            <Link
              href="/docs/weekly-apy-estimate"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">📊 Staking APY</h4>
              <p className="text-gray-400 text-sm">Understanding staking rewards and APY calculations</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}