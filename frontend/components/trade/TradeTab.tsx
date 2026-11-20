'use client';

import { useState, useEffect } from 'react';
import { tradingApi, TradingAccountDetail, tradingWS } from '@/lib/api/trading';
import { useInstruments } from '@/hooks/useInstruments';
import { toast } from 'sonner';
import { Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TradeTabProps {
  account: TradingAccountDetail | null;
  isDemo: boolean;
  onOrderPlaced?: () => void;
}

const ORDER_TYPES = ['market', 'limit'] as const;
type OrderType = typeof ORDER_TYPES[number];
type Side = 'buy' | 'sell';

export default function TradeTab({ account, isDemo, onOrderPlaced }: TradeTabProps) {
  const { symbols, isLoading: instrumentsLoading } = useInstruments();
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [side, setSide] = useState<Side>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (symbols.length > 0 && !symbols.includes(symbol)) {
      setSymbol(symbols[0]);
    }
  }, [symbols, symbol]);

  const available = account?.balances?.find(
    (b) => b.currency === account.base_currency,
  )?.available ?? '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      toast.error('Select a trading account first');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      toast.error('Enter a valid limit price');
      return;
    }

    setIsSubmitting(true);
    try {
      await tradingWS.placeOrder({
        trading_account_id: account.id,
        symbol,
        side,
        order_type: orderType,
        price: orderType === 'limit' ? price : undefined,
        quantity,
      });
      toast.success(`${side.toUpperCase()} order placed · ${quantity} ${symbol}`);
      setQuantity('');
      setPrice('');
      onOrderPlaced?.();
    } catch (err: any) {
      toast.error(err?.message ?? 'Order failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-slide-up">
      {/* Account balance strip */}
      {account ? (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">Available</p>
            <p className="text-lg font-bold text-text-primary font-orbitron">
              {parseFloat(available).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-sm text-cyan">{account.base_currency}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">Leverage</p>
            <p className="text-lg font-bold text-warning font-orbitron">{account.leverage}×</p>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
          <p className="text-sm text-text-secondary">Select a trading account above to start</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Symbol selector */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Symbol</label>
          <div className="flex flex-wrap gap-2">
            {symbols.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSymbol(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  symbol === s
                    ? 'bg-cyan/15 border-cyan/40 text-cyan'
                    : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:border-cyan/20 hover:text-text-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Buy / Sell side */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Side</label>
          <div className="grid grid-cols-2 gap-2">
            {(['buy', 'sell'] as Side[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all ${
                  side === s
                    ? s === 'buy'
                      ? 'bg-success/15 border-success/40 text-success'
                      : 'bg-danger/15 border-danger/40 text-danger'
                    : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.06]'
                }`}
              >
                {s === 'buy' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Order type */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Order Type</label>
          <div className="flex bg-white/[0.03] border border-white/[0.08] rounded-xl p-1 gap-1">
            {ORDER_TYPES.map((ot) => (
              <button
                key={ot}
                type="button"
                onClick={() => setOrderType(ot)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  orderType === ot
                    ? 'bg-cyan text-midnight shadow-lg shadow-cyan/20'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {ot}
              </button>
            ))}
          </div>
        </div>

        {/* Price (limit only) */}
        {orderType === 'limit' && (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
              Price (USD)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none focus:border-cyan/40 transition-all font-orbitron"
            />
          </div>
        )}

        {/* Quantity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Quantity</label>
            <span className="text-[10px] text-text-secondary">
              ~{symbol.replace('USDT', '').replace('USDC', '').replace('EUROC', '')}
            </span>
          </div>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none focus:border-cyan/40 transition-all font-orbitron"
          />
          {/* Quick-fill percentages */}
          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  // We can only estimate quantity from available balance if we had the price
                  // For now just note the percentage for UX reference
                  toast.info(`Set ${pct}% of available balance`);
                }}
                className="flex-1 py-1 rounded-lg text-[10px] font-bold text-text-secondary bg-white/[0.03] border border-white/[0.06] hover:border-cyan/20 hover:text-cyan transition-all"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="place-order-btn"
          disabled={isSubmitting || !account}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            side === 'buy'
              ? 'bg-gradient-to-r from-success to-emerald-500 text-midnight shadow-lg shadow-success/20 hover:shadow-success/40 hover:-translate-y-0.5'
              : 'bg-gradient-to-r from-danger to-rose-500 text-white shadow-lg shadow-danger/20 hover:shadow-danger/40 hover:-translate-y-0.5'
          } disabled:opacity-50 disabled:pointer-events-none`}
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              {side === 'buy' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
              {isDemo ? '(Demo) ' : ''}{side === 'buy' ? 'Buy' : 'Sell'} {symbol}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
