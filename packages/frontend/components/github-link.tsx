'use client';

import { useState, useEffect } from 'react';
import { useFarcasterUser } from '@/contexts/farcaster-context';

export function GitHubLinkPanel() {
  const { user: profile } = useFarcasterUser();
  const [isLinked, setIsLinked] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has already linked their GitHub
    if (profile?.fid) {
      checkGitHubLink(profile.fid);
    }
  }, [profile]);

  const checkGitHubLink = async (fid: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${fid}`);
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
      const response = await fetch('http://localhost:3001/api/auth/github/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farcasterFid: profile.fid,
          farcasterUsername: profile.username,
        }),
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        alert('Failed to initialize GitHub authentication');
      }
    } catch (error) {
      console.error('Error linking GitHub:', error);
      alert('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 max-w-2xl backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4 text-green-400 matrix-glow font-mono">
          {'>'} link_github()
        </h2>
        <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-8 text-center">
          <p className="text-green-600 font-mono mb-4">// Authentication required</p>
          <p className="text-green-400 font-mono">Please connect your Farcaster account to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 max-w-2xl backdrop-blur-sm">
      <h2 className="text-xl font-bold mb-4 text-green-400 matrix-glow font-mono">
        {'>'} link_github()
      </h2>
      
      <div className="space-y-6">
        {isLinked ? (
          <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-green-400 font-mono text-lg">✓ GitHub Linked</p>
              <span className="text-green-600 font-mono">@{githubUsername}</span>
            </div>
            
            <div className="space-y-3 text-sm font-mono">
              <div className="flex justify-between text-green-600">
                <span>Status:</span>
                <span className="text-green-400">ACTIVE</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Farcaster:</span>
                <span className="text-green-400">@{profile.username}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>FID:</span>
                <span className="text-green-400">{profile.fid}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-black/40 border border-green-900/30 rounded-lg">
              <p className="text-green-600 font-mono text-sm mb-2">// Next steps:</p>
              <ul className="space-y-1 text-green-400 font-mono text-sm">
                <li>→ Push commits to earn $ABC</li>
                <li>→ Create PRs for bonus rewards</li>
                <li>→ Stake $ABC for ETH dividends</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
              <h3 className="font-mono text-green-400 mb-3">// How it works:</h3>
              <ol className="space-y-2 text-green-600 font-mono text-sm">
                <li>1. Link your GitHub account</li>
                <li>2. Push commits to any public repo</li>
                <li>3. Earn $ABC tokens automatically</li>
                <li>4. Stake $ABC to earn ETH rewards</li>
              </ol>
            </div>

            <div className="bg-black/60 border border-green-900/30 rounded-lg p-4">
              <p className="text-green-600 font-mono text-sm mb-3">// Connected as:</p>
              <div className="flex items-center gap-3">
                <img 
                  src={profile.pfp?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.fid}`} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full border border-green-700/50"
                />
                <div>
                  <p className="text-green-400 font-mono">@{profile.username}</p>
                  <p className="text-green-600 font-mono text-xs">FID: {profile.fid}</p>
                </div>
              </div>
            </div>

            <button
              onClick={linkGitHub}
              disabled={loading}
              className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono py-3 rounded-lg 
                       border border-green-700/50 transition-all duration-300 hover:matrix-glow
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '// Connecting...' : '$ git connect --github'}
            </button>

            <div className="text-center">
              <p className="text-green-600 font-mono text-xs">
                // This will redirect you to GitHub for authorization
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}