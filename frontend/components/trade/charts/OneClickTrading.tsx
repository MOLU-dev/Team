'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatPrice } from './utils';

interface OneClickTradingProps {
  bid: number | null;
  ask: number | null;
  quantity: string;
  setQuantity: (q: string | ((q: string) => string)) => void;
  placeOrder: (side: 'buy' | 'sell') => Promise<void>;
}

export default function OneClickTrading({
  bid,
  ask,
  quantity,
  setQuantity,
  placeOrder,
}: OneClickTradingProps) {
  return (
    <div className="flex items-stretch bg-[#111620] border-t border-white/[0.06]">
      <button onClick={() => placeOrder('sell')}
        className="flex-1 flex flex-col items-start px-4 py-2.5 bg-danger/10 hover:bg-danger/15 active:bg-danger/20 transition-colors">
        <span className="text-[9px] font-black uppercase tracking-widest text-danger/60">SELL</span>
        <span className="text-base font-black font-orbitron text-danger">{bid ? formatPrice(bid) : '—'}</span>
      </button>
      <div className="flex items-center border-x border-white/[0.06]">
        <button onClick={() => setQuantity(q => Math.max(0.01, parseFloat(q)-0.01).toFixed(2))}
          className="px-3 h-full text-text-secondary hover:text-cyan transition-colors"><ChevronDown size={15}/></button>
        <span className="text-sm font-bold text-text-primary w-10 text-center">{quantity}</span>
        <button onClick={() => setQuantity(q => (parseFloat(q)+0.01).toFixed(2))}
          className="px-3 h-full text-text-secondary hover:text-cyan transition-colors"><ChevronUp size={15}/></button>
      </div>
      <button onClick={() => placeOrder('buy')}
        className="flex-1 flex flex-col items-end px-4 py-2.5 bg-success/10 hover:bg-success/15 active:bg-success/20 transition-colors">
        <span className="text-[9px] font-black uppercase tracking-widest text-success/60">BUY</span>
        <span className="text-base font-black font-orbitron text-success">{ask ? formatPrice(ask) : '—'}</span>
      </button>
    </div>
  );
}
