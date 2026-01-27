/**
 * WebSocket Client Service for Real-Time GPS Tracking
 * Implements requirement 4.3 for real-time map updates within 10 seconds
 */

export interface LocationUpdate {
  driverId: string;
  busId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  status: 'active' | 'idle' | 'offline';
  timestamp: string;
}

export interface DriverStatusUpdate {
  driverId: string;
  busId: string;
  routeId: string;
  status: 'active' | 'idle' | 'offline';
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'connection' | 'location_update' | 'driver_status' | 'initial_locations' | 'subscribed' | 'unsubscribed' | 'error' | 'pong' | 'shutdown';
  data?: any;
  clientId?: string;
  area?: string;
  message?: string;
  timestamp: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface WebSocketServiceConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  pingInterval: number;
  connectionTimeout: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketServiceConfig;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;
  private clientId: string | null = null;
  private subscriptions = new Set<string>();
  
  // Event listeners
  private locationUpdateListeners = new Set<(update: LocationUpdate) => void>();
  private statusUpdateListeners = new Set<(update: DriverStatusUpdate) => void>();
  private connectionStatusListeners = new Set<(status: ConnectionStatus) => void>();
  private initialLocationsListeners = new Set<(locations: LocationUpdate[]) => void>();
  private errorListeners = new Set<(error: string) => void>();

  // Statistics
  private stats = {
    messagesReceived: 0,
    messagesSent: 0,
    reconnectCount: 0,
    lastLocationUpdate: null as Date | null,
    connectionStartTime: null as Date | null
  };

  constructor(config: Partial<WebSocketServiceConfig> = {}) {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://bustracking-backend-ehnq.onrender.com/api';
    const wsUrl = baseUrl.replace('http', 'ws').replace('/api', '/ws');
    
    this.config = {
      url: wsUrl,
      reconnectInterval: 5000, // 5 seconds
      maxReconnectAttempts: 10,
      pingInterval: 30000, // 30 seconds
      connectionTimeout: 10000, // 10 seconds
      ...config
    };
  }

  /**
   * Connect to WebSocket server with automatic reconnection
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.setConnectionStatus('connecting');
      console.log(`Connecting to WebSocket server: ${this.config.url}`);

      try {
        this.ws = new WebSocket(this.config.url);
        
        // Connection timeout
        this.connectionTimer = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            this.handleConnectionError('Connection timeout');
            reject(new Error('Connection timeout'));
          }
        }, this.config.connectionTimeout);

        this.ws.onopen = () => {
          this.clearConnectionTimer();
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
          this.stats.connectionStartTime = new Date();
          this.startPingInterval();
          console.log('WebSocket connected successfully');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          this.clearConnectionTimer();
          this.clearPingInterval();
          console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
          
          if (event.code !== 1000) { // Not a normal closure
            this.handleConnectionError(`Connection closed: ${event.reason || 'Unknown reason'}`);
          } else {
            this.setConnectionStatus('disconnected');
          }
        };

        this.ws.onerror = (error) => {
          this.clearConnectionTimer();
          console.error('WebSocket error:', error);
          this.handleConnectionError('WebSocket error occurred');
          reject(error);
        };

      } catch (error) {
        this.clearConnectionTimer();
        console.error('Failed to create WebSocket connection:', error);
        this.handleConnectionError('Failed to create connection');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearReconnectTimer();
    this.clearPingInterval();
    this.clearConnectionTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setConnectionStatus('disconnected');
    this.clientId = null;
    this.subscriptions.clear();
    console.log('WebSocket disconnected');
  }

  /**
   * Subscribe to location updates for a geographic area
   */
  subscribeToArea(area: string, bounds: MapBounds): void {
    if (!this.isConnected()) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    const message = {
      type: 'subscribe',
      area: area,
      bounds: bounds,
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
    this.subscriptions.add(area);
    console.log(`Subscribed to area: ${area}`);
  }

  /**
   * Unsubscribe from location updates for a geographic area
   */
  unsubscribeFromArea(area: string): void {
    if (!this.isConnected()) {
      console.warn('Cannot unsubscribe: WebSocket not connected');
      return;
    }

    const message = {
      type: 'unsubscribe',
      area: area,
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
    this.subscriptions.delete(area);
    console.log(`Unsubscribed from area: ${area}`);
  }

  /**
   * Send ping to server to maintain connection
   */
  private ping(): void {
    if (this.isConnected()) {
      const message = {
        type: 'ping',
        timestamp: new Date().toISOString()
      };
      this.sendMessage(message);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      this.stats.messagesReceived++;
      const message: WebSocketMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'connection':
          this.clientId = message.clientId || null;
          console.log(`WebSocket client ID: ${this.clientId}`);
          break;

        case 'location_update':
          if (message.data) {
            this.stats.lastLocationUpdate = new Date();
            this.notifyLocationUpdateListeners(message.data);
          }
          break;

        case 'driver_status':
          if (message.data) {
            this.notifyStatusUpdateListeners(message.data);
          }
          break;

        case 'initial_locations':
          if (message.data && Array.isArray(message.data)) {
            this.notifyInitialLocationsListeners(message.data);
          }
          break;

        case 'subscribed':
          console.log(`Successfully subscribed to area: ${message.area}`);
          break;

        case 'unsubscribed':
          console.log(`Successfully unsubscribed from area: ${message.area}`);
          break;

        case 'pong':
          // Server responded to ping - connection is healthy
          break;

        case 'error':
          console.error('WebSocket server error:', message.message);
          this.notifyErrorListeners(message.message || 'Unknown server error');
          break;

        case 'shutdown':
          console.log('Server is shutting down:', message.message);
          this.setConnectionStatus('disconnected');
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.notifyErrorListeners('Failed to parse server message');
    }
  }

  /**
   * Send message to WebSocket server
   */
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.stats.messagesSent++;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.notifyErrorListeners('Failed to send message to server');
      }
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Handle connection errors and implement reconnection logic
   */
  private handleConnectionError(error: string): void {
    console.error('WebSocket connection error:', error);
    this.setConnectionStatus('error');
    this.notifyErrorListeners(error);
    
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('Max reconnection attempts reached');
      this.setConnectionStatus('disconnected');
    }
  }

  /**
   * Schedule automatic reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.setConnectionStatus('reconnecting');
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.stats.reconnectCount++;
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start ping interval to maintain connection health
   */
  private startPingInterval(): void {
    this.clearPingInterval();
    this.pingTimer = setInterval(() => {
      this.ping();
    }, this.config.pingInterval);
  }

  /**
   * Clear timers
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * Set connection status and notify listeners
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.notifyConnectionStatusListeners(status);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      ...this.stats,
      connectionStatus: this.connectionStatus,
      clientId: this.clientId,
      subscriptions: Array.from(this.subscriptions),
      isConnected: this.isConnected()
    };
  }

  // Event listener management methods
  onLocationUpdate(listener: (update: LocationUpdate) => void): () => void {
    this.locationUpdateListeners.add(listener);
    return () => this.locationUpdateListeners.delete(listener);
  }

  onStatusUpdate(listener: (update: DriverStatusUpdate) => void): () => void {
    this.statusUpdateListeners.add(listener);
    return () => this.statusUpdateListeners.delete(listener);
  }

  onConnectionStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.connectionStatusListeners.add(listener);
    return () => this.connectionStatusListeners.delete(listener);
  }

  onInitialLocations(listener: (locations: LocationUpdate[]) => void): () => void {
    this.initialLocationsListeners.add(listener);
    return () => this.initialLocationsListeners.delete(listener);
  }

  onError(listener: (error: string) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  // Notification methods
  private notifyLocationUpdateListeners(update: LocationUpdate): void {
    this.locationUpdateListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in location update listener:', error);
      }
    });
  }

  private notifyStatusUpdateListeners(update: DriverStatusUpdate): void {
    this.statusUpdateListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in status update listener:', error);
      }
    });
  }

  private notifyConnectionStatusListeners(status: ConnectionStatus): void {
    this.connectionStatusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  private notifyInitialLocationsListeners(locations: LocationUpdate[]): void {
    this.initialLocationsListeners.forEach(listener => {
      try {
        listener(locations);
      } catch (error) {
        console.error('Error in initial locations listener:', error);
      }
    });
  }

  private notifyErrorListeners(error: string): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }
}

// Create and export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;