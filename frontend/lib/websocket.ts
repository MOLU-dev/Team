
import { useEffect, useRef } from 'react';

export type NotificationType = 'balance_update' | 'transaction' | 'deposit' | 'withdrawal';

export interface Notification {
  type: NotificationType;
  user_id?: string;
  message?: string;
  data?: any;
  timestamp: string;
}

export type NotificationHandler = (notification: Notification) => void;

const BASE_RECONNECT_MS = 3_000;
const MAX_RECONNECT_MS  = 30_000;
const MAX_RETRIES       = 10;

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private handlers: Set<NotificationHandler> = new Set();
  private isAuthenticated = false;
  private retryCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.intentionalClose = false;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_API_URL 
      ? new URL(process.env.NEXT_PUBLIC_API_URL).host 
      : window.location.host;
    
    let url = `${protocol}//${host}/api/v1/ws`;
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      url += `?token=${token}`;
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isAuthenticated = true;
      this.retryCount = 0; // Reset backoff on successful connection
    };

    this.ws.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        this.notifyHandlers(notification);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    this.ws.onclose = () => {
      this.isAuthenticated = false;
      if (this.intentionalClose) return;

      if (this.retryCount < MAX_RETRIES) {
        const delay = Math.min(
          BASE_RECONNECT_MS * Math.pow(2, this.retryCount),
          MAX_RECONNECT_MS,
        );
        console.log(`WebSocket disconnected — reconnecting in ${delay}ms (attempt ${this.retryCount + 1}/${MAX_RETRIES})`);
        this.retryCount++;
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      } else {
        console.warn('WebSocket max retries reached — giving up');
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws?.close();
    };
  }

  disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.retryCount = 0;
  }

  subscribe(handler: NotificationHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private notifyHandlers(notification: Notification) {
    this.handlers.forEach(handler => handler(notification));
  }
}

export const wsService = WebSocketService.getInstance();

/**
 * Hook to connect to the WebSocket and optionally handle notifications.
 * Uses a ref internally so changing the handler callback does NOT
 * cause unsubscribe / resubscribe churn.
 */
export function useWebSocket(onNotification?: NotificationHandler) {
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;

  useEffect(() => {
    wsService.connect();

    // Single stable wrapper that delegates to the latest handler via ref
    const stableHandler: NotificationHandler = (n) => {
      handlerRef.current?.(n);
    };

    const unsubscribe = wsService.subscribe(stableHandler);
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return wsService;
}
