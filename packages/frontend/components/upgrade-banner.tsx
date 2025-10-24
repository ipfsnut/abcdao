'use client';

export function UpgradeBanner() {
  return (
    <div className="bg-yellow-900/30 border-b border-yellow-700/50 px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-300 font-mono">
              System Upgrade in Progress
            </span>
          </div>
          <span className="text-yellow-600">•</span>
          <span className="text-yellow-400 font-mono text-xs">
            Backend integration improvements underway
          </span>
        </div>
      </div>
    </div>
  );
}