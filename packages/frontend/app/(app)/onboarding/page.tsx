'use client';

import { ContractAddressesFooter } from '@/components/contract-addresses-footer';
import { FarcasterAuth } from '@/components/farcaster-auth';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { useMembership } from '@/hooks/useMembership';
import { MembershipNFTPayment } from '@/components/membership-nft-payment';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OnboardingContent() {
  const { isConnected } = useAccount();
  const { user } = useFarcaster();
  const membership = useMembership();
  const searchParams = useSearchParams();
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const installation_id = searchParams.get('installation_id');
    if (installation_id) {
      setInstallationId(installation_id);
    }
  }, [searchParams]);

  // Auto-advance steps based on completion
  useEffect(() => {
    if (isConnected && currentStep === 1) {
      setCurrentStep(2);
    }
    if (user && currentStep === 2) {
      setCurrentStep(3);
    }
    if (membership.isMember && currentStep === 3) {
      setCurrentStep(4);
    }
  }, [isConnected, user, membership.isMember, currentStep]);

  const steps = [
    { id: 1, title: 'Connect Wallet', completed: isConnected },
    { id: 2, title: 'Connect Farcaster', completed: !!user },
    { id: 3, title: 'Pay Membership Fee', completed: membership.isMember },
    { id: 4, title: 'Start Earning', completed: membership.isMember }
  ];

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
                  {'>'} ABC_DAO/onboarding
                </h1>
                <p className="text-xs text-green-600">
                  Set up your developer rewards account
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
                href="/support"
                className="bg-blue-900/30 hover:bg-blue-800/40 border border-blue-700/50 hover:border-blue-600/70 
                           text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg font-mono text-xs
                           transition-all duration-200 matrix-button"
              >
                🛠️ Support
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-8 max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-green-400 matrix-glow mb-4 font-mono">
            Welcome to ABC DAO! 🎉
          </h2>
          <p className="text-green-300 font-mono text-sm mb-2">
            You're about to join the Always Be Coding movement
          </p>
          <p className="text-green-600 font-mono text-xs mb-4">
            Complete the steps below to start earning $ABC tokens for your code contributions
          </p>
          
          {/* New Improved Onboarding Notice */}
          <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4 mb-4">
            <h3 className="text-blue-400 font-mono font-semibold mb-2">🆕 Try Our Improved Onboarding!</h3>
            <p className="text-blue-300 font-mono text-xs mb-3">
              GitHub-first verification • Earnings preview • Auto repository setup
            </p>
            <a
              href="/onboarding-v2"
              className="inline-block bg-blue-900/50 hover:bg-blue-800/40 border border-blue-700/50 hover:border-blue-600/70 
                         text-blue-400 hover:text-blue-300 px-4 py-2 rounded-lg font-mono text-xs
                         transition-all duration-200 matrix-button"
            >
              🚀 Try Improved Onboarding
            </a>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Setup Progress</h3>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold
                  ${step.completed 
                    ? 'bg-green-900/50 border-green-600 text-green-400 matrix-glow' 
                    : currentStep === step.id
                      ? 'bg-yellow-900/50 border-yellow-600 text-yellow-400'
                      : 'bg-gray-900/50 border-gray-600 text-gray-400'
                  }`}>
                  {step.completed ? '✓' : step.id}
                </div>
                <div className="flex-1">
                  <div className={`font-mono font-semibold ${
                    step.completed ? 'text-green-400' : currentStep === step.id ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  {currentStep === step.id && !step.completed && (
                    <div className="text-green-600 text-xs font-mono">← Current step</div>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 ${step.completed ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-8">
          {/* Step 1: Connect Wallet */}
          {currentStep === 1 && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-4 font-mono">
                Step 1: Connect Your Wallet
              </h3>
              <p className="text-green-300 font-mono text-sm mb-6">
                Connect your wallet to receive $ABC token rewards and pay the membership fee.
              </p>
              <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 mb-6">
                <p className="text-green-600 text-xs font-mono">
                  💡 Supported wallets: Rainbow, MetaMask, Coinbase Wallet, WalletConnect, and more
                </p>
              </div>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          )}

          {/* Step 2: Connect Farcaster */}
          {currentStep === 2 && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-4 font-mono">
                Step 2: Connect Your Farcaster Account (Recommended)
              </h3>
              <p className="text-green-300 font-mono text-sm mb-6">
                Link your Farcaster account to enable social verification and announcements of your achievements. This step is recommended but optional.
              </p>
              
              {/* Farcaster signup option */}
              <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4 mb-6">
                <h4 className="text-purple-400 font-mono text-sm font-semibold mb-2">New to Farcaster?</h4>
                <p className="text-purple-300 font-mono text-xs mb-3">
                  Farcaster is a decentralized social network. Create your account to get the full ABC DAO experience.
                </p>
                <a
                  href="https://farcaster.xyz/~/code/PB4OR7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-purple-900/50 hover:bg-purple-800/40 border border-purple-700/50 hover:border-purple-600/70 
                           text-purple-400 hover:text-purple-300 px-4 py-2 rounded-lg font-mono text-xs
                           transition-all duration-200 matrix-button"
                >
                  🆕 Create Farcaster Account
                </a>
              </div>
              
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4 mb-6">
                <h4 className="text-blue-400 font-mono text-sm font-semibold mb-2">Benefits of Farcaster Integration:</h4>
                <ul className="space-y-1 text-blue-300 text-xs">
                  <li>• Automated announcements when you earn rewards</li>
                  <li>• Social proof of your development contributions</li>
                  <li>• Community recognition and leaderboards</li>
                  <li>• Access to exclusive ABC DAO channels</li>
                </ul>
              </div>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <FarcasterAuth />
                </div>
                
                <div className="text-center">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-green-600 hover:text-green-400 font-mono text-sm transition-colors underline"
                  >
                    Skip for now (you can connect Farcaster later)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pay Membership Fee */}
          {currentStep === 3 && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-4 font-mono">
                Step 3: Pay Membership Fee
              </h3>
              <p className="text-green-300 font-mono text-sm mb-6">
                Pay a one-time membership fee of 0.002 ETH to join ABC DAO and start earning $ABC rewards.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-mono text-sm font-semibold mb-2">What your fee funds:</h4>
                  <ul className="space-y-1 text-green-600 text-xs">
                    <li>• $ABC token reward pool</li>
                    <li>• Automated distribution gas costs</li>
                    <li>• Infrastructure and development</li>
                    <li>• Community treasury</li>
                  </ul>
                </div>
                
                <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-mono text-sm font-semibold mb-2">What you get:</h4>
                  <ul className="space-y-1 text-blue-300 text-xs">
                    <li>• Up to 999k $ABC per commit</li>
                    <li>• Daily reward opportunities (10/day)</li>
                    <li>• Priority tag bonuses (1.5x multiplier)</li>
                    <li>• Community membership access</li>
                  </ul>
                </div>
              </div>

              {!membership.isMember && (
                <MembershipNFTPayment />
              )}
            </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-semibold text-green-400 mb-4 font-mono matrix-glow">
                Welcome to ABC DAO!
              </h3>
              <p className="text-green-300 font-mono text-sm mb-6">
                You're all set up and ready to start earning $ABC tokens for your code contributions!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-mono text-sm font-semibold mb-2">Next Steps:</h4>
                  <ul className="space-y-1 text-green-600 text-xs text-left">
                    <li>• Start coding and committing</li>
                    <li>• Use #high or #milestone tags</li>
                    <li>• Check rewards in main app</li>
                    <li>• Join community discussions</li>
                  </ul>
                </div>
                
                <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-mono text-sm font-semibold mb-2">Reward Tips:</h4>
                  <ul className="space-y-1 text-blue-300 text-xs text-left">
                    <li>• Daily limit: 10 commits</li>
                    <li>• Use meaningful commit messages</li>
                    <li>• #norew skips rewards</li>
                    <li>• #silent skips announcements</li>
                  </ul>
                </div>
                
                <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4">
                  <h4 className="text-purple-400 font-mono text-sm font-semibold mb-2">Community:</h4>
                  <ul className="space-y-1 text-purple-300 text-xs text-left">
                    <li>• Follow @abc-dao-commits</li>
                    <li>• Follow @abc-dao-dev</li>
                    <li>• Join token-gated chat</li>
                    <li>• Check weekly leaderboards</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/"
                  className="bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                             text-green-400 hover:text-green-300 px-6 py-3 rounded-lg font-mono text-sm
                             transition-all duration-200 matrix-button"
                >
                  🚀 Go to Main App
                </a>
                <a
                  href="/docs"
                  className="bg-blue-900/30 hover:bg-blue-800/40 border border-blue-700/50 hover:border-blue-600/70 
                             text-blue-400 hover:text-blue-300 px-6 py-3 rounded-lg font-mono text-sm
                             transition-all duration-200 matrix-button"
                >
                  📚 Read Full Documentation
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Installation Info */}
        {installationId && (
          <div className="bg-green-950/20 border border-green-900/50 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">
              GitHub App Installation Confirmed ✅
            </h3>
            <div className="space-y-2 text-green-300 font-mono text-sm">
              <p>Installation ID: <span className="text-green-400">{installationId}</span></p>
              <p>The ABC DAO GitHub App has been successfully installed on your selected repositories.</p>
              <p className="text-green-600 text-xs">
                Once you complete onboarding, your commits will automatically earn $ABC rewards!
              </p>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/docs"
              className="bg-green-950/20 border border-green-900/30 rounded-lg p-3 hover:border-green-700/50 transition-all duration-200"
            >
              <h4 className="text-green-400 font-mono font-semibold mb-1">📚 Documentation</h4>
              <p className="text-green-600 text-xs">Complete setup guides and troubleshooting</p>
            </a>
            <a
              href="/support"
              className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3 hover:border-blue-700/50 transition-all duration-200"
            >
              <h4 className="text-blue-400 font-mono font-semibold mb-1">🛠️ Support</h4>
              <p className="text-blue-600 text-xs">Get help with issues or questions</p>
            </a>
          </div>
        </div>
      </div>
      
      <ContractAddressesFooter />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}