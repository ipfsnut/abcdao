'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { mutate } from 'swr';
import { config } from '@/lib/config';

export interface RealtimeMessage {
  type: string;
  data: any;
  actionId?: string;
  timestamp: number;
}

export interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  connectionId?: string;
  lastPing?: number;
  reconnectAttempts: number;
}

export interface UseRealtimeUpdatesOptions {
  userWallet?: string;
  userFid?: number;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

/**
 * Real-time updates hook for WebSocket connection
 * Handles connection, authentication, and message processing
 */
export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const {
    userWallet,
    userFid,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    debug = false
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    authenticated: false,
    reconnectAttempts: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Log debug messages
  const debugLog = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[RealtimeUpdates] ${message}`, data || '');
    }
  }, [debug]);

  // Clean up function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: RealtimeMessage = JSON.parse(event.data);
      debugLog('Received message', message);

      switch (message.type) {
        case 'connection_established':
          setConnectionStatus(prev => ({
            ...prev,
            connected: true,
            connectionId: message.data.connectionId,
            reconnectAttempts: 0
          }));
          
          // Authenticate if user credentials are available
          if (userWallet && wsRef.current) {
            wsRef.current.send(JSON.stringify({
              type: 'authenticate',
              userWallet,
              userFid
            }));
          }
          break;

        case 'authentication_success':
          setConnectionStatus(prev => ({
            ...prev,
            authenticated: true
          }));
          debugLog('Authentication successful');
          break;

        case 'pong':
          setConnectionStatus(prev => ({
            ...prev,
            lastPing: Date.now()
          }));
          break;

        case 'staking_update':
          handleStakingUpdate(message.data);
          break;

        case 'commit_update':
          handleCommitUpdate(message.data);
          break;

        case 'treasury_update':
          handleTreasuryUpdate(message.data);
          break;

        case 'user_update':
          handleUserUpdate(message.data);
          break;

        case 'staking_rollback':
          handleStakingRollback(message.data);
          break;

        case 'test_message':
          debugLog('Test message received', message.data);
          break;

        case 'error':
          console.warn('[RealtimeUpdates] Server error:', message.data);
          break;

        default:
          debugLog('Unknown message type', message.type);
      }
    } catch (error) {
      console.error('[RealtimeUpdates] Failed to parse message:', error);
    }
  }, [userWallet, userFid, debugLog]);

  // Handle staking updates
  const handleStakingUpdate = useCallback((data: any) => {
    debugLog('Processing staking update', data);
    
    // Update staking overview
    mutate('/api/user-actions/staking/overview', data.globalMetrics, false);
    
    // Update user's specific staking position if it's for this user
    if (data.userWallet === userWallet) {
      mutate(`/api/user-actions/staking/position/${userWallet}`, data.userPosition, false);
    }
    
    // Update staking data in any staking components
    mutate('/api/staking/overview', {
      ...data.globalMetrics,
      apyData: data.apyData,
      topStakers: data.topStakers
    }, false);
  }, [userWallet, debugLog]);

  // Handle commit updates
  const handleCommitUpdate = useCallback((data: any) => {
    debugLog('Processing commit update', data);
    
    // Update leaderboard
    mutate('/api/users/leaderboard', data.leaderboard, false);
    
    // Update user profile if it's for this user
    if (data.userWallet === userWallet) {
      mutate(`/api/users/profile/${userWallet}`, data.user, false);
      mutate(`/api/user-actions/commits/${userWallet}`, (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          commits: [data.commit, ...prev.commits.slice(0, 19)] // Keep latest 20
        };
      }, false);
    }
    
    // Update roster data
    mutate('/api/users/roster', (prev: any) => {
      if (!prev || !prev.developers) return prev;
      
      return {
        ...prev,
        developers: prev.developers.map((dev: any) => 
          dev.wallet_address === data.userWallet 
            ? { ...dev, ...data.user }
            : dev
        )
      };
    }, false);
  }, [userWallet, debugLog]);

  // Handle treasury updates
  const handleTreasuryUpdate = useCallback((data: any) => {
    debugLog('Processing treasury update', data);
    
    // Update treasury data
    mutate('/api/treasury/current', data.treasuryBalance, false);
    
    // Update membership stats if they changed
    if (data.membershipStats) {
      mutate('/api/users/stats', data.membershipStats, false);
    }
  }, [debugLog]);

  // Handle user-specific updates
  const handleUserUpdate = useCallback((data: any) => {
    debugLog('Processing user update', data);
    
    // Update user profile data
    if (data.userWallet === userWallet) {
      mutate(`/api/users/profile/${userWallet}`, data, false);
    }
  }, [userWallet, debugLog]);

  // Handle staking rollbacks
  const handleStakingRollback = useCallback((data: any) => {
    debugLog('Processing staking rollback', data);
    
    // Update staking overview with corrected data
    mutate('/api/user-actions/staking/overview', data.globalMetrics, false);
    
    // Update user's position if it's for this user
    if (data.userWallet === userWallet) {
      mutate(`/api/user-actions/staking/position/${userWallet}`, data.userPosition, false);
    }
    
    // Show error message to user (could be handled by parent component)
    console.warn('[Staking] Transaction failed:', data.message);
  }, [userWallet, debugLog]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    
    cleanup();
    
    const wsUrl = config.backendUrl.replace(/^http/, 'ws') + '/realtime';
    debugLog('Connecting to WebSocket', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        debugLog('WebSocket connected');
        setConnectionStatus(prev => ({
          ...prev,
          connected: true,
          reconnectAttempts: 0
        }));
        
        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        debugLog('WebSocket disconnected', { code: event.code, reason: event.reason });
        
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          authenticated: false
        }));
        
        cleanup();
        
        // Auto-reconnect if enabled and not too many attempts
        if (autoReconnect && 
            connectionStatus.reconnectAttempts < maxReconnectAttempts &&
            mountedRef.current) {
          
          const delay = Math.min(1000 * Math.pow(2, connectionStatus.reconnectAttempts), 30000);
          debugLog(`Reconnecting in ${delay}ms (attempt ${connectionStatus.reconnectAttempts + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionStatus(prev => ({
              ...prev,
              reconnectAttempts: prev.reconnectAttempts + 1
            }));
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('[RealtimeUpdates] WebSocket error:', error);
      };

    } catch (error) {
      console.error('[RealtimeUpdates] Failed to create WebSocket:', error);
    }
  }, [
    handleMessage, 
    autoReconnect, 
    maxReconnectAttempts, 
    connectionStatus.reconnectAttempts,
    debugLog,
    cleanup
  ]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setConnectionStatus(prev => ({
      ...prev,
      reconnectAttempts: 0
    }));
    connect();
  }, [connect]);

  // Send message to server
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Join a room
  const joinRoom = useCallback((roomName: string) => {
    return sendMessage({ type: 'join_room', room: roomName });
  }, [sendMessage]);

  // Leave a room
  const leaveRoom = useCallback((roomName: string) => {
    return sendMessage({ type: 'leave_room', room: roomName });
  }, [sendMessage]);

  // Initialize connection on mount
  useEffect(() => {
    mountedRef.current = true;
    connect();
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [connect, cleanup]);

  // Update authentication when user credentials change
  useEffect(() => {
    if (connectionStatus.connected && !connectionStatus.authenticated && userWallet && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'authenticate',
        userWallet,
        userFid
      }));
    }
  }, [connectionStatus.connected, connectionStatus.authenticated, userWallet, userFid]);

  return {
    connectionStatus,
    connect,
    reconnect,
    sendMessage,
    joinRoom,
    leaveRoom
  };
}