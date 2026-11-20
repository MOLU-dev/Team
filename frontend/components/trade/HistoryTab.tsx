'use client';

import { useState, useEffect, useCallback } from 'react';
import { tradingApi, TradingOrder, tradingWS } from '@/lib/api/trading';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryTabProps {
  accountId: string;
  onCancelOrder?: () => void;
}

const STATUS_STYLE: Record<string, string> = {
  open:      'bg-cyan/10 border-cyan/20 text-cyan',
  filled:    'bg-success/10 border-success/20 text-success',
  cancelled: 'bg-white/5 border-white/10 text-text-secondary',
  rejected:  'bg-danger/10 border-danger/20 text-danger',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  open:      <Clock size={11} />,
  filled:    <CheckCircle2 size={11} />,
  cancelled: <XCircle size={11} />,
  rejected:  <XCircle size={11} />,
};

export default function HistoryTab({ accountId, onCancelOrder }: HistoryTabProps) {
  const [orders, setOrders] = useState<TradingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchOrders = useCallback(async (spinner = false) => {
    if (!accountId) return;
    if (spinner) setIsRefreshing(true);
    try {
      const open = await tradingApi.listOrders(accountId);
      setOrders(Array.isArray(open) ? open : []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [accountId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!accountId) return;

    const cleanup = tradingWS.onMessage((msg) => {
      if (msg.channel && msg.channel.startsWith('user:')) {
        const data = msg.data;
        // Refresh orders if a fill or status update occurs for this account
        if ((data.event === 'fill' || data.event === 'order_update') && data.trading_account_id === accountId) {
          fetchOrders();
        }
      }
    });

    return cleanup;
  }, [accountId, fetchOrders]);

  const handleCancel = async (orderId: string) => {
    setCancelling(orderId);
    try {
      await tradingApi.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      onCancelOrder?.();
    } catch (err: any) {
      console.error('Cancel failed', err);
    } finally {
      setCancelling(null);
    }
  };

  if (!accountId) {
    return (
      <div className="py-16 text-center text-text-secondary">
        <Clock size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Select an account to view history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-slide-up">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-text-primary">Open Orders</p>
        <button
          onClick={() => fetchOrders(true)}
          disabled={isRefreshing}
          className="p-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-text-secondary hover:text-cyan transition-all"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse border border-white/[0.04]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center">
          <Clock size={40} className="mx-auto mb-3 text-text-secondary/20" />
          <p className="text-sm text-text-secondary">No orders yet</p>
          <p className="text-xs text-text-secondary/50 mt-1">Place an order in the Trade tab</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const isBuy = order.side === 'buy';
            const filledPct = order.quantity && order.filled_qty
              ? (parseFloat(order.filled_qty) / parseFloat(order.quantity)) * 100
              : 0;
            const statusStyle = STATUS_STYLE[order.status] ?? STATUS_STYLE.cancelled;
            const statusIcon = STATUS_ICON[order.status] ?? STATUS_ICON.cancelled;
            const canCancel = order.status === 'open';

            return (
              <div
                key={order.id}
                className="px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all"
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isBuy ? 'bg-success/10' : 'bg-danger/10'}`}>
                      {isBuy ? <ArrowUpRight size={14} className="text-success" /> : <ArrowDownLeft size={14} className="text-danger" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">
                        {order.symbol}
                      </p>
                      <p className="text-[10px] text-text-secondary capitalize">
                        {order.order_type} · {order.side}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${statusStyle}`}>
                      {statusIcon} {order.status}
                    </span>
                    <p className="text-[10px] text-text-secondary/50 mt-0.5">
                      {order.created_at ? format(new Date(order.created_at), 'MMM d HH:mm') : '—'}
                    </p>
                  </div>
                </div>

                {/* Fill bar */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan to-electric-blue rounded-full transition-all"
                      style={{ width: `${filledPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-text-secondary shrink-0">
                    {parseFloat(order.filled_qty || '0').toFixed(4)} / {parseFloat(order.quantity).toFixed(4)} filled
                  </span>
                </div>

                {/* Price + Cancel */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-secondary">
                    {order.order_type === 'limit'
                      ? `@ $${parseFloat(order.price).toLocaleString()}`
                      : 'Market price'}
                  </p>
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={cancelling === order.id}
                      className="flex items-center gap-1 text-[10px] font-bold text-danger hover:text-danger/80 px-2 py-1 rounded-lg hover:bg-danger/10 transition-all"
                    >
                      {cancelling === order.id ? <Loader2 size={10} className="animate-spin" /> : <XCircle size={10} />}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
