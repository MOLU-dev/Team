'use client';

import { useState } from 'react';
import { FlaskConical, Wallet } from 'lucide-react';
import { useTradingAccount } from '@/hooks/useTradingAccount';

import TradeFloatingNav from './TradeFloatingNav';
import QuotesTab from './QuotesTab';
import ChartsTab from './ChartsTab';
import TradeTab from './TradeTab';
import HistoryTab from './HistoryTab';
import type { TradeTab as TradeTabType } from './TradeFloatingNav';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

export default function TradingWorkspace() {
  const [activeTab,   setActiveTab]   = useState<TradeTabType>('quotes');
  const [navVisible,  setNavVisible]  = useState(true);

  const {
    accounts,
    activeAccount,
    activeAccountId,
    isDemo,
    isLoadingAccounts,
    isLoadingDetail,
    setActiveAccountId,
    setIsDemo,
    refetchDetail,
  } = useTradingAccount();



  /* ─── Loading skeleton ───────────────────────────────────────────── */
  const LoadingSkeleton = isLoadingDetail && activeTab !== 'quotes' && activeTab !== 'charts' && (
    <div className="space-y-3 mt-2 px-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse border border-white/[0.04]" />
      ))}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     DESKTOP  ≥ lg : 3-panel trading terminal
  ═══════════════════════════════════════════════════════════════════ */
  return (
    <>


      {/* ── DESKTOP 3-panel layout ─────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr_300px] lg:h-[calc(100vh-113px)] overflow-hidden">

        {/* LEFT — Quotes / instrument list */}
        <aside className="border-r border-white/[0.05] overflow-y-auto bg-midnight/30 flex flex-col">
          <div className="px-3 pt-4 pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/50 mb-3">Markets</p>
            <QuotesTab />
          </div>
        </aside>

        {/* CENTER — Full-height chart */}
        <main className="flex flex-col overflow-hidden border-r border-white/[0.05] bg-[#0d1117]">
          <div className="flex-1 overflow-hidden">
            <ChartsTab
              desktopMode
              account={activeAccount}
              isDemo={isDemo}
              onOrderPlaced={refetchDetail}
            />
          </div>

          {/* Bottom: open-orders strip */}
          <div className="border-t border-white/[0.05] max-h-[220px] overflow-y-auto bg-midnight/60 backdrop-blur-xl">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/50">Open Orders</p>
            </div>
            <div className="px-3 pb-3">
              <HistoryTab accountId={activeAccountId} onCancelOrder={refetchDetail} />
            </div>
          </div>
        </main>

        {/* RIGHT — Trade form */}
        <aside className="overflow-y-auto bg-midnight/30 px-4 pt-4 pb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/50 mb-3">Place Order</p>
          {!isLoadingDetail ? (
            <TradeTab
              account={activeAccount}
              isDemo={isDemo}
              onOrderPlaced={refetchDetail}
            />
          ) : (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-white/[0.03] rounded-xl animate-pulse border border-white/[0.04]" />
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* ── MOBILE: Charts tab = full-page, others = contained ─────── */}
      <div className="lg:hidden">

        {/* Charts tab: full viewport width+height, no padding */}
        {activeTab === 'charts' && (
          <div
            className="fixed inset-0 z-10 bg-[#0d1117]"
            /* push down below the two sticky bars (AppHeader ~57px + sub-header ~49px) */
            style={{ top: '106px' }}
          >
            <ChartsTab
              account={activeAccount}
              isDemo={isDemo}
              onOrderPlaced={refetchDetail}
              navVisible={navVisible}
              onNavToggle={setNavVisible}
            />
          </div>
        )}

        {/* Other tabs: normal contained layout */}
        {activeTab !== 'charts' && (
          <div className="container mx-auto px-4 sm:px-6 max-w-2xl pt-5 pb-32">
            {LoadingSkeleton}
            {!isLoadingDetail && (
              <>
                {activeTab === 'quotes'  && <QuotesTab />}
                {activeTab === 'trade'   && (
                  <TradeTab
                    account={activeAccount}
                    isDemo={isDemo}
                    onOrderPlaced={refetchDetail}
                  />
                )}
                {activeTab === 'history' && (
                  <HistoryTab
                    accountId={activeAccountId}
                    onCancelOrder={refetchDetail}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Floating bottom nav — hidden when chart drawer is open */}
        <TradeFloatingNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            // Always restore nav when switching away from charts
            if (tab !== 'charts') setNavVisible(true);
          }}
          visible={activeTab === 'charts' ? navVisible : true}
        />
      </div>
    </>
  );
}
