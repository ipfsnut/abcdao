'use client';

import { ContractAddressesFooter } from '@/components/contract-addresses-footer';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/abc-logo.png" 
                alt="ABC Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold matrix-glow">
                  {'>'} ABC_DAO/support
                </h1>
                <p className="text-xs text-green-600">
                  Get help with ABC DAO rewards
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/docs"
                className="bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                           text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs
                           transition-all duration-200 matrix-button"
              >
                📚 Docs
              </a>
              <a
                href="/"
                className="bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                           text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-mono text-sm
                           transition-all duration-200 matrix-button"
              >
                ← Back to App
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-8 max-w-4xl mx-auto">
        {/* Quick Help */}
        <div className="bg-green-950/20 border border-green-900/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-4 font-mono">
            {'>'} Quick Help
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/docs#troubleshooting"
              className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200 text-center"
            >
              <div className="text-2xl mb-2">🛠️</div>
              <h3 className="text-green-400 font-mono font-semibold mb-2">Troubleshooting</h3>
              <p className="text-green-600 text-sm">Common issues and solutions</p>
            </a>
            <a
              href="/docs#getting-started"
              className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200 text-center"
            >
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="text-green-400 font-mono font-semibold mb-2">Getting Started</h3>
              <p className="text-green-600 text-sm">Setup guide for new users</p>
            </a>
            <a
              href="/docs#reward-system"
              className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200 text-center"
            >
              <div className="text-2xl mb-2">💰</div>
              <h3 className="text-green-400 font-mono font-semibold mb-2">Reward System</h3>
              <p className="text-green-600 text-sm">How rewards work</p>
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3 font-mono">I committed but didn't get rewards</h3>
              <div className="space-y-3 text-green-300 text-sm">
                <p className="font-mono">Check these common issues:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Membership status: Have you paid the 0.002 ETH membership fee?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Account linking: Is your GitHub account connected to your Farcaster profile?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Daily limit: Have you reached the 10 commits per day limit?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Commit tags: Did your commit message include #norew tag?</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3 font-mono">My reward amount seems wrong</h3>
              <div className="space-y-3 text-green-300 text-sm">
                <p className="font-mono">Rewards are distributed randomly within these ranges:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>95% chance: 50,000-60,000 $ABC</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>2.5% chance: 60,000-100,000 $ABC</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>2.5% chance: 100,000-999,000 $ABC (rare big rewards)</span>
                  </li>
                </ul>
                <p className="font-mono mt-3">Priority tags (#high, #milestone) provide 1.5x multipliers but have weekly limits.</p>
              </div>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3 font-mono">I can't claim my rewards</h3>
              <div className="space-y-3 text-green-300 text-sm">
                <p className="font-mono">Reward claiming process:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Rewards are processed in batches every 12 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Your wallet address must be connected to your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>You need ETH for gas fees on the Base network</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Check the "Rewards" tab in the main app to see claimable balance</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3 font-mono">GitHub App installation issues</h3>
              <div className="space-y-3 text-green-300 text-sm">
                <p className="font-mono">Installation checklist:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Repository permissions: Ensure the app has access to your repositories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Webhook configuration: Check that webhooks are properly configured</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Organization settings: For org repos, admin approval may be required</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3 font-mono">How do I join ABC DAO?</h3>
              <div className="space-y-3 text-green-300 text-sm">
                <p className="font-mono">Step-by-step onboarding:</p>
                <ol className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">1.</span>
                    <span>Connect your wallet (Rainbow, MetaMask, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">2.</span>
                    <span>Connect your Farcaster account for social verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">3.</span>
                    <span>Link your GitHub account for commit tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">4.</span>
                    <span>Pay 0.002 ETH membership fee to join the reward pool</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">5.</span>
                    <span>Install ABC DAO GitHub App on your repositories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">6.</span>
                    <span>Start coding and earning $ABC tokens!</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Contact Support
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Technical Issues</h3>
              <p className="text-green-300 font-mono text-sm mb-4">
                For bugs, errors, or technical problems with the ABC DAO system:
              </p>
              <a
                href="https://github.com/ABC-DAO/abc-dao/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                           text-green-400 hover:text-green-300 px-4 py-3 rounded-lg font-mono text-sm text-center
                           transition-all duration-200 matrix-button"
              >
                🐛 Report on GitHub Issues
              </a>
              <p className="text-green-600 font-mono text-xs mt-3">
                Please include: your Farcaster username, GitHub username, and a detailed description of the issue.
              </p>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">General Questions</h3>
              <p className="text-green-300 font-mono text-sm mb-4">
                For general questions about ABC DAO, rewards, or partnerships:
              </p>
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-green-400 font-mono text-sm mb-1">Message us on Farcaster:</p>
                  <p className="text-green-300 font-mono text-lg matrix-glow">@abc-dao-dev</p>
                </div>
                <div className="text-center">
                  <p className="text-green-600 font-mono text-xs">
                    For development-related questions:
                  </p>
                  <p className="text-green-400 font-mono text-sm">@abc-dao-commits</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Additional Resources
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/docs"
              className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200"
            >
              <h3 className="text-green-400 font-mono font-semibold mb-2">📚 Full Documentation</h3>
              <p className="text-green-600 text-sm">Complete guides and API reference</p>
            </a>
            <a
              href="/whitepaper"
              className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200"
            >
              <h3 className="text-green-400 font-mono font-semibold mb-2">📋 Whitepaper</h3>
              <p className="text-green-600 text-sm">Technical details and tokenomics</p>
            </a>
            <a
              href="/roster"
              className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200"
            >
              <h3 className="text-green-400 font-mono font-semibold mb-2">👥 Developer Roster</h3>
              <p className="text-green-600 text-sm">See all ABC DAO contributors</p>
            </a>
          </div>
        </section>

        {/* Status Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} System Status
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2 matrix-glow"></div>
                <h3 className="text-green-400 font-mono font-semibold mb-1">Reward System</h3>
                <p className="text-green-600 text-xs">Operational</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2 matrix-glow"></div>
                <h3 className="text-green-400 font-mono font-semibold mb-1">GitHub Integration</h3>
                <p className="text-green-600 text-xs">Operational</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2 matrix-glow"></div>
                <h3 className="text-green-400 font-mono font-semibold mb-1">Farcaster Bots</h3>
                <p className="text-green-600 text-xs">Operational</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <ContractAddressesFooter />
    </div>
  );
}