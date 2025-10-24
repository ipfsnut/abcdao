/**
 * Real-Time Notifications Component
 * 
 * Displays real-time notifications for earning rewards, commits, and other activities
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  type: 'commit_reward' | 'milestone' | 'achievement' | 'staking_reward' | 'repo_suggestion' | 'system';
  title: string;
  message: string;
  amount?: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
}

interface RealTimeNotificationsProps {
  user: any;
  isEnabled?: boolean;
}

export function RealTimeNotifications({ user, isEnabled = true }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isEnabled && user) {
      initializeNotifications();
      connectWebSocket();
      
      return () => {
        disconnectWebSocket();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isEnabled, user]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  const initializeNotifications = () => {
    // Load initial notifications (replace with actual API call)
    const initialNotifications: Notification[] = [
      {
        id: '1',
        type: 'commit_reward',
        title: 'Commit Rewarded!',
        message: 'Your commit "feat: implement user authentication" earned rewards',
        amount: '85,000 $ABC',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        isRead: false,
        actionUrl: '/developers#history',
        actionText: 'View Details',
        icon: '💰',
        priority: 'high'
      },
      {
        id: '2',
        type: 'milestone',
        title: 'Milestone Reached!',
        message: 'You\'ve earned over 1M $ABC tokens total',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isRead: false,
        actionUrl: '/developers#analytics',
        actionText: 'View Analytics',
        icon: '🏆',
        priority: 'medium'
      },
      {
        id: '3',
        type: 'staking_reward',
        title: 'Staking Rewards Available',
        message: 'You have 0.0156 ETH ready to claim',
        amount: '0.0156 ETH',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        isRead: true,
        actionUrl: '/staking#rewards',
        actionText: 'Claim Now',
        icon: '🎁',
        priority: 'medium'
      }
    ];
    
    setNotifications(initialNotifications);
  };

  const connectWebSocket = () => {
    if (!user?.wallet_address) return;
    
    try {
      // In production, replace with actual WebSocket URL
      const wsUrl = `wss://abcdao-production.up.railway.app/ws/notifications/${user.wallet_address}`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('🔗 Notifications WebSocket connected');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          handleNewNotification(notification);
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('📡 Notifications WebSocket disconnected');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (isEnabled) connectWebSocket();
        }, 5000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      
      // Fallback to polling for notifications
      startPolling();
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const startPolling = () => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(async () => {
      try {
        // Simulate polling for new notifications
        if (Math.random() < 0.1) { // 10% chance of new notification
          const mockNotification: Notification = {
            id: Date.now().toString(),
            type: 'commit_reward',
            title: 'New Commit Rewarded!',
            message: 'Your latest commit earned ABC tokens',
            amount: `${Math.floor(Math.random() * 50000 + 25000).toLocaleString()} $ABC`,
            timestamp: new Date(),
            isRead: false,
            actionUrl: '/developers#history',
            actionText: 'View Details',
            icon: '💰',
            priority: 'high'
          };
          handleNewNotification(mockNotification);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000); // Poll every 30 seconds
  };

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/abc-logo.png',
        badge: '/icons/abc-badge.png',
        tag: notification.id
      });
    }
    
    // Play notification sound for high priority notifications
    if (notification.priority === 'high') {
      playNotificationSound();
    }
    
    // Auto-open panel for high priority notifications
    if (notification.priority === 'high' && !isOpen) {
      setIsOpen(true);
      // Auto-close after 5 seconds
      setTimeout(() => setIsOpen(false), 5000);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Notification sound not available');
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
      }
    }
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      'commit_reward': 'text-green-400 bg-green-950/20 border-green-700/50',
      'milestone': 'text-yellow-400 bg-yellow-950/20 border-yellow-700/50',
      'achievement': 'text-purple-400 bg-purple-950/20 border-purple-700/50',
      'staking_reward': 'text-blue-400 bg-blue-950/20 border-blue-700/50',
      'repo_suggestion': 'text-cyan-400 bg-cyan-950/20 border-cyan-700/50',
      'system': 'text-gray-400 bg-gray-950/20 border-gray-700/50'
    };
    return colorMap[type as keyof typeof colorMap] || colorMap.system;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isEnabled || !user) return null;

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => requestNotificationPermission()}
          className="relative p-2 text-green-600 hover:text-green-400 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-mono">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          
          {/* Connection Status */}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-yellow-500'
          }`} title={isConnected ? 'Connected' : 'Reconnecting...'}>
          </div>
        </button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute top-16 right-4 w-96 max-w-[90vw] bg-black border border-green-900/50 rounded-xl shadow-2xl z-50">
          {/* Header */}
          <div className="bg-green-950/20 border-b border-green-900/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-green-400 font-mono">Notifications</h3>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-mono text-green-600 hover:text-green-400 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-green-600 hover:text-green-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">🔔</div>
                <h4 className="font-bold text-green-400 mb-2">No Notifications</h4>
                <p className="text-sm text-green-600 font-mono">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-green-950/10 ${
                      notification.isRead 
                        ? 'bg-black/20 border-green-900/20 opacity-75' 
                        : getNotificationColor(notification.type)
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{notification.icon}</span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm text-green-400">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-green-600 font-mono ml-2">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-green-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {notification.amount && (
                          <div className="font-mono font-bold text-green-300 text-sm mt-1">
                            +{notification.amount}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          {notification.actionText && (
                            <span className="text-xs text-green-500 hover:text-green-400 transition-colors">
                              {notification.actionText} →
                            </span>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            className="text-xs text-green-700 hover:text-red-400 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-green-950/20 border-t border-green-900/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-mono">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
                
                <button
                  onClick={clearAllNotifications}
                  className="text-xs font-mono text-green-700 hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click Outside to Close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}