/**
 * Notifications Hook
 * 
 * Manages real-time notifications state and actions
 */

'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

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

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  user?: any;
}

export function NotificationProvider({ children, user }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const notification: Notification = {
      ...notificationData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50

    // Show browser notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/abc-logo.png',
        badge: '/icons/abc-badge.png',
        tag: notification.id
      });
    }

    // Play sound for high priority notifications
    if (notification.priority === 'high') {
      playNotificationSound();
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

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently fail if sound can't be played
      });
    } catch (error) {
      // Silently fail if audio not available
    }
  };

  // Initialize with mock notifications for demo
  useEffect(() => {
    if (user && notifications.length === 0) {
      const mockNotifications: Notification[] = [
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
        }
      ];
      
      setNotifications(mockNotifications);
    }
  }, [user]);

  // Simulate WebSocket connection
  useEffect(() => {
    if (user) {
      setIsConnected(true);
      
      // Simulate receiving notifications periodically
      const interval = setInterval(() => {
        if (Math.random() < 0.05) { // 5% chance every 30 seconds
          addNotification({
            type: 'commit_reward',
            title: 'New Commit Rewarded!',
            message: 'Your latest commit earned ABC tokens',
            amount: `${Math.floor(Math.random() * 50000 + 25000).toLocaleString()} $ABC`,
            actionUrl: '/developers#history',
            actionText: 'View Details',
            icon: '💰',
            priority: 'high'
          });
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    requestPermission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Helper hook for creating specific notification types
export function useNotificationHelpers() {
  const { addNotification } = useNotifications();

  const notifyCommitReward = (amount: string, commitMessage: string) => {
    addNotification({
      type: 'commit_reward',
      title: 'Commit Rewarded! 🎉',
      message: `"${commitMessage}" earned ${amount}`,
      amount,
      actionUrl: '/developers#history',
      actionText: 'View Details',
      icon: '💰',
      priority: 'high'
    });
  };

  const notifyMilestone = (milestone: string, description: string) => {
    addNotification({
      type: 'milestone',
      title: `${milestone} Achieved!`,
      message: description,
      actionUrl: '/developers#analytics',
      actionText: 'View Progress',
      icon: '🏆',
      priority: 'medium'
    });
  };

  const notifyStakingReward = (amount: string) => {
    addNotification({
      type: 'staking_reward',
      title: 'Staking Rewards Ready!',
      message: `You have ${amount} ETH ready to claim`,
      amount,
      actionUrl: '/staking#rewards',
      actionText: 'Claim Now',
      icon: '🎁',
      priority: 'medium'
    });
  };

  const notifyRepoSuggestion = (repoName: string, estimatedEarning: string) => {
    addNotification({
      type: 'repo_suggestion',
      title: 'New Repository Detected!',
      message: `${repoName} could earn ~${estimatedEarning} $ABC/month`,
      actionUrl: '/developers#repositories',
      actionText: 'Enable Now',
      icon: '📁',
      priority: 'low'
    });
  };

  const notifyAchievement = (name: string, description: string, reward?: string) => {
    addNotification({
      type: 'achievement',
      title: `Achievement Unlocked: ${name}`,
      message: description,
      amount: reward,
      actionUrl: '/profile',
      actionText: 'View Badge',
      icon: '🏅',
      priority: 'medium'
    });
  };

  return {
    notifyCommitReward,
    notifyMilestone,
    notifyStakingReward,
    notifyRepoSuggestion,
    notifyAchievement
  };
}