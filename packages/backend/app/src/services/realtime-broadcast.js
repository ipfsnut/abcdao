import { WebSocketServer } from 'ws';
import { getPool } from './database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Real-time Broadcasting Manager
 * Manages WebSocket connections and broadcasts updates to connected clients
 */
export class RealtimeBroadcastManager {
  static instance = null;

  constructor() {
    this.wss = null;
    this.connections = new Map(); // connectionId -> { ws, userWallet, userFid, rooms }
    this.rooms = new Map(); // roomName -> Set<connectionId>
    this.pool = getPool();
    this.isInitialized = false;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RealtimeBroadcastManager();
    }
    return this.instance;
  }

  /**
   * Initialize the WebSocket server
   */
  initialize(server) {
    if (this.isInitialized) return;

    this.wss = new WebSocketServer({ 
      server,
      path: '/realtime'
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    // Clean up stale connections every 5 minutes
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 5 * 60 * 1000);

    this.isInitialized = true;
    console.log('✅ Real-time broadcast manager initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(ws, request) {
    const connectionId = uuidv4();
    const userAgent = request.headers['user-agent'] || '';
    const ipAddress = request.socket.remoteAddress;

    console.log(`🔌 New WebSocket connection: ${connectionId}`);

    // Store connection
    const connectionData = {
      ws,
      userWallet: null,
      userFid: null,
      rooms: new Set(['global']), // Everyone joins global room
      connectedAt: new Date(),
      lastPingAt: new Date()
    };

    this.connections.set(connectionId, connectionData);
    this.joinRoom(connectionId, 'global');

    // Store in database
    try {
      await this.pool.query(`
        INSERT INTO realtime_connections (
          connection_id, rooms, user_agent, ip_address
        ) VALUES ($1, $2, $3, $4)
      `, [connectionId, ['global'], userAgent, ipAddress]);
    } catch (error) {
      console.warn('Failed to store connection in database:', error.message);
    }

    // Set up message handlers
    ws.on('message', (data) => {
      this.handleMessage(connectionId, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    ws.on('error', (error) => {
      console.warn(`WebSocket error for ${connectionId}:`, error.message);
      this.handleDisconnection(connectionId);
    });

    // Send connection confirmation
    this.sendToConnection(connectionId, {
      type: 'connection_established',
      connectionId,
      timestamp: Date.now(),
      availableRooms: ['global', 'user_specific', 'leaderboard', 'staking', 'treasury']
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  async handleMessage(connectionId, data) {
    try {
      const message = JSON.parse(data.toString());
      const connection = this.connections.get(connectionId);
      
      if (!connection) return;

      // Update last ping time
      connection.lastPingAt = new Date();

      switch (message.type) {
        case 'authenticate':
          await this.handleAuthentication(connectionId, message);
          break;
          
        case 'join_room':
          await this.handleJoinRoom(connectionId, message.room);
          break;
          
        case 'leave_room':
          await this.handleLeaveRoom(connectionId, message.room);
          break;
          
        case 'ping':
          this.sendToConnection(connectionId, { type: 'pong', timestamp: Date.now() });
          break;
          
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.warn(`Failed to handle message from ${connectionId}:`, error.message);
    }
  }

  /**
   * Handle user authentication
   */
  async handleAuthentication(connectionId, message) {
    const { userWallet, userFid, signature } = message;
    const connection = this.connections.get(connectionId);
    
    if (!connection) return;

    // TODO: Add signature verification here
    // For now, we'll trust the frontend authentication

    // Update connection data
    connection.userWallet = userWallet;
    connection.userFid = userFid;

    // Add to user-specific room
    if (userWallet) {
      const userRoom = `user:${userWallet}`;
      this.joinRoom(connectionId, userRoom);
      connection.rooms.add(userRoom);
    }

    // Update database
    try {
      await this.pool.query(`
        UPDATE realtime_connections 
        SET 
          user_wallet = $1,
          user_fid = $2,
          rooms = $3,
          last_ping_at = NOW()
        WHERE connection_id = $4
      `, [
        userWallet, 
        userFid, 
        Array.from(connection.rooms), 
        connectionId
      ]);
    } catch (error) {
      console.warn('Failed to update connection in database:', error.message);
    }

    this.sendToConnection(connectionId, {
      type: 'authentication_success',
      userWallet,
      userFid,
      rooms: Array.from(connection.rooms),
      timestamp: Date.now()
    });

    console.log(`✅ User authenticated: ${userWallet} (${connectionId})`);
  }

  /**
   * Join a room
   */
  joinRoom(connectionId, roomName) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(connectionId);
    
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.rooms.add(roomName);
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(connectionId, roomName) {
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(connectionId);
      if (room.size === 0) {
        this.rooms.delete(roomName);
      }
    }
    
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.rooms.delete(roomName);
    }
  }

  /**
   * Handle room join request
   */
  async handleJoinRoom(connectionId, roomName) {
    // Validate room name
    const validRooms = ['global', 'leaderboard', 'staking', 'treasury'];
    const userRoomPattern = /^user:[a-fA-F0-9x]{42}$/;
    
    if (!validRooms.includes(roomName) && !userRoomPattern.test(roomName)) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: `Invalid room name: ${roomName}`,
        timestamp: Date.now()
      });
      return;
    }

    this.joinRoom(connectionId, roomName);
    
    this.sendToConnection(connectionId, {
      type: 'room_joined',
      room: roomName,
      timestamp: Date.now()
    });
  }

  /**
   * Handle room leave request
   */
  async handleLeaveRoom(connectionId, roomName) {
    if (roomName === 'global') {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Cannot leave global room',
        timestamp: Date.now()
      });
      return;
    }

    this.leaveRoom(connectionId, roomName);
    
    this.sendToConnection(connectionId, {
      type: 'room_left',
      room: roomName,
      timestamp: Date.now()
    });
  }

  /**
   * Handle connection disconnection
   */
  async handleDisconnection(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      // Remove from all rooms
      connection.rooms.forEach(room => {
        this.leaveRoom(connectionId, room);
      });
      
      this.connections.delete(connectionId);
      
      // Remove from database
      try {
        await this.pool.query(`
          DELETE FROM realtime_connections WHERE connection_id = $1
        `, [connectionId]);
      } catch (error) {
        console.warn('Failed to remove connection from database:', error.message);
      }
    }

    console.log(`🔌 WebSocket disconnected: ${connectionId}`);
  }

  /**
   * Send message to specific connection
   */
  sendToConnection(connectionId, message) {
    const connection = this.connections.get(connectionId);
    
    if (connection && connection.ws.readyState === 1) { // OPEN
      try {
        connection.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.warn(`Failed to send to ${connectionId}:`, error.message);
        this.handleDisconnection(connectionId);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Broadcast message to all connections in a room
   */
  async broadcastToRoom(roomName, message) {
    const room = this.rooms.get(roomName);
    if (!room) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    for (const connectionId of room) {
      if (this.sendToConnection(connectionId, message)) {
        sent++;
      } else {
        failed++;
      }
    }

    // Log broadcast to database
    try {
      await this.pool.query(`
        INSERT INTO broadcast_log (
          broadcast_type, target_rooms, message_data, 
          connection_count, successful_sends, failed_sends
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        message.type,
        [roomName],
        message,
        room.size,
        sent,
        failed
      ]);
    } catch (error) {
      console.warn('Failed to log broadcast:', error.message);
    }

    return { sent, failed };
  }

  /**
   * Main broadcast method used by action processors
   */
  async broadcast(broadcastData) {
    const { type, rooms, data, actionId } = broadcastData;
    
    const message = {
      type,
      data,
      actionId,
      timestamp: Date.now()
    };

    const results = [];

    for (const room of rooms) {
      const result = await this.broadcastToRoom(room, message);
      results.push({ room, ...result });
    }

    const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    console.log(`📡 Broadcast ${type}: ${totalSent} sent, ${totalFailed} failed`);
    
    return {
      success: true,
      totalSent,
      totalFailed,
      roomResults: results
    };
  }

  /**
   * Specialized broadcast methods for different update types
   */
  async broadcastStakingUpdate(updateData) {
    return this.broadcast({
      type: 'staking_update',
      rooms: ['global', 'staking'],
      data: updateData,
      actionId: updateData.actionId
    });
  }

  async broadcastCommitUpdate(updateData) {
    const rooms = ['global', 'leaderboard'];
    
    // Add user-specific room if available
    if (updateData.userWallet) {
      rooms.push(`user:${updateData.userWallet}`);
    }

    return this.broadcast({
      type: 'commit_update',
      rooms,
      data: updateData,
      actionId: updateData.actionId
    });
  }

  async broadcastTreasuryUpdate(updateData) {
    return this.broadcast({
      type: 'treasury_update',
      rooms: ['global', 'treasury'],
      data: updateData,
      actionId: updateData.actionId
    });
  }

  async broadcastUserUpdate(updateData) {
    const rooms = ['global'];
    
    if (updateData.userWallet) {
      rooms.push(`user:${updateData.userWallet}`);
    }

    return this.broadcast({
      type: 'user_update',
      rooms,
      data: updateData,
      actionId: updateData.actionId
    });
  }

  /**
   * Clean up stale connections
   */
  async cleanupStaleConnections() {
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes
    const staleConnections = [];

    for (const [connectionId, connection] of this.connections) {
      if (connection.lastPingAt < staleThreshold) {
        staleConnections.push(connectionId);
      }
    }

    for (const connectionId of staleConnections) {
      this.handleDisconnection(connectionId);
    }

    // Clean up database
    try {
      const result = await this.pool.query(`
        DELETE FROM realtime_connections 
        WHERE last_ping_at < NOW() - INTERVAL '10 minutes'
      `);
      
      if (result.rowCount > 0) {
        console.log(`🧹 Cleaned up ${result.rowCount} stale database connections`);
      }
    } catch (error) {
      console.warn('Failed to cleanup stale connections from database:', error.message);
    }

    if (staleConnections.length > 0) {
      console.log(`🧹 Cleaned up ${staleConnections.length} stale WebSocket connections`);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const roomStats = {};
    for (const [roomName, connections] of this.rooms) {
      roomStats[roomName] = connections.size;
    }

    return {
      totalConnections: this.connections.size,
      totalRooms: this.rooms.size,
      roomStats,
      authenticatedUsers: Array.from(this.connections.values())
        .filter(conn => conn.userWallet)
        .length
    };
  }

  /**
   * Send a test message to all connections (for debugging)
   */
  async sendTestMessage(message = 'Test message from server') {
    return this.broadcastToRoom('global', {
      type: 'test_message',
      message,
      timestamp: Date.now()
    });
  }
}