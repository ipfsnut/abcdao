'use client';

import { useState, useEffect } from 'react';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { useAccount } from 'wagmi';

interface ProfileOwnership {
  isOwner: boolean;
  authMethod: 'farcaster' | 'wallet' | 'none';
  canManage: boolean;
  authUser: {
    fid?: number;
    username?: string;
    walletAddress?: string;
  } | null;
}

export function useProfileOwnership(profileDevname: string): ProfileOwnership {
  const { user: farcasterUser, isAuthenticated: isFarcasterAuth } = useFarcaster();
  const { address: walletAddress, isConnected: isWalletConnected } = useAccount();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile data to get user identifiers
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
        const response = await fetch(`${backendUrl}/api/users-commits/profile/${profileDevname}`);
        
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.warn('Failed to fetch profile data for ownership check:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profileDevname) {
      fetchProfileData();
    }
  }, [profileDevname]);

  // Determine ownership and authentication method
  const ownership: ProfileOwnership = (() => {
    if (loading || !profileData) {
      return {
        isOwner: false,
        authMethod: 'none',
        canManage: false,
        authUser: null
      };
    }

    // Check Farcaster authentication
    if (isFarcasterAuth && farcasterUser) {
      const isOwnerByFarcaster = 
        farcasterUser.fid === profileData.identifiers?.farcasterFid ||
        farcasterUser.username === profileData.profile?.farcasterUsername;

      if (isOwnerByFarcaster) {
        return {
          isOwner: true,
          authMethod: 'farcaster',
          canManage: true,
          authUser: {
            fid: farcasterUser.fid,
            username: farcasterUser.username
          }
        };
      }
    }

    // Check wallet authentication  
    if (isWalletConnected && walletAddress && profileData.identifiers?.walletAddress) {
      const isOwnerByWallet = 
        walletAddress.toLowerCase() === profileData.identifiers.walletAddress.toLowerCase();

      if (isOwnerByWallet) {
        return {
          isOwner: true,
          authMethod: 'wallet',
          canManage: true,
          authUser: {
            walletAddress: walletAddress
          }
        };
      }
    }

    // Not the owner or not authenticated
    const authMethod: 'farcaster' | 'wallet' | 'none' = 
      isFarcasterAuth ? 'farcaster' : 
      isWalletConnected ? 'wallet' : 
      'none';

    return {
      isOwner: false,
      authMethod,
      canManage: false,
      authUser: isFarcasterAuth && farcasterUser ? {
        fid: farcasterUser.fid,
        username: farcasterUser.username
      } : isWalletConnected ? {
        walletAddress: walletAddress
      } : null
    };
  })();

  return ownership;
}

export default useProfileOwnership;