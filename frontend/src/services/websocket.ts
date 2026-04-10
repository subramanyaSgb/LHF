type MessageHandler = (data: unknown) => void;

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;

  connect(channel: string, path: string): void {
    if (this.connections.has(channel)) {
      return;
    }

    const url = `${WS_BASE_URL}${path}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      this.reconnectAttempts.set(channel, 0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const channelHandlers = this.handlers.get(channel);
        if (channelHandlers) {
          channelHandlers.forEach((handler) => handler(data));
        }
      } catch {
        // non-JSON message
      }
    };

    ws.onclose = () => {
      this.connections.delete(channel);
      this.attemptReconnect(channel, path);
    };

    ws.onerror = () => {
      ws.close();
    };

    this.connections.set(channel, ws);
  }

  private attemptReconnect(channel: string, path: string): void {
    const attempts = this.reconnectAttempts.get(channel) || 0;
    if (attempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, attempts);
    const timer = setTimeout(() => {
      this.reconnectAttempts.set(channel, attempts + 1);
      this.connect(channel, path);
    }, delay);

    this.reconnectTimers.set(channel, timer);
  }

  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler);

    return () => {
      this.handlers.get(channel)?.delete(handler);
    };
  }

  disconnect(channel: string): void {
    const ws = this.connections.get(channel);
    if (ws) {
      ws.close();
      this.connections.delete(channel);
    }
    const timer = this.reconnectTimers.get(channel);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(channel);
    }
    this.handlers.delete(channel);
    this.reconnectAttempts.delete(channel);
  }

  disconnectAll(): void {
    for (const channel of this.connections.keys()) {
      this.disconnect(channel);
    }
  }

  isConnected(channel: string): boolean {
    const ws = this.connections.get(channel);
    return ws?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager();
