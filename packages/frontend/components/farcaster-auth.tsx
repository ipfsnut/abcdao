'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: {
    url: string;
  };
}

export function FarcasterAuth() {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we're in a Farcaster mini-app context
    const fid = searchParams.get('fid');
    if (fid) {
      fetchUserData(parseInt(fid));
    }
  }, [searchParams]);

  const fetchUserData = async (fid: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${fid}`);
      const data = await response.json();
      setUser(data);
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

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-purple-900/20 rounded-lg px-4 py-2">
        <img 
          src={user.pfp.url} 
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

  return (
    <button
      onClick={handleSignIn}
      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
    >
      Sign in with Farcaster
    </button>
  );
}