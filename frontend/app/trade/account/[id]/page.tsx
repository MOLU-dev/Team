'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/shared/AppHeader';
import Background from '@/components/shared/Background';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { tradingApi, TradingAccountDetail, tradingWS } from '@/lib/api/trading';
import { toast } from 'sonner';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Settings2, Loader2, FlaskConical, Wallet, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100];

export default function TradingAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [account, setAccount] = useState<TradingAccountDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Panel state
  const [activePanel, setActivePanel] = useState<'fund' | 'withdraw' | 'leverage' | null>(null);
  const [amount, setAmount] = useState('');
  const [newLeverage, setNewLeverage] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccount = useCallback(async () => {
    try {
      const res = await tradingApi.getAccount(id);
      setAccount(res.account);
      setNewLeverage(res.account.leverage);
    } catch {
      toast.error('Account not found');
      router.push('/dashboard?tab=trading');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Identified user for private WS channels
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.id) tradingWS.setUserId(user.id);
      } catch (e) { /* ignore */ }
    }

    tradingWS.connect();

    const cleanup = tradingWS.onMessage((msg) => {
      if (msg.channel && (msg.channel.startsWith('user:') || msg.channel === 'equity:update')) {
        const data = msg.data;
        
        // Only update if it's the account we're looking at
        if (data.trading_account_id !== id) return;

        // If it's a fill, trigger a background refetch to ensure balance consistency
        if (data.event === 'fill') {
          fetchAccount();
        }

        // Patch the state immediately with whatever data we have
        setAccount((prev) => {
          if (!prev) return prev;
            
          const updatedBalances = prev.balances.map((b) =>
            b.currency === data.base_currency && data.available_margin !== undefined
              ? { ...b, available: data.available_margin }
              : b
          );

          return {
            ...prev,
            balances: data.balances || updatedBalances,
            equity: data.equity ?? prev.equity,
            margin_level: data.margin_ratio ?? prev.margin_level,
            unrealised_pnl: data.unrealised_pnl ?? prev.unrealised_pnl,
          };
        });
      }
    });

    return cleanup;
  }, [id, fetchAccount]);

  const handleFund = async () => {
    if (!account || !amount || parseFloat(amount) <= 0) return;
    setIsSubmitting(true);
    try {
      await tradingApi.fundAccount({
        trading_account_id: id,
        source_currency: account.base_currency,
        source_chain: '',
        amount,
      });
      toast.success(`Funded ${amount} ${account.base_currency}`);
      setAmount('');
      setActivePanel(null);
      fetchAccount();
    } catch (err: any) {
      toast.error(err?.message ?? 'Funding failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!account || !amount || parseFloat(amount) <= 0) return;
    setIsSubmitting(true);
    try {
      await tradingApi.withdrawFromAccount({
        trading_account_id: id,
        target_currency: account.base_currency,
        target_chain: '',
        amount,
      });
      toast.success(`Withdrew ${amount} ${account.base_currency}`);
      setAmount('');
      setActivePanel(null);
      fetchAccount();
    } catch (err: any) {
      toast.error(err?.message ?? 'Withdrawal failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetLeverage = async () => {
    if (!account) return;
    setIsSubmitting(true);
    try {
      await tradingApi.setLeverage({ trading_account_id: id, leverage: newLeverage });
      toast.success(`Leverage set to ${newLeverage}×`);
      setActivePanel(null);
      fetchAccount();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update leverage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const available = account?.balances?.find((b) => b.currency === account.base_currency)?.available ?? '0';
  const locked    = account?.balances?.find((b) => b.currency === account.base_currency)?.locked    ?? '0';

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Background type="dashboard" />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-cyan" size={36} />
        </div>
      </ProtectedRoute>
    );
  }

  if (!account) return null;

  const isDemo = account.is_demo;

  return (
    <ProtectedRoute>
      <Background type="dashboard" />
      <div className="relative z-10 min-h-screen pb-20">
        <AppHeader showBackButton backHref="/dashboard?tab=trading" />

        <main className="container mx-auto px-4 sm:px-6 max-w-lg pt-10">
          {/* Back */}
          <Link href="/dashboard?tab=trading" className="inline-flex items-center gap-1.5 text-text-secondary hover:text-cyan text-sm mb-6 transition-colors">
            <ArrowLeft size={15} /> Back to Trading
          </Link>

          {/* Account identity card */}
          <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 mb-6 overflow-hidden animate-fade-slide-up">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan/[0.05] rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan to-electric-blue flex items-center justify-center text-midnight font-black text-sm">
                    {account.base_currency.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-orbitron text-lg font-black text-text-primary">{account.base_currency}</h1>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${isDemo ? 'bg-warning/10 border-warning/20 text-warning' : 'bg-success/10 border-success/20 text-success'}`}>
                        {isDemo ? 'DEMO' : 'REAL'}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary font-mono mt-0.5">{id}</p>
                  </div>
                </div>
                <button onClick={fetchAccount} className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-text-secondary hover:text-cyan transition-all">
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Balance stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label="Available" value={`${parseFloat(available).toFixed(2)}`} sub={account.base_currency} accent="text-success" />
                <StatBox label="Locked"    value={`${parseFloat(locked).toFixed(2)}`}    sub={account.base_currency} accent="text-warning" />
                <StatBox label="Equity"    value={account.equity    ? parseFloat(account.equity).toFixed(2)     : '—'} sub={account.base_currency} accent="text-cyan" />
                <StatBox label="Leverage"  value={`${account.leverage}×`} sub="default" accent="text-electric-blue" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <ActionBtn id="panel-fund"     label="Fund"     icon={<ArrowDownLeft size={18} />}  accent="success"  active={activePanel === 'fund'}     onClick={() => setActivePanel(activePanel === 'fund'     ? null : 'fund')} />
            <ActionBtn id="panel-withdraw" label="Withdraw" icon={<ArrowUpRight size={18} />}   accent="danger"   active={activePanel === 'withdraw'} onClick={() => setActivePanel(activePanel === 'withdraw' ? null : 'withdraw')} />
            <ActionBtn id="panel-leverage" label="Leverage" icon={<Settings2 size={18} />}      accent="electric-blue" active={activePanel === 'leverage'} onClick={() => setActivePanel(activePanel === 'leverage' ? null : 'leverage')} />
          </div>

          {/* Fund panel */}
          {activePanel === 'fund' && (
            <Panel title="Fund Account" desc={`Transfer ${account.base_currency} from your funding wallet into this trading account.`} onClose={() => setActivePanel(null)}>
              <AmountInput value={amount} onChange={setAmount} currency={account.base_currency} />
              <button id="confirm-fund" onClick={handleFund} disabled={isSubmitting || !amount}
                className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-success to-emerald-500 text-midnight shadow-lg shadow-success/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                {isSubmitting ? 'Funding…' : `Fund ${account.base_currency}`}
              </button>
            </Panel>
          )}

          {/* Withdraw panel */}
          {activePanel === 'withdraw' && (
            <Panel title="Withdraw" desc={`Move ${account.base_currency} back to your funding wallet.`} onClose={() => setActivePanel(null)}>
              <div className="text-right text-[11px] text-text-secondary mb-1">
                Max: <button onClick={() => setAmount(available)} className="text-cyan underline">{parseFloat(available).toFixed(2)}</button>
              </div>
              <AmountInput value={amount} onChange={setAmount} currency={account.base_currency} />
              <button id="confirm-withdraw" onClick={handleWithdraw} disabled={isSubmitting || !amount}
                className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-danger to-rose-500 text-white shadow-lg shadow-danger/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                {isSubmitting ? 'Withdrawing…' : `Withdraw ${account.base_currency}`}
              </button>
            </Panel>
          )}

          {/* Leverage panel */}
          {activePanel === 'leverage' && (
            <Panel title="Set Leverage" desc="This changes the default leverage applied to new positions on this account." onClose={() => setActivePanel(null)}>
              <div className="flex flex-wrap gap-2 mb-4">
                {LEVERAGE_OPTIONS.map((lev) => (
                  <button key={lev} onClick={() => setNewLeverage(lev)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${newLeverage === lev ? 'bg-cyan/10 border-cyan/40 text-cyan' : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:border-cyan/20'}`}>
                    {lev}×
                  </button>
                ))}
              </div>
              {newLeverage >= 50 && <p className="text-[11px] text-warning mb-3">⚠ High leverage increases liquidation risk.</p>}
              <button id="confirm-leverage" onClick={handleSetLeverage} disabled={isSubmitting || newLeverage === account.leverage}
                className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-cyan to-electric-blue text-midnight shadow-lg shadow-cyan/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                {isSubmitting ? 'Updating…' : `Set ${newLeverage}× Leverage`}
              </button>
            </Panel>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function StatBox({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-center">
      <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary mb-1">{label}</p>
      <p className={`text-base font-black font-orbitron ${accent}`}>{value}</p>
      <p className="text-[9px] text-text-secondary/50">{sub}</p>
    </div>
  );
}

function ActionBtn({ id, label, icon, accent, active, onClick }: { id: string; label: string; icon: React.ReactNode; accent: string; active: boolean; onClick: () => void }) {
  return (
    <button id={id} onClick={onClick}
      className={`flex flex-col items-center gap-2 py-4 rounded-2xl border font-bold text-sm transition-all ${
        active
          ? `bg-${accent}/10 border-${accent}/30 text-${accent}`
          : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:border-white/[0.15] hover:text-text-primary'
      }`}>
      {icon}
      {label}
    </button>
  );
}

function Panel({ title, desc, children, onClose }: { title: string; desc: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 mb-6 space-y-4 animate-expand-down">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-text-primary">{title}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">{desc}</p>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1">✕</button>
      </div>
      {children}
    </div>
  );
}

function AmountInput({ value, onChange, currency }: { value: string; onChange: (v: string) => void; currency: string }) {
  return (
    <div className="relative mb-4">
      <input type="number" step="any" min="0" placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3.5 px-4 text-text-primary text-sm focus:outline-none focus:border-cyan/40 transition-all font-orbitron pr-20" />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">{currency}</span>
    </div>
  );
}
