export interface ChatMessage {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  messageType: 'text' | 'image' | 'system' | 'ai_admin';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface WebSocketMessage {
  type: 'chat_message' | 'new_message' | 'user_typing' | 'user_online' | 'user_offline';
  chatId?: number;
  senderId?: number;
  content?: string;
  message?: ChatMessage;
  userId?: number;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private userId: number | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  connect(userId: number) {
    this.userId = userId;
    this.createConnection();
  }

  private createConnection() {
    if (!this.userId || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // TODO: Implement WebSocket server on backend before enabling
    console.log('WebSocketManager connection disabled - server not implemented yet');
    return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${this.userId}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyHandlers('connect', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
        this.notifyHandlers('disconnect', { connected: false });
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'new_message':
        this.notifyHandlers('message', message.message);
        break;
      case 'user_typing':
        this.notifyHandlers('typing', { userId: message.userId, chatId: message.chatId });
        break;
      case 'user_online':
        this.notifyHandlers('user_online', { userId: message.userId });
        break;
      case 'user_offline':
        this.notifyHandlers('user_offline', { userId: message.userId });
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private notifyHandlers(event: string, data: any) {
    const handler = this.messageHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.createConnection();
    }, this.reconnectInterval);
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, maintain connection but reduce activity
      return;
    } else {
      // Page is visible, ensure connection is active
      if (this.userId && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
        this.createConnection();
      }
    }
  }

  sendMessage(chatId: number, content: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.userId) {
      const message: WebSocketMessage = {
        type: 'chat_message',
        chatId,
        senderId: this.userId,
        content
      };
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  sendTyping(chatId: number) {
    if (this.ws?.readyState === WebSocket.OPEN && this.userId) {
      const message: WebSocketMessage = {
        type: 'user_typing',
        chatId,
        userId: this.userId
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  on(event: string, handler: (data: any) => void) {
    this.messageHandlers.set(event, handler);
  }

  off(event: string) {
    this.messageHandlers.delete(event);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.messageHandlers.clear();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Global WebSocket manager instance
export const wsManager = new WebSocketManager();
