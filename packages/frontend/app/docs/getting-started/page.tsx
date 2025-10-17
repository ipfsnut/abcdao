'use client';

import Link from 'next/link';

export default function GettingStartedPage() {
  return (
    <div className="max-w-4xl">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🚀</span>
          <h1 className="text-4xl font-bold text-white">Getting Started</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Start earning $ABC tokens for your code contributions in just a few minutes. 
          This guide walks you through the complete setup process.
        </p>
      </div>

      {/* Prerequisites */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Before You Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">GitHub Account</p>
                <p className="text-gray-400 text-sm">With repositories you want to monetize</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">Base Network Wallet</p>
                <p className="text-gray-400 text-sm">With ~0.003 ETH for membership fee + gas</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">Farcaster Account (Optional)</p>
                <p className="text-gray-400 text-sm">For reward announcements and community</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">Active Development</p>
                <p className="text-gray-400 text-sm">Regular commits to earn meaningful rewards</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <h2 className="text-2xl font-bold text-white">Connect Your GitHub Account</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Link your GitHub account to enable automatic commit tracking and repository verification.
            </p>
            
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">In the ABC DAO App:</h3>
              <ol className="space-y-2 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-mono">1.</span>
                  <span>Open ABC DAO app (via Farcaster miniapp or web)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-mono">2.</span>
                  <span>Click "Link GitHub Account" or "Connect GitHub"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-mono">3.</span>
                  <span>Authorize ABC DAO to access your public repositories</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-mono">4.</span>
                  <span>You'll see a green checkmark when successfully connected</span>
                </li>
              </ol>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <p className="text-yellow-300 text-sm">
                <strong>Note:</strong> ABC DAO only needs read access to your public repositories. 
                We never access private repositories or modify your code.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <h2 className="text-2xl font-bold text-white">Pay Membership Fee</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Pay a one-time fee of 0.002 ETH to join ABC DAO and unlock reward earning.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Payment Process:</h3>
                <ol className="space-y-2 text-gray-300 text-sm">
                  <li>1. Connect your wallet (MetaMask, Coinbase, etc.)</li>
                  <li>2. Ensure you're on Base network</li>
                  <li>3. Click "Pay 0.002 ETH to Join"</li>
                  <li>4. Confirm transaction in your wallet</li>
                  <li>5. Wait for transaction confirmation</li>
                </ol>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">What This Covers:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Reward pool funding</li>
                  <li>• Gas costs for automated distributions</li>
                  <li>• Infrastructure maintenance</li>
                  <li>• Anti-spam protection</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                <strong>Premium Option:</strong> Users with 5M+ $ABC staked can skip the membership fee entirely 
                and get unlimited repository registrations. <Link href="/docs/rewards-system" className="text-blue-400 hover:text-blue-300 underline">Learn more →</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <h2 className="text-2xl font-bold text-white">Register Your Repositories</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Register up to 3 repositories to start earning $ABC tokens for your commits.
            </p>
            
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Repository Requirements:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Must have admin access to the repository</li>
                  <li>• Repository can be public or private</li>
                  <li>• Active development (recent commits preferred)</li>
                </ul>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Substantial codebase (100+ files ideal)</li>
                  <li>• Popular programming languages get higher scores</li>
                  <li>• Community engagement (stars, forks) helps</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Registration Process:</h3>
              <ol className="space-y-2 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-mono">1.</span>
                  <span>Go to the Repository Manager in the ABC DAO app</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-mono">2.</span>
                  <span>Click "Add Repository" or "Register New Repository"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-mono">3.</span>
                  <span>Enter your repository name (format: username/repo-name)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-mono">4.</span>
                  <span>System will verify you have admin access</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-mono">5.</span>
                  <span>Repository status will show as "Pending"</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              4
            </div>
            <h2 className="text-2xl font-bold text-white">Configure Webhooks</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Set up GitHub webhooks to automatically notify ABC DAO about your commits.
            </p>
            
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Webhook Setup:</h3>
              <div className="space-y-3">
                <div className="bg-black/40 border border-gray-600 rounded p-3">
                  <p className="text-green-400 font-mono text-sm mb-2">Webhook URL:</p>
                  <code className="text-green-300 text-sm bg-black/60 px-2 py-1 rounded">
                    https://abcdao-production.up.railway.app/api/webhooks/github
                  </code>
                </div>
                
                <ol className="space-y-2 text-gray-300 text-sm">
                  <li>1. Go to your repository on GitHub</li>
                  <li>2. Navigate to Settings → Webhooks</li>
                  <li>3. Click "Add webhook"</li>
                  <li>4. Paste the webhook URL above</li>
                  <li>5. Content type: application/json</li>
                  <li>6. Events: Select "Just the push event"</li>
                  <li>7. Active: ✅ (checked)</li>
                  <li>8. Click "Add webhook"</li>
                </ol>
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <p className="text-green-300 text-sm">
                <strong>Success!</strong> Once the webhook is configured, your repository status will 
                change to "Active" and you'll start earning $ABC tokens for every commit.
              </p>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              5
            </div>
            <h2 className="text-2xl font-bold text-white">Start Earning Rewards</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Make commits to your registered repositories and automatically earn $ABC tokens.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Reward Details:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• 50k-999k $ABC per commit (random)</li>
                  <li>• Up to 10 commits per day count</li>
                  <li>• Rewards processed every 12 hours</li>
                  <li>• Claim anytime from the app</li>
                </ul>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Optimization Tips:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Use #priority or #milestone tags for 1.5x rewards</li>
                  <li>• Meaningful commits earn more consistently</li>
                  <li>• Popular repositories get higher base rewards</li>
                  <li>• Regular activity increases your score</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-2xl">💡</span>
                <div>
                  <p className="text-blue-300 font-semibold mb-2">Pro Tips for Maximum Earnings:</p>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• Connect your Farcaster account for public reward announcements</li>
                    <li>• Learn about commit tags to control reward behavior</li>
                    <li>• Consider staking 5M+ $ABC for premium benefits</li>
                    <li>• Join the community to stay updated on system changes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-12 pt-8 border-t border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/docs/repository-setup"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
          >
            <h3 className="text-white font-semibold mb-2">🔧 Repository Setup</h3>
            <p className="text-gray-400 text-sm">
              Detailed webhook configuration and troubleshooting
            </p>
          </Link>
          
          <Link
            href="/docs/rewards-system"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
          >
            <h3 className="text-white font-semibold mb-2">💰 Rewards & Tags</h3>
            <p className="text-gray-400 text-sm">
              Learn about commit tags and reward optimization
            </p>
          </Link>
          
          <Link
            href="/docs/troubleshooting"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
          >
            <h3 className="text-white font-semibold mb-2">🛠️ Troubleshooting</h3>
            <p className="text-gray-400 text-sm">
              Common issues and how to get help
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}