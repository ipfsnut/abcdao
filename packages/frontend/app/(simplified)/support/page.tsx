/**
 * Support Page (/support)
 * 
 * Help and troubleshooting resources
 */

'use client';

import { BackNavigation } from '@/components/back-navigation';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="support_center()" 
        subtitle="Get help and troubleshooting" 
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Quick Help */}
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-6">Quick Help</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
                <h3 className="font-semibold text-green-400 mb-3">🔧 Common Issues</h3>
                <ul className="space-y-2 text-sm text-green-600">
                  <li>• Wallet connection problems</li>
                  <li>• GitHub integration issues</li>
                  <li>• Missing reward payments</li>
                  <li>• Staking transaction failures</li>
                </ul>
                <Link 
                  href="/docs/troubleshooting"
                  className="inline-block mt-3 text-xs text-green-500 hover:text-green-400 transition-colors"
                >
                  View Troubleshooting Guide →
                </Link>
              </div>
              
              <div className="bg-black/40 border border-blue-900/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-400 mb-3">📚 Documentation</h3>
                <ul className="space-y-2 text-sm text-green-600">
                  <li>• Getting started guide</li>
                  <li>• Repository setup</li>
                  <li>• Rewards system explained</li>
                  <li>• API reference</li>
                </ul>
                <Link 
                  href="/docs"
                  className="inline-block mt-3 text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Browse Documentation →
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-black/40 border border-green-900/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-green-400 mb-4">Contact Support</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a
                href="https://discord.gg/HK62WQWJ"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-indigo-950/20 border border-indigo-900/50 hover:border-indigo-700/70 rounded-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <h4 className="text-indigo-400 font-semibold">Discord Community</h4>
                </div>
                <p className="text-sm text-green-600 mb-2">
                  Join our Discord server for community support and real-time help
                </p>
                <div className="text-xs text-indigo-500">
                  Usually responds within 1 hour
                </div>
              </a>
              
              <a
                href="https://github.com/abc-dao/abc-dao/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-gray-950/20 border border-gray-700/50 hover:border-gray-500/70 rounded-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-gray-300 font-semibold">GitHub Issues</h4>
                </div>
                <p className="text-sm text-green-600 mb-2">
                  Report bugs or request features on our GitHub repository
                </p>
                <div className="text-xs text-gray-400">
                  For technical issues and feature requests
                </div>
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4">Frequently Asked Questions</h3>
            
            <div className="space-y-4">
              <div className="bg-black/20 border border-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-400 mb-2">How do I start earning $ABC tokens?</h4>
                <p className="text-sm text-green-600">
                  Connect your wallet, link your GitHub account, and enable repositories for rewards. Every commit to enabled repos earns you $ABC tokens.
                </p>
              </div>
              
              <div className="bg-black/20 border border-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-400 mb-2">Why aren't my commits being rewarded?</h4>
                <p className="text-sm text-green-600">
                  Make sure your repository is enabled for rewards, you're a member of ABC DAO, and your commits meet the minimum requirements. Check the troubleshooting guide for more details.
                </p>
              </div>
              
              <div className="bg-black/20 border border-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-400 mb-2">How does staking work?</h4>
                <p className="text-sm text-green-600">
                  Stake your $ABC tokens to earn ETH rewards. The more you stake and the longer you stake, the more ETH you earn from the protocol's revenue sharing.
                </p>
              </div>
              
              <div className="bg-black/20 border border-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-400 mb-2">What's the membership fee for?</h4>
                <p className="text-sm text-green-600">
                  The 0.002 ETH membership fee helps fund the reward pool, covers gas costs for automated distributions, and supports protocol development.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}