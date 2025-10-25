'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useUniversalAuth } from '@/contexts/universal-auth-context';
import { MembershipNFTPayment } from './membership-nft-payment';

export function WebappAuth() {
  const { address, isConnected } = useAccount();
  const { user, isLoading, error, authenticateByWallet, linkGithub, processMembershipPurchase } = useUniversalAuth();
  const [linkingGithub, setLinkingGithub] = useState(false);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && address && !user && !isLoading) {
      console.log('WebappAuth: Auto-authenticating with wallet:', address);
      authenticateByWallet(address).catch(err => {
        console.error('WebappAuth: Authentication failed:', err);
      });
    }
  }, [isConnected, address, user, isLoading, authenticateByWallet]);

  const handleGithubLink = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    setLinkingGithub(true);
    try {
      // Get GitHub OAuth URL from the universal auth endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app'}/api/universal-auth/github/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
          context: 'webapp'
        }),
      });

      if (response.ok) {
        const { auth_url } = await response.json();
        
        // Open GitHub OAuth in new window
        const githubWindow = window.open(auth_url, '_blank', 'width=600,height=700');
        
        // Poll for connection success
        const pollForConnection = setInterval(async () => {
          try {
            // Re-authenticate to check for GitHub connection
            await authenticateByWallet(address);
            if (user?.has_github) {
              clearInterval(pollForConnection);
              alert(`GitHub account @${user.github_username} linked successfully!`);
              githubWindow?.close();
            }
          } catch (pollError) {
            console.error('Error polling GitHub auth status:', pollError);
          }
        }, 3000);
        
        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollForConnection);
          githubWindow?.close();
        }, 120000);
        
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to initialize GitHub authentication');
      }
    } catch (error) {
      console.error('GitHub linking failed:', error);
      alert('Error connecting to GitHub. Please try again later.');
    } finally {
      setLinkingGithub(false);
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
    return <MembershipNFTPayment />;
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