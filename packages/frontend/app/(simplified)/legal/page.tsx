/**
 * Legal Page (/legal)
 * 
 * Privacy policy and terms of service
 */

'use client';

import { BackNavigation } from '@/components/back-navigation';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="legal_documents()" 
        subtitle="Privacy policy and terms of service" 
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Terms of Service */}
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-6">Terms of Service</h2>
            
            <div className="space-y-4 text-sm text-green-600">
              <div>
                <h3 className="font-semibold text-green-400 mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using ABC DAO ("the Protocol"), you agree to be bound by these Terms of Service. 
                  The Protocol is a decentralized system for rewarding developers with cryptocurrency tokens.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-400 mb-2">2. Protocol Description</h3>
                <p>
                  ABC DAO automatically distributes $ABC tokens to developers based on their code contributions. 
                  The system integrates with GitHub repositories and tracks commits to calculate rewards.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-400 mb-2">3. User Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You must own and control the wallet address you connect</li>
                  <li>You are responsible for securing your private keys</li>
                  <li>You must own the GitHub account you link</li>
                  <li>You may only claim rewards for your own genuine contributions</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-400 mb-2">4. Disclaimers</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>The Protocol is provided "as is" without warranties</li>
                  <li>Cryptocurrency values are volatile and may decrease</li>
                  <li>Smart contract risks exist and cannot be eliminated</li>
                  <li>The Protocol may experience downtime or technical issues</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibent text-green-400 mb-2">5. Limitation of Liability</h3>
                <p>
                  The Protocol operators are not liable for any losses, damages, or issues arising from use of the system. 
                  Users participate at their own risk.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="bg-black/40 border border-green-900/30 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-6">Privacy Policy</h2>
            
            <div className="space-y-4 text-sm text-green-600">
              <div>
                <h3 className="font-semibold text-green-400 mb-2">Data Collection</h3>
                <p>
                  We collect minimal data necessary for Protocol functionality:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Wallet addresses (public blockchain data)</li>
                  <li>GitHub usernames and public repository information</li>
                  <li>Commit hashes and metadata (public Git data)</li>
                  <li>Discord/Farcaster usernames (if you choose to connect)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-400 mb-2">Data Usage</h3>
                <p>
                  Your data is used only for:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Calculating and distributing token rewards</li>
                  <li>Displaying your profile and achievements</li>
                  <li>Enabling community features and leaderboards</li>
                  <li>Protocol analytics and improvements</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-400 mb-2">Data Protection</h3>
                <p>
                  We implement security measures to protect your data, but cannot guarantee absolute security. 
                  Most data we collect is already public on GitHub and blockchain networks.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-400 mb-2">Data Sharing</h3>
                <p>
                  We do not sell or share your personal data with third parties. Some data may be publicly 
                  visible as part of the Protocol's transparent design (leaderboards, achievements, etc.).
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-400 mb-2">Your Rights</h3>
                <p>
                  You can disconnect your accounts at any time. Some data may remain on the blockchain 
                  permanently due to its immutable nature.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-blue-400 mb-4">Questions?</h3>
            <p className="text-sm text-green-600 mb-4">
              If you have questions about these terms or privacy practices, please contact us:
            </p>
            <div className="space-y-2">
              <div>
                <span className="text-blue-400">Discord:</span>
                <a 
                  href="https://discord.gg/HK62WQWJ" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-green-400 hover:text-green-300 transition-colors"
                >
                  https://discord.gg/HK62WQWJ
                </a>
              </div>
              <div>
                <span className="text-blue-400">GitHub:</span>
                <a 
                  href="https://github.com/abc-dao" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-green-400 hover:text-green-300 transition-colors"
                >
                  https://github.com/abc-dao
                </a>
              </div>
            </div>
            
            <p className="text-xs text-green-700 mt-6">
              Last updated: October 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}