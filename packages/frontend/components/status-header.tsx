'use client';

import { useState } from 'react';
import { useMembership } from '@/hooks/useMembership';
import { useRewardsSystematic } from '@/hooks/useRewardsSystematic';
import { useStakingSystematic } from '@/hooks/useStakingSystematic';
import { useTokenSystematic } from '@/hooks/useTokenSystematic';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface StatusDotProps {
  status: 'connected' | 'warning' | 'error' | 'loading';
  size?: 'sm' | 'md';
}

function StatusDot({ status, size = 'sm' }: StatusDotProps) {
  const sizeClasses = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  
  const statusClasses = {
    connected: 'bg-green-400 shadow-green-400/50',
    warning: 'bg-yellow-400 shadow-yellow-400/50', 
    error: 'bg-red-400 shadow-red-400/50',
    loading: 'bg-gray-400 animate-pulse'
  };

  return (
    <div className={`${sizeClasses} rounded-full ${statusClasses[status]} shadow-sm`} />
  );
}

interface StatusItemProps {
  icon: React.ReactNode;
  status: 'connected' | 'warning' | 'error' | 'loading';
  label: string;
  value?: string;
  href?: string;
  onClick?: () => void;
  mobile?: boolean;
}

function StatusItem({ icon, status, label, value, href, onClick, mobile = false }: StatusItemProps) {
  const content = (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-black/20 transition-colors cursor-pointer ${mobile ? 'text-xs' : 'text-sm'}`}>
      <StatusDot status={status} size={mobile ? 'sm' : 'md'} />
      <span className="text-green-400 hidden sm:inline">{icon}</span>
      <span className={`text-green-300 font-mono ${mobile ? 'hidden' : 'hidden md:inline'}`}>
        {label}
      </span>
      {value && (
        <span className={`text-green-400 font-bold font-mono ${mobile ? 'text-xs' : 'text-sm'}`}>
          {value}
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return <button onClick={onClick}>{content}</button>;
  }

  return content;
}

export function StatusHeader() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isConnected, address } = useAccount();
  const membership = useMembership();
  const { tokenData } = useTokenSystematic('ABC');
  const { overview: stakingData } = useStakingSystematic();
  const { data: userRewards } = useRewardsSystematic();

  // Determine GitHub status
  const getGithubStatus = () => {
    if (membership.isLoading) return 'loading';
    if (!membership.githubUsername) return 'error';
    if (!membership.isVerified) return 'warning';
    return 'connected';
  };

  // Determine membership status
  const getMembershipStatus = () => {
    if (membership.isLoading) return 'loading';
    if (!membership.isMember) return 'error';
    return 'connected';
  };

  // Format balance
  const formatBalance = (amount: number | null) => {
    if (!amount) return '$0';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  // Get user's total earned ABC from membership data
  const abcBalance = membership.totalEarned || 0;
  const stakedBalance = stakingData?.userPosition?.stakedAmount || 0;
  const pendingRewards = userRewards?.summary?.totalClaimable || 0;

  return (
    <div className="bg-black/80 backdrop-blur-sm border-b border-green-900/30 sticky top-0 z-50">
      {/* Mobile Status Bar */}
      <div className="lg:hidden px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Left side - Critical status */}
          <div className="flex items-center gap-2">
            <StatusItem
              icon="🔗"
              status={getGithubStatus()}
              label="GitHub"
              href="/dev"
              mobile
            />
            <StatusItem
              icon="👤"
              status={getMembershipStatus()}
              label="Member"
              href="/dev"
              mobile
            />
            {abcBalance > 0 && (
              <StatusItem
                icon="💰"
                status="connected"
                label="ABC"
                value={formatBalance(abcBalance)}
                href="/supply"
                mobile
              />
            )}
          </div>

          {/* Right side - Expandable */}
          <div className="flex items-center gap-2">
            {pendingRewards > 0 && (
              <StatusItem
                icon="⚡"
                status="warning"
                label="Rewards"
                value={formatBalance(pendingRewards)}
                href="/dev"
                mobile
              />
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-green-400 hover:text-green-300"
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded mobile view */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-green-900/30 space-y-1">
            {stakedBalance > 0 && (
              <StatusItem
                icon="🔒"
                status="connected"
                label="Staked"
                value={formatBalance(stakedBalance)}
                href="/staking"
              />
            )}
            <div className="flex justify-center pt-2">
              <ConnectButton.Custom>
                {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="bg-green-600 hover:bg-green-700 text-black px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Connect Wallet
                            </button>
                          );
                        }

                        return (
                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="bg-black/60 border border-green-900/50 text-green-400 px-3 py-1 rounded-lg text-xs font-mono transition-colors hover:border-green-700"
                          >
                            {account.ensName || `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                          </button>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Status Bar */}
      <div className="hidden lg:flex items-center justify-between px-6 py-3">
        {/* Left side - Status indicators */}
        <div className="flex items-center gap-4">
          <StatusItem
            icon="🔗"
            status={getGithubStatus()}
            label={getGithubStatus() === 'connected' ? 'GitHub Connected' : getGithubStatus() === 'warning' ? 'GitHub Needs Verification' : 'GitHub Disconnected'}
            href="/dev"
          />
          <StatusItem
            icon="👤"
            status={getMembershipStatus()}
            label={getMembershipStatus() === 'connected' ? 'DAO Member' : 'Not a Member'}
            href="/dev"
          />
        </div>

        {/* Center - Balances */}
        <div className="flex items-center gap-6">
          {abcBalance > 0 && (
            <StatusItem
              icon="💰"
              status="connected"
              label="ABC Balance"
              value={formatBalance(abcBalance)}
              href="/supply"
            />
          )}
          {stakedBalance > 0 && (
            <StatusItem
              icon="🔒"
              status="connected"
              label="Staked"
              value={formatBalance(stakedBalance)}
              href="/staking"
            />
          )}
          {pendingRewards > 0 && (
            <StatusItem
              icon="⚡"
              status="warning"
              label="Pending Rewards"
              value={formatBalance(pendingRewards)}
              href="/dev"
            />
          )}
        </div>

        {/* Right side - Wallet connection */}
        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}