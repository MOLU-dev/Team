'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMarketPrices } from '@/lib/api/market';
import { getAssetIcon, ASSETS } from '@/lib/chains';
import { tradingWS } from '@/lib/api/trading';
import { TrendingUp, TrendingDown, Search, RefreshCw } from 'lucide-react';
import type { MarketAsset } from '@/lib/api/types';

export default function QuotesTab() {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPrices = useCallback(async (spinner = false) => {
    if (spinner) setIsRefreshing(true);
    try {
      const res = await getMarketPrices();
      const cryptoOnly = (res.assets ?? [])
        .filter((a) => a.type === 'crypto')
        .sort((a, b) => b.price_usd - a.price_usd);
      setAssets(cryptoOnly);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  useEffect(() => {
    const cleanup = tradingWS.onMessage((msg) => {
      if (msg.channel && msg.channel.startsWith('ticker:')) {
        const symbol = msg.channel.split(':')[1];
        const tick = msg.data;
        
        setAssets((prev) => 
          prev.map((a) => 
            a.symbol === symbol 
              ? { ...a, price_usd: (parseFloat(tick.bid) + parseFloat(tick.ask)) / 2, bid: parseFloat(tick.bid), ask: parseFloat(tick.ask) } 
              : a
          )
        );
      }
    });

    tradingWS.subscribe(['ticker:*']);

    return () => {
      cleanup();
      // We might not want to unsubscribe if other components use it, 
      // but ticker:* is broad so it's probably fine to keep or unsubscribe.
    };
  }, []);

  const filtered = assets.filter((a) => {
    const name = ASSETS[a.symbol]?.name ?? a.symbol;
    const q = search.toLowerCase();
    return a.symbol.toLowerCase().includes(q) || name.toLowerCase().includes(q);
  });

  const fmtPrice = (p: number) =>
    p >= 1000
      ? p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : p >= 1
      ? p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
      : p.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 });

  return (
    <div className="space-y-4 animate-fade-slide-up">
      {/* Search + refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search markets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-cyan/40 transition-all"
          />
        </div>
        <button
          onClick={() => fetchPrices(true)}
          disabled={isRefreshing}
          className="p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-secondary hover:text-cyan hover:border-cyan/30 transition-all"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 text-[10px] font-black uppercase tracking-widest text-text-secondary/60">
        <span>Asset</span>
        <span className="text-right">Price (USD)</span>
        <span className="text-right w-16">24h</span>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {isLoading
          ? Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse border border-white/[0.04]" />
            ))
          : filtered.map((asset) => {
              const change = asset.change_24h ?? null;
              const isPos = (change ?? 0) >= 0;
              const spread = asset.bid && asset.ask
                ? (((asset.ask - asset.bid) / asset.ask) * 100).toFixed(3)
                : null;

              return (
                <div
                  key={asset.symbol}
                  className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-cyan/20 transition-all cursor-pointer group"
                >
                  {/* Asset info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/[0.04] rounded-lg flex items-center justify-center p-1.5 border border-white/[0.06] group-hover:scale-105 transition-transform shrink-0">
                      {getAssetIcon(asset.symbol)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{asset.symbol}</p>
                      <p className="text-[10px] text-text-secondary">
                        {ASSETS[asset.symbol]?.name ?? asset.symbol}
                        {spread && <span className="ml-1 opacity-50">· spr {spread}%</span>}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <p className="text-sm font-bold text-text-primary font-orbitron text-right">
                    ${fmtPrice(asset.price_usd)}
                  </p>

                  {/* Change */}
                  <div className={`flex items-center justify-end gap-0.5 text-xs font-bold w-16 ${isPos ? 'text-success' : 'text-danger'}`}>
                    {change !== null ? (
                      <>
                        {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(change).toFixed(2)}%
                      </>
                    ) : (
                      <span className="text-text-secondary/40 text-[10px]">--</span>
                    )}
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
