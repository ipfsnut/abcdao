/**
 * Social Tab Component
 * 
 * Community updates, announcements, and social activity
 */

'use client';

import { useState, useEffect } from 'react';

interface SocialUpdate {
  id: string;
  type: 'announcement' | 'achievement' | 'milestone' | 'event' | 'news';
  title: string;
  content: string;
  author: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  tags: string[];
  url?: string;
}

interface SocialTabProps {
  user: any;
  discordMembers: number;
}

export function SocialTab({ user, discordMembers }: SocialTabProps) {
  const [updates, setUpdates] = useState<SocialUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'announcements' | 'achievements' | 'events'>('all');

  useEffect(() => {
    loadSocialUpdates();
  }, [filter]);

  const loadSocialUpdates = async () => {
    setIsLoading(true);
    
    // Simulate API call - replace with actual social feed API
    setTimeout(() => {
      const mockUpdates: SocialUpdate[] = [
        {
          id: '1',
          type: 'announcement',
          title: 'New Staking Rewards Distribution',
          content: 'We\'ve increased the ETH rewards pool by 25%! All stakers will see higher daily rewards starting this week. The new APY is approximately 15.2%.',
          author: 'ABC DAO Team',
          timestamp: '2 hours ago',
          likes: 47,
          comments: 12,
          isLiked: false,
          tags: ['staking', 'rewards', 'announcement'],
          url: '/staking'
        },
        {
          id: '2',
          type: 'achievement',
          title: 'Community Milestone: 10M ABC Tokens Distributed!',
          content: 'Amazing work developers! We\'ve officially distributed over 10 million ABC tokens in rewards. This represents thousands of meaningful commits and countless hours of valuable development work.',
          author: 'Community Bot',
          timestamp: '1 day ago',
          likes: 89,
          comments: 23,
          isLiked: true,
          tags: ['milestone', 'developers', 'rewards']
        },
        {
          id: '3',
          type: 'event',
          title: 'Developer AMA - This Friday 3PM UTC',
          content: 'Join our core team for a live AMA session! We\'ll be discussing the upcoming roadmap, answering your questions about earning optimization, and sharing insights about the protocol\'s future.',
          author: 'Events Team',
          timestamp: '2 days ago',
          likes: 34,
          comments: 8,
          isLiked: false,
          tags: ['ama', 'events', 'developers'],
          url: 'https://discord.gg/abcdao'
        },
        {
          id: '4',
          type: 'news',
          title: 'TypeScript Commits Now Earn 25% Bonus',
          content: 'We\'ve updated our reward algorithm to give TypeScript commits a 25% bonus multiplier. This reflects the value of type-safe code in our ecosystem.',
          author: 'Protocol Update',
          timestamp: '3 days ago',
          likes: 56,
          comments: 15,
          isLiked: false,
          tags: ['typescript', 'bonus', 'earning']
        },
        {
          id: '5',
          type: 'achievement',
          title: 'Top Contributor Spotlight: @superdev',
          content: 'Congratulations to @superdev for becoming our first contributor to earn over 500K ABC tokens! Their consistent high-quality commits to the core protocol have been invaluable.',
          author: 'Community Team',
          timestamp: '1 week ago',
          likes: 78,
          comments: 19,
          isLiked: true,
          tags: ['spotlight', 'achievement', 'developer']
        }
      ];
      
      // Filter updates based on selected filter
      const filteredUpdates = filter === 'all' 
        ? mockUpdates 
        : mockUpdates.filter(update => {
            if (filter === 'announcements') return update.type === 'announcement' || update.type === 'news';
            if (filter === 'achievements') return update.type === 'achievement' || update.type === 'milestone';
            if (filter === 'events') return update.type === 'event';
            return false;
          });
      
      setUpdates(filteredUpdates);
      setIsLoading(false);
    }, 800);
  };

  const handleLike = (updateId: string) => {
    setUpdates(prev => 
      prev.map(update => 
        update.id === updateId 
          ? { 
              ...update, 
              isLiked: !update.isLiked,
              likes: update.isLiked ? update.likes - 1 : update.likes + 1
            }
          : update
      )
    );
  };

  const getUpdateIcon = (type: string) => {
    const iconMap = {
      'announcement': '📢',
      'achievement': '🏆',
      'milestone': '🎯',
      'event': '📅',
      'news': '📰'
    };
    return iconMap[type as keyof typeof iconMap] || '📝';
  };

  const getUpdateColor = (type: string) => {
    const colorMap = {
      'announcement': 'text-blue-400 bg-blue-950/20 border-blue-700/50',
      'achievement': 'text-yellow-400 bg-yellow-950/20 border-yellow-700/50',
      'milestone': 'text-purple-400 bg-purple-950/20 border-purple-700/50',
      'event': 'text-green-400 bg-green-950/20 border-green-700/50',
      'news': 'text-cyan-400 bg-cyan-950/20 border-cyan-700/50'
    };
    return colorMap[type as keyof typeof colorMap] || 'text-gray-400 bg-gray-950/20 border-gray-700/50';
  };

  const getTagColor = (tag: string) => {
    const colorMap = {
      'staking': 'text-blue-400 bg-blue-950/20',
      'rewards': 'text-green-400 bg-green-950/20',
      'announcement': 'text-blue-400 bg-blue-950/20',
      'milestone': 'text-purple-400 bg-purple-950/20',
      'developers': 'text-green-400 bg-green-950/20',
      'events': 'text-yellow-400 bg-yellow-950/20',
      'earning': 'text-green-400 bg-green-950/20',
      'typescript': 'text-blue-400 bg-blue-950/20'
    };
    return colorMap[tag as keyof typeof colorMap] || 'text-gray-400 bg-gray-950/20';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-green-950/20 border border-green-900/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-950/30 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-5 bg-green-950/30 rounded mb-2"></div>
                  <div className="h-3 bg-green-950/30 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-green-950/30 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Community Stats */}
      <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-green-400 mb-4">📊 Community Pulse</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-green-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{discordMembers.toLocaleString()}</div>
            <div className="text-sm text-green-600 font-mono">Discord Members</div>
          </div>
          
          <div className="bg-black/40 border border-blue-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">847</div>
            <div className="text-sm text-green-600 font-mono">Active Developers</div>
          </div>
          
          <div className="bg-black/40 border border-purple-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">10.2M</div>
            <div className="text-sm text-green-600 font-mono">ABC Distributed</div>
          </div>
          
          <div className="bg-black/40 border border-yellow-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">1,247</div>
            <div className="text-sm text-green-600 font-mono">Total Commits</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'All Updates', count: updates.length },
          { value: 'announcements', label: 'Announcements', count: updates.filter(u => u.type === 'announcement' || u.type === 'news').length },
          { value: 'achievements', label: 'Achievements', count: updates.filter(u => u.type === 'achievement' || u.type === 'milestone').length },
          { value: 'events', label: 'Events', count: updates.filter(u => u.type === 'event').length }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors flex items-center gap-2 ${
              filter === tab.value
                ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                : 'bg-black/40 text-green-600 border border-green-900/30 hover:text-green-400'
            }`}
          >
            {tab.label}
            <span className="text-xs bg-black/40 px-1 rounded">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Social Feed */}
      <div className="space-y-4">
        {updates.map((update) => (
          <div
            key={update.id}
            className={`border rounded-xl p-6 transition-all duration-200 hover:border-green-700/50 ${getUpdateColor(update.type)}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center text-xl">
                {getUpdateIcon(update.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-green-400 font-mono">
                    {update.title}
                  </h4>
                  <span className="text-xs text-green-600 font-mono ml-4">
                    {update.timestamp}
                  </span>
                </div>
                
                <p className="text-sm text-green-600 mb-4 leading-relaxed">
                  {update.content}
                </p>
                
                {/* Tags */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {update.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-1 rounded text-xs font-mono ${getTagColor(tag)}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(update.id)}
                      className={`flex items-center gap-2 text-sm font-mono transition-colors ${
                        update.isLiked ? 'text-red-400' : 'text-green-600 hover:text-green-400'
                      }`}
                    >
                      <span>{update.isLiked ? '❤️' : '🤍'}</span>
                      {update.likes}
                    </button>
                    
                    <button className="flex items-center gap-2 text-sm font-mono text-green-600 hover:text-green-400 transition-colors">
                      <span>💬</span>
                      {update.comments}
                    </button>
                    
                    <span className="text-xs text-green-700 font-mono">
                      by {update.author}
                    </span>
                  </div>
                  
                  {update.url && (
                    <a
                      href={update.url}
                      target={update.url.startsWith('http') ? '_blank' : '_self'}
                      rel={update.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-sm font-mono text-green-600 hover:text-green-400 transition-colors"
                    >
                      Learn More →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {updates.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📢</div>
          <h4 className="text-lg font-bold text-green-400 mb-2">No Updates Found</h4>
          <p className="text-sm text-green-600 font-mono">
            {filter === 'all' ? 'No community updates available' : `No ${filter} found`}
          </p>
        </div>
      )}

      {/* Community Actions */}
      <div className="bg-gradient-to-r from-green-950/20 via-blue-950/20 to-purple-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">🚀 Get Involved</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/40 border border-green-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">💬</div>
            <h5 className="font-semibold text-green-400 font-mono text-sm mb-2">Join Discord</h5>
            <p className="text-xs text-green-600 mb-3">
              Connect with other developers in real-time
            </p>
            <button
              onClick={() => window.open('https://discord.gg/abcdao', '_blank')}
              className="w-full py-2 bg-blue-900/50 text-blue-400 rounded-lg font-mono text-sm hover:bg-blue-800/60 transition-colors"
            >
              Join Now
            </button>
          </div>
          
          <div className="bg-black/40 border border-purple-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🌐</div>
            <h5 className="font-semibold text-purple-400 font-mono text-sm mb-2">Follow on Farcaster</h5>
            <p className="text-xs text-green-600 mb-3">
              Get updates and share achievements
            </p>
            <button
              onClick={() => window.open('https://warpcast.com/abc-dao', '_blank')}
              className="w-full py-2 bg-purple-900/50 text-purple-400 rounded-lg font-mono text-sm hover:bg-purple-800/60 transition-colors"
            >
              Follow
            </button>
          </div>
          
          <div className="bg-black/40 border border-yellow-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📝</div>
            <h5 className="font-semibold text-yellow-400 font-mono text-sm mb-2">Share Feedback</h5>
            <p className="text-xs text-green-600 mb-3">
              Help us improve the platform
            </p>
            <button
              onClick={() => {}}
              className="w-full py-2 bg-yellow-900/50 text-yellow-400 rounded-lg font-mono text-sm hover:bg-yellow-800/60 transition-colors"
            >
              Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-green-400 mb-4">🔥 Trending Topics</h4>
        
        <div className="flex flex-wrap gap-2">
          {[
            { tag: 'staking-rewards', count: 47 },
            { tag: 'typescript-bonus', count: 34 },
            { tag: 'developer-ama', count: 28 },
            { tag: 'milestone-10m', count: 23 },
            { tag: 'governance', count: 19 },
            { tag: 'community-growth', count: 15 }
          ].map((topic) => (
            <button
              key={topic.tag}
              className="px-3 py-2 bg-black/40 border border-green-900/30 rounded-lg hover:border-green-700/50 hover:bg-green-950/10 transition-all duration-200"
            >
              <span className="text-sm font-mono text-green-400">#{topic.tag}</span>
              <span className="text-xs text-green-600 ml-2">({topic.count})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}