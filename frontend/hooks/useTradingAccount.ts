'use client';

import { useState, useEffect, useCallback } from 'react';
import { tradingApi, TradingAccount, TradingAccountDetail } from '@/lib/api/trading';

interface UseTradingAccountReturn {
  accounts: TradingAccount[];
  activeAccount: TradingAccountDetail | null;
  activeAccountId: string;
  isDemo: boolean;
  isLoadingAccounts: boolean;
  isLoadingDetail: boolean;
  setActiveAccountId: (id: string) => void;
  setIsDemo: (demo: boolean) => void;
  refetchAccounts: () => void;
  refetchDetail: () => void;
}

import { tradingWS } from '@/lib/api/trading';

export function useTradingAccount(): UseTradingAccountReturn {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccountId, setActiveAccountIdState] = useState<string>('');
  const [activeAccount, setActiveAccount] = useState<TradingAccountDetail | null>(null);
  const [isDemo, setIsDemoState] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // ── Fetch all accounts ─────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const res = await tradingApi.listAccounts();
      const list = res.accounts ?? [];
      setAccounts(list);

      // Auto-select: prefer real account matching current demo flag
      if (list.length > 0 && !activeAccountId) {
        const preferred =
          list.find((a) => a.is_demo === isDemo) ??
          list[0];
        setActiveAccountIdState(preferred.id);
      }
    } catch (err) {
      console.error('Failed to load trading accounts', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [activeAccountId, isDemo]);

  // ── Fetch detail for active account ───────────────────────────
  const fetchDetail = useCallback(async () => {
    if (!activeAccountId) return;
    setIsLoadingDetail(true);
    try {
      const res = await tradingApi.getAccount(activeAccountId);
      setActiveAccount(res.account ?? null);
    } catch (err) {
      console.error('Failed to load account detail', err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [activeAccountId]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // ── WebSocket for real-time updates ───────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Attempt to get user ID for private channel identification
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.id) {
          tradingWS.setUserId(user.id);
        }
      } catch (e) {
        console.warn('[useTradingAccount] Failed to parse user from localStorage', e);
      }
    }

    tradingWS.connect();

    const cleanup = tradingWS.onMessage((msg) => {
      // Handle equity updates from private user channel or global equity channel
      if (msg.channel && (msg.channel.startsWith('user:') || msg.channel === 'equity:update')) {
        const data = msg.data;
        if (data.event === 'equity_update' && data.trading_account_id === activeAccountId) {
          setActiveAccount((prev) => {
            if (!prev) return prev;
            
            // Update the available balance for the base currency
            const updatedBalances = prev.balances.map((b) =>
              b.currency === data.base_currency
                ? { ...b, available: data.available_margin }
                : b
            );

            return {
              ...prev,
              balances: updatedBalances,
              equity: data.equity,
              // Note: margin_used is derived or we can estimate it
              margin_level: data.margin_ratio,
              unrealised_pnl: data.unrealised_pnl,
            };
          });
        }
      }
    });

    return cleanup;
  }, [activeAccountId]);

  // ── Setters with side-effects ──────────────────────────────────
  const setActiveAccountId = useCallback((id: string) => {
    setActiveAccountIdState(id);
    const acct = accounts.find((a) => a.id === id);
    if (acct) setIsDemoState(acct.is_demo);
  }, [accounts]);

  const setIsDemo = useCallback((demo: boolean) => {
    setIsDemoState(demo);
    // Auto-switch to matching account type, same base currency if possible
    const current = accounts.find((a) => a.id === activeAccountId);
    const match =
      accounts.find(
        (a) => a.is_demo === demo && a.base_currency === current?.base_currency,
      ) ?? accounts.find((a) => a.is_demo === demo);
    if (match) setActiveAccountIdState(match.id);
  }, [accounts, activeAccountId]);

  return {
    accounts,
    activeAccount,
    activeAccountId,
    isDemo,
    isLoadingAccounts,
    isLoadingDetail,
    setActiveAccountId,
    setIsDemo,
    refetchAccounts: fetchAccounts,
    refetchDetail: fetchDetail,
  };
}
