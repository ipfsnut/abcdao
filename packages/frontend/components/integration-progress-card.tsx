/**
 * Integration Progress Card Component
 * 
 * Shows user's integration status and progress toward full feature access
 */

'use client';

import { useState } from 'react';

interface IntegrationProgressCardProps {
  user: any;
  features: any;
}

export function IntegrationProgressCard({ user, features }: IntegrationProgressCardProps) {
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);

  const integrations = [
    {
      id: 'wallet',
      name: 'Wallet',
      icon: '💳',
      connected: true, // Always true if we're here
      required: true,
      description: 'Your crypto identity and gateway to ABC DAO',
      features: ['View tokens', 'Stake ABC', 'Claim rewards'],
      status: 'Connected',
      color: 'text-green-400'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: '💻',
      connected: user?.github_connected || false,
      required: false,
      description: 'Connect to earn ABC tokens for your code contributions',
      features: ['Earn from commits', 'Repository management', 'Auto-detection'],
      status: user?.github_connected ? `@${user?.github_username || 'unknown'}` : 'Not connected',
      color: user?.github_connected ? 'text-green-400' : 'text-yellow-400',
      setupAction: 'connect_github'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: '💬',
      connected: user?.discord_connected || false,
      required: false,
      description: 'Join the community for support and collaboration',
      features: ['Community access', 'Role management', 'Direct support'],
      status: user?.discord_connected ? (user?.discord_username || 'Connected') : 'Not connected',
      color: user?.discord_connected ? 'text-blue-400' : 'text-gray-400',
      setupAction: 'connect_discord'
    },
    {
      id: 'farcaster',
      name: 'Farcaster',
      icon: '🌐',
      connected: user?.farcaster_connected || false,
      required: false,
      description: 'Enable social features and achievement announcements',
      features: ['Social proof', 'Cast integration', 'Mini-app features'],
      status: user?.farcaster_connected ? `@${user?.farcaster_username || 'unknown'}` : 'Not connected',
      color: user?.farcaster_connected ? 'text-purple-400' : 'text-gray-400',
      setupAction: 'connect_farcaster'
    }
  ];

  const connectedCount = integrations.filter(i => i.connected).length;
  const totalCount = integrations.length;
  const progressPercentage = (connectedCount / totalCount) * 100;

  const handleIntegrationClick = (integration: any) => {
    if (!integration.connected && integration.setupAction) {
      // Handle setup action
      console.log(`Setup ${integration.id}`);
    }
    
    setExpandedIntegration(
      expandedIntegration === integration.id ? null : integration.id
    );
  };

  return (
    <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-green-400">Integrations</h3>
        <span className="text-sm font-mono text-green-600">
          {connectedCount}/{totalCount}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-mono text-green-600">Profile Setup</span>
          <span className="text-sm font-mono text-green-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-green-950/30 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-green-600 to-green-400 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Integration List */}
      <div className="space-y-3">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className={`border rounded-lg transition-all duration-200 ${
              integration.connected
                ? 'border-green-700/50 bg-green-950/10'
                : 'border-green-900/30 bg-black/20 hover:border-green-700/30 cursor-pointer'
            }`}
            onClick={() => handleIntegrationClick(integration)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{integration.icon}</span>
                  <div>
                    <div className={`font-semibold font-mono text-sm ${integration.color}`}>
                      {integration.name}
                      {integration.required && (
                        <span className="ml-2 text-xs text-red-400">*required</span>
                      )}
                    </div>
                    <div className="text-xs text-green-600">
                      {integration.status}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {integration.connected ? (
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  )}
                  
                  <svg 
                    className={`w-4 h-4 transition-transform ${
                      expandedIntegration === integration.id ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedIntegration === integration.id && (
                <div className="mt-4 pt-4 border-t border-green-900/20">
                  <p className="text-xs text-green-600 mb-3">
                    {integration.description}
                  </p>
                  
                  <div className="mb-3">
                    <div className="text-xs font-mono text-green-600 mb-2">Features:</div>
                    <ul className="space-y-1">
                      {integration.features.map((feature, i) => (
                        <li key={i} className="text-xs text-green-700 flex items-center gap-2">
                          <span className={integration.connected ? 'text-green-400' : 'text-gray-400'}>
                            {integration.connected ? '✅' : '⏳'}
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {!integration.connected && integration.setupAction && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle setup action
                        console.log(`Setup ${integration.id}`);
                      }}
                      className="w-full py-2 px-4 bg-green-900/50 hover:bg-green-800/60 text-green-400 rounded-lg font-mono text-sm transition-colors"
                    >
                      Connect {integration.name}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Completion Reward */}
      {progressPercentage === 100 ? (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-lg text-center">
          <div className="text-2xl mb-2">🎉</div>
          <div className="text-sm font-bold text-green-400 mb-1">Profile Complete!</div>
          <div className="text-xs text-green-600">You have access to all ABC DAO features</div>
        </div>
      ) : (
        <div className="mt-4 p-4 bg-black/20 border border-green-900/20 rounded-lg text-center">
          <div className="text-lg mb-2">🚀</div>
          <div className="text-sm font-bold text-green-400 mb-1">
            {totalCount - connectedCount} more integration{totalCount - connectedCount !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-green-600">
            Complete setup to unlock all features
          </div>
        </div>
      )}

      {/* Benefits Preview */}
      <div className="mt-4 p-3 bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/20 rounded-lg">
        <div className="text-xs font-mono text-green-600 mb-2">💡 What you unlock:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`flex items-center gap-1 ${user?.github_connected ? 'text-green-400' : 'text-gray-500'}`}>
            <span>💰</span>
            <span>Commit rewards</span>
          </div>
          <div className={`flex items-center gap-1 ${user?.discord_connected ? 'text-blue-400' : 'text-gray-500'}`}>
            <span>👥</span>
            <span>Community</span>
          </div>
          <div className={`flex items-center gap-1 ${user?.farcaster_connected ? 'text-purple-400' : 'text-gray-500'}`}>
            <span>🌟</span>
            <span>Social proof</span>
          </div>
          <div className={`flex items-center gap-1 ${progressPercentage === 100 ? 'text-yellow-400' : 'text-gray-500'}`}>
            <span>🏆</span>
            <span>All features</span>
          </div>
        </div>
      </div>
    </div>
  );
}