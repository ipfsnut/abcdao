'use client';

import Link from 'next/link';

export function WhitepaperButton() {
  return (
    <Link
      href="/whitepaper"
      className="bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                 text-green-400 hover:text-green-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-mono text-xs sm:text-sm 
                 transition-all duration-300 matrix-button min-h-[36px] flex items-center"
    >
      <span className="hidden sm:inline">./whitepaper</span>
      <span className="sm:hidden">WP</span>
    </Link>
  );
}