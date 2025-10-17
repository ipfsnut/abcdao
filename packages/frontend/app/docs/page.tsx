'use client';

import Link from 'next/link';

export default function DocsOverviewPage() {
  return (
    <div className="max-w-4xl">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          ABC DAO Documentation
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          Complete guide to earning <span className="text-green-400 font-semibold">$ABC tokens</span> for your 
          code contributions. From setup to advanced integration, we&apos;ve got you covered.
        </p>
      </div>

      {/* Quick Start Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
              🚀
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">New Developer?</h3>
              <p className="text-sm text-gray-400">Get started in 5 minutes</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Link GitHub, pay 0.002 ETH, register repositories, and start earning $ABC for commits.
          </p>
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Start Here →
          </Link>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
              📁
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Repository Owner?</h3>
              <p className="text-sm text-gray-400">Enable rewards for contributors</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Set up ABC DAO integration to automatically reward your contributors with $ABC tokens.
          </p>
          <Link
            href="/docs/repository-setup"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Setup Guide →
          </Link>
        </div>
      </div>

      {/* Main Documentation Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/docs/getting-started"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-800/70 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🚀</span>
              <h3 className="text-white font-semibold">Getting Started</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Complete onboarding guide from account setup to first rewards
            </p>
          </Link>

          <Link
            href="/docs/repository-setup"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-800/70 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📁</span>
              <h3 className="text-white font-semibold">Repository Setup</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Register repositories and configure webhooks for automatic rewards
            </p>
          </Link>

          <Link
            href="/docs/rewards-system"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-800/70 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💰</span>
              <h3 className="text-white font-semibold">Rewards & Tags</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Understand reward calculations, commit tags, and optimization tips
            </p>
          </Link>

          <Link
            href="/docs/api-reference"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-800/70 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚙️</span>
              <h3 className="text-white font-semibold">API Reference</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Integration endpoints for developers and advanced users
            </p>
          </Link>

          <Link
            href="/docs/troubleshooting"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-800/70 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🛠️</span>
              <h3 className="text-white font-semibold">Troubleshooting</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Common issues, solutions, and where to get help
            </p>
          </Link>

          <a
            href="/whitepaper"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-800/70 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📄</span>
              <h3 className="text-white font-semibold">Whitepaper</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Technical specification and system architecture
            </p>
          </a>
        </div>
      </div>

      {/* Mission Statement Preview */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Always Be Coding</h2>
        <p className="text-gray-300 text-lg leading-relaxed mb-6">
          ABC DAO exists to <strong className="text-green-400">incentivize collaboration in the Farcaster ecosystem</strong> by 
          creating direct economic rewards for developers who ship code and contribute to decentralized social applications.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-green-400 text-lg">🚀</span>
              <span className="text-white font-medium">Ship code, earn tokens</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400 text-lg">💰</span>
              <span className="text-white font-medium">Direct economic incentives</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-green-400 text-lg">🤖</span>
              <span className="text-white font-medium">Automated & transparent</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400 text-lg">⚡</span>
              <span className="text-white font-medium">Multi-token rewards</span>
            </div>
          </div>
        </div>
        <Link
          href="/docs/mission"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Read Full Mission Statement →
        </Link>
      </div>

      {/* Community Links */}
      <div className="border-t border-gray-700 pt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Community & Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://warpcast.com/abc-dao"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          >
            <span className="text-xl">🐦</span>
            <span className="text-white font-medium">Follow on Farcaster</span>
          </a>
          <a
            href="https://github.com/ABC-DAO/abc-dao"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          >
            <span className="text-xl">💻</span>
            <span className="text-white font-medium">GitHub Repository</span>
          </a>
          <a
            href="https://app.uniswap.org/#/swap?outputCurrency=0x5c0872b790bb73e2b3a9778db6e7704095624b07&chain=base"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          >
            <span className="text-xl">🔄</span>
            <span className="text-white font-medium">Get $ABC on Uniswap</span>
          </a>
        </div>
      </div>
    </div>
  );
}