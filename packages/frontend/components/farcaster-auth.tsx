'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFarcaster } from '@/contexts/unified-farcaster-context';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: {
    url: string;
  };
}

function FarcasterAuthContent() {
  const { user, login, isLoading } = useFarcaster();
  const [loading, setLoading] = useState(false);
  const [isInFrame, setIsInFrame] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we're in a Farcaster frame context
    const fid = searchParams.get('fid');
    const inFrame = window !== window.top || 
                    window.location !== window.parent.location ||
                    !!fid ||
                    navigator.userAgent.includes('farcaster') ||
                    window.location.href.includes('frame');
    
    setIsInFrame(inFrame);
    
    // Handle Neynar OAuth callback
    const neynarCode = searchParams.get('code');
    const neynarState = searchParams.get('state');
    
    if (neynarCode && !user) {
      handleNeynarCallback(neynarCode, neynarState);
    } else if (fid) {
      fetchUserData(parseInt(fid));
    }
  }, [searchParams, user]);

  const handleNeynarCallback = async (code: string, state: string | null) => {
    setLoading(true);
    try {
      console.log('Processing Neynar OAuth callback...');
      
      // Call backend to exchange code for user data
      const response = await fetch('/api/auth/farcaster/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const userData = {
            fid: data.user.fid,
            username: data.user.username,
            displayName: data.user.displayName || data.user.username,
            pfpUrl: data.user.pfpUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${data.user.username}`
          };
          login(userData);
          
          // Clean up URL by removing OAuth params
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        console.error('Neynar OAuth failed:', await response.text());
      }
    } catch (error) {
      console.error('Neynar callback error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (fid: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${fid}`);
      const data = await response.json();
      if (data) {
        const userData = {
          fid: data.fid,
          username: data.username,
          displayName: data.displayName,
          pfpUrl: data.pfp?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${data.username}`
        };
        login(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.href);
    const authUrl = `https://app.neynar.com/login?client_id=${clientId}&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  };

  // Handle both browser and frame modes
  if (!isInFrame) {
    // Browser mode - show connect button if no user
    if (user) {
      return (
        <div className="flex items-center gap-3 bg-purple-900/20 border border-purple-700/50 rounded-lg px-4 py-3">
          <img 
            src={user.pfpUrl} 
            alt={user.displayName}
            className="w-10 h-10 rounded-full border border-purple-600/50"
          />
          <div className="flex-1">
            <div className="font-semibold text-purple-300 font-mono">{user.displayName}</div>
            <div className="text-purple-500 font-mono text-sm">@{user.username}</div>
          </div>
          <div className="text-green-400 font-mono text-sm">✓ Connected</div>
        </div>
      );
    }

    // Show connect button for web users
    return (
      <div className="space-y-4">
        <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4">
          <p className="text-purple-400 font-mono text-sm mb-3">
            Connect your Farcaster account to enable social features and community announcements.
          </p>
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-purple-900/50 hover:bg-purple-800/70 text-purple-400 font-mono py-2.5 rounded-lg 
                     border border-purple-700/50 transition-all duration-300 hover:matrix-glow
                     disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
          >
            {loading ? '// Connecting...' : 'Connect Farcaster Account'}
          </button>
        </div>
        
        <div className="bg-black/40 border border-purple-900/30 rounded-lg p-3">
          <p className="text-purple-600 font-mono text-xs mb-2">{"// Benefits of connecting:"}</p>
          <ul className="space-y-1 text-purple-500 font-mono text-xs">
            <li>→ Social proof of your contributions</li>
            <li>→ Automatic achievement announcements</li>
            <li>→ Community recognition and leaderboards</li>
            <li>→ Access to exclusive ABC DAO channels</li>
          </ul>
        </div>
      </div>
    );
  }

  // In frame mode, show loading or user info (never a sign-in button)
  if (loading || isLoading) {
    return <div className="animate-pulse text-purple-400">Loading Farcaster user...</div>;
  }

  // In frame context, always show user info if available
  if (user) {
    return (
      <div className="flex items-center gap-3 bg-purple-900/20 rounded-lg px-4 py-2">
        <img 
          src={user.pfpUrl} 
          alt={user.displayName}
          className="w-8 h-8 rounded-full"
        />
        <div className="text-sm">
          <div className="font-semibold">{user.displayName}</div>
          <div className="text-gray-400">@{user.username}</div>
        </div>
      </div>
    );
  }

  // If no user data yet in frame context, show nothing (user data should be automatically available)
  return null;
}

export function FarcasterAuth() {
  return (
    <Suspense fallback={<div className="animate-pulse text-green-600">Loading...</div>}>
      <FarcasterAuthContent />
    </Suspense>
  );
}