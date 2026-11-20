'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/shared/AppHeader';
import Background from '@/components/shared/Background';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { tradingApi } from '@/lib/api/trading';
import { toast } from 'sonner';
import { Loader2, FlaskConical, Wallet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const BASE_CURRENCIES = ['USDT', 'USDC', 'EUROC'] as const;
type BaseCurrency = typeof BASE_CURRENCIES[number];
const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100];

export default function CreateTradingAccountPage() {
  const router = useRouter();
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency>('USDT');
  const [isDemo, setIsDemo] = useState(false);
  const [leverage, setLeverage] = useState(10);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await tradingApi.createAccount({ base_currency: baseCurrency, is_demo: isDemo, leverage });
      toast.success(`${isDemo ? 'Demo' : 'Real'} ${baseCurrency} account created!`);
      router.push(`/trade/account/${res.account.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create account');
      setIsCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <Background type="dashboard" />
      <div className="relative z-10 min-h-screen pb-20">
        <AppHeader showBackButton backHref="/dashboard?tab=trading" />
        <main className="container mx-auto px-4 sm:px-6 max-w-lg pt-10">
          <Link href="/dashboard?tab=trading" className="inline-flex items-center gap-1.5 text-text-secondary hover:text-cyan text-sm mb-8 transition-colors">
            <ArrowLeft size={15} /> Back to Trading
          </Link>

          <div className="mb-8">
            <h1 className="font-orbitron text-2xl font-black gradient-text mb-1">New Trading Account</h1>
            <p className="text-text-secondary text-sm">Choose currency, type, and leverage.</p>
          </div>

          {/* Account type */}
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Account Type</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { demo: false, label: 'Real', desc: 'Trade with actual funds', icon: <Wallet size={24} className="text-success" />, accent: 'border-success/30 bg-success/5' },
                { demo: true,  label: 'Demo', desc: 'Practice risk-free',     icon: <FlaskConical size={24} className="text-warning" />, accent: 'border-warning/30 bg-warning/5' },
              ].map(({ demo, label, desc, icon, accent }) => (
                <button key={label} id={`account-type-${label.toLowerCase()}`} onClick={() => setIsDemo(demo)}
                  className={`flex flex-col items-center gap-2 py-5 rounded-2xl border text-center transition-all ${isDemo === demo ? accent : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                  {icon}
                  <span className={`text-sm font-bold ${isDemo === demo ? 'text-text-primary' : 'text-text-secondary'}`}>{label}</span>
                  <span className="text-[10px] text-text-secondary/70 px-2">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Base currency */}
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Base Currency</p>
            <div className="grid grid-cols-3 gap-3">
              {BASE_CURRENCIES.map((cur) => (
                <button key={cur} id={`base-currency-${cur.toLowerCase()}`} onClick={() => setBaseCurrency(cur)}
                  className={`py-4 rounded-2xl border font-bold text-sm transition-all ${baseCurrency === cur ? 'border-cyan/40 bg-cyan/5 text-cyan' : 'border-white/[0.08] bg-white/[0.02] text-text-secondary hover:border-white/[0.15]'}`}>
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* Leverage */}
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Leverage · {leverage}×</p>
            <div className="flex flex-wrap gap-2">
              {LEVERAGE_OPTIONS.map((lev) => (
                <button key={lev} id={`leverage-${lev}`} onClick={() => setLeverage(lev)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${leverage === lev ? 'bg-cyan/10 border-cyan/40 text-cyan' : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:border-cyan/20'}`}>
                  {lev}×
                </button>
              ))}
            </div>
            {leverage >= 50 && <p className="text-[11px] text-warning mt-3">⚠ High leverage significantly increases liquidation risk.</p>}
          </div>

          {/* Summary */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Summary</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-[10px] text-text-secondary mb-1">Type</p><p className={`text-lg font-black font-orbitron ${isDemo ? 'text-warning' : 'text-success'}`}>{isDemo ? 'Demo' : 'Real'}</p></div>
              <div><p className="text-[10px] text-text-secondary mb-1">Currency</p><p className="text-lg font-black font-orbitron text-cyan">{baseCurrency}</p></div>
              <div><p className="text-[10px] text-text-secondary mb-1">Leverage</p><p className="text-lg font-black font-orbitron text-electric-blue">{leverage}×</p></div>
            </div>
          </div>

          <button id="create-account-submit" onClick={handleCreate} disabled={isCreating}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-gradient-to-r from-cyan to-electric-blue text-midnight shadow-lg shadow-cyan/25 hover:shadow-cyan/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
            {isCreating && <Loader2 size={18} className="animate-spin" />}
            {isCreating ? 'Creating…' : `Create ${isDemo ? 'Demo' : 'Real'} ${baseCurrency} Account`}
          </button>
        </main>
      </div>
    </ProtectedRoute>
  );
}
