'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function CollapsibleSection({ 
  title, 
  defaultOpen = false, 
  children, 
  className = "",
  headerClassName = "",
  contentClassName = ""
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-black/40 border border-green-900/50 rounded-xl backdrop-blur-sm ${className}`}>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-green-950/20 transition-all duration-300 rounded-t-xl ${headerClassName}`}
      >
        <h2 className="text-lg sm:text-xl font-bold text-green-400 matrix-glow font-mono">
          {'>'} {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-mono text-xs sm:text-sm">
            {isOpen ? 'Hide' : 'Show'}
          </span>
          {isOpen ? (
            <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className={`px-4 sm:px-6 pb-4 sm:pb-6 border-t border-green-900/30 ${contentClassName}`}>
          <div className="pt-3 sm:pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}