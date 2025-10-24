/**
 * Unified Community Hub Page (/community)
 * 
 * Consolidates community-related features into single interface:
 * - Connect Tab: Discord, Farcaster integration
 * - Support Tab: Help, documentation, contact
 * - Social Tab: Recent activity, announcements
 */

'use client';

import { useState, useEffect } from 'react';
import { useWalletFirstAuth } from '@/hooks/useWalletFirstAuth';
import { BackNavigation } from '@/components/back-navigation';
import { config } from '@/lib/config';

// Import tabbed components
import { ConnectTab } from '@/components/community/connect-tab';
import { SupportTab } from '@/components/community/support-tab';
import { SocialTab } from '@/components/community/social-tab';

type TabId = 'connect' | 'support' | 'social';

export default function UnifiedCommunityHub() {
  const { user, isAuthenticated, features } = useWalletFirstAuth();
  const [activeTab, setActiveTab] = useState<TabId>('connect');
  const [communityData, setCommunityData] = useState({
    discordMembers: 0,
    socialConnections: 0,
    supportTickets: 0,
    isLoading: true
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCommunityData();
    }
  }, [isAuthenticated, user]);

  const loadCommunityData = async () => {
    try {
      // Try to fetch real community data from backend
      const response = await fetch(`${config.backendUrl}/api/community/stats`);
      
      if (response.ok) {
        const data = await response.json();
        setCommunityData({
          discordMembers: data.discord_members || 0, // Use 0 if no real data
          socialConnections: user?.discord_connected && user?.farcaster_connected ? 2 : 
                            user?.discord_connected || user?.farcaster_connected ? 1 : 0,
          supportTickets: data.support_tickets || 0,
          isLoading: false
        });
      } else {
        // Backend doesn't have community stats API yet, try Discord API directly
        const discordMembers = await fetchDiscordMemberCount();
        setCommunityData({
          discordMembers,
          socialConnections: user?.discord_connected && user?.farcaster_connected ? 2 : 
                            user?.discord_connected || user?.farcaster_connected ? 1 : 0,
          supportTickets: 0,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to load community data:', error);
      // Try to get Discord count as fallback
      const discordMembers = await fetchDiscordMemberCount();
      setCommunityData({
        discordMembers,
        socialConnections: user?.discord_connected && user?.farcaster_connected ? 2 : 
                          user?.discord_connected || user?.farcaster_connected ? 1 : 0,
        supportTickets: 0,
        isLoading: false
      });
    }
  };

  const fetchDiscordMemberCount = async (): Promise<number> => {
    try {
      // Try to fetch from a more generic endpoint that might exist
      const response = await fetch(`${config.backendUrl}/api/discord/member-count`);
      if (response.ok) {
        const data = await response.json();
        return data.memberCount || data.member_count || 0;
      }
      
      // If no backend endpoint, show 0 instead of fake data
      return 0;
    } catch (error) {
      console.error('Failed to fetch Discord member count:', error);
      return 0; // Return 0 instead of fake number
    }
  };

  const tabs = [
    {
      id: 'connect' as TabId,
      label: 'Connect',
      icon: '🔗',
      description: 'Join Discord and connect Farcaster',
      count: communityData.socialConnections < 2 ? '!' : null,
      priority: communityData.socialConnections < 2
    },
    {
      id: 'support' as TabId,
      label: 'Support',
      icon: '🛟',
      description: 'Get help and find documentation',
      count: communityData.supportTickets > 0 ? communityData.supportTickets.toString() : null,
      priority: false
    },
    {
      id: 'social' as TabId,
      label: 'Social',
      icon: '📢',
      description: 'Community updates and activity',
      count: null,
      priority: false
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation title="Community Hub" subtitle="Connect with the ABC DAO community" />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="text-4xl mb-6">👥</div>
            <h1 className="text-2xl font-bold text-green-400 matrix-glow mb-4">
              ABC DAO Community
            </h1>
            <p className="text-green-600 font-mono mb-6">
              Connect your wallet to join our vibrant developer community
            </p>
            
            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">Community Features</h3>
              <ul className="space-y-3 text-sm text-green-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Discord community access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Real-time support and help
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Developer collaboration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Governance participation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation title="Community Hub" subtitle="Connect • Support • Collaborate • Govern" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Community Overview Header */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-green-600 mb-1">Social Connections</div>
                <div className="text-2xl font-bold text-green-400">
                  {communityData.isLoading ? '...' : `${communityData.socialConnections}/2`}
                </div>
                <div className="text-xs text-green-700">Discord & Farcaster</div>
              </div>
              
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-blue-600 mb-1">Discord Members</div>
                <div className="text-2xl font-bold text-blue-400">
                  {communityData.isLoading ? '...' : 
                   communityData.discordMembers > 0 ? communityData.discordMembers.toLocaleString() : 'TBD'}
                </div>
                <div className="text-xs text-blue-700">
                  {communityData.discordMembers > 0 ? 'Active community' : 'Coming soon'}
                </div>
              </div>
              
              
              <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4">
                <div className="text-sm font-mono text-purple-600 mb-1">Support Status</div>
                <div className="text-2xl font-bold text-purple-400">
                  {communityData.supportTickets > 0 ? `${communityData.supportTickets} Open` : '✅ All Clear'}
                </div>
                <div className="text-xs text-purple-700">Help tickets</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-green-900/30">
              <nav className="flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    disabled={tab.disabled}
                    className={`relative px-6 py-4 font-mono text-sm font-medium transition-all duration-200 ${
                      tab.disabled
                        ? 'text-green-800 cursor-not-allowed opacity-50'
                        : activeTab === tab.id
                        ? 'text-green-400 border-b-2 border-green-400 bg-green-950/20'
                        : 'text-green-600 hover:text-green-400 hover:bg-green-950/10'
                    } ${tab.priority ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.count && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          tab.count === '!' 
                            ? 'bg-red-900/50 text-red-400' 
                            : 'bg-green-900/50 text-green-400'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                      {tab.disabled && (
                        <span className="bg-gray-900/50 text-gray-500 px-2 py-1 rounded text-xs">
                          Locked
                        </span>
                      )}
                    </div>
                    
                    {activeTab === tab.id && !tab.disabled && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-green-600 to-green-400"></div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Description */}
            <div className="mt-4 text-sm text-green-600 font-mono">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === 'connect' && (
              <ConnectTab 
                user={user}
                communityData={communityData}
                onDataUpdate={loadCommunityData}
              />
            )}
            
            {activeTab === 'support' && (
              <SupportTab 
                user={user}
                supportTickets={communityData.supportTickets}
              />
            )}
            
            {activeTab === 'social' && (
              <SocialTab 
                user={user}
                discordMembers={communityData.discordMembers}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}