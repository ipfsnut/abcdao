'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { config, isInFrame, getCallbackUrl } from '@/lib/config';
import { useMembership } from '@/hooks/useMembership';
import { MembershipPaymentPanel } from '@/components/membership-payment';


export function GitHubLinkPanel() {
  const { user: profile, isInMiniApp } = useFarcaster();
  const { isConnected } = useAccount();
  const membership = useMembership();
  const [loading, setLoading] = useState(false);
  const [inFrame, setInFrame] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  
  // Use membership hook as single source of truth
  const isLinked = membership.hasGithub;
  const githubUsername = membership.githubUsername || '';

  useEffect(() => {
    // Detect if we're in a Farcaster frame or iframe
    setInFrame(isInFrame());
    
    // Check for GitHub OAuth success parameters (user returning from GitHub)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('github_success') === 'true') {
      console.log('🔄 GitHub OAuth success detected, refreshing membership status...');
      membership.refreshStatus();
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Listen for OAuth callback messages (from popup/iframe)
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'github_linked' && event.data.success) {
        // Refresh membership status to sync with backend
        membership.refreshStatus();
        setShowPayment(true);
        console.log('✅ GitHub linked via postMessage:', event.data.username);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [membership]);




  const linkGitHub = async () => {
    if (!profile) {
      alert('Please connect your Farcaster account first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/auth/github/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farcasterFid: profile.fid,
          farcasterUsername: profile.username,
          // Include callback URL for proper redirect after GitHub auth
          callbackUrl: getCallbackUrl(),
        }),
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        
        // Handle redirect differently for frames vs regular browser
        if (inFrame) {
          // In a frame, we need to open in a new window/tab
          window.open(authUrl, '_blank');
          alert('Complete GitHub authorization in the new tab, then refresh this page.');
        } else {
          // In regular browser, direct redirect is fine
          window.location.href = authUrl;
        }
      } else {
        alert('Failed to initialize GitHub authentication');
      }
    } catch (error) {
      console.error('Error linking GitHub:', error);
      alert('Error connecting to backend. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const unlinkGitHub = async () => {
    if (!profile) return;
    
    const confirmed = confirm(
      'Are you sure you want to unlink your GitHub account? You can always link it again later.'
    );
    
    if (!confirmed) return;

    setUnlinking(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/auth/github/unlink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farcasterFid: profile.fid,
        }),
      });

      if (response.ok) {
        // Refresh membership status to sync with backend
        membership.refreshStatus();
        setShowPayment(false);
        
        alert('GitHub account unlinked successfully');
      } else {
        const error = await response.json();
        alert(`Failed to unlink GitHub: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error unlinking GitHub:', error);
      alert('Error connecting to backend. Please try again later.');
    } finally {
      setUnlinking(false);
    }
  };

  if (!profile && isInMiniApp) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} join_dao()
        </h2>
        <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4 text-center">
          <p className="text-purple-400 font-mono text-sm mb-2">
            🔄 Loading your Farcaster profile...
          </p>
          <p className="text-green-600 font-mono text-xs">
            This should happen automatically in the miniapp
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} connect_farcaster()
        </h2>
        <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 sm:p-6 text-center">
          <p className="text-green-600 font-mono mb-2 text-xs sm:text-sm">{"// Auth required"}</p>
          <p className="text-green-400 font-mono text-sm sm:text-base">Connect Farcaster first</p>
        </div>
      </div>
    );
  }

  // Show payment panel first (simplified flow)
  if (showPayment && !membership.isMember) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowPayment(false)}
          className="text-green-600 hover:text-green-400 font-mono text-sm transition-colors min-h-[44px] px-3 py-2"
        >
          {'<'} Back
        </button>
        <MembershipPaymentPanel 
          onPaymentComplete={() => {
            setShowPayment(false);
            membership.refreshStatus();
            // GitHub linking will happen in main flow after payment
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
        {membership.isMember && isLinked ? '> member_dashboard()' : '> join_dao()'}
      </h2>
      
      <div className="space-y-4">
        {membership.isMember && isLinked ? (
          // Active Member Dashboard
          <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-green-400 font-mono text-sm sm:text-base">✓ Active Member</p>
              <span className="text-green-600 font-mono text-xs sm:text-sm">@{githubUsername}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-mono">
              <div className="bg-black/40 border border-green-900/30 rounded p-2">
                <span className="text-green-600">Commits:</span>
                <span className="text-green-400 ml-2">{membership.totalCommits || 0}</span>
              </div>
              <div className="bg-black/40 border border-green-900/30 rounded p-2">
                <span className="text-green-600">Earned:</span>
                <span className="text-green-400 ml-2">{membership.totalEarned || 0} $ABC</span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-black/40 border border-green-900/30 rounded-lg">
              <p className="text-green-600 font-mono text-xs mb-2">{"// Reward rates:"}</p>
              <ul className="space-y-1 text-green-400 font-mono text-xs">
                <li>→ Commit = 50k-1M $ABC (random)</li>
                <li>→ Daily limit = 10 commits max</li>
                <li>→ Stake 5M+ $ABC = Premium benefits</li>
              </ul>
            </div>

            <div className="mt-3 space-y-2">
              <button
                onClick={() => {
                  // This would open the repository manager component
                  alert('Repository manager would open here - integrate with your routing system');
                }}
                className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 font-mono py-2.5 rounded-lg 
                         border border-blue-700/50 transition-all duration-300 text-sm min-h-[44px]"
              >
                📁 Manage Repositories
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={unlinkGitHub}
                  disabled={unlinking}
                  className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 font-mono py-2.5 rounded-lg 
                           border border-red-700/50 transition-all duration-300 text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {unlinking ? '⏳ Unlinking...' : '🔗 Unlink GitHub'}
                </button>
                
                <button
                  onClick={membership.refreshStatus}
                  disabled={membership.loading}
                  className="px-4 bg-green-900/30 hover:bg-green-900/50 text-green-400 font-mono py-2.5 rounded-lg 
                           border border-green-700/50 transition-all duration-300 text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  title="Refresh GitHub connection status"
                >
                  {membership.loading ? '🔄' : '↻'}
                </button>
              </div>
            </div>
          </div>
        ) : membership.isMember && !isLinked ? (
          // Member needs to link GitHub
          <div className="space-y-4">
            <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4">
              <p className="text-blue-400 font-mono text-sm mb-2">✓ Membership Active</p>
              <p className="text-green-600 font-mono text-xs">Now link your GitHub to start earning rewards</p>
            </div>
            
            <button
              onClick={linkGitHub}
              disabled={loading}
              className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono py-3 rounded-lg 
                       border border-green-700/50 transition-all duration-300 hover:matrix-glow text-sm sm:text-base
                       disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              {loading ? '🔗 Connecting to GitHub...' : '🔗 Link GitHub Account'}
            </button>
          </div>
        ) : (
          // Non-member signup flow
          <div className="space-y-4">
            <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3">
              <h3 className="font-mono text-green-400 mb-2 text-sm">{"// Simple steps:"}</h3>
              <ol className="space-y-1 text-green-600 font-mono text-xs">
                <li>1. Pay 0.002 ETH membership fee</li>
                <li>2. Link GitHub automatically</li>
                <li>3. Start earning $ABC for commits</li>
              </ol>
            </div>

            <div className="bg-purple-950/10 border border-purple-900/30 rounded-lg p-3">
              <h3 className="font-mono text-purple-400 mb-2 text-sm">{"// Premium benefits:"}</h3>
              <div className="space-y-1 text-purple-600 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">⭐</span>
                  <span>Stake 5M+ $ABC = Skip 0.002 ETH fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">♾️</span>
                  <span>Unlimited repository registrations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">🎯</span>
                  <span>Higher priority reward chances</span>
                </div>
              </div>
            </div>

            <div className="bg-black/60 border border-green-900/30 rounded-lg p-3">
              <p className="text-green-600 font-mono text-xs mb-2">{"// Your profile:"}</p>
              <div className="flex items-center gap-2">
                <img 
                  src={`https://api.dicebear.com/7.x/identicon/svg?seed=${profile.fid}`} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border border-green-700/50"
                />
                <div>
                  <p className="text-green-400 font-mono text-sm">@{profile.username}</p>
                  <p className="text-green-600 font-mono text-xs">FID: {profile.fid}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPayment(true)}
              disabled={!isConnected}
              className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono py-3 rounded-lg 
                       border border-green-700/50 transition-all duration-300 hover:matrix-glow text-sm sm:text-base
                       disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              {!isConnected ? '🔌 Connect Wallet First' : '💰 Pay 0.002 ETH to Join'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}