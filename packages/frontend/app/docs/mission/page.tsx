'use client';

export default function MissionStatementPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">ABC DAO Mission Statement</h1>
        <h2 className="text-2xl text-green-400 font-semibold mb-6">Always Be Coding</h2>
      </div>

      <div className="prose prose-invert max-w-none">
        {/* Mission */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            ABC DAO exists to <strong className="text-green-400">incentivize collaboration in the Farcaster ecosystem using appcoins</strong> by 
            creating direct economic rewards for developers who ship code and contribute to decentralized social applications.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            We believe that the future of decentralized social networks depends on sustainable funding models that reward cross-ecosystem collaboration. 
            Through our automated multi-token reward system, we transform every commit, every pull request, and every meaningful contribution into 
            tangible economic value across multiple Farcaster applications and their native appcoins.
          </p>
        </div>

        {/* Core Principles */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Core Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3">🚀 Always Be Coding</h3>
              <p className="text-gray-300">
                We reward action over intention. Ship code, earn tokens. The blockchain doesn't care about your resume—it cares about your contributions.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3">💰 Direct Economic Incentives</h3>
              <p className="text-gray-300">
                Developers shouldn't code for "exposure" or "portfolio building." Every meaningful contribution deserves immediate financial recognition.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3">🤖 Automated & Transparent</h3>
              <p className="text-gray-300">
                Our system runs autonomously through smart contracts and GitHub webhooks. No gatekeepers, no subjective evaluations.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3">⚡ Real-Time Multi-Token Recognition</h3>
              <p className="text-gray-300">
                Rewards are processed automatically within hours, earning $ABC tokens plus relevant appcoins based on ecosystem impact.
              </p>
            </div>
          </div>
        </div>

        {/* What We Do */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">What We Do</h2>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-green-400 mb-4">Multi-Appcoin Developer Rewards Program</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Cross-Ecosystem Commit Tracking</strong>: Every Git commit earns $ABC plus relevant appcoins</li>
              <li>• <strong>Farcaster-Native Integration</strong>: Rewards distributed through channels, frames, and social interactions</li>
              <li>• <strong>Collaboration Multipliers</strong>: Extra rewards when contributions benefit multiple applications</li>
              <li>• <strong>Smart Rewards</strong>: AI-enhanced commit parsing with priority tags and milestone bonuses</li>
              <li>• <strong>Daily Limits</strong>: Sustainable reward distribution (10 commits/day) encouraging quality over quantity</li>
            </ul>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-green-400 mb-4">Farcaster-First Automated Infrastructure</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>GitHub Webhooks</strong>: Instant commit detection and cross-ecosystem reward processing</li>
              <li>• <strong>Multi-Token Smart Contracts</strong>: Trustless allocation of $ABC and partner appcoins on Base</li>
              <li>• <strong>Channel-Targeted Broadcasting</strong>: Automated announcements in relevant Farcaster channels</li>
              <li>• <strong>Cross-App Integration</strong>: Framework for any Farcaster application to integrate rewards</li>
              <li>• <strong>Social Proof Engine</strong>: Real-time developer reputation across the entire ecosystem</li>
            </ul>
          </div>
        </div>

        {/* Vision */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Our Vision for the Future</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Short-Term (2025)</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• 1,000+ Active Developers earning multi-token rewards</li>
                <li>• 5+ Major Farcaster App Integrations</li>
                <li>• Cross-App Collaboration Engine</li>
                <li>• Enhanced AI-powered automation</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Medium-Term (2025-2026)</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Farcaster Ecosystem Standard for rewards</li>
                <li>• Cross-Chain Appcoin Support</li>
                <li>• Decentralized Governance</li>
                <li>• Global Developer Network</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Long-Term (2026+)</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Universal Farcaster Funding Model</li>
                <li>• Sustainable Developer Economy</li>
                <li>• Decentralized Social Infrastructure</li>
                <li>• Educational Pipeline Integration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technology */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Blockchain Infrastructure</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Base Network for low-cost transactions</li>
                <li>• Smart contracts for trustless rewards</li>
                <li>• Multi-token architecture</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Development Integration</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• GitHub webhooks for real-time detection</li>
                <li>• AI commit analysis and processing</li>
                <li>• Cross-repository reward distribution</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Join the Movement</h2>
          <p className="text-gray-300 text-lg mb-6">
            Ready to earn tokens for your code contributions?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/docs/getting-started"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Get Started as Developer →
            </a>
            <a
              href="/docs/repository-setup"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Setup Repository Rewards →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}