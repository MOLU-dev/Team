'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getMarketPrices } from '@/lib/api/market';
import { api } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';
import { getAssetIcon, getAssetTextColor, ASSETS } from '@/lib/chains';
import {
  BarChart3, TrendingUp, TrendingDown, Search, ArrowUpRight,
  Clock, Star, RefreshCw, ArrowLeft, Wifi, WifiOff, Layers,
  ChevronDown, Activity, Zap, Globe, Plus
} from 'lucide-react';
import type { MarketAsset } from '@/lib/api/types';

type ViewMode = 'grid' | 'list' | 'p2p';
type FilterType = 'all' | 'crypto' | 'fiat';
type SortField = 'name' | 'price' | 'change';

export default function P2PPage() {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortAsc, setSortAsc] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [tickFlash, setTickFlash] = useState<Record<string, 'up' | 'down'>>({});
  const [showPostAd, setShowPostAd] = useState(false);

  const fetchMarketData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const [marketRes, balRes] = await Promise.all([
        getMarketPrices(),
        api.getAllBalances()
      ]);

      if (balRes.success && balRes.balances) {
        const internalFiat = balRes.balances.find(b => b.chain === 'internal');
        if (internalFiat) {
          setPreferredCurrency(internalFiat.currency);
        } else if (balRes.balances.length > 0 && balRes.balances[0].fiat_currency) {
          setPreferredCurrency(balRes.balances[0].fiat_currency);
        }
      }

      if (marketRes.assets) {
        setAssets(prev => {
          const flashes: Record<string, 'up' | 'down'> = {};
          marketRes.assets.forEach(newA => {
            const oldA = prev.find(p => p.symbol === newA.symbol);
            if (oldA && oldA.price_usd !== newA.price_usd) {
              flashes[newA.symbol] = newA.price_usd > oldA.price_usd ? 'up' : 'down';
            }
          });
          if (Object.keys(flashes).length > 0) {
            setTickFlash(flashes);
            setTimeout(() => setTickFlash({}), 800);
          }
          return [...marketRes.assets].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'crypto' ? -1 : 1;
            return a.symbol.localeCompare(b.symbol);
          });
        });
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch market prices', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMarketData(); }, [fetchMarketData]);
  useEffect(() => {
    const interval = setInterval(() => fetchMarketData(), 10_000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  useWebSocket(useCallback((notif: any) => {
    if (notif.type === 'price_update') fetchMarketData();
  }, [fetchMarketData]));

  // Filtering
  const filteredAssets = assets.filter(a => {
    const assetName = ASSETS[a.symbol]?.name ?? a.symbol;
    const matchesSearch =
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'crypto' && a.type === 'crypto') ||
      (filter === 'fiat' && a.type === 'fiat');
    if (a.type === 'fiat' && preferredCurrency && a.symbol !== preferredCurrency) return false;
    return matchesSearch && matchesFilter;
  });

  // Sorting
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.symbol.localeCompare(b.symbol);
    else if (sortField === 'price') cmp = a.price_usd - b.price_usd;
    else if (sortField === 'change') cmp = (a.change_24h ?? 0) - (b.change_24h ?? 0);
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const cryptoCount = assets.filter(a => a.type === 'crypto').length;
  const gainers = assets.filter(a => (a.change_24h ?? 0) > 0).length;
  const losers = assets.filter(a => (a.change_24h ?? 0) < 0).length;

  const formatPrice = (asset: MarketAsset) => {
    if (asset.price_usd === 0) return '--';
    if (asset.type === 'fiat') return asset.price_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (asset.price_usd >= 1000) return asset.price_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (asset.price_usd >= 1) return asset.price_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return asset.price_usd.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
  };

  const formatSpread = (asset: MarketAsset) => {
    if (asset.bid === 0 || asset.ask === 0) return null;
    return (((asset.ask - asset.bid) / asset.ask) * 100).toFixed(3);
  };

  return (
    <ProtectedRoute>
      <div className="fixed inset-0 bg-midnight z-0">
        {/* Subtle ambient grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(0,255,204,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan/[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-electric-blue/[0.02] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative z-10 h-screen flex flex-col overflow-hidden">
        {/* ── Top Bar ──────────────────────────────────────────────── */}
        <header className="flex-shrink-0 border-b border-white/[0.04] bg-midnight/60 backdrop-blur-2xl">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="w-9 h-9 flex items-center justify-center bg-white/[0.04] border border-white/[0.06] rounded-xl hover:border-cyan/30 hover:bg-cyan/5 transition-all"
              >
                <ArrowLeft size={16} className="text-text-secondary" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gradient-to-br from-cyan to-electric-blue clip-hexagon flex items-center justify-center">
                  <BarChart3 size={13} className="text-midnight" />
                </div>
                <div>
                  <h1 className="text-sm font-black text-text-primary tracking-tight leading-none">
                    P2P Marketplace
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${isConnected ? 'text-success' : 'text-danger'}`}>
                      {isConnected ? <Wifi size={8} /> : <WifiOff size={8} />}
                      {isConnected ? 'Live' : 'Offline'}
                    </div>
                    {lastUpdated && (
                      <span className="text-[9px] text-text-secondary/40 font-medium">
                        · {lastUpdated.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Quick Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-xs">
                <Layers size={12} className="text-cyan/60" />
                <span className="text-text-secondary">{cryptoCount}</span>
                <span className="text-text-secondary/40">assets</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp size={12} className="text-success/60" />
                <span className="text-success">{gainers}</span>
                <span className="text-text-secondary/40">gainers</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingDown size={12} className="text-danger/60" />
                <span className="text-danger">{losers}</span>
                <span className="text-text-secondary/40">losers</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPostAd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan to-electric-blue text-midnight font-bold text-xs rounded-xl shadow-lg shadow-cyan/10 hover:shadow-cyan/25 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Plus size={14} />
                <span className="hidden xs:inline">Create Ad</span>
              </button>

              <button
                onClick={() => fetchMarketData(true)}
                disabled={isRefreshing}
                className="w-9 h-9 flex items-center justify-center bg-white/[0.04] border border-white/[0.06] rounded-xl text-text-secondary hover:text-cyan hover:border-cyan/30 transition-all disabled:opacity-40"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <div className="hidden sm:flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-0.5 gap-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'grid' ? 'bg-cyan/10 text-cyan' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'list' ? 'bg-cyan/10 text-cyan' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('p2p')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'p2p' ? 'bg-cyan/10 text-cyan' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  P2P
                </button>
              </div>
            </div>
          </div>

          {/* ── Filter Bar ────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-2.5 border-t border-white/[0.02]">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-cyan/30 transition-all"
              />
            </div>
            <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-0.5 gap-0.5">
              {(['all', 'crypto', 'fiat'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                    filter === f
                      ? 'bg-cyan/10 text-cyan shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── Main Content (scrollable) ───────────────────────────── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className={`bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse ${viewMode === 'grid' ? 'h-44' : 'h-16'}`} />
                ))}
              </div>
            ) : sortedAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <BarChart3 className="mb-4 text-text-secondary/10" size={56} />
                <p className="text-sm text-text-secondary">No assets found{searchQuery ? ` for "${searchQuery}"` : ''}</p>
                <p className="text-xs text-text-secondary/40 mt-1">Prices are fetched from the live price engine.</p>
              </div>
            ) : viewMode === 'grid' ? (
              /* ── Grid View ──────────────────────────────────────── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedAssets.map((asset, i) => {
                  const info = ASSETS[asset.symbol];
                  const change = asset.change_24h ?? null;
                  const isPositive = (change ?? 0) >= 0;
                  const spread = formatSpread(asset);
                  const flash = tickFlash[asset.symbol];

                  return (
                    <div
                      key={asset.symbol}
                      className={`
                        group relative bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5
                        hover:bg-white/[0.04] hover:border-cyan/20 transition-all duration-300
                        ${flash === 'up' ? 'ring-1 ring-success/30 bg-success/[0.03]' : ''}
                        ${flash === 'down' ? 'ring-1 ring-danger/30 bg-danger/[0.03]' : ''}
                      `}
                      style={{ animationDelay: `${i * 0.03}s` }}
                    >
                      {/* Top accent line */}
                      <div className={`absolute top-0 left-4 right-4 h-px ${isPositive ? 'bg-gradient-to-r from-transparent via-success/20 to-transparent' : 'bg-gradient-to-r from-transparent via-danger/20 to-transparent'}`} />

                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center p-2 border border-white/[0.06] group-hover:scale-110 group-hover:border-cyan/20 transition-all">
                            {getAssetIcon(asset.symbol)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-text-primary leading-none">{info?.name || asset.symbol}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-text-secondary/60 uppercase tracking-widest font-bold">{asset.symbol}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${asset.type === 'crypto' ? 'bg-cyan/8 text-cyan/70' : 'bg-electric-blue/8 text-electric-blue/70'}`}>
                                {asset.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        {change !== null && (
                          <div className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-success/8 text-success' : 'bg-danger/8 text-danger'}`}>
                            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {Math.abs(change).toFixed(2)}%
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="text-[10px] text-text-secondary/40 mb-0.5 uppercase tracking-widest font-bold">
                          {asset.type === 'fiat' ? 'Per 1 USD' : 'Price'}
                        </p>
                        <p className={`text-xl font-black text-text-primary tracking-tight font-orbitron transition-colors duration-300 ${flash === 'up' ? 'text-success' : flash === 'down' ? 'text-danger' : ''}`}>
                          {asset.type === 'fiat' ? '' : '$'}{formatPrice(asset)}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
                        <div className="text-[9px] text-text-secondary/40 font-medium space-y-0.5">
                          {spread ? <p>Spread: {spread}%</p> : <p className="flex items-center gap-1"><Activity size={8} /> Live</p>}
                          <p>src: {asset.source || 'aggregated'}</p>
                        </div>
                        <button className="p-2 bg-white/[0.03] rounded-lg text-text-secondary/30 hover:bg-cyan/10 hover:text-cyan transition-all opacity-0 group-hover:opacity-100">
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : viewMode === 'list' ? (
              /* ── List View ──────────────────────────────────────── */
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl overflow-hidden">
                {/* List header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                  <button onClick={() => handleSort('name')} className="text-[10px] font-black uppercase tracking-widest text-text-secondary/50 text-left hover:text-cyan transition-colors flex items-center gap-1">
                    Asset {sortField === 'name' && <ChevronDown size={10} className={sortAsc ? 'rotate-180' : ''} />}
                  </button>
                  <button onClick={() => handleSort('price')} className="text-[10px] font-black uppercase tracking-widest text-text-secondary/50 text-right hover:text-cyan transition-colors flex items-center gap-1 justify-end w-32">
                    Price {sortField === 'price' && <ChevronDown size={10} className={sortAsc ? 'rotate-180' : ''} />}
                  </button>
                  <button onClick={() => handleSort('change')} className="text-[10px] font-black uppercase tracking-widest text-text-secondary/50 text-right hover:text-cyan transition-colors flex items-center gap-1 justify-end w-20">
                    24h {sortField === 'change' && <ChevronDown size={10} className={sortAsc ? 'rotate-180' : ''} />}
                  </button>
                  <div className="w-16" />
                </div>

                {/* List rows */}
                {sortedAssets.map((asset) => {
                  const info = ASSETS[asset.symbol];
                  const change = asset.change_24h ?? null;
                  const isPositive = (change ?? 0) >= 0;
                  const spread = formatSpread(asset);
                  const flash = tickFlash[asset.symbol];

                  return (
                    <div
                      key={asset.symbol}
                      className={`
                        grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5
                        border-b border-white/[0.02] hover:bg-white/[0.03] transition-all cursor-pointer group
                        ${flash === 'up' ? 'bg-success/[0.02]' : ''}
                        ${flash === 'down' ? 'bg-danger/[0.02]' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/[0.04] rounded-xl flex items-center justify-center p-1.5 border border-white/[0.06] group-hover:scale-105 transition-transform shrink-0">
                          {getAssetIcon(asset.symbol)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{info?.name || asset.symbol}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[10px] text-text-secondary/50 uppercase tracking-widest font-bold">{asset.symbol}</p>
                            {spread && <span className="text-[9px] text-text-secondary/30">spr {spread}%</span>}
                          </div>
                        </div>
                      </div>

                      <p className={`text-sm font-bold text-text-primary font-orbitron text-right w-32 transition-colors ${flash === 'up' ? 'text-success' : flash === 'down' ? 'text-danger' : ''}`}>
                        {asset.type === 'fiat' ? '' : '$'}{formatPrice(asset)}
                      </p>

                      <div className={`flex items-center justify-end gap-0.5 text-xs font-bold w-20 ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {change !== null ? (
                          <>
                            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(change).toFixed(2)}%
                          </>
                        ) : (
                          <span className="text-text-secondary/30 text-[10px]">--</span>
                        )}
                      </div>

                      <div className="w-16 flex justify-end">
                        <button className="p-2 bg-white/[0.03] rounded-lg text-text-secondary/20 hover:bg-cyan/10 hover:text-cyan transition-all opacity-0 group-hover:opacity-100">
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── P2P View ────────────────────────────────────────── */
              <div className="space-y-4">
                <P2PTradingTerminal showPostAd={showPostAd} setShowPostAd={setShowPostAd} />
              </div>
            )}

            {/* CTA Banner */}
            <div className="mt-8 mb-6 p-6 bg-gradient-to-r from-cyan/[0.06] via-electric-blue/[0.04] to-cyan/[0.06] rounded-2xl border border-cyan/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan/20 to-electric-blue/20 rounded-xl flex items-center justify-center border border-cyan/10">
                  <Zap size={18} className="text-cyan" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Pro Analytics Terminal</h3>
                  <p className="text-xs text-text-secondary/60 mt-0.5">Order book heatmaps, whale alerts, and deep liquidity data.</p>
                </div>
              </div>
              <button className="px-6 py-2.5 bg-gradient-to-r from-cyan to-electric-blue text-midnight font-bold text-xs rounded-xl shadow-lg shadow-cyan/15 hover:shadow-cyan/30 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </main>
      </div>
      {showPostAd && <PostAdModal onClose={() => setShowPostAd(false)} onCreated={() => {
        // If we were in P2P view, we'd want to refresh ads. 
        // But the modal is inside the P2P terminal usually.
        // we will keep the modal here so it's accessible.
        setShowPostAd(false);
      }} />}
    </ProtectedRoute>
  );
}

// ── P2P Trading Terminal Component ──────────────────────────────────────────

function P2PTradingTerminal({ showPostAd, setShowPostAd }: { showPostAd: boolean; setShowPostAd: (v: boolean) => void }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [pairs, setPairs] = useState<any[]>([]);
  const [selectedPair, setSelectedPair] = useState('');
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<any | null>(null);

  useEffect(() => {
    const fetchPairs = async () => {
      const res = await api.p2p.getPairs();
      if (res.success && res.data && res.data.length > 0) {
        setPairs(res.data);
        setSelectedPair(`${res.data[0].base}/${res.data[0].quote}`);
      }
    };
    fetchPairs();
  }, []);

  const fetchAds = useCallback(async () => {
    if (!selectedPair) return;
    setIsLoading(true);
    try {
      const [base, quote] = selectedPair.split('/');
      const res = await api.p2p.getAds({ base, quote, side: side === 'buy' ? 'sell' : 'buy' });
      if (res.success) {
        setAds(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch P2P ads', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPair, side]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Ad List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 gap-1">
            <button
              onClick={() => setSide('buy')}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${side === 'buy' ? 'bg-success text-midnight shadow-lg shadow-success/20' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${side === 'sell' ? 'bg-danger text-white shadow-lg shadow-danger/20' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Sell
            </button>
          </div>

          <div className="flex items-center gap-2">
             <select 
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-cyan/30"
             >
               {pairs.map(p => (
                 <option key={`${p.base}/${p.quote}`} value={`${p.base}/${p.quote}`}>
                   {p.base}/{p.quote}
                 </option>
               ))}
             </select>
             <RefreshCw size={14} className="text-text-secondary cursor-pointer hover:text-cyan" onClick={fetchAds} />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse" />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-12 text-center">
            <Activity className="mx-auto mb-3 text-text-secondary/20" size={32} />
            <p className="text-sm text-text-secondary">No active ads found for this pair.</p>
            <button className="mt-4 text-xs text-cyan font-bold hover:underline">Create your own Ad</button>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 hover:bg-white/[0.03] transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/[0.04] rounded-xl flex items-center justify-center border border-white/[0.06]">
                    <Globe size={20} className="text-cyan/60" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">Merchant_{ad.owner_id.slice(0, 5)}</span>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-success/10 rounded text-[8px] text-success font-black uppercase tracking-tighter">
                        <Star size={8} fill="currentColor" /> Verified
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-text-secondary/60">
                      <span>Limits: {ad.min_amount} - {ad.max_amount} {ad.quote_symbol}</span>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span>Available: {ad.available} {ad.base_symbol}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] text-text-secondary/40 font-bold uppercase tracking-widest mb-0.5">Price</p>
                    <p className="text-lg font-black text-text-primary font-orbitron">{ad.price_per_unit.toLocaleString()} <span className="text-xs text-text-secondary font-sans font-medium">{ad.quote_symbol}</span></p>
                  </div>
                  <button 
                    onClick={() => setSelectedAd(ad)}
                    className={`px-8 py-3 rounded-xl font-black text-xs transition-all shadow-lg hover:scale-105 active:scale-95 ${side === 'buy' ? 'bg-success text-midnight shadow-success/10 hover:shadow-success/20' : 'bg-danger text-white shadow-danger/10 hover:shadow-danger/20'}`}
                  >
                    {side === 'buy' ? 'Buy' : 'Sell'} {ad.base_symbol}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar: My Orders & Post Ad */}
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-cyan/10 to-electric-blue/5 border border-cyan/20 rounded-2xl p-5">
          <h3 className="text-sm font-black text-text-primary mb-1">Make a Profit</h3>
          <p className="text-[10px] text-text-secondary/60 mb-4 leading-relaxed">Create your own buy or sell advertisement and set your own price.</p>
          <button 
            onClick={() => setShowPostAd(true)}
            className="w-full py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-xs font-bold text-text-primary hover:bg-cyan/10 hover:border-cyan/30 transition-all flex items-center justify-center gap-2"
          >
            <Zap size={14} className="text-cyan" /> Post Advertisement
          </button>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-widest">My Orders</h3>
            <span className="text-[10px] text-cyan font-bold cursor-pointer hover:underline">View All</span>
          </div>
          <div className="space-y-3">
             <UserOrderList />
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
           <h3 className="text-xs font-black text-text-primary uppercase tracking-widest mb-3">P2P Guide</h3>
           <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-cyan/10 rounded flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-cyan">1</span>
                </div>
                <p className="text-[10px] text-text-secondary/60 leading-normal">Place an order and lock the funds in our secure escrow.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-cyan/10 rounded flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-cyan">2</span>
                </div>
                <p className="text-[10px] text-text-secondary/60 leading-normal">Pay the seller or wait for buyer payment via bank transfer.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-cyan/10 rounded flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-cyan">3</span>
                </div>
                <p className="text-[10px] text-text-secondary/60 leading-normal">Mark as paid and wait for escrow release.</p>
              </div>
           </div>
        </div>
      </div>

      {selectedAd && <PlaceOrderModal ad={selectedAd} onClose={() => setSelectedAd(null)} />}
    </div>
  );
}

// ── Modals ──────────────────────────────────────────────────────────────────

function PostAdModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [pairs, setPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    side: 'buy' as 'buy' | 'sell',
    base_symbol: '',
    base_chain: '',
    quote_symbol: '',
    quote_chain: '',
    price_per_unit: 0,
    min_amount: 0,
    max_amount: 0,
    total_quantity: 0
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [aRes, pRes] = await Promise.all([
          api.p2p.getAssets(),
          api.p2p.getPairs()
        ]);
        if (aRes.success && aRes.data && pRes.success && pRes.data) {
          setAssets(aRes.data);
          setPairs(pRes.data);
          if (pRes.data.length > 0) {
            const p = pRes.data[0];
            const b = aRes.data.find((x: any) => x.currency === p.base);
            const q = aRes.data.find((x: any) => x.currency === p.quote);
            setFormData(prev => ({
              ...prev,
              base_symbol: p.base,
              base_chain: b?.chain || '',
              quote_symbol: p.quote,
              quote_chain: q?.chain || ''
            }));
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  const handlePairChange = (pairStr: string) => {
    const [base, quote] = pairStr.split('/');
    const b = assets.find(x => x.currency === base);
    const q = assets.find(x => x.currency === quote);
    setFormData({
      ...formData,
      base_symbol: base,
      base_chain: b?.chain || '',
      quote_symbol: quote,
      quote_chain: q?.chain || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.base_symbol || !formData.quote_symbol) {
      alert('Please select a valid trading pair');
      return;
    }
    const res = await api.p2p.createAd(formData);
    if (res.success) {
      onCreated();
      onClose();
    } else {
      alert(res.error || 'Failed to create ad');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md">
        <div className="text-cyan animate-pulse font-bold tracking-widest">LOADING PAIRS...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md">
      <div className="bg-midnight border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black text-text-primary uppercase tracking-tight">Create Advertisement</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Side</label>
               <select 
                value={formData.side}
                onChange={e => setFormData({...formData, side: e.target.value as any})}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-cyan/40"
               >
                 <option value="buy">Buy</option>
                 <option value="sell">Sell</option>
               </select>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Trading Pair</label>
               <select 
                value={`${formData.base_symbol}/${formData.quote_symbol}`}
                onChange={e => handlePairChange(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-cyan/40"
               >
                 {pairs.map(p => (
                   <option key={`${p.base}/${p.quote}`} value={`${p.base}/${p.quote}`}>
                     {p.base}/{p.quote}
                   </option>
                 ))}
               </select>
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Price Per {formData.base_symbol} ({formData.quote_symbol})</label>
             <input 
              type="number" 
              step="any"
              value={formData.price_per_unit || ''}
              onChange={e => setFormData({...formData, price_per_unit: parseFloat(e.target.value)})}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-cyan/40"
              placeholder={`e.g. 1500 ${formData.quote_symbol}`}
              required
             />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Min ({formData.quote_symbol})</label>
               <input 
                type="number" 
                value={formData.min_amount || ''}
                onChange={e => setFormData({...formData, min_amount: parseFloat(e.target.value)})}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-cyan/40"
                placeholder="1000"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Max ({formData.quote_symbol})</label>
               <input 
                type="number" 
                value={formData.max_amount || ''}
                onChange={e => setFormData({...formData, max_amount: parseFloat(e.target.value)})}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-cyan/40"
                placeholder="100000"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Total {formData.base_symbol}</label>
               <input 
                type="number" 
                value={formData.total_quantity || ''}
                onChange={e => setFormData({...formData, total_quantity: parseFloat(e.target.value)})}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-cyan/40"
                placeholder="100"
               />
            </div>
          </div>

          <button className="w-full py-4 bg-gradient-to-r from-cyan to-electric-blue text-midnight font-black text-sm rounded-xl mt-4 shadow-xl shadow-cyan/20">
            Publish Advertisement
          </button>
        </form>
      </div>
    </div>
  );
}

function PlaceOrderModal({ ad, onClose }: { ad: any; onClose: () => void }) {
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.p2p.placeOrder({ ad_id: ad.id, base_amount: amount, note });
      if (res.success) {
        alert('Order placed successfully! Please proceed to payment.');
        onClose();
      } else {
        alert(res.error || 'Failed to place order');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md">
      <div className="bg-midnight border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black text-text-primary uppercase tracking-tight">Trade {ad.base_symbol}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">✕</button>
        </div>
        <div className="p-6 bg-white/[0.02]">
           <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] text-text-secondary/40 font-bold uppercase tracking-widest">Price</span>
             <span className="text-sm font-black text-success">{ad.price_per_unit.toLocaleString()} {ad.quote_symbol}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-[10px] text-text-secondary/40 font-bold uppercase tracking-widest">Available</span>
             <span className="text-sm font-black text-text-primary">{ad.available} {ad.base_symbol}</span>
           </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">I want to buy (Qty)</label>
             <div className="relative">
               <input 
                type="number" 
                step="any"
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value))}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-text-primary focus:border-cyan/40"
                placeholder="0.00"
                required
               />
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary/40">{ad.base_symbol}</span>
             </div>
             <p className="text-[10px] text-text-secondary/40 mt-1">Approx. {(amount * ad.price_per_unit).toLocaleString()} {ad.quote_symbol}</p>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Payment Note (Optional)</label>
             <textarea 
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-cyan/40 h-20"
              placeholder="e.g. Paying from MyBank account"
             />
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-success to-success/80 text-midnight font-black text-sm rounded-xl mt-2 shadow-xl shadow-success/10 disabled:opacity-50"
          >
            {isSubmitting ? 'Placing Order...' : `Confirm Order`}
          </button>
        </form>
      </div>
    </div>
  );
}

function UserOrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.p2p.getOrders();
        if (res.success && res.data) setOrders(res.data.slice(0, 5));
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (isLoading) return <div className="h-20 bg-white/[0.02] rounded-xl animate-pulse" />;
  if (orders.length === 0) return (
    <div className="flex flex-col items-center justify-center py-8 opacity-20">
      <Clock size={24} className="mb-2" />
      <p className="text-[10px] font-bold uppercase tracking-widest">No active orders</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {orders.map(order => (
        <div key={order.id} className="p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl hover:border-cyan/20 transition-all group cursor-pointer">
           <div className="flex justify-between items-start mb-1">
             <span className="text-[10px] font-bold text-text-primary uppercase tracking-tight">{order.base_symbol}/{order.quote_symbol}</span>
             <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
               order.status === 'released' ? 'bg-success/10 text-success' : 
               order.status === 'locked' ? 'bg-cyan/10 text-cyan' : 
               'bg-white/10 text-text-secondary'
             }`}>{order.status}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-[10px] text-text-secondary/40 font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
             <span className="text-xs font-black text-text-primary">{order.base_amount} {order.base_symbol}</span>
           </div>
        </div>
      ))}
    </div>
  );
}
