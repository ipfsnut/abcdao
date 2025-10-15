'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CollapsibleStatCardProps {
  title: string;
  value: string;
  description?: string;
  href?: string;
  children?: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
}

export function CollapsibleStatCard({
  title,
  value,
  description,
  href,
  children,
  className = '',
  defaultExpanded = false
}: CollapsibleStatCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const cardContent = (
    <div className={`bg-green-950/20 border border-green-900/50 rounded-lg p-3 matrix-button transition-all duration-300 ${
      href ? 'hover:bg-green-900/30 hover:border-green-700/50 cursor-pointer' : ''
    } ${className}`}>
      {/* Header with title, value, and caret */}
      <div 
        className="flex items-center justify-between"
        onClick={(e) => {
          if (!href) {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex-1">
          <p className="text-green-600 text-responsive-xs font-mono">{title}</p>
          <p className="text-responsive-sm font-bold text-green-400 matrix-glow">{value}</p>
          {description && (
            <p className="text-green-500 text-xs font-mono mt-1">{description}</p>
          )}
        </div>
        
        {/* Caret icon */}
        {(children || !href) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="ml-2 p-1 text-green-600 hover:text-green-400 transition-colors duration-200"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-4 h-4 transform transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Expandable content */}
      {children && (
        <div className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'mt-3 opacity-100' : 'max-h-0 opacity-0 mt-0'
        }`}>
          {children}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// Specialized collapsible card for treasury/rewards combination
export function TreasuryRewardsCard({ treasuryBalance, totalRewardsDistributed }: {
  treasuryBalance: string;
  totalRewardsDistributed: string;
}) {
  return (
    <CollapsibleStatCard
      title="Treasury & Rewards"
      value={`${parseFloat(treasuryBalance).toFixed(0)} $ABC`}
      description="Community Treasury"
      href="/treasury"
    >
      <div className="bg-black/40 border border-green-900/30 rounded p-3">
        <h4 className="text-green-400 font-mono text-xs mb-2">ETH Rewards Distributed</h4>
        <p className="text-green-300 font-mono text-sm font-bold">{parseFloat(totalRewardsDistributed).toFixed(3)} ETH</p>
        <p className="text-green-600 font-mono text-xs mt-1">Total rewards paid to stakers</p>
      </div>
    </CollapsibleStatCard>
  );
}