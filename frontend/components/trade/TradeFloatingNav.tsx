'use client';

import { BarChart2, CandlestickChart, ArrowLeftRight, History } from 'lucide-react';

export type TradeTab = 'quotes' | 'charts' | 'trade' | 'history';

interface TradeFloatingNavProps {
  activeTab:    TradeTab;
  onTabChange:  (tab: TradeTab) => void;
  /** hide/show the nav (used by ChartsTab drawer toggle on mobile) */
  visible?:     boolean;
}

const TABS: { id: TradeTab; label: string; icon: React.ReactNode }[] = [
  { id: 'quotes',  label: 'Quotes',  icon: <BarChart2 size={20} /> },
  { id: 'charts',  label: 'Charts',  icon: <CandlestickChart size={20} /> },
  { id: 'trade',   label: 'Trade',   icon: <ArrowLeftRight size={20} /> },
  { id: 'history', label: 'History', icon: <History size={20} /> },
];

export default function TradeFloatingNav({
  activeTab, onTabChange, visible = true,
}: TradeFloatingNavProps) {
  return (
    <nav
      id="trade-floating-nav"
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-fit
        bg-deep-navy/75 backdrop-blur-2xl border border-cyan/15
        rounded-full px-1.5 py-1.5 flex items-center
        shadow-[0_8px_32px_rgba(0,0,0,0.45)] z-30
        transition-all duration-300 ease-in-out
        ${visible
          ? 'translate-y-0 opacity-100 pointer-events-auto animate-slide-up'
          : 'translate-y-28 opacity-0 pointer-events-none'
        }
      `}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`trade-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col items-center gap-1 px-4 sm:px-5 py-2 rounded-full
              transition-all relative
              ${isActive
                ? 'bg-gradient-to-b from-cyan/20 to-electric-blue/10 text-cyan'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
              }
            `}
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
