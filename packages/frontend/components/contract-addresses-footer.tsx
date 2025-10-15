'use client';

import { useState } from 'react';
import { CONTRACTS } from '@/lib/contracts';

interface ContractAddressProps {
  label: string;
  address: string;
  symbol?: string;
}

function ContractAddress({ label, address, symbol }: ContractAddressProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const openInExplorer = () => {
    window.open(`https://basescan.org/address/${address}`, '_blank');
  };

  if (!address || address.length === 0) {
    return null;
  }

  return (
    <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-2 font-mono text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="text-green-600 font-medium">
          {label} {symbol && `(${symbol})`}
        </span>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            className="text-green-400 hover:text-green-300 transition-colors px-1 py-0.5 rounded matrix-button"
            title="Copy address"
          >
            {copied ? '✓' : '📋'}
          </button>
          <button
            onClick={openInExplorer}
            className="text-green-400 hover:text-green-300 transition-colors px-1 py-0.5 rounded matrix-button"
            title="View on Basescan"
          >
            🔗
          </button>
        </div>
      </div>
      <div className="text-green-400 break-all text-[10px] leading-tight">
        {address.slice(0, 6)}...{address.slice(-4)}
      </div>
    </div>
  );
}

export function ContractAddressesFooter() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get addresses from environment variables and contracts
  const abcTokenAddress = process.env.NEXT_PUBLIC_ABC_TOKEN_ADDRESS || CONTRACTS.ABC_TOKEN?.address;
  const stakingAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS || CONTRACTS.ABC_STAKING?.address;
  const rewardsAddress = process.env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS || CONTRACTS.ABC_REWARDS?.address;
  const governanceAddress = process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT_ADDRESS;
  const protocolWalletAddress = process.env.NEXT_PUBLIC_PROTOCOL_WALLET_ADDRESS;
  
  // Only show if we have at least one address
  if (!abcTokenAddress && !stakingAddress && !rewardsAddress && !governanceAddress) {
    return null;
  }

  return (
    <footer className="bg-black/80 border-t border-green-900/30 backdrop-blur-sm mt-8">
      <div className="px-4 py-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-green-600 hover:text-green-400 transition-colors font-mono text-xs"
        >
          <span>Contract Addresses {isExpanded ? '▼' : '▶'}</span>
          <span className="text-green-800">Base Mainnet</span>
        </button>
        
        {isExpanded && (
          <div className="mt-3 space-y-2">
            {abcTokenAddress && (
              <ContractAddress
                label="ABC Token"
                address={abcTokenAddress}
                symbol={CONTRACTS.ABC_TOKEN?.symbol || 'ABC'}
              />
            )}
            
            {stakingAddress && (
              <ContractAddress
                label="ABC Staking"
                address={stakingAddress}
              />
            )}
            
            {rewardsAddress && (
              <ContractAddress
                label="ABC Rewards"
                address={rewardsAddress}
              />
            )}
            
            {governanceAddress && (
              <ContractAddress
                label="ABC Governance"
                address={governanceAddress}
              />
            )}
            
            {protocolWalletAddress && (
              <ContractAddress
                label="Protocol Wallet"
                address={protocolWalletAddress}
              />
            )}
            
            <div className="text-center pt-2 border-t border-green-900/30">
              <p className="text-green-700 font-mono text-[10px]">
                Click addresses to copy • Click 🔗 to view on Basescan
              </p>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}