'use client';

import Link from 'next/link';

export default function TroubleshootingPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🛠️</span>
          <h1 className="text-4xl font-bold text-white">Troubleshooting & Support</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Common issues, step-by-step solutions, and support resources for ABC DAO users and developers.
        </p>
      </div>

      {/* Quick Help */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">🆘 Need Immediate Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="https://warpcast.com/abc-dao-dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🐦</div>
              <h3 className="text-white font-semibold">Farcaster</h3>
              <p className="text-gray-400 text-sm">@abc-dao-dev for quick help</p>
            </div>
          </a>
          <a 
            href="https://github.com/ABC-DAO/abc-dao/issues" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🐛</div>
              <h3 className="text-white font-semibold">GitHub Issues</h3>
              <p className="text-gray-400 text-sm">Report bugs and technical issues</p>
            </div>
          </a>
          <a 
            href="https://discord.gg/HK62WQWJ" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="text-white font-semibold">Discord</h3>
              <p className="text-gray-400 text-sm">Community support and chat</p>
            </div>
          </a>
        </div>
      </div>

      <div className="space-y-8">
        {/* Common Setup Issues */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🔧 Common Setup Issues</h2>
          
          <div className="space-y-6">
            {/* Membership Payment */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">💳 Membership Payment Problems</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="text-red-400 font-medium mb-2">❌ "Payment verification failed"</h4>
                  <p className="text-gray-300 text-sm mb-2">Your payment may not have been processed correctly.</p>
                  <div className="bg-black/40 rounded p-3">
                    <p className="text-green-400 text-sm font-semibold">Solutions:</p>
                    <ul className="text-gray-300 text-sm mt-1 space-y-1">
                      <li>• Check that you paid exactly 0.002 ETH to the protocol wallet</li>
                      <li>• Ensure you're on Base network</li>
                      <li>• Wait 2-3 minutes for blockchain confirmation</li>
                      <li>• Try refreshing the page</li>
                      <li>• Verify payment went to: <code className="bg-black/60 px-1 rounded text-xs">0xBE6525b767cA8D38d169C93C8120c0C0957388B8</code></li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="text-yellow-400 font-medium mb-2">⚠️ "Membership already paid! Please refresh the page"</h4>
                  <p className="text-gray-300 text-sm mb-2">You may have multiple payment attempts or a race condition.</p>
                  <div className="bg-black/40 rounded p-3">
                    <p className="text-green-400 text-sm font-semibold">Solutions:</p>
                    <ul className="text-gray-300 text-sm mt-1 space-y-1">
                      <li>• Refresh the page and check your status</li>
                      <li>• Do not attempt another payment</li>
                      <li>• Wait a few minutes for the system to sync</li>
                      <li>• Contact support if status doesn't update</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-blue-400 font-medium mb-2">ℹ️ "Please connect your wallet first"</h4>
                  <p className="text-gray-300 text-sm mb-2">Wallet connection required for payment processing.</p>
                  <div className="bg-black/40 rounded p-3">
                    <p className="text-green-400 text-sm font-semibold">Solutions:</p>
                    <ul className="text-gray-300 text-sm mt-1 space-y-1">
                      <li>• Connect your wallet using the wallet connect button</li>
                      <li>• Switch to Base network if prompted</li>
                      <li>• Try refreshing if wallet doesn't appear connected</li>
                      <li>• Use MetaMask, Coinbase Wallet, or other compatible wallets</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* GitHub Integration */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">🐙 GitHub Integration Issues</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="text-red-400 font-medium mb-2">❌ "GitHub linking failed"</h4>
                  <p className="text-gray-300 text-sm mb-2">OAuth process encountered an error.</p>
                  <div className="bg-black/40 rounded p-3">
                    <p className="text-green-400 text-sm font-semibold">Solutions:</p>
                    <ul className="text-gray-300 text-sm mt-1 space-y-1">
                      <li>• Clear browser cache and cookies</li>
                      <li>• Try linking again from a fresh browser session</li>
                      <li>• Ensure you accept all permissions during GitHub OAuth</li>
                      <li>• Check if you're logged into the correct GitHub account</li>
                      <li>• Try from a different browser or incognito mode</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="text-yellow-400 font-medium mb-2">⚠️ Webhook Configuration Problems</h4>
                  <p className="text-gray-300 text-sm mb-2">Repository webhooks not working correctly.</p>
                  <div className="bg-black/40 rounded p-3">
                    <p className="text-green-400 text-sm font-semibold">Required Settings:</p>
                    <ul className="text-gray-300 text-sm mt-1 space-y-1">
                      <li>• URL: <code className="bg-black/60 px-1 rounded text-xs">https://abcdao-production.up.railway.app/api/webhooks/github</code></li>
                      <li>• Content type: <code className="bg-black/60 px-1 rounded text-xs">application/json</code></li>
                      <li>• Events: Select "Just the push event"</li>
                      <li>• Active: ✅ (must be checked)</li>
                      <li>• Use the webhook secret provided in ABC DAO interface</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-blue-400 font-medium mb-2">ℹ️ "Repository not registered or webhook not configured"</h4>
                  <p className="text-gray-300 text-sm mb-2">Commits aren't being tracked for rewards.</p>
                  <div className="bg-black/40 rounded p-3">
                    <p className="text-green-400 text-sm font-semibold">Checklist:</p>
                    <ul className="text-gray-300 text-sm mt-1 space-y-1">
                      <li>• Register repository in ABC DAO interface first</li>
                      <li>• Configure webhook in GitHub repository settings</li>
                      <li>• Mark webhook as configured in ABC DAO</li>
                      <li>• Test with a small commit to verify tracking</li>
                      <li>• Ensure you have admin access to the repository</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Reward System */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">💰 Reward System Issues</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="text-yellow-400 font-medium mb-2">⚠️ Commits Not Receiving Rewards</h4>
                  <p className="text-gray-300 text-sm mb-2">Your commits aren't generating $ABC tokens.</p>
                  <div className="bg-black/40 rounded p-3">
                    <p className="text-green-400 text-sm font-semibold">Common Causes:</p>
                    <ul className="text-gray-300 text-sm mt-1 space-y-1">
                      <li>• Repository not registered with ABC DAO</li>
                      <li>• Webhook not properly configured</li>
                      <li>• Daily limit reached (10 commits per day)</li>
                      <li>• Used #norew tag in commit message</li>
                      <li>• Membership fee not paid</li>
                      <li>• Commit to private repository without proper setup</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-blue-400 font-medium mb-2">ℹ️ Daily/Weekly Limits</h4>
                  <p className="text-gray-300 text-sm mb-2">Understanding reward limitations.</p>
                  <div className="bg-black/40 rounded p-3">
                    <p className="text-green-400 text-sm font-semibold">Limits:</p>
                    <ul className="text-gray-300 text-sm mt-1 space-y-1">
                      <li>• <strong>10 commits per day</strong> earn rewards (resets at midnight UTC)</li>
                      <li>• <strong>5 priority tags per week</strong> (#priority or #milestone)</li>
                      <li>• <strong>3 repositories maximum</strong> for standard users</li>
                      <li>• <strong>Unlimited repositories</strong> for 5M+ ABC stakers</li>
                      <li>• Priority tags reset Monday to Monday</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="text-green-400 font-medium mb-2">✅ Expected Reward Ranges</h4>
                  <p className="text-gray-300 text-sm mb-2">Normal reward distribution.</p>
                  <div className="bg-black/40 rounded p-3">
                    <p className="text-green-400 text-sm font-semibold">Reward Tiers:</p>
                    <ul className="text-gray-300 text-sm mt-1 space-y-1">
                      <li>• <strong>95% of commits:</strong> 50k-60k $ABC</li>
                      <li>• <strong>2.5% of commits:</strong> 60k-100k $ABC</li>
                      <li>• <strong>2.5% of commits:</strong> 100k-999k $ABC (jackpot)</li>
                      <li>• <strong>Priority multiplier:</strong> 1.5x base reward</li>
                      <li>• <strong>Milestone multiplier:</strong> 1.5x base reward</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Issues */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">⚙️ Technical Issues</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">🌐 Network & Connection Issues</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-yellow-400 font-medium mb-2">API Timeouts</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Check system status: <Link href="/api/system-health/overview" className="text-blue-400 hover:text-blue-300">System Health</Link></li>
                    <li>• Wait a few minutes and retry</li>
                    <li>• Clear browser cache</li>
                    <li>• Try from different device/network</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-medium mb-2">Wallet Connection Issues</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Ensure you're on Base network</li>
                    <li>• Try different wallet (MetaMask, Coinbase)</li>
                    <li>• Clear wallet cache/reset connection</li>
                    <li>• Check wallet browser extension is updated</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">📊 Data Sync Issues</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-yellow-400 font-medium mb-2">Staking Data Not Updating</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Wait 2-3 block confirmations</li>
                    <li>• Refresh the page</li>
                    <li>• Check blockchain transaction status</li>
                    <li>• Data updates every 30 seconds</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-medium mb-2">Leaderboard/Stats Outdated</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Leaderboards update daily at 11:59 PM UTC</li>
                    <li>• Real-time data may have 5-10 minute delay</li>
                    <li>• Check <Link href="/api/system-health/overview" className="text-blue-400 hover:text-blue-300">system health</Link> for issues</li>
                    <li>• Contact support if data is &gt;24 hours old</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">❓ Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Why can't I register more than 3 repositories?</h3>
              <p className="text-gray-300 text-sm">
                Standard users are limited to 3 repositories to prevent spam. Users who stake 5M+ $ABC tokens get unlimited repository registrations. 
                <Link href="/staking" className="text-blue-400 hover:text-blue-300 ml-1">Learn about staking →</Link>
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">How long does it take to receive rewards?</h3>
              <p className="text-gray-300 text-sm">
                Rewards are processed immediately when commits are pushed. However, they appear as "PENDING" until the daily blockchain processing occurs, 
                typically within 12-24 hours. You can claim rewards anytime from your dashboard.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Can I use ABC DAO with private repositories?</h3>
              <p className="text-gray-300 text-sm">
                Yes! ABC DAO works with both public and private repositories. You just need to have admin access to configure the webhook. 
                Private repositories are processed the same way as public ones for rewards.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">What if I make a mistake with the membership payment?</h3>
              <p className="text-gray-300 text-sm">
                If you send the wrong amount or to the wrong address, contact support immediately with your transaction hash. 
                Manual recovery may be possible, but it's easier to send exactly 0.002 ETH to the protocol wallet address shown in the interface.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">How do commit tags work?</h3>
              <p className="text-gray-300 text-sm">
                Add tags like #priority or #milestone to your commit messages for reward multipliers. Tags are case-insensitive and can be placed anywhere in the message. 
                <Link href="/docs/rewards-system" className="text-blue-400 hover:text-blue-300 ml-1">See full tag documentation →</Link>
              </p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📊 System Status & Diagnostics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-semibold mb-3">🏥 Health Checks</h3>
              <div className="space-y-2">
                <a href="/health" target="_blank" className="block bg-gray-900/50 border border-gray-600 rounded p-3 hover:border-gray-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Main System Health</span>
                    <span className="text-green-400 text-xs">Check Status →</span>
                  </div>
                </a>
                <a href="/api/system-health/overview" target="_blank" className="block bg-gray-900/50 border border-gray-600 rounded p-3 hover:border-gray-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Detailed Health Overview</span>
                    <span className="text-green-400 text-xs">Check Status →</span>
                  </div>
                </a>
                <a href="/api/treasury/health" target="_blank" className="block bg-gray-900/50 border border-gray-600 rounded p-3 hover:border-gray-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Treasury System Health</span>
                    <span className="text-green-400 text-xs">Check Status →</span>
                  </div>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">🔍 Diagnostic Tools</h3>
              <div className="space-y-2">
                <a href="/api/treasury-tiers/status" target="_blank" className="block bg-gray-900/50 border border-gray-600 rounded p-3 hover:border-gray-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Current Reward Tier</span>
                    <span className="text-blue-400 text-xs">Check →</span>
                  </div>
                </a>
                <a href="/api/users/stats" target="_blank" className="block bg-gray-900/50 border border-gray-600 rounded p-3 hover:border-gray-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">User Statistics</span>
                    <span className="text-blue-400 text-xs">Check →</span>
                  </div>
                </a>
                <a href="/api/staking/overview" target="_blank" className="block bg-gray-900/50 border border-gray-600 rounded p-3 hover:border-gray-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Staking Overview</span>
                    <span className="text-blue-400 text-xs">Check →</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Support */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📞 Support Escalation</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-blue-300 font-semibold mb-3">🔄 Self-Help (Try First)</h3>
                <ol className="text-gray-300 text-sm space-y-2">
                  <li>1. Check this troubleshooting guide</li>
                  <li>2. Verify system health status</li>
                  <li>3. Try basic solutions (refresh, wait, retry)</li>
                  <li>4. Check your browser console for errors</li>
                  <li>5. Try from different browser/device</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-blue-300 font-semibold mb-3">🤝 Community Support</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>• <a href="https://discord.gg/HK62WQWJ" target="_blank" className="text-blue-400 hover:text-blue-300">Discord server</a> for community help</li>
                  <li>• <a href="https://warpcast.com/abc-dao-dev" target="_blank" className="text-blue-400 hover:text-blue-300">Farcaster @abc-dao-dev</a> for questions</li>
                  <li>• Search existing <a href="https://github.com/ABC-DAO/abc-dao/issues" target="_blank" className="text-blue-400 hover:text-blue-300">GitHub issues</a></li>
                  <li>• Ask in ABC DAO community channels</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-blue-300 font-semibold mb-3">🎯 Direct Support (For Technical Issues)</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">📧</span>
                  <div>
                    <p className="text-white font-medium">GitHub Issues</p>
                    <p className="text-gray-400 text-sm">Create a detailed issue report with steps to reproduce</p>
                    <a href="https://github.com/ABC-DAO/abc-dao/issues/new" target="_blank" className="text-blue-400 hover:text-blue-300 text-sm">Create New Issue →</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">🐦</span>
                  <div>
                    <p className="text-white font-medium">Farcaster Direct Message</p>
                    <p className="text-gray-400 text-sm">For urgent issues or partnership inquiries</p>
                    <a href="https://warpcast.com/abc-dao-dev" target="_blank" className="text-blue-400 hover:text-blue-300 text-sm">Contact @abc-dao-dev →</a>
                  </div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3 mt-4">
                  <p className="text-yellow-200 text-sm">
                    <strong>When contacting support, please include:</strong>
                  </p>
                  <ul className="text-yellow-100 text-sm mt-1 space-y-1">
                    <li>• Your wallet address or Farcaster ID</li>
                    <li>• Exact error message or description of issue</li>
                    <li>• Steps you took before the issue occurred</li>
                    <li>• Browser/device information</li>
                    <li>• Transaction hashes (if payment related)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Documentation */}
        <div className="border-t border-gray-700 pt-8">
          <h3 className="text-lg font-semibold text-white mb-4">📚 Related Documentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/docs/getting-started"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">🚀 Getting Started</h4>
              <p className="text-gray-400 text-sm">Complete setup guide from account to first rewards</p>
            </Link>
            
            <Link
              href="/docs/rewards-system"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">💰 Rewards System</h4>
              <p className="text-gray-400 text-sm">Understanding reward calculations and commit tags</p>
            </Link>
            
            <Link
              href="/docs/api-reference"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">⚙️ API Reference</h4>
              <p className="text-gray-400 text-sm">Technical integration and endpoint documentation</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}