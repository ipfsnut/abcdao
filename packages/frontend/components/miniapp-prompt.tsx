'use client';

import { useState, useEffect } from 'react';
import { useFarcaster } from '@/contexts/unified-farcaster-context';

export function MiniAppPrompt() {
  const { isInMiniApp, user } = useFarcaster();
  const [dismissed, setDismissed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if user has previously dismissed this prompt
    const wasDismissed = localStorage.getItem('miniapp-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('miniapp-prompt-dismissed', 'true');
  };

  // Don't show if:
  // - Not client-side rendered yet
  // - Already in miniapp 
  // - User dismissed it
  // - User is accessing via Farcaster but not in miniapp (they likely know about it)
  if (!isClient || isInMiniApp || dismissed || user) {
    return null;
  }

  // Only show to users who are NOT coming from Farcaster at all
  // This targets regular web users who might benefit from knowing about the miniapp

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
              onClick={handleDismiss}
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