/**
 * Join/Onboarding Page (/join)
 * 
 * Simplified onboarding flow for new users
 */

'use client';

import { useWalletFirstAuth } from '@/hooks/useWalletFirstAuth';
import { BackNavigation } from '@/components/back-navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function JoinPage() {
  const { user, isAuthenticated, nextSteps } = useWalletFirstAuth();

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="join_abc_dao()" 
        subtitle="Start your developer rewards journey" 
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-green-400 matrix-glow mb-6">
              Join ABC DAO
            </h1>
            <p className="text-xl text-green-300 mb-4">
              Two ways to participate and earn
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-green-400 mb-2">💻 Developers (Members)</h3>
                <p className="text-green-600 font-mono text-sm">
                  Join as a member • Earn ABC tokens for code commits
                </p>
              </div>
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-2">🏦 Stakers (Everyone)</h3>
                <p className="text-blue-600 font-mono text-sm">
                  Just connect wallet • Stake ABC for ETH rewards
                </p>
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold text-green-400 mb-2">Instant Rewards</h3>
              <p className="text-sm text-green-600">
                Earn 50k-1M $ABC tokens for every commit you make
              </p>
            </div>
            
            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="font-semibold text-green-400 mb-2">Auto-Detection</h3>
              <p className="text-sm text-green-600">
                Connect GitHub once, we handle the rest automatically
              </p>
            </div>
            
            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🏦</div>
              <h3 className="font-semibold text-green-400 mb-2">Stake & Earn</h3>
              <p className="text-sm text-green-600">
                Stake $ABC tokens to earn ETH rewards passively
              </p>
            </div>
            
            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="font-semibold text-green-400 mb-2">Community</h3>
              <p className="text-sm text-green-600">
                Join a thriving community of builders and creators
              </p>
            </div>
          </div>

          {!isAuthenticated ? (
            /* Wallet Connection */
            <div className="bg-black/40 border border-green-900/30 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-green-400 mb-4">Get Started</h2>
              <p className="text-green-600 font-mono mb-6">
                Connect your wallet to begin your developer journey
              </p>
              <ConnectButton />
              <p className="text-xs text-green-700 font-mono mt-4">
                No signup required • Your wallet, your identity • Start earning immediately
              </p>
            </div>
          ) : (
            /* Next Steps for Authenticated Users */
            <div className="space-y-6">
              <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">Welcome! 🎉</h2>
                <p className="text-green-600 font-mono mb-6">
                  Your wallet is connected. Complete these steps to start earning:
                </p>
                
                <div className="space-y-4">
                  {nextSteps.map((step, index) => (
                    <div key={step.action} className="flex items-start gap-4 p-4 bg-black/20 border border-green-900/20 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-900/50 border border-green-700 flex items-center justify-center text-green-400 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-400 mb-1">{step.title}</h3>
                        <p className="text-sm text-green-600 mb-2">{step.description}</p>
                        <div className="text-xs text-green-700">
                          Benefits: {step.benefits.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-4">Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/developers" className="block p-4 bg-black/40 border border-green-900/30 rounded-lg hover:border-green-700/50 transition-colors">
                    <div className="text-2xl mb-2">💻</div>
                    <div className="font-semibold text-green-400 mb-1">Developer Tools</div>
                    <div className="text-xs text-green-600">Set up repositories and start earning</div>
                  </Link>
                  
                  <Link href="/staking" className="block p-4 bg-black/40 border border-green-900/30 rounded-lg hover:border-green-700/50 transition-colors">
                    <div className="text-2xl mb-2">🏦</div>
                    <div className="font-semibold text-green-400 mb-1">Staking</div>
                    <div className="text-xs text-green-600">Stake tokens and earn ETH rewards</div>
                  </Link>
                  
                  <Link href="/community" className="block p-4 bg-black/40 border border-green-900/30 rounded-lg hover:border-green-700/50 transition-colors">
                    <div className="text-2xl mb-2">👥</div>
                    <div className="font-semibold text-green-400 mb-1">Community</div>
                    <div className="text-xs text-green-600">Join Discord and connect with builders</div>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}