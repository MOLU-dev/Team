'use client';

import TradingViewChart from './TradingViewChart';

interface DesktopChartsProps {
  symbols: string[];
  symbol: string;
  setSymbol: (s: string) => void;
  timeframe: string;
}

export default function DesktopCharts({
  symbols,
  symbol,
  setSymbol,
  timeframe,
}: DesktopChartsProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Symbol chips */}
      <div className="flex flex-wrap gap-1.5 p-2 border-b border-white/5 bg-[#0d1117]">
        {symbols.slice(0, 8).map(p => (
          <button key={p} onClick={() => setSymbol(p)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
              p === symbol
                ? 'bg-cyan/15 border-cyan/40 text-cyan'
                : 'bg-white/[0.03] border-white/[0.07] text-text-secondary hover:border-cyan/20 hover:text-text-primary'
            }`}>{p}</button>
        ))}
      </div>
      <TradingViewChart 
        symbol={symbol} 
        timeframe={timeframe} 
        className="flex-1 w-full" 
      />
    </div>
  );
}
