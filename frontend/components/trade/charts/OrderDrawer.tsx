'use client';

import { ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import { DrawerState, OrderType, ORDER_TYPES } from './types';

interface OrderDrawerProps {
  drawerState: DrawerState;
  onDragStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onDragEnd: (e: React.TouchEvent | React.MouseEvent) => void;
  symbol: string;
  onNavToggle: (v: boolean) => void;
  setDrawerState: (v: DrawerState) => void;
  orderType: OrderType;
  setOrderType: (ot: OrderType) => void;
  quantity: string;
  setQuantity: (q: string | ((q: string) => string)) => void;
  limitPrice: string;
  setLimitPrice: (p: string | ((p: string) => string)) => void;
  bid: number | null;
  isSubmitting: boolean;
  placeOrder: () => Promise<void>;
  fmt: (p: number) => string;
  isEmbedded?: boolean;
}

export default function OrderDrawer({
  drawerState,
  onDragStart,
  onDragEnd,
  symbol,
  onNavToggle,
  setDrawerState,
  orderType,
  setOrderType,
  quantity,
  setQuantity,
  limitPrice,
  setLimitPrice,
  bid,
  isSubmitting,
  placeOrder,
  fmt,
  isEmbedded = false,
}: OrderDrawerProps) {
  return (
    <div className={`${isEmbedded ? 'relative' : 'fixed bottom-0 left-0 right-0'} bg-[#151b2e] rounded-t-2xl z-40 flex flex-col
      shadow-[0_-8px_40px_rgba(0,0,0,0.6)] border-t border-white/[0.08] transition-all duration-300
      ${drawerState === 'full' ? 'h-[90vh]' : drawerState === 'partial' ? 'h-[45vh]' : 'h-0 overflow-hidden'}`}
    >
      {/* Drag handle */}
      <div className="flex justify-center items-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0"
        onTouchStart={onDragStart} onTouchEnd={onDragEnd}
        onMouseDown={onDragStart}  onMouseUp={onDragEnd}>
        <div className="w-10 h-1 bg-white/20 rounded-full" />
      </div>

      {/* Symbol + SL/TP row */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <button className="flex items-center gap-1.5 text-cyan font-bold text-sm">
          {symbol} <ChevronDown size={13} className="text-cyan/50" />
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border border-danger/40 text-danger bg-danger/10">SL</span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border border-success/40 text-success bg-success/10">TP</span>
          <button onClick={() => { onNavToggle(true); setDrawerState('hidden'); }}
            className="p-1 text-text-secondary hover:text-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Order type tabs */}
      <div className="flex overflow-x-auto scrollbar-hide px-3 gap-0.5 pb-1 border-b border-white/[0.06] shrink-0">
        {ORDER_TYPES.map(ot => {
          const isSell = ot.id.startsWith('sell');
          const isActive = orderType === ot.id;
          return (
            <button key={ot.id} onClick={() => setOrderType(ot.id)}
              className={`shrink-0 px-3 py-2 text-xs font-bold transition-all border-b-2 ${
                isActive
                  ? isSell ? 'border-danger text-danger' : 'border-cyan text-cyan'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}>{ot.label}</button>
          );
        })}
      </div>

      {/* Scrollable form content */}
      <div className="overflow-y-auto flex-1 px-4 pt-4 pb-6 space-y-4">
        {/* Volume */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 justify-between">
            <span className="text-xs text-text-secondary font-bold">Volume</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(q => Math.max(0.01, parseFloat(q)-0.01).toFixed(2))}
                className="text-text-secondary hover:text-cyan"><ChevronDown size={16}/></button>
              <span className="font-orbitron text-sm font-bold text-text-primary w-12 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q => (parseFloat(q)+0.01).toFixed(2))}
                className="text-text-secondary hover:text-cyan"><ChevronUp size={16}/></button>
            </div>
          </div>
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-3 gap-1 text-xs text-text-secondary font-bold">
            Lots <ChevronDown size={12}/>
          </div>
        </div>

        {/* Volume slider */}
        <input type="range" min="0.01" max="10" step="0.01"
          value={quantity} onChange={e => setQuantity(e.target.value)}
          className="w-full accent-cyan" />

        {/* Price (limit/stop) */}
        {orderType !== 'market' && (
          <div className="flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
            <span className="text-xs text-text-secondary font-bold">Price</span>
            <input type="number" step="any" min="0" placeholder={bid ? fmt(bid) : '0.00'}
              value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
              className="bg-transparent text-right font-orbitron text-sm font-bold text-text-primary w-32 focus:outline-none" />
            <div className="flex flex-col ml-1">
              <button onClick={() => setLimitPrice(p => ((parseFloat(p)||0)+0.00001).toFixed(5))}
                className="text-text-secondary hover:text-cyan"><ChevronUp size={12}/></button>
              <button onClick={() => setLimitPrice(p => Math.max(0,(parseFloat(p)||0)-0.00001).toFixed(5))}
                className="text-text-secondary hover:text-cyan"><ChevronDown size={12}/></button>
            </div>
          </div>
        )}

        {/* Add stop levels */}
        <button className="w-full py-3 rounded-xl text-sm font-bold text-cyan border border-cyan/20 bg-cyan/5 hover:bg-cyan/10 transition-all">
          Add Stop Levels
        </button>

        {/* Expiry / comment */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Expiration:</span>
          <button className="flex items-center gap-1 text-cyan font-bold">GTC <ChevronDown size={12}/></button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Comment:</span>
          <button className="text-cyan font-bold text-sm">Add comment</button>
        </div>

        {/* Submit */}
        <button onClick={() => placeOrder()} disabled={isSubmitting}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            orderType.startsWith('sell')
              ? 'bg-gradient-to-r from-danger to-rose-500 text-white shadow-lg shadow-danger/20 hover:-translate-y-0.5'
              : 'bg-gradient-to-r from-cyan to-electric-blue text-midnight shadow-lg shadow-cyan/20 hover:-translate-y-0.5'
          } disabled:opacity-50 disabled:pointer-events-none`}>
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
          {orderType === 'market'
            ? (orderType.startsWith('sell') ? 'Sell at Market' : 'Buy at Market')
            : `Place ${ORDER_TYPES.find(o => o.id === orderType)?.label}`}
        </button>
      </div>
    </div>
  );
}
