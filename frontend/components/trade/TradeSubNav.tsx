'use client';

import { BarChart2, CandlestickChart, ArrowLeftRight, History } from 'lucide-react';

export type TradeTab = 'quotes' | 'charts' | 'trade' | 'history';

interface TradeSubNavProps {
  activeTab: TradeTab;
  onTabChange: (tab: TradeTab) => void;
}

const TABS: { id: TradeTab; label: string; icon: React.ReactNode }[] = [
  { id: 'quotes',  label: 'Quotes',  icon: <BarChart2 size={19} /> },
  { id: 'charts',  label: 'Charts',  icon: <CandlestickChart size={19} /> },
  { id: 'trade',   label: 'Trade',   icon: <ArrowLeftRight size={19} /> },
  { id: 'history', label: 'History', icon: <History size={19} /> },
];

export default function TradeSubNav({ activeTab, onTabChange }: TradeSubNavProps) {
  return (
    <nav
      id="trade-sub-nav"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-fit
                 bg-deep-navy/75 backdrop-blur-2xl border border-white/[0.08]
                 rounded-full px-1.5 py-1.5 flex items-center
                 shadow-[0_8px_32px_rgba(0,0,0,0.45)] z-30 animate-slide-up"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`trade-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 sm:px-5 py-2 rounded-full transition-all relative ${
              isActive
                ? 'bg-cyan/10 text-cyan'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
            }`}
          >
            <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
              {tab.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter hidden xs:block">
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan rounded-full shadow-[0_0_8px_#00ffcc]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
