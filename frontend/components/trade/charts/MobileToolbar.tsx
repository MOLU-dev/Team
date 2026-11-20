'use client';

import { Menu, Plus, TrendingUp, ChevronDown, Layers, SlidersHorizontal } from 'lucide-react';
import { TIMEFRAMES } from './types';

interface MobileToolbarProps {
  timeframe: string;
  setTimeframe: (tf: string) => void;
  showTF: boolean;
  setShowTF: (v: boolean | ((v: boolean) => boolean)) => void;
  oneClick: boolean;
  setOneClick: (v: boolean | ((v: boolean) => boolean)) => void;
  navVisible: boolean;
  handleNavToggle: () => void;
}

export default function MobileToolbar({
  timeframe,
  setTimeframe,
  showTF,
  setShowTF,
  oneClick,
  setOneClick,
  navVisible,
  handleNavToggle,
}: MobileToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-[#0d1117] z-20">
      <div className="flex items-center gap-3.5 text-text-secondary">
        <button className="hover:text-text-primary transition-colors"><Menu size={19} /></button>
        <button className="hover:text-text-primary transition-colors"><Plus size={19} /></button>
        <button className="hover:text-text-primary transition-colors"><TrendingUp size={19} /></button>
      </div>

      {/* Timeframe */}
      <div className="relative">
        <button onClick={() => setShowTF(v => !v)}
          className="flex items-center gap-1 text-sm font-bold text-text-primary px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
          {timeframe} <ChevronDown size={12} />
        </button>
        {showTF && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-deep-navy border border-white/10 rounded-xl p-2 grid grid-cols-4 gap-1 z-50 shadow-2xl">
            {TIMEFRAMES.map(tf => (
              <button key={tf} onClick={() => { setTimeframe(tf); setShowTF(false); }}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tf === timeframe ? 'bg-cyan text-midnight' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}>{tf}</button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* One-click toggle */}
        <button onClick={() => setOneClick(v => !v)}
          id="chart-one-click-btn"
          className={`p-1.5 rounded-lg transition-all ${oneClick ? 'bg-cyan/20 text-cyan shadow-[0_0_10px_rgba(0,255,204,0.2)]' : 'text-text-secondary hover:text-text-primary'}`}>
          <Layers size={19} />
        </button>
        {/* Drawer / nav toggle */}
        <button onClick={handleNavToggle}
          id="chart-drawer-toggle-btn"
          className={`p-1.5 rounded-lg transition-all ${!navVisible ? 'bg-cyan/20 text-cyan shadow-[0_0_10px_rgba(0,255,204,0.2)]' : 'text-text-secondary hover:text-text-primary'}`}>
          <SlidersHorizontal size={19} />
        </button>
      </div>
    </div>
  );
}
