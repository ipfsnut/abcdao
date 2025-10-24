'use client';

import { ContractAddressesFooter } from '@/components/contract-addresses-footer';
import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPage() {
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
                  {'>'} ABC_DAO/privacy
                </h1>
                <p className="text-xs text-green-600">
                  Privacy policy for GitHub App and services
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
        <div className="bg-green-950/20 border border-green-900/50 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-green-400 matrix-glow mb-4 font-mono">
            ABC DAO Privacy Policy
          </h2>
          <p className="text-green-300 font-mono text-sm mb-4">
            Effective Date: October 16, 2025
          </p>
          <p className="text-green-300 font-mono text-sm">
            Last Updated: October 16, 2025
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Introduction
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 space-y-4">
            <p className="text-green-300 font-mono text-sm">
              ABC DAO (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates a developer incentive platform that rewards open source contributions with cryptocurrency tokens. This Privacy Policy explains how we collect, use, and protect your information when you use our services.
            </p>
            
            <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
              <h3 className="text-green-400 font-mono font-semibold mb-2">Contact Information</h3>
              <div className="space-y-1 text-green-600 text-xs">
                <p>Organization: ABC DAO</p>
                <p>Website: https://abc.epicdylan.com</p>
                <p>Contact: @abc-dao-dev on Farcaster</p>
                <p>GitHub: https://github.com/ABC-DAO</p>
              </div>
            </div>
          </div>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Information We Collect
          </h2>
          
          <div className="space-y-6">
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">GitHub Data</h3>
              <p className="text-green-300 font-mono text-sm mb-4">
                When you install our GitHub App, we collect:
              </p>
              <ul className="space-y-2 text-green-600 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>GitHub username and user ID</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Repository information (name, URL, metadata)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Commit information (hash, message, timestamp, author)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Pull request data (title, description, merge status)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Public email address associated with commits</span>
                </li>
              </ul>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Farcaster Data</h3>
              <p className="text-green-300 font-mono text-sm mb-4">
                When you connect your Farcaster account, we collect:
              </p>
              <ul className="space-y-2 text-green-600 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Farcaster ID (FID) and username</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Public profile information (display name, bio, avatar)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Connected wallet addresses</span>
                </li>
              </ul>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Blockchain Data</h3>
              <p className="text-green-300 font-mono text-sm mb-4">
                When you connect your wallet and interact with our platform:
              </p>
              <ul className="space-y-2 text-green-600 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Wallet addresses and transaction hashes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Token balances and staking information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Payment transactions (membership fees)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Reward distribution records</span>
                </li>
              </ul>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Technical Data</h3>
              <ul className="space-y-2 text-green-600 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>IP addresses and browser information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Usage analytics and interaction logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Error logs and debugging information</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} How We Use Your Information
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3 font-mono">Core Platform Functions</h3>
                <ul className="space-y-2 text-green-600 text-sm ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Track and verify code contributions for reward calculation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Distribute $ABC tokens and partner appcoins as rewards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Link GitHub contributions to Farcaster social identity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Process membership payments and manage user accounts</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3 font-mono">Community Features</h3>
                <ul className="space-y-2 text-green-600 text-sm ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Post automated announcements on Farcaster about achievements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Generate leaderboards and contribution statistics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Enable social proof and community recognition</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3 font-mono">Platform Improvement</h3>
                <ul className="space-y-2 text-green-600 text-sm ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Analyze usage patterns to improve reward algorithms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Debug technical issues and optimize performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span>Develop new features and integrations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Information Sharing */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Information Sharing
          </h2>
          
          <div className="space-y-6">
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Public Information</h3>
              <p className="text-green-300 font-mono text-sm mb-4">
                The following information is made publicly available:
              </p>
              <ul className="space-y-2 text-green-600 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>GitHub and Farcaster usernames</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Contribution statistics and leaderboard rankings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Reward announcements on Farcaster (unless marked #silent)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span>Repository names and commit messages (for public repos)</span>
                </li>
              </ul>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Third-Party Services</h3>
              <p className="text-green-300 font-mono text-sm mb-4">
                We share limited data with these services to operate our platform:
              </p>
              <ul className="space-y-2 text-green-600 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span><strong>GitHub:</strong> Repository and commit data (via their API)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span><strong>Neynar:</strong> Farcaster posting and user verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span><strong>Base Network:</strong> Blockchain transactions and smart contract interactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">•</span>
                  <span><strong>Railway:</strong> Database hosting and application infrastructure</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4">
              <h3 className="text-red-400 font-mono font-semibold mb-2">What We Never Share</h3>
              <ul className="space-y-1 text-red-300 text-xs ml-4">
                <li>• Private repository content or private commit details</li>
                <li>• Wallet private keys or seed phrases</li>
                <li>• Personal contact information beyond public profiles</li>
                <li>• Individual user data for commercial purposes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Data Security
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
            <div className="space-y-4">
              <p className="text-green-300 font-mono text-sm">
                We implement industry-standard security measures to protect your information:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-mono font-semibold mb-2">Technical Safeguards</h4>
                  <ul className="space-y-1 text-green-600 text-xs">
                    <li>• Encrypted database connections (SSL/TLS)</li>
                    <li>• Secure API authentication and rate limiting</li>
                    <li>• Regular security updates and monitoring</li>
                    <li>• Environment variable protection for secrets</li>
                  </ul>
                </div>
                
                <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-mono font-semibold mb-2">Access Controls</h4>
                  <ul className="space-y-1 text-blue-300 text-xs">
                    <li>• Minimal data collection principles</li>
                    <li>• Role-based access to user information</li>
                    <li>• Automated systems with limited human access</li>
                    <li>• Regular access audits and reviews</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Rights */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Your Rights
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3 font-mono">Access and Control</h3>
                <ul className="space-y-2 text-green-600 text-sm ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span><strong>View Your Data:</strong> Access your contribution history and rewards through the main app</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span><strong>Control Announcements:</strong> Use #silent tag to prevent Farcaster posts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span><strong>Disconnect Accounts:</strong> Unlink GitHub or Farcaster accounts at any time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-mono">•</span>
                    <span><strong>Uninstall App:</strong> Remove GitHub App from your repositories</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3 font-mono">Data Deletion</h3>
                <p className="text-green-600 text-sm mb-2">
                  To request account deletion or data removal, contact @abc-dao-dev on Farcaster. Note:
                </p>
                <ul className="space-y-1 text-green-600 text-xs ml-4">
                  <li>• Blockchain transactions cannot be deleted (immutable ledger)</li>
                  <li>• Public contributions may remain visible on GitHub and Farcaster</li>
                  <li>• We will remove your account data from our systems within 30 days</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Updates and Contact */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-400 matrix-glow mb-6 font-mono">
            {'>'} Policy Updates
          </h2>
          
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
            <p className="text-green-300 font-mono text-sm mb-4">
              We may update this Privacy Policy to reflect changes in our practices or legal requirements. 
              When we make significant changes, we will:
            </p>
            <ul className="space-y-2 text-green-600 text-sm ml-4 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-mono">•</span>
                <span>Post the updated policy on our website</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-mono">•</span>
                <span>Announce changes through @abc-dao-dev on Farcaster</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-mono">•</span>
                <span>Update the &quot;Last Updated&quot; date at the top of this policy</span>
              </li>
            </ul>
            
            <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
              <h3 className="text-green-400 font-mono font-semibold mb-2">Contact Us</h3>
              <p className="text-green-600 text-sm mb-2">
                If you have questions about this Privacy Policy or our data practices:
              </p>
              <div className="space-y-1 text-green-600 text-xs">
                <p>• Farcaster: @abc-dao-dev</p>
                <p>• GitHub Issues: https://github.com/ABC-DAO/abc-dao/issues</p>
                <p>• Website: https://abc.epicdylan.com/support</p>
              </div>
            </div>
          </div>
        </section>

        {/* Legal Compliance */}
        <section className="mb-8">
          <div className="bg-gray-950/20 border border-gray-900/50 rounded-xl p-6">
            <h3 className="text-gray-400 font-mono font-semibold mb-4">Legal Compliance</h3>
            <div className="space-y-3 text-gray-600 text-xs">
              <p>
                This privacy policy is designed to comply with applicable data protection laws, including GDPR, CCPA, and other regional privacy regulations.
              </p>
              <p>
                As a decentralized application operating on public blockchains, some information is inherently public and cannot be deleted due to the immutable nature of blockchain technology.
              </p>
              <p>
                By using ABC DAO services, you acknowledge and agree to the collection and use of information in accordance with this Privacy Policy.
              </p>
            </div>
          </div>
        </section>
      </div>
      
      <ContractAddressesFooter />
    </div>
  );
}