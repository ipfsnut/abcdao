'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt, useWriteContract, useReadContract } from 'wagmi';
import { toast } from 'sonner';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { config } from '@/lib/config';
import { CONTRACTS } from '@/lib/contracts';
import { useMembership } from '@/hooks/useMembership';
import { formatEther } from 'viem';

interface MembershipNFTPaymentProps {
  onPaymentComplete?: () => void;
}

export function MembershipNFTPayment({ onPaymentComplete }: MembershipNFTPaymentProps) {
  const { address, isConnected } = useAccount();
  const { user: profile, isInMiniApp } = useFarcaster();
  const membership = useMembership();
  const [hasGithub, setHasGithub] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [needsGithubRelink, setNeedsGithubRelink] = useState(false);

  // Read contract data
  const { data: mintPrice } = useReadContract({
    address: CONTRACTS.ABC_MEMBERSHIP.address,
    abi: CONTRACTS.ABC_MEMBERSHIP.abi,
    functionName: 'MINT_PRICE',
  });

  const { data: hasMembershipNFT } = useReadContract({
    address: CONTRACTS.ABC_MEMBERSHIP.address,
    abi: CONTRACTS.ABC_MEMBERSHIP.abi,
    functionName: 'isMember',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.ABC_MEMBERSHIP.address,
    abi: CONTRACTS.ABC_MEMBERSHIP.abi,
    functionName: 'totalSupply',
  });

  // Write contract for minting
  const { 
    writeContract,
    data: txHash,
    isPending: isMinting,
    isError: isMintError,
    error: mintError
  } = useWriteContract();

  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Format mint price for display
  const formattedMintPrice = mintPrice ? formatEther(mintPrice) : '0.002';

  // Check GitHub link status
  useEffect(() => {
    if (profile?.fid) {
      checkMembershipStatus(profile.fid);
    }
  }, [profile]);

  // Update paid status based on NFT ownership
  useEffect(() => {
    if (hasMembershipNFT !== undefined) {
      setIsPaid(hasMembershipNFT === true);
    }
  }, [hasMembershipNFT]);

  const checkMembershipStatus = async (fid: number) => {
    try {
      const response = await fetch(`${config.backendUrl}/api/users/${fid}/status`);
      if (response.ok) {
        const data = await response.json();
        const hasGithubLinked = !!data.user?.github_username;
        const hasPayment = !!(data.membership_tx_hash || 
                             data.user?.membership_tx_hash || 
                             data.membership_status === 'paid');
        
        setHasGithub(hasGithubLinked);
        
        // For NFT membership, check both database and on-chain
        const hasMembership = hasPayment || (hasMembershipNFT === true);
        setIsPaid(hasMembership);
        
        // Detect users who have paid but need to link GitHub
        setNeedsGithubRelink(hasMembership && !hasGithubLinked);
      }
    } catch (error) {
      console.error('Error checking membership status:', error);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash && profile) {
      verifyNFTMint(txHash);
    }
  }, [isConfirmed, txHash, profile]);

  const verifyNFTMint = async (hash: `0x${string}`) => {
    if (!profile) return;
    
    setVerifying(true);
    try {
      // Process the NFT mint with the backend to update membership
      const response = await fetch(`${config.backendUrl}/api/nft-membership/nft-mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farcasterFid: profile.fid,
          txHash: hash,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ NFT membership processed:', data);
        
        setIsPaid(true);
        toast.success(`Membership NFT #${data.data?.tokenId || 'Unknown'} minted! Welcome to ABC DAO!`);
        
        // Refresh membership status to update header indicators
        membership.refreshStatus();
        onPaymentComplete?.();
      } else {
        const error = await response.json();
        console.error('❌ Backend processing failed:', error);
        
        // Still show success for the NFT mint but warn about profile update
        setIsPaid(true);
        toast.warning('NFT minted successfully but membership update failed. Please refresh the page.');
        membership.refreshStatus();
        onPaymentComplete?.();
      }
    } catch (error) {
      console.error('Error processing NFT mint:', error);
      
      // NFT is minted but backend processing failed
      setIsPaid(true);
      toast.warning('NFT minted successfully but failed to update profile. Please refresh the page.');
      membership.refreshStatus();
      onPaymentComplete?.();
    } finally {
      setVerifying(false);
    }
  };

  const handleMintNFT = async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!mintPrice) {
      toast.error('Failed to load mint price. Please try again.');
      return;
    }

    // Check if already has NFT
    if (hasMembershipNFT === true) {
      toast.error('You already own a membership NFT!');
      return;
    }

    // Recheck membership status to prevent race conditions
    if (profile) {
      await checkMembershipStatus(profile.fid);
      if (isPaid) {
        toast.error('Membership already active! Refreshing page...');
        setTimeout(() => window.location.reload(), 2000);
        return;
      }
    }

    try {
      console.log('Minting membership NFT...');
      console.log('Contract:', CONTRACTS.ABC_MEMBERSHIP.address);
      console.log('Mint Price:', formatEther(mintPrice), 'ETH');
      console.log('From:', address);
      
      writeContract({
        address: CONTRACTS.ABC_MEMBERSHIP.address,
        abi: CONTRACTS.ABC_MEMBERSHIP.abi,
        functionName: 'mint',
        value: mintPrice,
      });
      
      console.log('NFT mint transaction sent');
    } catch (error) {
      console.error('NFT mint error:', error);
      toast.error('Failed to mint membership NFT');
    }
  };

  const handleGithubLinking = async () => {
    if (!profile) {
      toast.error('Please connect your Farcaster account first');
      return;
    }

    try {
      const response = await fetch(`${config.backendUrl}/api/auth/github/authorize`, {
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
        const data = await response.json();
        window.open(data.authUrl, '_blank', 'width=600,height=700');
        toast.success('GitHub linking window opened. Please complete the process.');
        
        // Check for updates every few seconds after opening GitHub linking
        const checkInterval = setInterval(() => {
          if (profile) {
            checkMembershipStatus(profile.fid);
            // Stop checking if GitHub is now linked
            if (hasGithub) {
              clearInterval(checkInterval);
              toast.success('GitHub account linked successfully!');
              // Refresh membership status to update header indicators
              membership.refreshStatus();
            }
          }
        }, 3000);
        
        // Stop checking after 2 minutes
        setTimeout(() => clearInterval(checkInterval), 120000);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to start GitHub linking');
      }
    } catch (error) {
      console.error('GitHub linking error:', error);
      toast.error('Failed to start GitHub linking process');
    }
  };

  // Special case: User has NFT but needs to link GitHub
  if (needsGithubRelink) {
    return (
      <div className="bg-black/40 border border-yellow-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-yellow-400 matrix-glow font-mono">
          {'>'} complete_setup()
        </h2>
        <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-yellow-400 font-mono text-sm sm:text-base">🎫 NFT Membership Active</p>
            <span className="text-green-600 font-mono text-xs sm:text-sm">MEMBER</span>
          </div>
          
          <div className="space-y-3 text-xs sm:text-sm font-mono">
            <div className="flex justify-between items-center text-yellow-600">
              <span className="shrink-0">NFT Status:</span>
              <span className="text-green-400 text-right truncate ml-2">✓ OWNED</span>
            </div>
            <div className="flex justify-between items-center text-yellow-600">
              <span className="shrink-0">GitHub:</span>
              <span className="text-red-400 text-right truncate ml-2">⚠️ NOT LINKED</span>
            </div>
            <div className="flex justify-between items-center text-yellow-600">
              <span className="shrink-0">Total NFTs:</span>
              <span className="text-green-400 text-right truncate ml-2">#{totalSupply?.toString() || '...'}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-black/40 border border-yellow-900/30 rounded-lg">
            <p className="text-yellow-600 font-mono text-xs mb-2">{"// Action Required:"}</p>
            <p className="text-yellow-400 font-mono text-xs mb-3">
              Link your GitHub account to start earning $ABC for commits
            </p>
            
            <button
              onClick={handleGithubLinking}
              className="w-full bg-yellow-900/50 hover:bg-yellow-900/70 text-yellow-400 font-mono py-2 sm:py-2.5 rounded-lg 
                       border border-yellow-700/50 transition-all duration-300 hover:matrix-glow
                       text-sm sm:text-base font-bold"
            >
              LINK GITHUB ACCOUNT
            </button>
          </div>

          <div className="mt-3 p-3 bg-black/40 border border-yellow-900/30 rounded-lg">
            <p className="text-yellow-600 font-mono text-xs mb-2">{"// After linking GitHub:"}</p>
            <ul className="space-y-1 text-yellow-400 font-mono text-xs">
              <li>→ Start earning $ABC for commits</li>
              <li>→ Access full DAO benefits</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (isPaid || hasMembershipNFT === true) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} nft_membership_status()
        </h2>
        <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-400 font-mono text-sm sm:text-base">🎫 NFT Member #{totalSupply?.toString() || '...'}</p>
            <span className="text-green-600 font-mono text-xs sm:text-sm">MEMBER</span>
          </div>
          
          <div className="space-y-2 text-xs sm:text-sm font-mono">
            <div className="flex justify-between items-center text-green-600">
              <span className="shrink-0">NFT Status:</span>
              <span className="text-green-400 text-right truncate ml-2">✓ OWNED</span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span className="shrink-0">GitHub:</span>
              <span className="text-green-400 text-right truncate ml-2">✓ Linked</span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span className="shrink-0">Collection:</span>
              <span className="text-green-400 text-right truncate ml-2">October 2025</span>
            </div>
          </div>

          <div className="mt-3 p-3 bg-black/40 border border-green-900/30 rounded-lg">
            <p className="text-green-600 font-mono text-xs mb-2">{"// NFT Benefits:"}</p>
            <ul className="space-y-1 text-green-400 font-mono text-xs">
              <li>→ Tradeable membership proof</li>
              <li>→ Earn $ABC for commits</li>
              <li>→ October 2025 collectible</li>
            </ul>
          </div>

          <div className="mt-3 p-3 bg-black/40 border border-green-900/30 rounded-lg">
            <p className="text-green-600 font-mono text-xs mb-2">{"// View on marketplaces:"}</p>
            <a 
              href={`https://opensea.io/assets/base/${CONTRACTS.ABC_MEMBERSHIP.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono text-xs underline"
            >
              🌊 View on OpenSea
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
        {'>'} mint_membership_nft()
      </h2>
      
      <div className="space-y-4">
        {/* Requirements Checklist */}
        <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3">
          <h3 className="font-mono text-green-400 mb-2 text-sm">{"// Requirements:"}</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className={profile ? "text-green-400" : "text-yellow-400"}>
                {profile ? "✓" : "○"}
              </span>
              <span className={profile ? "text-green-600" : "text-yellow-600"}>
                Farcaster connected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasGithub ? "text-green-400" : "text-yellow-400"}>
                {hasGithub ? "✓" : "○"}
              </span>
              <span className={hasGithub ? "text-green-600" : "text-yellow-600"}>
                GitHub linked
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={isConnected ? "text-green-400" : "text-yellow-400"}>
                {isConnected ? "✓" : "○"}
              </span>
              <span className={isConnected ? "text-green-600" : "text-yellow-600"}>
                Wallet connected
              </span>
            </div>
          </div>
        </div>

        {/* NFT Info */}
        <div className="bg-black/60 border border-green-900/30 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-600 font-mono text-sm">NFT Mint Price:</span>
            <span className="text-green-400 font-mono text-base font-bold">{formattedMintPrice} ETH</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-600 font-mono text-sm">Collection:</span>
            <span className="text-green-400 font-mono text-sm">October 2025</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-600 font-mono text-sm">Total Minted:</span>
            <span className="text-green-400 font-mono text-sm">#{totalSupply?.toString() || 'Loading...'}</span>
          </div>
          <p className="text-green-600 font-mono text-xs mt-2">
            {"// Tradeable membership proof NFT"}
          </p>
        </div>

        {/* Mint Button */}
        {!hasGithub ? (
          <div className="space-y-4">
            <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-3">
              <p className="text-yellow-400 font-mono text-sm text-center mb-2">
                ⚠️ GitHub not linked yet
              </p>
              <p className="text-yellow-600 font-mono text-xs text-center">
                You can mint now and link GitHub later to start earning
              </p>
            </div>
            
            <button
              onClick={handleMintNFT}
              disabled={isMinting || isConfirming || verifying || !isConnected}
              className="w-full bg-yellow-900/50 hover:bg-yellow-900/70 text-yellow-400 font-mono py-2.5 sm:py-3 rounded-lg 
                       border border-yellow-700/50 transition-all duration-300 hover:matrix-glow
                       disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-bold"
            >
              {isMinting ? '// Minting NFT...' : 
               isConfirming ? '// Confirming...' :
               verifying ? '// Processing...' :
               !isConnected ? 'CONNECT WALLET TO MINT' :
               `MINT MEMBERSHIP NFT (${formattedMintPrice} ETH)`}
            </button>
          </div>
        ) : (
          <button
            onClick={handleMintNFT}
            disabled={isMinting || isConfirming || verifying || !isConnected}
            className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono py-2.5 sm:py-3 rounded-lg 
                     border border-green-700/50 transition-all duration-300 hover:matrix-glow
                     disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-bold"
          >
            {isMinting ? '// Minting NFT...' : 
             isConfirming ? '// Confirming...' :
             verifying ? '// Processing...' :
             !isConnected ? 'CONNECT WALLET TO MINT' :
             `MINT MEMBERSHIP NFT (${formattedMintPrice} ETH)`}
          </button>
        )}

        {/* Transaction Status */}
        {txHash && (
          <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3">
            <p className="text-green-600 font-mono text-xs mb-1">{"// Transaction:"}</p>
            <p className="text-green-400 font-mono text-xs break-all">
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
            {isConfirmed && (
              <p className="text-green-400 font-mono text-xs mt-2">
                ✓ NFT Minted - Welcome to ABC DAO!
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {isMintError && (
          <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3">
            <p className="text-red-400 font-mono text-xs">
              Error: {mintError?.message || 'NFT mint failed'}
            </p>
          </div>
        )}

        {/* What Happens Next */}
        <div className="bg-black/40 border border-green-900/30 rounded-lg p-3">
          <p className="text-green-600 font-mono text-xs mb-2">{"// After minting:"}</p>
          <ol className="space-y-1 text-green-500 font-mono text-xs">
            <li>1. NFT appears in your wallet</li>
            <li>2. Membership verified on-chain</li>
            <li>3. {hasGithub ? 'Start earning $ABC for commits' : 'Link GitHub to start earning'}</li>
            <li>5. Tradeable on NFT marketplaces</li>
          </ol>
        </div>
      </div>
    </div>
  );
}