'use client';

import { useState } from 'react';
import { useFarcaster } from '@/contexts/unified-farcaster-context';

export function MiniAppPrompt() {
  const { isInMiniApp } = useFarcaster();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already in miniapp or if user dismissed it
  if (isInMiniApp || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-950/30 via-green-950/30 to-purple-950/30 border-b border-green-900/30">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📱</div>
            <div>
              <p className="text-green-400 font-mono text-sm font-semibold">
                Add ABC DAO to Farcaster
              </p>
              <p className="text-green-600 font-mono text-xs">
                Get the full experience with wallet integration and social features
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href="https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-900/50 hover:bg-green-800/60 border border-green-700/50 hover:border-green-600 
                       text-green-400 hover:text-green-300 px-3 py-2 rounded-lg font-mono text-xs font-semibold
                       transition-all duration-300 matrix-button matrix-glow"
            >
              Add to Farcaster →
            </a>
            <button
              onClick={() => setDismissed(true)}
              className="text-green-600 hover:text-green-400 font-mono text-xs p-2 transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}