/**
 * Simplified Layout Content
 * 
 * This component runs inside the Providers context and can safely use
 * wallet hooks like useWalletFirstAuth
 */

'use client';

import { useState } from 'react';
import { SimplifiedNavigation } from "@/components/simplified-navigation";
import { UpgradeBanner } from "@/components/upgrade-banner";
import { useWalletFirstAuth } from "@/hooks/useWalletFirstAuth";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface SimplifiedLayoutContentProps {
  children: React.ReactNode;
}

// Component that receives data as props to avoid double hook calls
function WalletFirstAuthWithData({ 
  user, 
  isLoading, 
  isAuthenticated, 
  features, 
  nextSteps,
  addGitHubIntegration,
  addDiscordIntegration, 
  addFarcasterIntegration,
  processMembershipPurchase 
}: any) {
  const { isConnected } = useAccount();
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);

  // Same rendering logic as WalletFirstAuth but without calling the hook
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse text-green-400 text-4xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-green-400 matrix-glow mb-2">
            Connecting...
          </h2>
          <p className="text-green-600 font-mono">
            Setting up your wallet-first profile
          </p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-green-400 matrix-glow mb-4">
              Welcome to ABC DAO
            </h1>
            <p className="text-xl text-green-300 mb-2">
              Ship code. Earn rewards. Build the future.
            </p>
            <p className="text-green-600 font-mono">
              Connect your wallet to get started
            </p>
          </div>

          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-6">
              Why Wallet-First?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="font-semibold text-green-400 mb-2">Secure Identity</h3>
                <p className="text-sm text-green-600">
                  Your wallet is your identity - secure, decentralized, and owned by you
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-semibold text-green-400 mb-2">Instant Access</h3>
                <p className="text-sm text-green-600">
                  View tokens, stake, claim rewards - no signup required
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="font-semibold text-green-400 mb-2">Progressive Setup</h3>
                <p className="text-sm text-green-600">
                  Add features as you need them - GitHub, Discord, social
                </p>
              </div>
            </div>

            <div className="mb-6">
              <ConnectButton />
            </div>

            <p className="text-xs text-green-700 font-mono">
              No personal data required • No email signup • Your keys, your identity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 border border-green-900/30 rounded-lg p-6">
              <h3 className="font-semibold text-green-400 mb-3">For Developers</h3>
              <ul className="text-sm text-green-600 space-y-2">
                <li>• Earn 50k-1M $ABC per commit</li>
                <li>• Auto-track your repositories</li>
                <li>• Repository integration tools</li>
                <li>• Developer community access</li>
              </ul>
            </div>
            
            <div className="bg-black/40 border border-green-900/30 rounded-lg p-6">
              <h3 className="font-semibold text-green-400 mb-3">For Everyone</h3>
              <ul className="text-sm text-green-600 space-y-2">
                <li>• Stake $ABC tokens for rewards</li>
                <li>• Community access and networking</li>
                <li>• Social features and recognition</li>
                <li>• Treasury transparency</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null; // For authenticated users, show the main app content
}

export function SimplifiedLayoutContent({ children }: SimplifiedLayoutContentProps) {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    features, 
    nextSteps,
    addGitHubIntegration,
    addDiscordIntegration,
    addFarcasterIntegration,
    processMembershipPurchase 
  } = useWalletFirstAuth();

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Upgrade Banner */}
      <UpgradeBanner />
      
      {/* Simplified Navigation Header */}
      <SimplifiedNavigation user={user as any} isAuthenticated={isAuthenticated} />
      
      {/* Main Content Area */}
      <main className="relative">
        {!isAuthenticated && !isLoading ? (
          /* Show wallet connection prompt for unauthenticated users - pass data via props to avoid double hook calls */
          <div className="container mx-auto px-4 py-8">
            <WalletFirstAuthWithData 
              user={user} 
              isLoading={isLoading} 
              isAuthenticated={isAuthenticated}
              features={features}
              nextSteps={nextSteps}
              addGitHubIntegration={addGitHubIntegration}
              addDiscordIntegration={addDiscordIntegration}
              addFarcasterIntegration={addFarcasterIntegration}
              processMembershipPurchase={processMembershipPurchase}
            />
          </div>
        ) : (
          /* Show app content for authenticated users */
          children
        )}
      </main>
    </div>
  );
}