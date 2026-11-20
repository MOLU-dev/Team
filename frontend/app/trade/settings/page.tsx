'use client';

import { useTradingAccount } from '@/hooks/useTradingAccount';
import AppHeader from '@/components/shared/AppHeader';
import Background from '@/components/shared/Background';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { ArrowLeft, Wallet, FlaskConical, CheckCircle2, Plus } from 'lucide-react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useRouter } from 'next/navigation';

export default function TradingSettingsPage() {
  const { 
    accounts, 
    activeAccountId, 
    isDemo, 
    setIsDemo, 
    setActiveAccountId, 
    isLoadingAccounts 
  } = useTradingAccount();
  
  const router = useRouter();

  const realAccounts = accounts.filter(a => !a.is_demo);
  const demoAccounts = accounts.filter(a => a.is_demo);

  return (
    <ProtectedRoute>
      <Background type="dashboard" />
      <div className="relative z-10 min-h-screen pb-20">
        <AppHeader showBackButton backHref="/dashboard?tab=trading" />
        <main className="container mx-auto px-4 sm:px-6 max-w-lg pt-10">
          <Link href="/dashboard?tab=trading" className="inline-flex items-center gap-1.5 text-text-secondary hover:text-cyan text-sm mb-8 transition-colors">
            <ArrowLeft size={15} /> Back to Trading
          </Link>

          <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
            <div>
              <h1 className="font-orbitron text-2xl font-black gradient-text mb-1">Trading Settings</h1>
              <p className="text-text-secondary text-sm">Manage your trading accounts</p>
            </div>
            
            <div className="flex items-center gap-2 bg-midnight/50 p-2 rounded-xl border border-white/[0.06]">
              <Wallet size={14} className={!isDemo ? 'text-success' : 'text-text-secondary'} />
              <ToggleSwitch enabled={isDemo} onChange={setIsDemo} />
              <FlaskConical size={14} className={isDemo ? 'text-warning' : 'text-text-secondary'} />
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                isDemo
                  ? 'bg-warning/10 border-warning/20 text-warning'
                  : 'bg-success/10 border-success/20 text-success'
              }`}>
                {isDemo ? 'Demo' : 'Real'} Mode
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Accounts</p>
              </div>

              {isLoadingAccounts ? (
                 <div className="space-y-2">
                   {Array(2).fill(0).map((_, i) => <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />)}
                 </div>
              ) : (
                <div className="space-y-4">
                  {realAccounts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-text-secondary/50 px-1">Real</p>
                      {realAccounts.map(acct => (
                        <AccountCard key={acct.id} account={acct} isActive={acct.id === activeAccountId} onSelect={() => setActiveAccountId(acct.id)} onManage={() => router.push(`/trade/account/${acct.id}`)} />
                      ))}
                    </div>
                  )}

                  {demoAccounts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-text-secondary/50 px-1">Demo</p>
                      {demoAccounts.map(acct => (
                        <AccountCard key={acct.id} account={acct} isActive={acct.id === activeAccountId} onSelect={() => setActiveAccountId(acct.id)} onManage={() => router.push(`/trade/account/${acct.id}`)} />
                      ))}
                    </div>
                  )}
                  
                  {accounts.length === 0 && (
                     <div className="py-8 text-center bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                        <Wallet size={32} className="mx-auto mb-3 text-text-secondary/30" />
                        <p className="text-sm text-text-secondary">No accounts yet</p>
                     </div>
                  )}
                </div>
              )}
            </div>

            <Link href="/trade/create-account" className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 transition-all">
              <Plus size={18} /> Create New Account
            </Link>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function AccountCard({ account, isActive, onSelect, onManage }: any) {
  const colorClass = account.base_currency === 'USDT' ? 'text-emerald-400' : account.base_currency === 'USDC' ? 'text-blue-400' : account.base_currency === 'EUROC' ? 'text-indigo-400' : 'text-text-primary';
  const bgClass = account.base_currency === 'USDT' ? 'bg-emerald-500/10 border-emerald-500/20' : account.base_currency === 'USDC' ? 'bg-blue-500/10 border-blue-500/20' : account.base_currency === 'EUROC' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-white/5 border-white/10';

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all ${
        isActive ? 'bg-cyan/[0.08] border border-cyan/30 shadow-[0_0_15px_rgba(0,255,204,0.1)]' : 'bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06]'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 ${bgClass} ${colorClass}`}>
        {account.base_currency.slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${colorClass}`}>{account.base_currency}</span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
            account.is_demo
              ? 'bg-warning/10 border-warning/20 text-warning'
              : 'bg-success/10 border-success/20 text-success'
          }`}>
            {account.is_demo ? 'DEMO' : 'REAL'}
          </span>
          <span className="text-[10px] text-text-secondary border border-white/10 px-1.5 py-0.5 rounded shrink-0">
            {account.leverage}×
          </span>
        </div>
        <p className="text-[11px] text-text-secondary mt-0.5 truncate font-mono">
          {account.id}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isActive && <CheckCircle2 size={16} className="text-cyan" />}
        <button
          onClick={(e) => { e.stopPropagation(); onManage(); }}
          className="text-[11px] text-text-secondary hover:text-cyan px-2.5 py-1.5 rounded-lg hover:bg-cyan/10 border border-transparent hover:border-cyan/30 transition-all font-bold"
        >
          Manage
        </button>
      </div>
    </div>
  );
}
