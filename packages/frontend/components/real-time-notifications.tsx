/**
 * Real-time Notifications Component
 * 
 * Provides real-time notifications for user activity using polling
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
  // All hooks must be called before any conditional logic
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string | null>(null);

  useEffect(() => {
    if (isEnabled && user?.wallet_address) {
      initializeNotifications();
      startPolling();
      
      return () => {
        stopPolling();
      };
    }
  }, [isEnabled, user]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  // Early return AFTER all hooks are called
  if (!isEnabled) return null;

  const initializeNotifications = async () => {
    if (!user?.wallet_address) return;
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
      const response = await fetch(`${backendUrl}/api/notifications/${user.wallet_address}?limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform API response to match component interface
      const transformedNotifications: Notification[] = data.notifications.map((notification: any) => ({
        id: notification.id,
        type: notification.type as 'commit_reward' | 'milestone' | 'achievement' | 'staking_reward' | 'repo_suggestion' | 'system',
        title: notification.title,
        message: notification.message,
        amount: notification.amount,
        timestamp: new Date(notification.timestamp),
        isRead: notification.isRead,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        icon: notification.icon,
        priority: notification.priority as 'low' | 'medium' | 'high'
      }));
      
      setNotifications(transformedNotifications);
      setIsConnected(true);
      
      // Set last fetch timestamp for polling
      lastFetchRef.current = new Date().toISOString();
    } catch (error) {
      console.error('Failed to load notifications:', error);
      
      // Fallback to welcome notification
      const fallbackNotifications: Notification[] = [
        {
          id: 'welcome',
          type: 'system',
          title: 'Welcome to ABC DAO!',
          message: 'Start making commits to earn ABC tokens and receive notifications about your rewards.',
          timestamp: new Date(),
          isRead: false,
          actionUrl: '/developers',
          actionText: 'Get Started',
          icon: '👋',
          priority: 'medium'
        }
      ];
      
      setNotifications(fallbackNotifications);
      setIsConnected(false);
    }
  };

  const startPolling = () => {
    // Poll for new notifications every 30 seconds
    intervalRef.current = setInterval(() => {
      pollForNewNotifications();
    }, 30000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pollForNewNotifications = async () => {
    if (!user?.wallet_address || !lastFetchRef.current) return;
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
      const response = await fetch(
        `${backendUrl}/api/notifications/${user.wallet_address}?since=${lastFetchRef.current}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.notifications.length > 0) {
        // Transform and add new notifications
        const newNotifications: Notification[] = data.notifications.map((notification: any) => ({
          id: notification.id,
          type: notification.type as 'commit_reward' | 'milestone' | 'achievement' | 'staking_reward' | 'repo_suggestion' | 'system',
          title: notification.title,
          message: notification.message,
          amount: notification.amount,
          timestamp: new Date(notification.timestamp),
          isRead: notification.isRead,
          actionUrl: notification.actionUrl,
          actionText: notification.actionText,
          icon: notification.icon,
          priority: notification.priority as 'low' | 'medium' | 'high'
        }));
        
        // Add new notifications to the beginning of the list
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 20)); // Keep max 20 notifications
        
        // Update last fetch timestamp
        lastFetchRef.current = new Date().toISOString();
        
        // Show notification if high priority
        newNotifications.forEach(notification => {
          if (notification.priority === 'high') {
            showBrowserNotification(notification);
          }
        });
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to poll for notifications:', error);
      setIsConnected(false);
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
      await fetch(`${backendUrl}/api/notifications/${user.wallet_address}/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
      await fetch(`${backendUrl}/api/notifications/${user.wallet_address}/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-950/20';
      case 'medium': return 'border-yellow-500/50 bg-yellow-950/20';
      case 'low': return 'border-green-500/50 bg-green-950/20';
      default: return 'border-gray-500/50 bg-gray-950/20';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-green-400 hover:text-green-300 transition-colors"
        title="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3.001 3.001 0 11-6 0m6 0H9" />
        </svg>
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* Connection Status Indicator */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-black/95 border border-green-900/50 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-green-900/30">
            <h3 className="text-lg font-bold text-green-400 font-mono">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-green-600 hover:text-green-400 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={requestNotificationPermission}
                className="text-xs text-green-600 hover:text-green-400 transition-colors"
                title="Enable browser notifications"
              >
                🔔
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-green-600 font-mono text-sm">No notifications yet</p>
                <p className="text-green-700 text-xs mt-1">Start making commits to see updates!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-l-4 hover:bg-green-950/10 transition-colors cursor-pointer ${
                    getPriorityColor(notification.priority)
                  } ${notification.isRead ? 'opacity-60' : ''}`}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification.id);
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{notification.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-green-400 text-sm">{notification.title}</h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-green-600 text-xs mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-green-700 text-xs font-mono">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {notification.amount && (
                          <span className="text-green-400 text-xs font-mono font-bold">
                            +{notification.amount}
                          </span>
                        )}
                      </div>
                      {notification.actionText && notification.actionUrl && (
                        <button className="text-green-500 text-xs mt-1 hover:text-green-400 transition-colors">
                          {notification.actionText} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-green-900/30 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-green-700">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
              <span className="text-green-800">•</span>
              <span>Updates every 30s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}