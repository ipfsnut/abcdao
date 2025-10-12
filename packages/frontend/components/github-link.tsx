'use client';

import { useState, useEffect } from 'react';
import { useFarcasterUser } from '@/contexts/farcaster-context';
import { config, isInFrame, getCallbackUrl } from '@/lib/config';

export function GitHubLinkPanel() {
  const { user: profile } = useFarcasterUser();
  const [isLinked, setIsLinked] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [inFrame, setInFrame] = useState(false);

  useEffect(() => {
    // Detect if we're in a Farcaster frame or iframe
    setInFrame(isInFrame());
    
    // Check if user has already linked their GitHub
    if (profile?.fid) {
      checkGitHubLink(profile.fid);
    }
  }, [profile]);

  const checkGitHubLink = async (fid: number) => {
    try {
      const response = await fetch(`${config.backendUrl}/api/users/${fid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.github_username) {
          setIsLinked(true);
          setGithubUsername(data.github_username);
        }
      }
    } catch (error) {
      console.error('Error checking GitHub link:', error);
    }
  };

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

  if (!profile) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} link_github()
        </h2>
        <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 sm:p-6 text-center">
          <p className="text-green-600 font-mono mb-2 text-xs sm:text-sm">{"// Auth required"}</p>
          <p className="text-green-400 font-mono text-sm sm:text-base">Connect Farcaster first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
        {'>'} link_github()
      </h2>
      
      <div className="space-y-4">
        {isLinked ? (
          <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-green-400 font-mono text-sm sm:text-base">✓ Linked</p>
              <span className="text-green-600 font-mono text-xs sm:text-sm">@{githubUsername}</span>
            </div>
            
            <div className="space-y-2 text-xs sm:text-sm font-mono">
              <div className="flex justify-between text-green-600">
                <span>Status:</span>
                <span className="text-green-400">ACTIVE</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>FC:</span>
                <span className="text-green-400">@{profile.username}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>FID:</span>
                <span className="text-green-400">{profile.fid}</span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-black/40 border border-green-900/30 rounded-lg">
              <p className="text-green-600 font-mono text-xs mb-2">{"// Next:"}</p>
              <ul className="space-y-1 text-green-400 font-mono text-xs">
                <li>→ Push commits = $ABC</li>
                <li>→ Merge PRs = Bonus</li>
                <li>→ Stake $ABC = ETH</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3">
              <h3 className="font-mono text-green-400 mb-2 text-sm">{"// How it works:"}</h3>
              <ol className="space-y-1 text-green-600 font-mono text-xs">
                <li>1. Link GitHub</li>
                <li>2. Push commits</li>
                <li>3. Earn $ABC</li>
                <li>4. Stake for ETH</li>
              </ol>
            </div>

            <div className="bg-black/60 border border-green-900/30 rounded-lg p-3">
              <p className="text-green-600 font-mono text-xs mb-2">{"// Connected:"}</p>
              <div className="flex items-center gap-2">
                <img 
                  src={profile.pfp?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.fid}`} 
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
              onClick={linkGitHub}
              disabled={loading}
              className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono py-2.5 sm:py-3 rounded-lg 
                       border border-green-700/50 transition-all duration-300 hover:matrix-glow
                       disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? '// Connecting...' : '$ git connect'}
            </button>

            <div className="text-center">
              <p className="text-green-600 font-mono text-xs">
                {inFrame 
                  ? "// Opens GitHub auth in new tab" 
                  : "// Redirects to GitHub"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}