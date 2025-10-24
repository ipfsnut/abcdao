/**
 * Quick Actions Panel Component
 * 
 * Provides quick access to all major features based on user's profile completeness
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface QuickActionsPanelProps {
  user: any;
  features: any;
  onSectionChange: (section: string) => void;
}

export function QuickActionsPanel({ user, features, onSectionChange }: QuickActionsPanelProps) {
  const router = useRouter();
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const primaryActions = [
    {
      id: 'earning',
      title: 'Start Earning',
      description: 'Connect GitHub and earn $ABC for commits',
      icon: '💰',
      href: '/developers',
      enabled: features?.earning_rewards,
      setupRequired: !user.github_connected,
      setupText: 'Connect GitHub first',
      color: 'green',
      priority: 1
    },
    {
      id: 'staking',
      title: 'Stake & Earn',
      description: 'Stake $ABC tokens to earn ETH rewards',
      icon: '🏦',
      href: '/staking',
      enabled: true,
      setupRequired: false,
      color: 'blue',
      priority: 2
    },
    {
      id: 'repositories',
      title: 'Manage Repos',
      description: 'Setup and manage your earning repositories',
      icon: '📁',
      href: '/developers',
      enabled: features?.repository_management,
      setupRequired: !user.github_connected,
      setupText: 'Connect GitHub first',
      color: 'purple',
      priority: 3
    },
    {
      id: 'community',
      title: 'Join Community',
      description: 'Connect with other developers and builders',
      icon: '👥',
      href: '/community',
      enabled: true,
      setupRequired: false,
      color: 'orange',
      priority: 4
    }
  ];

  const secondaryActions = [
    {
      id: 'treasury',
      title: 'Treasury',
      description: 'View DAO finances and analytics',
      icon: '💼',
      href: '/treasury',
      enabled: true
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'View and edit your developer profile',
      icon: '👤',
      href: `/profile?address=${user.wallet_address}`,
      enabled: true
    },
    {
      id: 'docs',
      title: 'Documentation',
      description: 'Learn how to maximize your earnings',
      icon: '📚',
      href: '/docs',
      enabled: true
    }
  ];

  const handleActionClick = (action: any) => {
    if (!action.enabled && action.setupRequired) {
      onSectionChange('setup');
      return;
    }
    
    router.push(action.href);
  };

  const getActionColorClasses = (color: string, enabled: boolean) => {
    const baseClasses = "transition-all duration-200";
    
    if (!enabled) {
      return `${baseClasses} bg-gray-950/30 border-gray-700/50 text-gray-400 hover:border-gray-600/50`;
    }
    
    const colorMap = {
      green: `${baseClasses} bg-green-950/20 border-green-900/50 text-green-400 hover:border-green-700/70 hover:bg-green-900/30 hover:matrix-glow`,
      blue: `${baseClasses} bg-blue-950/20 border-blue-900/50 text-blue-400 hover:border-blue-700/70 hover:bg-blue-900/30`,
      purple: `${baseClasses} bg-purple-950/20 border-purple-900/50 text-purple-400 hover:border-purple-700/70 hover:bg-purple-900/30`,
      orange: `${baseClasses} bg-orange-950/20 border-orange-900/50 text-orange-400 hover:border-orange-700/70 hover:bg-orange-900/30`
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.green;
  };

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
        <h2 className="text-xl font-bold text-green-400 mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {primaryActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              className={`p-4 rounded-lg border text-left ${getActionColorClasses(action.color, action.enabled)}`}
              disabled={!action.enabled && action.setupRequired}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{action.icon}</span>
                {action.enabled ? (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                )}
              </div>
              
              <h3 className="font-semibold font-mono text-sm mb-1">
                {action.title}
              </h3>
              
              <p className="text-xs opacity-80 mb-2">
                {action.description}
              </p>
              
              {action.setupRequired && (
                <div className="text-xs font-mono bg-black/40 px-2 py-1 rounded">
                  {action.setupText}
                </div>
              )}
              
              {hoveredAction === action.id && action.enabled && (
                <div className="text-xs font-mono text-green-300 mt-2">
                  Click to open →
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Setup Progress */}
        <div className="bg-black/20 border border-green-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-mono text-green-600">Setup Progress</span>
            <span className="text-sm font-mono text-green-400">
              {primaryActions.filter(a => a.enabled).length}/{primaryActions.length}
            </span>
          </div>
          <div className="w-full bg-green-950/30 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(primaryActions.filter(a => a.enabled).length / primaryActions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="bg-black/40 border border-green-900/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-green-400 mb-4">More Actions</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {secondaryActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                action.enabled 
                  ? 'bg-green-950/10 border-green-900/30 text-green-400 hover:border-green-700/50 hover:bg-green-950/20'
                  : 'bg-gray-950/10 border-gray-700/30 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!action.enabled}
            >
              <div className="text-xl mb-2">{action.icon}</div>
              <div className="text-xs font-mono">{action.title}</div>
              {('setupRequired' in action && action.setupRequired) ? (
                <div className="text-xs text-yellow-400 mt-1">
                  ⚠️
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-green-400 mb-4">🌟 Feature Highlights</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-green-400">🚀</span>
            <div>
              <div className="text-sm font-mono text-green-400">Auto-Repository Detection</div>
              <div className="text-xs text-green-600">We automatically find and suggest your active repositories</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-blue-400">⚡</span>
            <div>
              <div className="text-sm font-mono text-blue-400">Real-Time Rewards</div>
              <div className="text-xs text-green-600">Get notified instantly when commits are rewarded</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-purple-400">🤖</span>
            <div>
              <div className="text-sm font-mono text-purple-400">Smart Tagging</div>
              <div className="text-xs text-green-600">AI-powered commit analysis for maximum rewards</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}