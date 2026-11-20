'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, Check, ArrowLeft, Loader2, X, Info, Copy } from 'lucide-react';
import Link from 'next/link';
import { api, Notification } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';
import { formatDistanceToNow, format } from 'date-fns';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

const fieldLabels: Record<string, string> = {
  tx_hash: 'Transaction Hash',
  tx_type: 'Transaction Type',
  amount: 'Amount',
  currency: 'Currency',
  status: 'Status',
  address: 'Address',
  action_url: 'Action URL',
  network: 'Network',
  fee: 'Fee',
};

function formatKeyLabel(key: string): string {
  return fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function parseNotificationData(data: any): Record<string, any> | null {
  if (!data) return null;
  if (typeof data === 'object' && !Array.isArray(data)) {
    return data;
  }
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) return null;

    // 1. Try direct JSON parsing
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_) {}

    // 2. Try base64 decoding (in case serialized as Go byte slice)
    try {
      const decoded = atob(trimmed);
      const parsed = JSON.parse(decoded);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_) {}
  }
  return null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.getNotifications(50);
      if (response.success) {
        setNotifications(response.notifications);
        setUnreadCount(response.unread_count);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle real-time notifications
  useWebSocket(useCallback((notification: any) => {
    // If we receive a balance update or deposit, refresh notifications
    if (['deposit', 'withdrawal', 'balance_update', 'exchange'].includes(notification.type)) {
      fetchNotifications();
    }
  }, [fetchNotifications]));

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-midnight text-text-primary p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-cyan px-2 py-0.5 rounded-full text-midnight text-xs font-bold">
                  {unreadCount} New
                </span>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAll}
                className="text-sm font-semibold text-cyan hover:text-electric-blue flex items-center gap-2 transition-colors"
              >
                {isMarkingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Mark all as read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card-bg/20 border border-border rounded-3xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-text-secondary" />
              </div>
              <p className="text-text-secondary font-medium">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((n) => (
                <div 
                  key={n.id}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    n.is_read 
                      ? 'bg-card-bg/20 border-border opacity-70 hover:opacity-100' 
                      : 'bg-gradient-to-br from-white/10 to-transparent border-cyan/30 shadow-lg shadow-cyan/5 hover:border-cyan/50'
                  }`}
                  onClick={() => {
                    setSelectedNotification(n);
                    if (!n.is_read) markAsRead(n.id);
                  }}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === 'deposit' ? 'bg-green-500/20 text-green-500' :
                      n.type === 'withdrawal' ? 'bg-red-500/20 text-red-500' :
                      'bg-cyan/20 text-cyan'
                    }`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold">{n.title}</h3>
                        <span className="text-xs text-text-secondary">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 bg-cyan rounded-full mt-2 ring-4 ring-cyan/20" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notification Details Modal */}
          {selectedNotification && (
            <div 
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-midnight/80 backdrop-blur-sm animate-fade-in"
              onClick={() => setSelectedNotification(null)}
            >
              <div 
                className="bg-card-bg border border-border w-full sm:max-w-lg max-h-[90dvh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-scale-up flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                  <>
                    <div className="p-6 border-b border-border flex items-center justify-between bg-white/5 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan/20 text-cyan">
                          <Info className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">Notification Details</h2>
                      </div>
                      <button 
                        onClick={() => setSelectedNotification(null)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                      <div className="mb-8">
                        <h3 className="text-2xl font-bold mb-2 tracking-tight">{selectedNotification.title}</h3>
                        <div className="flex items-center gap-2 text-text-secondary text-sm">
                          <Bell className="w-4 h-4" />
                          <span>{selectedNotification.type.toUpperCase()}</span>
                          <span>•</span>
                          <span>{format(new Date(selectedNotification.created_at), 'MMM d, yyyy HH:mm:ss')}</span>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                        <p className="text-lg leading-relaxed text-text-primary">
                          {selectedNotification.message}
                        </p>
                      </div>

                      {(() => {
                        const additionalInfo = parseNotificationData(selectedNotification.data);
                        if (!additionalInfo) return null;

                        const validEntries = Object.entries(additionalInfo).filter(([_, value]) => {
                          return value !== '' && value !== null && value !== undefined;
                        });

                        if (validEntries.length === 0) return null;

                        return (
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Additional Info</h4>
                            <div className="grid grid-cols-1 gap-3">
                              {validEntries.map(([key, value]) => {
                                const valStr = String(value);
                                const isHashOrAddress = key.includes('hash') || key.includes('address') || (valStr.length > 24 && !valStr.includes(' '));
                                const isStatus = key.toLowerCase() === 'status';

                                return (
                                  <div key={key} className="flex flex-col gap-1.5 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-text-secondary">
                                        {formatKeyLabel(key)}
                                      </span>
                                      {isHashOrAddress && (
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(key, valStr)}
                                          className="flex items-center gap-1 text-xs text-cyan hover:text-electric-blue transition-colors"
                                          title="Copy to clipboard"
                                        >
                                          {copiedKey === key ? (
                                            <>
                                              <Check className="w-3.5 h-3.5 text-success" />
                                              <span className="text-[10px] text-success font-semibold">Copied</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3.5 h-3.5" />
                                              <span className="text-[10px] font-semibold">Copy</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                    {isStatus ? (
                                      <div className="flex items-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                          valStr.toLowerCase() === 'confirmed' || valStr.toLowerCase() === 'success'
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : valStr.toLowerCase() === 'pending'
                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                            : 'bg-white/10 text-text-secondary border border-white/10'
                                        }`}>
                                          {valStr}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className={`font-semibold break-all text-sm ${
                                        isHashOrAddress ? 'font-mono text-xs text-text-secondary bg-black/20 p-2 rounded-lg' : 'text-text-primary'
                                      }`}>
                                        {valStr}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
