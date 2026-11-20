'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import BalanceCard from '@/components/dashboard/BalanceCard';
import AssetsList from '@/components/dashboard/AssetsList';
import DashboardTips from '@/components/dashboard/DashboardTips';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import FloatingNavbar from '@/components/shared/FloatingNavbar';
import TradingWorkspace from '@/components/trade/TradingWorkspace';
import WalletFloatingNav from '@/components/trade/WalletFloatingNav';
import Background from '@/components/shared/Background';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Wallet, TrendingUp } from 'lucide-react';

type DashTab = 'wallet' | 'trading';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashTab>(
    (searchParams.get('tab') as DashTab) ?? 'wallet'
  );

  // Sync tab to URL so users can deep-link / refresh to same view
  const handleTabChange = (tab: DashTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  // If URL param changes externally, keep local state in sync
  useEffect(() => {
    const t = searchParams.get('tab') as DashTab;
    if (t && t !== activeTab) setActiveTab(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <ProtectedRoute>
      <Background type="dashboard" />

      <div className="relative z-10 min-h-screen overflow-x-hidden">
        {/* ── Shared app header ──────────────────────────────────── */}
        <DashboardHeader />



        {/* ── Wallet view ────────────────────────────────────────── */}
        {activeTab === 'wallet' && (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl pt-8 md:pt-10 pb-16">
            <OnboardingChecklist />
            <BalanceCard />
            <AssetsList />
            <DashboardTips />
          </main>
        )}

        {/* ── Trading view ───────────────────────────────────────── */}
        {activeTab === 'trading' && (
          /* TradingWorkspace renders its own sticky sub-header + TradeFloatingNav */
          <TradingWorkspace />
        )}
      </div>

      <FloatingNavbar />
    </ProtectedRoute>
  );
}

// ── Internal pill component ────────────────────────────────────────────
function TabPill({
  id,
  label,
  icon,
  active,
  onClick,
  accent = 'cyan',
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  accent?: 'cyan' | 'lime';
}) {
  const accentStyles = {
    cyan: {
      active:   'bg-cyan/10 border-cyan/30 text-cyan shadow-[0_0_12px_rgba(0,255,204,0.15)]',
      inactive: 'hover:bg-surface-hover hover:text-text-primary',
      dot:      'bg-cyan shadow-[0_0_8px_#00ffcc]',
    },
    lime: {
      active:   'bg-lime/10 border-lime/30 text-lime shadow-[0_0_12px_rgba(204,255,0,0.15)]',
      inactive: 'hover:bg-surface-hover hover:text-text-primary',
      dot:      'bg-lime shadow-[0_0_8px_#ccff00]',
    },
  }[accent];

  return (
    <button
      id={id}
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all duration-200 ${
        active
          ? `${accentStyles.active} border`
          : `text-text-secondary border-transparent ${accentStyles.inactive}`
      }`}
    >
      {icon}
      {label}
      {active && (
        <span
          className={`absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${accentStyles.dot}`}
        />
      )}
    </button>
  );
}
