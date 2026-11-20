'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Ban, 
  RotateCcw, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  X,
  Filter,
  CreditCard,
  Building2,
  Info,
  Repeat
} from 'lucide-react';
import { api, FiatTransaction } from '@/lib/api';
import { cardApi } from '@/lib/api/cards';
import { formatNumberWithCommas } from '@/lib/utils';
import { useWebSocket } from '@/lib/websocket';

interface FiatTransactionHistoryProps {
  currency?: string;
  onRefreshNeeded?: () => void;
}

type TypeFilter = 'all' | 'deposit' | 'withdrawal' | 'swap' | 'card';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed' | 'cancelled' | 'expired';

export default function FiatTransactionHistory({ currency, onRefreshNeeded }: FiatTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<FiatTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<FiatTransaction | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const [res, swapRes, cardRes] = await Promise.all([
        api.listFiatTransactions({
          currency: currency && currency !== 'ALL' ? currency : undefined,
          limit: 100,
        }).catch(() => ({ success: false, transactions: [] as any[] })),
        api.listSwaps().catch(() => ({ success: false, swaps: [] as any[] })),
        cardApi.listTransactions(undefined, 100).catch(() => ({ success: false, transactions: [] as any[] }))
      ]);

      const fiatList: FiatTransaction[] = (res.success && (res.transactions || (res as any).data)) || [];
      const rawSwaps = (swapRes as any)?.swaps || (swapRes as any)?.data || [];
      const rawCards = (cardRes as any)?.transactions || [];
      const fiatCurrencies = ['NGN', 'USD', 'EUR', 'GBP'];
      const targetCurr = currency && currency !== 'ALL' ? currency.toUpperCase() : null;

      const mappedSwaps: FiatTransaction[] = rawSwaps
        .filter((s: any) => {
          const from = s.from_asset?.toUpperCase();
          const to = s.to_asset?.toUpperCase();
          if (targetCurr) {
            return from === targetCurr || to === targetCurr;
          }
          return fiatCurrencies.includes(from) || fiatCurrencies.includes(to);
        })
        .map((s: any) => ({
          id: s.id,
          user_id: s.user_id,
          type: 'swap' as any,
          amount: s.from_amount,
          fee: s.fee_amount || 0,
          currency: s.from_asset,
          status: (s.status?.toLowerCase() === 'completed' ? 'completed' : s.status?.toLowerCase() === 'failed' ? 'failed' : 'pending') as any,
          processor: 'Internal Swap',
          processor_ref: `swap-${(s.id || '').slice(0, 8)}`,
          metadata: {
            from_asset: s.from_asset,
            to_asset: s.to_asset,
            from_amount: s.from_amount,
            to_amount: s.to_amount,
            rate: s.rate,
          },
          created_at: s.created_at,
          updated_at: s.updated_at || s.created_at,
        }));

      const mappedCards: FiatTransaction[] = rawCards
        .filter((c: any) => {
          if (targetCurr) {
            const spent = (c.spent_from_asset || 'USD').toUpperCase();
            const merch = (c.merchant_currency || 'USD').toUpperCase();
            return spent === targetCurr || merch === targetCurr;
          }
          return true;
        })
        .map((c: any) => {
          const st = (c.status || '').toLowerCase();
          const isCompleted = st === 'settled' || st === 'completed';
          const isFailed = st === 'declined' || st === 'failed';
          return {
            id: c.id,
            user_id: '',
            type: 'card' as any,
            amount: c.merchant_amount,
            fee: 0,
            currency: c.merchant_currency || 'USD',
            status: (isCompleted ? 'completed' : isFailed ? 'failed' : 'pending') as any,
            processor: `Card (${c.spent_from_asset ? `from ${c.spent_from_asset}` : 'Virtual Card'})`,
            processor_ref: `card-${(c.auth_token || c.id || '').slice(0, 8)}`,
            metadata: {
              card_token: c.card_token,
              auth_token: c.auth_token,
              spent_from: c.spent_from_asset,
              merchant_amount: c.merchant_amount,
            },
            created_at: c.created_at || new Date().toISOString(),
            updated_at: c.created_at || new Date().toISOString(),
          };
        });

      const merged = [...fiatList, ...mappedSwaps, ...mappedCards].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(merged);
    } catch (err) {
      console.error('Failed to fetch fiat transactions:', err);
    } finally {
      setIsLoading(false);
      if (showRefreshingSpinner) setIsRefreshing(false);
    }
  }, [currency]);

  useEffect(() => {
    setIsLoading(true);
    fetchTransactions();
  }, [fetchTransactions]);

  // Real-time updates via WebSocket
  useWebSocket(useCallback((notification: any) => {
    if (['deposit', 'withdrawal', 'balance_update', 'transaction_update'].includes(notification.type)) {
      fetchTransactions();
      if (onRefreshNeeded) onRefreshNeeded();
    }
  }, [fetchTransactions, onRefreshNeeded]));

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(id);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const getCurrencyPrefix = (curr: string) => {
    switch (curr?.toUpperCase()) {
      case 'NGN': return '₦';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '';
    }
  };

  // Status badge config
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Successful',
          icon: <CheckCircle2 size={12} className="text-success" />,
          classes: 'bg-success/10 text-success border-success/30',
        };
      case 'pending':
      case 'awaiting_payment':
        return {
          label: 'Pending',
          icon: <Clock size={12} className="text-amber-400" />,
          classes: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
        };
      case 'processing':
        return {
          label: 'Processing',
          icon: <RefreshCw size={12} className="text-cyan animate-spin" />,
          classes: 'bg-cyan/10 text-cyan border-cyan/30',
        };
      case 'failed':
        return {
          label: 'Failed',
          icon: <XCircle size={12} className="text-danger" />,
          classes: 'bg-danger/10 text-danger border-danger/30',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: <Ban size={12} className="text-text-tertiary" />,
          classes: 'bg-white/5 text-text-tertiary border-border',
        };
      case 'expired':
        return {
          label: 'Expired',
          icon: <AlertTriangle size={12} className="text-orange-400" />,
          classes: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        };
      case 'reversed':
        return {
          label: 'Reversed',
          icon: <RotateCcw size={12} className="text-purple-400" />,
          classes: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        };
      default:
        return {
          label: status,
          icon: <Clock size={12} className="text-text-secondary" />,
          classes: 'bg-white/5 text-text-secondary border-border',
        };
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Type match
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }
      // Status match
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && !['pending', 'awaiting_payment', 'processing'].includes(tx.status)) {
          return false;
        }
        if (statusFilter === 'failed' && !['failed', 'reversed'].includes(tx.status)) {
          return false;
        }
        if (statusFilter === 'cancelled' && tx.status !== 'cancelled') {
          return false;
        }
        if (statusFilter === 'expired' && tx.status !== 'expired') {
          return false;
        }
        if (statusFilter === 'completed' && tx.status !== 'completed') {
          return false;
        }
      }
      return true;
    });
  }, [transactions, typeFilter, statusFilter]);

  const countByType = useMemo(() => {
    const counts = { all: transactions.length, deposit: 0, withdrawal: 0, swap: 0, card: 0 };
    transactions.forEach(t => {
      if (t.type === 'deposit') counts.deposit++;
      else if (t.type === 'withdrawal') counts.withdrawal++;
      else if (t.type === 'swap') counts.swap++;
      else if ((t.type as any) === 'card') counts.card++;
    });
    return counts;
  }, [transactions]);

  const countByStatus = useMemo(() => {
    const counts = { all: transactions.length, completed: 0, pending: 0, failed: 0, expired: 0, cancelled: 0 };
    transactions.forEach(t => {
      if (t.status === 'completed') counts.completed++;
      else if (['pending', 'awaiting_payment', 'processing'].includes(t.status)) counts.pending++;
      else if (['failed', 'reversed'].includes(t.status)) counts.failed++;
      else if (t.status === 'expired') counts.expired++;
      else if (t.status === 'cancelled') counts.cancelled++;
    });
    return counts;
  }, [transactions]);

  return (
    <div className="space-y-4">
      {/* Header Controls: Filter Pills & Refresh */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-2">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 bg-deep-navy/30 dark:bg-white/5 p-1 rounded-xl border border-border overflow-x-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'all'
                ? 'bg-cyan text-midnight shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            All ({countByType.all})
          </button>
          <button
            onClick={() => setTypeFilter('deposit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              typeFilter === 'deposit'
                ? 'bg-cyan text-midnight shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ArrowDownLeft size={13} /> Deposits ({countByType.deposit})
          </button>
          <button
            onClick={() => setTypeFilter('withdrawal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              typeFilter === 'withdrawal'
                ? 'bg-cyan text-midnight shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ArrowUpRight size={13} /> Withdrawals ({countByType.withdrawal})
          </button>
          <button
            onClick={() => setTypeFilter('swap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              typeFilter === 'swap'
                ? 'bg-cyan text-midnight shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Repeat size={13} /> Swaps ({countByType.swap})
          </button>
          <button
            onClick={() => setTypeFilter('card')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              typeFilter === 'card'
                ? 'bg-cyan text-midnight shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <CreditCard size={13} /> Card ({countByType.card})
          </button>
        </div>

        {/* Right side: Status Filter dropdown & Refresh button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-card-bg/60 dark:bg-white/5 border border-border text-text-primary text-xs font-semibold rounded-xl px-3 py-2 pr-7 focus:outline-none focus:border-cyan cursor-pointer appearance-none"
            >
              <option value="all" className="bg-midnight">All Statuses ({countByStatus.all})</option>
              <option value="completed" className="bg-midnight">Successful ({countByStatus.completed})</option>
              <option value="pending" className="bg-midnight">Pending ({countByStatus.pending})</option>
              <option value="expired" className="bg-midnight">Expired ({countByStatus.expired})</option>
              <option value="failed" className="bg-midnight">Failed ({countByStatus.failed})</option>
              <option value="cancelled" className="bg-midnight">Cancelled ({countByStatus.cancelled})</option>
            </select>
            <Filter size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          </div>

          <button
            onClick={() => fetchTransactions(true)}
            disabled={isRefreshing}
            title="Refresh transactions"
            className="p-2 bg-card-bg/60 dark:bg-white/5 border border-border rounded-xl text-text-secondary hover:text-cyan hover:border-cyan transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-cyan' : ''} />
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 px-4 bg-card-bg/30 border border-border/60 rounded-3xl animate-fade-in">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3 text-text-tertiary">
            <CreditCard size={26} />
          </div>
          <h4 className="text-base font-bold text-text-primary mb-1">No Fiat Transactions</h4>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
            {typeFilter !== 'all' || statusFilter !== 'all' 
              ? 'No transactions match the selected filters. Try changing or clearing your filter criteria.'
              : 'You have no fiat deposit or withdrawal history yet.'}
          </p>
          {(typeFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-cyan hover:underline font-bold"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        /* Transaction List Items */
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isDeposit = tx.type === 'deposit';
            const isSwap = tx.type === 'swap';
            const isCard = (tx.type as any) === 'card';
            const badge = getStatusBadge(tx.status);
            const prefix = getCurrencyPrefix(tx.currency);
            const amountNum = parseFloat(String(tx.amount || '0'));
            const formattedAmount = `${prefix}${formatNumberWithCommas(amountNum, 2)} ${tx.currency}`;
            const refCode = tx.processor_ref || tx.id;
            const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A';

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card-bg/60 border border-border rounded-2xl hover:border-cyan/40 hover:bg-card-bg/90 transition-all cursor-pointer shadow-sm gap-3 sm:gap-4"
              >
                {/* Left: Icon & Details */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className={`relative w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border shadow-sm ${
                    isCard
                      ? 'bg-cyan/15 border-cyan/30 text-cyan'
                      : isSwap
                      ? 'bg-cyan/15 border-cyan/30 text-cyan'
                      : isDeposit 
                      ? 'bg-success/15 border-success/30 text-success' 
                      : 'bg-danger/15 border-danger/30 text-danger'
                  }`}>
                    {isCard ? <CreditCard size={20} /> : isSwap ? <Repeat size={20} /> : isDeposit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-text-primary text-sm capitalize">
                        {isCard ? `Card Spend (${tx.metadata?.spent_from || tx.currency})` : isSwap ? `Swap ${tx.metadata?.from_asset || tx.currency} → ${tx.metadata?.to_asset}` : isDeposit ? 'Fiat Deposit' : 'Fiat Withdrawal'}
                      </span>
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.classes}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-text-tertiary">
                        Ref: {refCode.slice(0, 12)}...
                      </span>
                      <span className="capitalize px-1.5 py-0.2 bg-white/5 rounded border border-border/50 text-[10px]">
                        {tx.processor || 'Paystack'}
                      </span>
                    </div>

                    {/* Failure reason preview if failed or expired */}
                    {tx.failure_reason && ['failed', 'expired', 'cancelled'].includes(tx.status) && (
                      <div className="mt-1.5 text-[11px] text-danger/90 font-medium flex items-center gap-1">
                        <Info size={11} className="shrink-0" />
                        <span className="truncate max-w-xs">{tx.failure_reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Status */}
                <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                  <div className={`font-mono font-bold text-base sm:text-lg ${
                    isCard
                      ? 'text-rose-400'
                      : isSwap
                      ? 'text-cyan'
                      : isDeposit && tx.status === 'completed'
                      ? 'text-success'
                      : 'text-text-primary'
                  }`}>
                    {isCard ? `-${formattedAmount}` : isSwap ? `-${formattedAmount}` : (isDeposit ? '+' : '-') + formattedAmount}
                  </div>
                  <div className="text-[11px] text-text-tertiary">
                    {isSwap && tx.metadata?.to_amount ? (
                      <span className="text-success font-medium">+{tx.metadata.to_amount} {tx.metadata.to_asset}</span>
                    ) : parseFloat(String(tx.fee || '0')) > 0 ? (
                      <span>Fee: {prefix}{formatNumberWithCommas(parseFloat(String(tx.fee)), 2)}</span>
                    ) : (
                      <span className="text-text-tertiary">Zero fee</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="main-card max-w-lg w-full p-6 sm:p-8 animate-scale-in relative border border-border max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-text-primary rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                selectedTx.type === 'swap'
                  ? 'bg-cyan/15 border-cyan/30 text-cyan'
                  : selectedTx.type === 'deposit'
                  ? 'bg-success/15 border-success/30 text-success'
                  : 'bg-danger/15 border-danger/30 text-danger'
              }`}>
                {selectedTx.type === 'swap' ? <Repeat size={24} /> : selectedTx.type === 'deposit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary capitalize">
                  {selectedTx.type === 'swap' ? 'Swap Details' : selectedTx.type === 'deposit' ? 'Fiat Deposit Details' : 'Fiat Withdrawal Details'}
                </h3>
                <p className="text-xs text-text-secondary font-mono">ID: {selectedTx.id}</p>
              </div>
            </div>

            {/* Status Hero Banner in Modal */}
            <div className={`p-4 rounded-2xl border mb-6 flex items-center justify-between ${getStatusBadge(selectedTx.status).classes}`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {getStatusBadge(selectedTx.status).icon}
                <span>Status: {getStatusBadge(selectedTx.status).label}</span>
              </div>
              <span className="font-mono text-xs uppercase px-2 py-0.5 bg-black/20 rounded">
                {selectedTx.status}
              </span>
            </div>

            {/* Failure reason explanation banner if failed, cancelled, or expired */}
            {selectedTx.failure_reason && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl mb-6 text-xs text-danger flex items-start gap-2">
                <Info size={15} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Reason:</span> {selectedTx.failure_reason}
                </div>
              </div>
            )}

            {/* Detailed Key-Values */}
            <div className="bg-white/5 border border-border rounded-2xl p-4 space-y-3 text-xs mb-6 font-mono">
              {selectedTx.type === 'swap' && selectedTx.metadata ? (
                <>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-sans">You Sold:</span>
                    <span className="font-bold text-text-primary text-sm">
                      {selectedTx.metadata.from_amount} {selectedTx.metadata.from_asset}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-sans">You Received:</span>
                    <span className="font-bold text-success text-sm">
                      +{selectedTx.metadata.to_amount} {selectedTx.metadata.to_asset}
                    </span>
                  </div>
                  {selectedTx.metadata.rate && (
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-text-secondary font-sans">Effective Rate:</span>
                      <span className="text-text-primary">
                        1 {selectedTx.metadata.from_asset} ≈ {selectedTx.metadata.rate} {selectedTx.metadata.to_asset}
                      </span>
                    </div>
                  )}
                </>
              ) : (selectedTx.type as any) === 'card' ? (
                <>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-sans">Merchant Amount:</span>
                    <span className="font-bold text-text-primary text-sm">
                      {getCurrencyPrefix(selectedTx.currency)}{formatNumberWithCommas(parseFloat(String(selectedTx.amount || '0')), 2)} {selectedTx.currency}
                    </span>
                  </div>
                  {selectedTx.metadata?.spent_from && (
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-text-secondary font-sans">Drained From Asset:</span>
                      <span className="font-bold text-cyan text-sm">
                        {selectedTx.metadata.spent_from}
                      </span>
                    </div>
                  )}
                  {selectedTx.metadata?.auth_token && (
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-text-secondary font-sans">Authorization:</span>
                      <span className="text-text-primary text-xs">
                        {selectedTx.metadata.auth_token}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-text-secondary font-sans">Amount:</span>
                  <span className="font-bold text-text-primary text-sm">
                    {getCurrencyPrefix(selectedTx.currency)}{formatNumberWithCommas(parseFloat(String(selectedTx.amount || '0')), 2)} {selectedTx.currency}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-text-secondary font-sans">Fee:</span>
                <span className="text-text-primary">
                  {getCurrencyPrefix(selectedTx.currency)}{formatNumberWithCommas(parseFloat(String(selectedTx.fee || '0')), 2)} {selectedTx.currency}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-text-secondary font-sans">Payment Method / Provider:</span>
                <span className="text-cyan capitalize font-sans font-bold">
                  {selectedTx.processor || 'Paystack'} ({selectedTx.payment_method || 'Standard'})
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-text-secondary font-sans">Internal Reference:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedTx.processor_ref || selectedTx.id, 'ref')}
                  className="flex items-center gap-1.5 text-cyan hover:underline bg-cyan/10 px-2 py-0.5 rounded"
                >
                  <span className="truncate max-w-[160px]">{selectedTx.processor_ref || selectedTx.id}</span>
                  {copiedRef === 'ref' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>

              {selectedTx.external_id && (
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-text-secondary font-sans">Provider Reference:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedTx.external_id!, 'ext')}
                    className="flex items-center gap-1.5 text-cyan hover:underline bg-cyan/10 px-2 py-0.5 rounded"
                  >
                    <span className="truncate max-w-[160px]">{selectedTx.external_id}</span>
                    {copiedRef === 'ext' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-text-secondary font-sans">Created Date:</span>
                <span className="text-text-primary">
                  {selectedTx.created_at ? new Date(selectedTx.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>

              {selectedTx.completed_at && (
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-text-secondary font-sans">Completed Date:</span>
                  <span className="text-success font-bold">
                    {new Date(selectedTx.completed_at).toLocaleString()}
                  </span>
                </div>
              )}

              {selectedTx.expires_at && selectedTx.status === 'pending' && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-secondary font-sans">Expires At:</span>
                  <span className="text-amber-400">
                    {new Date(selectedTx.expires_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-text-primary rounded-xl font-bold border border-border transition-all text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
