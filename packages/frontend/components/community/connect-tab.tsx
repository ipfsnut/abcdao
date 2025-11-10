/**
 * Connect Tab Component
 * 
 * Discord and Farcaster integration for community access
 */

'use client';

import { useState } from 'react';

interface ConnectTabProps {
  user: any;
  communityData: {
    discordMembers: number;
    socialConnections: number;
  };
  onDataUpdate: () => void;
}

export function ConnectTab({ user, communityData, onDataUpdate }: ConnectTabProps) {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleDiscordConnect = async () => {
    setIsConnecting('discord');
    
    if (!user?.farcaster_fid && !user?.fid) {
      alert('Please connect your Farcaster account first');
      setIsConnecting(null);
      return;
    }

    try {
      // Get Discord OAuth URL from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app'}/api/universal-auth/discord/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farcaster_fid: user.farcaster_fid || user.fid,
          farcaster_username: user.farcaster_username || user.username,
          context: 'webapp'
        }),
      });

      if (response.ok) {
        const { auth_url } = await response.json();
        
        // Open Discord OAuth in new window
        const discordWindow = window.open(auth_url, '_blank', 'width=600,height=700');
        
        // Poll for connection success
        const pollForConnection = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app'}/api/users/${user.farcaster_fid || user.fid}/status`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.user?.discord_username) {
                clearInterval(pollForConnection);
                alert(`Discord account @${statusData.user.discord_username} connected successfully!`);
                onDataUpdate();
                discordWindow?.close();
              }
            }
          } catch (pollError) {
            console.error('Error polling Discord auth status:', pollError);
          }
        }, 3000);
        
        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollForConnection);
          discordWindow?.close();
        }, 120000);
        
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to initialize Discord authentication');
      }
    } catch (error) {
      console.error('Error connecting Discord:', error);
      alert('Error connecting to Discord. Please try again later.');
    }
    
    setIsConnecting(null);
  };

  const handleFarcasterConnect = async () => {
    setIsConnecting('farcaster');
    
    try {
      // Check if we're in a mini-app context first
      const isMiniApp = window !== window.top || 
                        window.location !== window.parent.location ||
                        navigator.userAgent.includes('farcaster') ||
                        window.location.href.includes('frame');

      if (isMiniApp) {
        // In mini-app, user should already be authenticated
        alert('You are already connected via Farcaster mini-app!');
        onDataUpdate();
        setIsConnecting(null);
        return;
      }

      // For web users, redirect to Neynar OAuth
      const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;
      if (!clientId) {
        alert('Farcaster authentication not configured');
        setIsConnecting(null);
        return;
      }

      const redirectUri = encodeURIComponent(window.location.href);
      const authUrl = `https://app.neynar.com/login?client_id=${clientId}&redirect_uri=${redirectUri}`;
      
      // Open in new window for OAuth flow
      const farcasterWindow = window.open(authUrl, '_blank', 'width=600,height=700');
      
      // Monitor for successful authentication
      const pollForConnection = setInterval(() => {
        try {
          // Check localStorage for updated user data
          const storedUser = localStorage.getItem('abc_farcaster_user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            if (userData.fid && userData.username) {
              clearInterval(pollForConnection);
              alert(`Farcaster account @${userData.username} connected successfully!`);
              onDataUpdate();
              farcasterWindow?.close();
            }
          }
        } catch (pollError) {
          console.error('Error polling Farcaster auth status:', pollError);
        }
      }, 2000);
      
      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollForConnection);
        farcasterWindow?.close();
      }, 120000);
      
    } catch (error) {
      console.error('Error connecting Farcaster:', error);
      alert('Error connecting to Farcaster. Please try again later.');
    }
    
    setIsConnecting(null);
  };

  const integrations = [
    {
      id: 'discord',
      name: 'Discord',
      icon: '💬',
      description: 'Join our Discord server for real-time chat, support, and collaboration',
      connected: user?.discord_connected,
      memberCount: communityData.discordMembers,
      benefits: [
        'Real-time developer chat',
        'Technical support channels',
        'Community events and AMAs',
        'Early access to features',
        'Developer role and perks'
      ],
      connectAction: handleDiscordConnect,
      connectText: user?.discord_connected ? 'Open Discord' : 'Join Discord Server',
      color: 'blue'
    },
    {
      id: 'farcaster',
      name: 'Farcaster',
      icon: '🌐',
      description: 'Connect your Farcaster account for social features and announcements',
      connected: user?.farcaster_connected,
      memberCount: 1247, // Farcaster followers
      benefits: [
        'Social proof of achievements',
        'Automated achievement posts',
        'Community feed integration',
        'Direct cast from mini-app',
        'Enhanced profile features'
      ],
      connectAction: handleFarcasterConnect,
      connectText: user?.farcaster_connected ? 'Manage Farcaster' : 'Connect Farcaster',
      color: 'purple'
    }
  ];

  const getConnectionColor = (color: string, connected: boolean) => {
    if (!connected) {
      return 'bg-black/20 border-green-900/30 hover:border-green-700/50';
    }
    
    const colorMap = {
      blue: 'bg-blue-950/20 border-blue-700/50',
      purple: 'bg-purple-950/20 border-purple-700/50'
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getTextColor = (color: string) => {
    const colorMap = {
      blue: 'text-blue-400',
      purple: 'text-purple-400'
    };
    
    return colorMap[color as keyof typeof colorMap] || 'text-green-400';
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Overview */}
      <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-2">🌐 Social Connections</h3>
            <p className="text-sm text-green-600 font-mono">
              Connect with the ABC DAO community across platforms
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {communityData.socialConnections}/2
            </div>
            <div className="text-sm text-green-600">Connected</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-mono text-green-600">Connection Progress</span>
            <span className="text-sm font-mono text-green-400">
              {Math.round((communityData.socialConnections / 2) * 100)}%
            </span>
          </div>
          <div className="w-full bg-green-950/30 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-600 to-green-400 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${(communityData.socialConnections / 2) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {communityData.socialConnections === 2 ? (
          <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🎉</div>
            <div className="text-sm font-bold text-green-400 mb-1">Fully Connected!</div>
            <div className="text-xs text-green-600">You have access to all community features</div>
          </div>
        ) : (
          <div className="bg-yellow-950/20 border border-yellow-700/30 rounded-lg p-4 text-center">
            <div className="text-lg mb-2">🚀</div>
            <div className="text-sm font-bold text-yellow-400 mb-1">
              {2 - communityData.socialConnections} more connection{2 - communityData.socialConnections !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-green-600">
              Complete all connections to unlock premium community features
            </div>
          </div>
        )}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className={`border rounded-xl p-6 transition-all duration-200 ${getConnectionColor(integration.color, integration.connected)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <h4 className={`text-lg font-bold font-mono ${getTextColor(integration.color)}`}>
                    {integration.name}
                  </h4>
                  <div className="text-xs text-green-600">
                    {integration.memberCount.toLocaleString()} members
                  </div>
                </div>
              </div>
              
              <div className={`w-4 h-4 rounded-full ${
                integration.connected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
              }`}></div>
            </div>
            
            <p className="text-sm text-green-600 mb-4">
              {integration.description}
            </p>
            
            {/* Benefits */}
            <div className="mb-6">
              <div className="text-sm font-mono text-green-600 mb-2">What you get:</div>
              <ul className="space-y-1">
                {integration.benefits.map((benefit, i) => (
                  <li key={i} className="text-xs text-green-700 flex items-center gap-2">
                    <span className={integration.connected ? 'text-green-400' : 'text-gray-400'}>
                      {integration.connected ? '✅' : '⏳'}
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Connection Status */}
            {integration.connected ? (
              <div className="space-y-3">
                <div className="bg-green-950/30 border border-green-700/50 rounded-lg p-3 text-center">
                  <div className="text-sm font-bold text-green-400 mb-1">✅ Connected</div>
                  <div className="text-xs text-green-600">
                    {integration.id === 'discord' ? `@${user.discord_username}` : `@${user.farcaster_username}`}
                  </div>
                </div>
                
                <button
                  onClick={integration.connectAction}
                  disabled={isConnecting === integration.id}
                  className={`w-full py-2 px-4 rounded-lg font-mono text-sm transition-colors ${
                    integration.color === 'blue'
                      ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-800/60'
                      : 'bg-purple-900/50 text-purple-400 hover:bg-purple-800/60'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isConnecting === integration.id ? '🔄 Opening...' : integration.connectText}
                </button>
              </div>
            ) : (
              <button
                onClick={integration.connectAction}
                disabled={isConnecting === integration.id}
                className={`w-full py-3 px-4 rounded-lg font-mono font-bold text-sm transition-all duration-200 ${
                  integration.color === 'blue'
                    ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-800/60 hover:matrix-glow'
                    : 'bg-purple-900/50 text-purple-400 hover:bg-purple-800/60'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isConnecting === integration.id ? '🔄 Connecting...' : `🔗 ${integration.connectText}`}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Community Guidelines */}
      <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">📋 Community Guidelines</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">✅ Do's</h5>
            <ul className="space-y-2 text-xs text-green-700">
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                Be respectful and helpful to fellow developers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                Share knowledge and collaborate on projects
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                Use appropriate channels for different topics
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                Provide constructive feedback and suggestions
              </li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-sm font-mono text-green-600 mb-3">❌ Don'ts</h5>
            <ul className="space-y-2 text-xs text-green-700">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                Spam, self-promote, or post off-topic content
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                Share confidential or sensitive information
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                Engage in harassment or discriminatory behavior
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                Discuss prices, trading, or financial advice
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">🔗 Quick Links</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Discord Server', url: 'https://discord.gg/abcdao', icon: '💬' },
            { label: 'Farcaster Channel', url: 'https://warpcast.com/abc-dao', icon: '🌐' },
            { label: 'Developer Docs', url: '/docs', icon: '📚' },
            { label: 'Code of Conduct', url: '/docs/conduct', icon: '📋' }
          ].map((link, i) => (
            <a
              key={i}
              href={link.url}
              target={link.url.startsWith('http') ? '_blank' : '_self'}
              rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="p-3 bg-black/40 border border-green-900/30 rounded-lg text-center hover:border-green-700/50 hover:bg-green-950/10 transition-all duration-200 group"
            >
              <div className="text-lg mb-1">{link.icon}</div>
              <div className="text-xs font-mono text-green-600 group-hover:text-green-400 transition-colors">
                {link.label}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}