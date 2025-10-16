import type { Metadata } from "next";
import { ContractAddressesFooter } from '@/components/contract-addresses-footer';
import { WhitepaperButton } from '@/components/whitepaper-button';
import { RepositoryIntegrationButton } from '@/components/repository-integration-button';
import { generatePageMetadata } from '@/lib/metadata';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = generatePageMetadata({
  title: "Documentation",
  description: "Complete guide to ABC DAO - setup, rewards, GitHub integration, and API reference for developers.",
  path: "/docs"
});

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/abc-logo.png" 
                alt="ABC Logo" 
                className="w-10 h-10 object-contain"
                width={40}
                height={40}
              />
              <div>
                <h1 className="text-xl font-bold matrix-glow">
                  {'>'} ABC_DAO/docs
                </h1>
                <p className="text-xs text-green-600">
                  Developer documentation and guides
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                         text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-mono text-sm
                         transition-all duration-200 matrix-button"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-8 max-w-4xl mx-auto">
        {/* Quick Links */}
        <div className="bg-green-950/20 border border-green-900/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-4 font-mono">
            {'>'} Quick Start
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <WhitepaperButton />
              <RepositoryIntegrationButton />
            </div>
            <div className="space-y-3">
              <a
                href="https://app.uniswap.org/#/swap?outputCurrency=0x5c0872b790bb73e2b3a9778db6e7704095624b07&chain=base"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                           text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-mono text-sm text-center
                           transition-all duration-200 matrix-button"
              >
                🔄 Get $ABC on Uniswap
              </a>
              <a
                href="https://www.nounspace.com/t/base/0x5c0872b790bb73e2b3a9778db6e7704095624b07/Profile"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-blue-900/30 hover:bg-blue-800/40 border border-blue-700/50 hover:border-blue-600/70 
                           text-blue-400 hover:text-blue-300 px-4 py-2 rounded-lg font-mono text-sm text-center
                           transition-all duration-200 matrix-button"
              >
                💬 Join Community Chat
              </a>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-green-400 matrix-glow mb-4 font-mono">
            {'>'} Documentation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="#mission-statement" className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200">
              <h3 className="text-green-400 font-mono font-semibold mb-2">🎯 Mission Statement</h3>
              <p className="text-green-600 text-sm">Our vision and goals for the ecosystem</p>
            </a>
            <a href="#getting-started" className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200">
              <h3 className="text-green-400 font-mono font-semibold mb-2">🚀 Getting Started</h3>
              <p className="text-green-600 text-sm">Set up your account and start earning</p>
            </a>
            <a href="#github-app" className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200">
              <h3 className="text-green-400 font-mono font-semibold mb-2">📱 GitHub App</h3>
              <p className="text-green-600 text-sm">Install and configure the ABC DAO app</p>
            </a>
            <a href="#reward-system" className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200">
              <h3 className="text-green-400 font-mono font-semibold mb-2">💰 Reward System</h3>
              <p className="text-green-600 text-sm">How rewards work and optimization tips</p>
            </a>
            <a href="#farcaster-integration" className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200">
              <h3 className="text-green-400 font-mono font-semibold mb-2">🤝 Farcaster Integration</h3>
              <p className="text-green-600 text-sm">Connect your Farcaster account</p>
            </a>
            <a href="#troubleshooting" className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200">
              <h3 className="text-green-400 font-mono font-semibold mb-2">🛠️ Troubleshooting</h3>
              <p className="text-green-600 text-sm">Common issues and solutions</p>
            </a>
            <a href="#api-reference" className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200">
              <h3 className="text-green-400 font-mono font-semibold mb-2">⚙️ API Reference</h3>
              <p className="text-green-600 text-sm">Integration guide for developers</p>
            </a>
          </div>
        </div>

        {/* Mission Statement Section */}
        <section id="mission-statement" className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Mission Statement
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 mb-6">
            <h3 className="text-2xl font-bold text-green-400 matrix-glow mb-4 text-center">
              Always Be Coding
            </h3>
            <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-6 mb-6">
              <p className="text-green-300 font-mono text-sm leading-relaxed">
                ABC DAO exists to <strong>incentivize collaboration in the Farcaster ecosystem using appcoins</strong> by creating direct economic rewards for developers who ship code and contribute to decentralized social applications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-black/40 border border-green-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-mono font-semibold mb-3 flex items-center gap-2">
                  <span>🚀</span> Always Be Coding
                </h4>
                <p className="text-green-600 text-sm">Ship code, earn tokens. The blockchain doesn&apos;t care about your resume—it cares about your contributions.</p>
              </div>
              <div className="bg-black/40 border border-green-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-mono font-semibold mb-3 flex items-center gap-2">
                  <span>💰</span> Direct Economic Incentives
                </h4>
                <p className="text-green-600 text-sm">Every meaningful contribution deserves immediate financial recognition through $ABC token rewards.</p>
              </div>
              <div className="bg-black/40 border border-green-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-mono font-semibold mb-3 flex items-center gap-2">
                  <span>🤖</span> Automated & Transparent
                </h4>
                <p className="text-green-600 text-sm">No gatekeepers, no subjective evaluations—just code and rewards through smart contracts.</p>
              </div>
              <div className="bg-black/40 border border-green-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-mono font-semibold mb-3 flex items-center gap-2">
                  <span>⚡</span> Real-Time Multi-Token Recognition
                </h4>
                <p className="text-green-600 text-sm">Earn $ABC plus relevant appcoins ($EMARK, $FRAME, etc.) based on ecosystem impact.</p>
              </div>
            </div>

            <div className="bg-blue-950/20 border border-blue-900/50 rounded-lg p-4 mb-6">
              <h4 className="text-blue-400 font-mono font-semibold mb-3">🌍 Building the Farcaster Ecosystem</h4>
              <p className="text-blue-300 text-sm mb-3">
                We prioritize contributions that benefit the entire Farcaster ecosystem, especially infrastructure, tools, and foundational technologies that enable multiple applications and their appcoins to thrive together.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="text-center">
                  <p className="text-blue-400 font-semibold">Short-Term (2025)</p>
                  <p className="text-blue-600">1,000+ Active Developers</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 font-semibold">Medium-Term (2025-2026)</p>
                  <p className="text-blue-600">Farcaster Ecosystem Standard</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 font-semibold">Long-Term (2026+)</p>
                  <p className="text-blue-600">Universal Funding Model</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-green-400 font-mono text-lg font-bold mb-2">
                Always Be Coding. Always Be Earning. Always Be Building.
              </p>
              <p className="text-green-600 text-sm italic">
                ABC DAO - Where code meets capital, and developers earn what they deserve.
              </p>
              <a
                href="/docs/abc-dao-mission-statement.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                           text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-mono text-sm
                           transition-all duration-200 matrix-button"
              >
                📖 Read Full Mission Statement
              </a>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section id="getting-started" className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Getting Started
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Step 1: Set Up Your Account</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-mono">1.</span>
                <div>
                  <p className="text-green-300 font-mono text-sm mb-2">Open ABC DAO in Farcaster miniapp</p>
                  <p className="text-green-600 text-xs">Your wallet is automatically connected through Farcaster</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-mono">2.</span>
                <div>
                  <p className="text-green-300 font-mono text-sm mb-2">Link your GitHub account</p>
                  <p className="text-green-600 text-xs">Enables automatic commit tracking and rewards</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Step 2: Pay Membership Fee</h3>
            <div className="space-y-3">
              <p className="text-green-300 font-mono text-sm">Pay 0.002 ETH to join ABC DAO and start earning rewards</p>
              <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-3">
                <p className="text-green-600 text-xs font-mono">
                  💡 This one-time fee funds the reward pool and covers gas costs for automated distributions
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* GitHub App Section */}
        <section id="github-app" className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Repository Registration
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Add Your Repositories</h3>
            <p className="text-green-300 font-mono text-sm mb-4">
              Register your repositories to automatically earn $ABC rewards for every meaningful commit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-green-400 font-mono text-sm font-semibold">Member Registration (Free)</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-mono">•</span>
                    <p className="text-green-600 text-sm">Up to 3 repositories for paid members</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-mono">•</span>
                    <p className="text-green-600 text-sm">Requires admin access to repository</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-mono">•</span>
                    <p className="text-green-600 text-sm">Standard reward rates</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-blue-400 font-mono text-sm font-semibold">Premium Stakers</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-mono">•</span>
                    <p className="text-blue-600 text-sm">Unlimited repositories (5M+ $ABC staked)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-mono">•</span>
                    <p className="text-blue-600 text-sm">No registration fees</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-mono">•</span>
                    <p className="text-blue-600 text-sm">Priority support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Registration Steps</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-mono">1.</span>
                <div>
                  <p className="text-green-300 font-mono text-sm mb-2">Ensure GitHub account is linked</p>
                  <p className="text-green-600 text-xs">Connect via the main ABC DAO app</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-mono">2.</span>
                <div>
                  <p className="text-green-300 font-mono text-sm mb-2">Register repository via API or interface</p>
                  <p className="text-green-600 text-xs">Must have admin access to the repository</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-mono">3.</span>
                <div>
                  <p className="text-green-300 font-mono text-sm mb-2">Configure webhook (manual setup)</p>
                  <p className="text-green-600 text-xs">Webhook URL: https://abcdao-production.up.railway.app/api/webhooks/github</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-mono">4.</span>
                <div>
                  <p className="text-green-300 font-mono text-sm mb-2">Start earning rewards automatically</p>
                  <p className="text-green-600 text-xs">Commits automatically trigger reward calculations</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-950/20 border border-purple-900/50 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-purple-400 text-lg">💼</span>
              <div>
                <p className="text-purple-400 font-mono text-sm font-semibold mb-1">
                  Partner Program
                </p>
                <p className="text-purple-500 font-mono text-xs">
                  Organizations can apply for partner status (1M $ABC fee) to get 2x reward multipliers and unlimited repositories.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Reward System Section */}
        <section id="reward-system" className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Reward System
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Reward Amounts</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-600 font-mono text-sm">95% chance:</span>
                  <span className="text-green-400 font-mono text-sm">50k-60k $ABC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 font-mono text-sm">2.5% chance:</span>
                  <span className="text-green-400 font-mono text-sm">60k-100k $ABC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 font-mono text-sm">2.5% chance:</span>
                  <span className="text-green-400 font-mono text-sm">100k-999k $ABC</span>
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Bonus Multipliers</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-600 font-mono text-sm">#high priority:</span>
                  <span className="text-green-400 font-mono text-sm">1.5x rewards</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 font-mono text-sm">#milestone:</span>
                  <span className="text-green-400 font-mono text-sm">1.5x rewards</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 font-mono text-sm">Farcaster apps:</span>
                  <span className="text-green-400 font-mono text-sm">Multi-token</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Commit Tags</h3>
            <p className="text-green-300 font-mono text-sm mb-4">
              Use these tags in your commit messages to control rewards:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="bg-green-950/20 border border-green-900/30 rounded p-2">
                  <span className="text-green-400 font-mono text-sm">#high</span>
                  <p className="text-green-600 text-xs">High priority work (1.5x rewards)</p>
                </div>
                <div className="bg-green-950/20 border border-green-900/30 rounded p-2">
                  <span className="text-green-400 font-mono text-sm">#milestone</span>
                  <p className="text-green-600 text-xs">Major milestone (1.5x rewards)</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-red-950/20 border border-red-900/30 rounded p-2">
                  <span className="text-red-400 font-mono text-sm">#norew</span>
                  <p className="text-red-600 text-xs">Skip rewards for this commit</p>
                </div>
                <div className="bg-blue-950/20 border border-blue-900/30 rounded p-2">
                  <span className="text-blue-400 font-mono text-sm">#silent</span>
                  <p className="text-blue-600 text-xs">No Farcaster announcement</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Farcaster Integration Section */}
        <section id="farcaster-integration" className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Farcaster Integration
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Social Verification</h3>
            <p className="text-green-300 font-mono text-sm mb-4">
              Connect your Farcaster account to link your social identity with your GitHub contributions.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-mono">•</span>
                <p className="text-green-600 text-sm">Automated announcements when you earn rewards</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-mono">•</span>
                <p className="text-green-600 text-sm">Social proof for your development contributions</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-mono">•</span>
                <p className="text-green-600 text-sm">Community recognition and leaderboards</p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">ABC DAO Bots</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-950/20 border border-green-900/30 rounded p-3">
                <h4 className="text-green-400 font-mono text-sm font-semibold mb-2">@abc-dao-commits</h4>
                <p className="text-green-600 text-xs">Announces individual commit rewards and development activity</p>
              </div>
              <div className="bg-green-950/20 border border-green-900/30 rounded p-3">
                <h4 className="text-green-400 font-mono text-sm font-semibold mb-2">@abc-dao-dev</h4>
                <p className="text-green-600 text-xs">Ecosystem announcements, leaderboards, and system updates</p>
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section id="troubleshooting" className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Troubleshooting
          </h2>
          
          <div className="space-y-6">
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Common Issues</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-green-300 font-mono text-sm font-semibold mb-2">I committed but didn&apos;t get rewards</h4>
                  <div className="space-y-1 text-xs text-green-600">
                    <p>• Check your membership status (0.002 ETH payment required)</p>
                    <p>• Verify your GitHub account is linked to your Farcaster account</p>
                    <p>• Ensure you haven&apos;t reached the daily limit (10 commits/day)</p>
                    <p>• Check if your commit message included #norew tag</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-green-300 font-mono text-sm font-semibold mb-2">Wrong reward amount</h4>
                  <div className="space-y-1 text-xs text-green-600">
                    <p>• Rewards are randomly distributed within ranges (50k-999k $ABC)</p>
                    <p>• Check for priority tags (#high, #milestone) for bonus multipliers</p>
                    <p>• Priority tags have weekly limits (may be downgraded to normal)</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-green-300 font-mono text-sm font-semibold mb-2">Can&apos;t claim rewards</h4>
                  <div className="space-y-1 text-xs text-green-600">
                    <p>• Rewards are processed in batches every 12 hours</p>
                    <p>• Check that your wallet address is connected to your account</p>
                    <p>• Ensure you have enough ETH for gas fees on Base network</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Get Help</h3>
              <div className="space-y-3">
                <a
                  href="https://github.com/ABC-DAO/abc-dao/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                             text-green-400 hover:text-green-300 px-4 py-3 rounded-lg font-mono text-sm text-center
                             transition-all duration-200 matrix-button"
                >
                  🐛 Report Technical Issues
                </a>
                <div className="text-center">
                  <p className="text-green-600 font-mono text-xs mb-2">
                    For general questions, message us on Farcaster:
                  </p>
                  <p className="text-green-400 font-mono text-sm">@abc-dao-dev</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* API Reference Section */}
        <section id="api-reference" className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} API Reference
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Integration Endpoints</h3>
            <p className="text-green-300 font-mono text-sm mb-6">
              For Farcaster applications wanting to integrate appcoin rewards:
            </p>
            
            <div className="space-y-4">
              <div className="bg-green-950/20 border border-green-900/30 rounded p-4">
                <h4 className="text-green-400 font-mono text-sm font-semibold mb-2">Webhook Registration</h4>
                <p className="text-green-600 text-xs mb-2">POST /api/webhooks/register</p>
                <div className="bg-black/40 rounded p-2">
                  <code className="text-green-300 text-xs font-mono">
                    {JSON.stringify({
                      repository: "your-org/repo-name",
                      appcoin_address: "0x...",
                      reward_multiplier: 1.0,
                      channel_id: "your-channel"
                    }, null, 2)}
                  </code>
                </div>
              </div>
              
              <div className="bg-green-950/20 border border-green-900/30 rounded p-4">
                <h4 className="text-green-400 font-mono text-sm font-semibold mb-2">User Stats</h4>
                <p className="text-green-600 text-xs mb-2">GET /api/users/&#123;fid&#125;/stats</p>
                <p className="text-green-600 text-xs">Returns user&apos;s contribution history and reward totals</p>
              </div>
            </div>
            
            <div className="bg-blue-950/20 border border-blue-900/50 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-lg">💡</span>
                <div>
                  <p className="text-blue-400 font-mono text-sm font-semibold mb-1">
                    Partnership Program
                  </p>
                  <p className="text-blue-500 font-mono text-xs">
                    Contact @abc-dao-dev on Farcaster to discuss integrating your appcoin with ABC DAO&apos;s reward system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <ContractAddressesFooter />
    </div>
  );
}