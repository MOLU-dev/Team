'use client';

import { useState, useEffect, useRef } from 'react';
import { useInstruments } from '@/hooks/useInstruments';
import { tradingWS, TradingAccountDetail } from '@/lib/api/trading';
import { getMarketPrices } from '@/lib/api/market';
import { toast } from 'sonner';

// Sub-components
import { DrawerState, OrderType } from './charts/types';
import TradingViewChart from './charts/TradingViewChart';
import MobileToolbar from './charts/MobileToolbar';
import OneClickTrading from './charts/OneClickTrading';
import OrderDrawer from './charts/OrderDrawer';
import DesktopCharts from './charts/DesktopCharts';
import { formatPrice } from './charts/utils';

export interface ChartsTabProps {
  account?:       TradingAccountDetail | null;
  isDemo?:        boolean;
  onOrderPlaced?: () => void;
  /** mobile nav visibility controlled from parent */
  navVisible?:    boolean;
  onNavToggle?:   (v: boolean) => void;
  /** skip mobile toolbar on desktop 3-panel layout */
  desktopMode?:   boolean;
}

export default function ChartsTab({
  account, isDemo, onOrderPlaced,
  navVisible = true, onNavToggle, desktopMode = false,
}: ChartsTabProps) {
  const { symbols } = useInstruments();
  const [symbol,        setSymbol]        = useState('BTCUSDT');
  const [timeframe,     setTimeframe]     = useState('M5');
  const [showTF,        setShowTF]        = useState(false);
  const [drawerState,   setDrawerState]   = useState<DrawerState>('hidden');
  const [oneClick,      setOneClick]      = useState(false);
  const [orderType,     setOrderType]     = useState<OrderType>('market');
  const [quantity,      setQuantity]      = useState('0.01');
  const [limitPrice,    setLimitPrice]    = useState('');
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [bid,           setBid]           = useState<number | null>(null);
  const [ask,           setAsk]           = useState<number | null>(null);

  const dragStartY = useRef(0);
  const dragging   = useRef(false);

  useEffect(() => {
    if (symbols.length > 0 && !symbols.includes(symbol)) setSymbol(symbols[0]);
  }, [symbols, symbol]);

  // Poll market prices
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMarketPrices();
        const a = res.assets?.find(x => x.symbol === symbol);
        if (a) { setBid(a.bid ?? null); setAsk(a.ask ?? null); }
      } catch {}
    };
    fetch();
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, [symbol]);



  /* ── Nav / drawer toggle ─────────────────────────────────────── */
  const handleNavToggle = () => {
    const next = !navVisible;
    onNavToggle?.(next);
    setDrawerState(next ? 'hidden' : 'partial');
  };

  /* ── Drag to expand/collapse drawer ─────────────────────────── */
  const onDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    dragging.current = true;
    dragStartY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
  };
  const onDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const endY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const delta = dragStartY.current - endY;
    if (delta > 50  && drawerState === 'partial') setDrawerState('full');
    if (delta < -50 && drawerState === 'full')    setDrawerState('partial');
  };

  /* ── Place order ─────────────────────────────────────────────── */
  const placeOrder = async (forceSide?: 'buy' | 'sell') => {
    if (!account) { toast.error('Select a trading account first'); return; }
    const isLimit = orderType !== 'market';
    if (isLimit && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error('Enter a valid price'); return;
    }
    const side: 'buy' | 'sell' = forceSide
      ?? (orderType === 'sell_limit' || orderType === 'sell_stop' ? 'sell' : 'buy');

    setIsSubmitting(true);
    try {
      await tradingWS.placeOrder({
        trading_account_id: account.id, symbol, side,
        order_type: isLimit ? 'limit' : 'market',
        price: isLimit ? limitPrice : undefined,
        quantity,
      });
      toast.success(`Order placed · ${quantity} ${symbol}`);
      onOrderPlaced?.();
    } catch (err: any) {
      toast.error(err?.message ?? 'Order failed');
    } finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    // If oneClick is enabled on mobile, we must hide the nav to show the trading area
    if (oneClick && !desktopMode && navVisible) {
      onNavToggle?.(false);
      setDrawerState('partial');
    }
  }, [oneClick, desktopMode, navVisible, onNavToggle]);

  /* ── DESKTOP mode (used inside 3-panel workspace) ────────────── */
  if (desktopMode) {
    return (
      <DesktopCharts 
        symbols={symbols}
        symbol={symbol}
        setSymbol={setSymbol}
        timeframe={timeframe}
      />
    );
  }

  /* ── MOBILE mode ─────────────────────────────────────────────── */
  return (
    <div className="relative flex flex-col h-full bg-[#0d1117]">
      <MobileToolbar 
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        showTF={showTF}
        setShowTF={setShowTF}
        oneClick={oneClick}
        setOneClick={setOneClick}
        navVisible={navVisible}
        handleNavToggle={handleNavToggle}
      />

      {/* Symbol info overlay */}
      <div className="absolute top-[52px] left-3 z-10 pointer-events-none">
        <p className="text-cyan text-sm font-bold leading-tight">
          {symbol} <span className="text-white/30 text-xs">▼</span> {timeframe}
        </p>
        <p className="text-white/40 text-xs">
          {symbol.replace('USDT','').replace('USDC','').replace('EUROC','')} vs USD
        </p>
      </div>

      {/* Chart */}
      <div className={`transition-all duration-300 ${drawerState === 'full' ? 'h-[120px]' : 'flex-1'}`}>
        <TradingViewChart 
          symbol={symbol} 
          timeframe={timeframe} 
          className="w-full h-full" 
        />
      </div>

      {/* ── Bottom Trading Controls Area ──────────────────────────────── */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col transition-all duration-500 transform ${
          !navVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* One-click trading bar - sits on top of the drawer content */}
        {oneClick && (
          <div className="bg-[#111620] border-t border-white/[0.06] shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
            <OneClickTrading 
              bid={bid}
              ask={ask}
              quantity={quantity}
              setQuantity={setQuantity}
              placeOrder={placeOrder}
            />
          </div>
        )}

        <OrderDrawer 
          drawerState={drawerState}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          symbol={symbol}
          onNavToggle={(v) => onNavToggle?.(v)}
          setDrawerState={setDrawerState}
          orderType={orderType}
          setOrderType={setOrderType}
          quantity={quantity}
          setQuantity={setQuantity}
          limitPrice={limitPrice}
          setLimitPrice={setLimitPrice}
          bid={bid}
          isSubmitting={isSubmitting}
          placeOrder={placeOrder}
          fmt={formatPrice}
          isEmbedded={true}
        />
      </div>
    </div>
  );
}
