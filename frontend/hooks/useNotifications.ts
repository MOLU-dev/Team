'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.getNotifications(1); // Fetch at least one to get the count
      if (response.success) {
        setUnreadCount(response.unread_count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh every minute as a fallback
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Handle real-time updates — only refetch on notification-relevant events
  const wsHandler = useCallback((notification: any) => {
    if (['balance_update', 'deposit', 'withdrawal', 'transaction'].includes(notification.type)) {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  useWebSocket(wsHandler);

  return { unreadCount, loading, refresh: fetchUnreadCount };
}
