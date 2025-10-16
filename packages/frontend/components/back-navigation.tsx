'use client';

import Link from 'next/link';
import Image from 'next/image';

interface BackNavigationProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

export function BackNavigation({ title, subtitle, showLogo = true }: BackNavigationProps) {
  return (
    <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showLogo && (
              <Link href="/">
                <Image 
                  src="/abc-logo.png" 
                  alt="ABC Logo" 
                  className="w-10 h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  width={40}
                  height={40}
                />
              </Link>
            )}
            <div>
              <h1 className="text-xl font-bold matrix-glow">
                {'>'} {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-green-600">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/"
            className="bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                     text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-mono text-sm
                     transition-all duration-200 matrix-button"
          >
            ← Back to App
          </Link>
        </div>
      </div>
    </header>
  );
}