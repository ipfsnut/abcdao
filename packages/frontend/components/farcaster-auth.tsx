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
    
    if (fid) {
      fetchUserData(parseInt(fid));
    }
  }, [searchParams]);

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

  // In browser mode, don't show Farcaster auth at all
  if (!isInFrame) {
    return null;
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