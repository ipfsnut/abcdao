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
  const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0xc35c2dCdD084F1Df8a4dDbD374436E35136b4368';

  // Only show if we have at least one address
  if (!abcTokenAddress && !treasuryAddress) {
    return null;
  }

  return (
    <footer className="bg-black/80 border-t border-green-900/30 backdrop-blur-sm mt-8">
      <div className="px-4 py-6">
        {/* Navigation Links */}
        <div className="mb-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Main Navigation */}
            <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <a
                href="/treasury"
                className="text-green-400 hover:text-green-300 font-mono text-sm transition-colors matrix-button"
              >
                💰 Treasury
              </a>
              <a
                href="/community"
                className="text-green-400 hover:text-green-300 font-mono text-sm transition-colors matrix-button"
              >
                👥 Community
              </a>
              <a
                href="/support"
                className="text-green-400 hover:text-green-300 font-mono text-sm transition-colors matrix-button"
              >
                💬 Support
              </a>
              <a
                href="/legal"
                className="text-green-400 hover:text-green-300 font-mono text-sm transition-colors matrix-button"
              >
                📜 Legal
              </a>
            </nav>
            
            {/* Brand & Copyright */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img 
                  src="/ABC_DAO_LOGO.png" 
                  alt="ABC DAO" 
                  className="w-4 h-4"
                />
                <span className="text-green-400 font-mono font-bold">ABC DAO</span>
              </div>
              <p className="text-green-700 font-mono text-xs">
                Always. Be. Coding.
              </p>
            </div>
          </div>
        </div>
        
        {/* Contract Addresses Section */}
        <div className="border-t border-green-900/30 pt-4">
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

            {treasuryAddress && (
              <ContractAddress
                label="Treasury"
                address={treasuryAddress}
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
      </div>
    </footer>
  );
}