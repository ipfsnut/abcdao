'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useSendTransaction } from 'wagmi';
import { toast } from 'sonner';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { config } from '@/lib/config';
import { TransactionValidator } from './transaction-validator';

// Bot's wallet address for receiving membership payments
const BOT_WALLET_ADDRESS = '0x475579e65E140B11bc4656dD4b05e0CADc8366eB' as `0x${string}`;
const MEMBERSHIP_FEE = '0.002'; // ETH

interface MembershipPaymentPanelProps {
  onPaymentComplete?: () => void;
}

export function MembershipPaymentPanel({ onPaymentComplete }: MembershipPaymentPanelProps) {
  const { address, isConnected } = useAccount();
  const { user: profile } = useFarcaster();
  const [hasGithub, setHasGithub] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [needsGithubRelink, setNeedsGithubRelink] = useState(false);
  
  const { 
    sendTransaction, 
    data: txHash,
    isPending: isSending,
    isError: isSendError,
    error: sendError
  } = useSendTransaction();

  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Check GitHub link status
  useEffect(() => {
    if (profile?.fid) {
      checkMembershipStatus(profile.fid);
    }
  }, [profile]);

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
        setIsPaid(hasPayment);
        
        // Detect users who have paid but need to link GitHub
        setNeedsGithubRelink(hasPayment && !hasGithubLinked);
      }
    } catch (error) {
      console.error('Error checking membership status:', error);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash && profile) {
      verifyPayment(txHash);
    }
  }, [isConfirmed, txHash, profile]);

  const verifyPayment = async (hash: `0x${string}`) => {
    if (!profile) return;
    
    setVerifying(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/membership/verify`, {
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
        setIsPaid(true);
        toast.success('Membership payment verified! Welcome to ABC DAO!');
        onPaymentComplete?.();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment. Please contact support.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePayment = async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!profile) {
      toast.error('Please connect your Farcaster account first');
      return;
    }

    if (!hasGithub) {
      toast.error('Please link your GitHub account first');
      return;
    }

    // Double-check payment status before sending transaction
    if (isPaid) {
      toast.error('Membership already paid! Please refresh the page.');
      return;
    }

    // Recheck membership status to prevent race conditions
    await checkMembershipStatus(profile.fid);
    if (isPaid) {
      toast.error('Payment already processed! Refreshing page...');
      setTimeout(() => window.location.reload(), 2000);
      return;
    }

    try {
      sendTransaction({
        to: BOT_WALLET_ADDRESS,
        value: parseEther(MEMBERSHIP_FEE),
        data: `0x${Buffer.from(`ABC_DAO_MEMBERSHIP_FID:${profile.fid}`).toString('hex')}` as `0x${string}`,
      });
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Failed to send payment transaction');
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

  // Special case: User has paid but needs to link GitHub
  if (needsGithubRelink) {
    return (
      <div className="bg-black/40 border border-yellow-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-yellow-400 matrix-glow font-mono">
          {'>'} complete_setup()
        </h2>
        <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-yellow-400 font-mono text-sm sm:text-base">⚠️ Payment Received</p>
            <span className="text-green-600 font-mono text-xs sm:text-sm">PAID</span>
          </div>
          
          <div className="space-y-3 text-xs sm:text-sm font-mono">
            <div className="flex justify-between text-yellow-600">
              <span>Status:</span>
              <span className="text-yellow-400">PAYMENT CONFIRMED</span>
            </div>
            <div className="flex justify-between text-yellow-600">
              <span>GitHub:</span>
              <span className="text-red-400">⚠️ NOT LINKED</span>
            </div>
            <div className="flex justify-between text-yellow-600">
              <span>Fee Paid:</span>
              <span className="text-green-400">0.002 ETH</span>
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
              <li>→ Participate in governance</li>
              <li>→ Access full DAO benefits</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} membership_status()
        </h2>
        <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-400 font-mono text-sm sm:text-base">✓ Active Member</p>
            <span className="text-green-600 font-mono text-xs sm:text-sm">PAID</span>
          </div>
          
          <div className="space-y-2 text-xs sm:text-sm font-mono">
            <div className="flex justify-between text-green-600">
              <span>Status:</span>
              <span className="text-green-400">ACTIVE</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>GitHub:</span>
              <span className="text-green-400">✓ Linked</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Fee Paid:</span>
              <span className="text-green-400">{MEMBERSHIP_FEE} ETH</span>
            </div>
          </div>

          <div className="mt-3 p-3 bg-black/40 border border-green-900/30 rounded-lg">
            <p className="text-green-600 font-mono text-xs mb-2">{"// You can now:"}</p>
            <ul className="space-y-1 text-green-400 font-mono text-xs">
              <li>→ Earn $ABC for commits</li>
              <li>→ Participate in governance</li>
              <li>→ Stake $ABC for ETH rewards</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
        {'>'} join_dao()
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

        {/* Payment Info */}
        <div className="bg-black/60 border border-green-900/30 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-600 font-mono text-sm">Membership Fee:</span>
            <span className="text-green-400 font-mono text-base font-bold">{MEMBERSHIP_FEE} ETH</span>
          </div>
          <p className="text-green-600 font-mono text-xs">
            {"// One-time payment to join ABC DAO"}
          </p>
        </div>

        {/* Payment Button */}
        {!hasGithub ? (
          <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-3">
            <p className="text-yellow-400 font-mono text-sm text-center">
              ⚠️ Link GitHub first
            </p>
          </div>
        ) : !isConnected ? (
          <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-3">
            <p className="text-yellow-400 font-mono text-sm text-center">
              ⚠️ Connect wallet first
            </p>
          </div>
        ) : (
          <button
            onClick={handlePayment}
            disabled={isSending || isConfirming || verifying || !profile}
            className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono py-2.5 sm:py-3 rounded-lg 
                     border border-green-700/50 transition-all duration-300 hover:matrix-glow
                     disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-bold"
          >
            {isSending ? '// Sending...' : 
             isConfirming ? '// Confirming...' :
             verifying ? '// Verifying...' :
             `PAY ${MEMBERSHIP_FEE} ETH`}
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
                ✓ Confirmed - Verifying membership...
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {isSendError && (
          <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3">
            <p className="text-red-400 font-mono text-xs">
              Error: {sendError?.message || 'Transaction failed'}
            </p>
          </div>
        )}

        {/* What Happens Next */}
        <div className="bg-black/40 border border-green-900/30 rounded-lg p-3">
          <p className="text-green-600 font-mono text-xs mb-2">{"// After payment:"}</p>
          <ol className="space-y-1 text-green-500 font-mono text-xs">
            <li>1. Transaction verified on-chain</li>
            <li>2. Membership activated</li>
            <li>3. Start earning $ABC for commits</li>
            <li>4. Access to DAO governance</li>
          </ol>
        </div>
      </div>

      {/* Transaction Validator */}
      <TransactionValidator onValidationSuccess={() => checkMembershipStatus(profile?.fid!)} />
    </div>
  );
}