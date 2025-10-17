'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useUniversalAuth } from '@/contexts/universal-auth-context';

export function WebappAuth() {
  const { address, isConnected } = useAccount();
  const { user, isLoading, error, authenticateByWallet, linkGithub, processMembershipPurchase } = useUniversalAuth();
  const [linkingGithub, setLinkingGithub] = useState(false);

  // Auto-authenticate when wallet connects
  if (isConnected && address && !user && !isLoading) {
    authenticateByWallet(address);
  }

  const handleGithubLink = async () => {
    setLinkingGithub(true);
    try {
      // In a real implementation, this would redirect to GitHub OAuth
      // For now, we'll show a placeholder
      alert('GitHub OAuth flow would start here. This requires implementing OAuth redirect flow.');
    } catch (error) {
      console.error('GitHub linking failed:', error);
    } finally {
      setLinkingGithub(false);
    }
  };

  const handleMembershipPurchase = async () => {
    try {
      // In a real implementation, this would handle the ETH payment transaction
      // For now, we'll show a placeholder
      alert('Membership purchase flow would start here. This requires implementing ETH payment transaction.');
    } catch (error) {
      console.error('Membership purchase failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm text-center">
        <div className="animate-pulse text-green-400 mb-2">🔗</div>
        <p className="text-green-400 font-mono">Authenticating...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm text-center">
        <h2 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
          {'>'} connect_wallet()
        </h2>
        <p className="text-green-600 font-mono text-sm mb-6">
          Connect your wallet to join ABC DAO and start earning rewards for your contributions.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (error && error.includes('Membership purchase required')) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm text-center">
        <h2 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
          {'>'} purchase_membership()
        </h2>
        <p className="text-green-600 font-mono text-sm mb-6">
          Join ABC DAO by purchasing a membership for 0.002 ETH to start earning rewards.
        </p>
        <button
          onClick={handleMembershipPurchase}
          className="bg-green-900/50 hover:bg-green-800/60 border border-green-700/50 hover:border-green-600 
                     text-green-400 hover:text-green-300 px-6 py-3 rounded-lg font-mono font-semibold
                     transition-all duration-300 matrix-button matrix-glow"
        >
          Purchase Membership (0.002 ETH)
        </button>
      </div>
    );
  }

  if (user && !user.has_github) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm text-center">
        <h2 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
          {'>'} link_github()
        </h2>
        <p className="text-green-600 font-mono text-sm mb-6">
          Link your GitHub account to start earning $ABC tokens for your code contributions.
        </p>
        <button
          onClick={handleGithubLink}
          disabled={linkingGithub}
          className="bg-green-900/50 hover:bg-green-800/60 border border-green-700/50 hover:border-green-600 
                     text-green-400 hover:text-green-300 px-6 py-3 rounded-lg font-mono font-semibold
                     transition-all duration-300 matrix-button matrix-glow disabled:opacity-50"
        >
          {linkingGithub ? 'Linking...' : 'Link GitHub Account'}
        </button>
      </div>
    );
  }

  if (user) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-responsive-lg font-bold mb-4 text-green-400 matrix-glow font-mono">
          {'>'} user_authenticated()
        </h2>
        <div className="space-y-3 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-green-600">Status:</span>
            <span className="text-green-400">
              {user.is_member ? '✅ Member' : '❌ Not a member'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">GitHub:</span>
            <span className="text-green-400">
              {user.has_github ? `✅ ${user.github_username}` : '❌ Not linked'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Can Earn:</span>
            <span className="text-green-400">
              {user.can_earn_rewards ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Total Commits:</span>
            <span className="text-green-400">{user.total_commits || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Total Earned:</span>
            <span className="text-green-400">{user.total_earned || 0} $ABC</span>
          </div>
        </div>
        
        {user.can_earn_rewards && (
          <div className="mt-6 pt-4 border-t border-green-900/30">
            <p className="text-green-400 font-mono text-sm text-center">
              🎉 You're all set! Start contributing to earn $ABC rewards.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm text-center">
      <p className="text-green-600 font-mono text-sm">Loading authentication status...</p>
    </div>
  );
}