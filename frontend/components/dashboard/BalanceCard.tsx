'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api, Balance } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';
import { Eye, EyeOff, RefreshCw, History } from 'lucide-react';
import Link from 'next/link';
import { normalizeSymbol, ASSETS } from '@/lib/chains';

type DisplayMode = {
  id: string;
  label: string;
}

const DISPLAY_MODES: DisplayMode[] = [
  { id: 'fiat', label: 'Total Balance' },
  { id: 'BTC', label: 'In BTC' },
  { id: 'ETH', label: 'In ETH' },
  { id: 'BNB', label: 'In BNB' },
  { id: 'SOL', label: 'In SOL' },
  { id: 'TRX', label: 'In TRX' },
  { id: 'XRP', label: 'In XRP' },
  { id: 'LTC', label: 'In LTC' },
  { id: 'DOGE', label: 'In DOGE' },
  { id: 'DASH', label: 'In DASH' },
  { id: 'BCH', label: 'In BCH' },
  { id: 'USDT', label: 'In USDT' },
  { id: 'USDC', label: 'In USDC' },
  { id: 'EURC', label: 'In EURC' },
  { id: 'BUSD', label: 'In BUSD' },
];

const MOCK_PRICES: Record<string, number> = {
  'BTC': 65432.10,
  'ETH': 3456.78,
  'BNB': 589.45,
  'SOL': 145.32,
  'TRX': 0.1234,
  'XRP': 0.6123,
  'LTC': 84.56,
  'DOGE': 0.1456,
  'DASH': 34.12,
  'BCH': 445.67,
  'USDT': 1.00,
  'USDC': 1.00,
  'BUSD': 1.00,
  'EURC': 1.08,
};


export default function BalanceCard() {
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalChange24h, setTotalChange24h] = useState<number>(0);
  const [nativeBalance, setNativeBalance] = useState<string>('0.000');
  const [fiatCurrency, setFiatCurrency] = useState<string>('NGN');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [displayModeIndex, setDisplayModeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const isInitialLoad = useRef(true);
  // Use a ref for fiatCurrency inside fetchBalances to avoid a
  // fetch→setFiatCurrency→re-create callback→re-fetch loop.
  const fiatCurrencyRef = useRef(fiatCurrency);
  fiatCurrencyRef.current = fiatCurrency;

  const currentMode = DISPLAY_MODES[displayModeIndex];

  const fetchBalances = useCallback(async () => {
    try {
      const response = await api.getAllBalances();
      if (response.success && response.balances) {
        let currentTotal = 0;
        let prevTotal = 0;
        let newFiatCurrency = fiatCurrencyRef.current || 'USD';
        const newPrices: Record<string, number> = {};
        
        // Track individual asset amounts for the sub-balance display
        const assetAmounts: Record<string, number> = {};

        response.balances.forEach((curr) => {
          const processEntry = (fiatVal: number, amountVal: number, change: number, price: number, currency: string) => {
            const normalized = normalizeSymbol(currency);
            
            // Apply mock price if real price is missing
            let effectivePrice = price;
            if (effectivePrice <= 0 && MOCK_PRICES[normalized]) {
              effectivePrice = MOCK_PRICES[normalized];
            }
            
            if (effectivePrice > 0) newPrices[normalized] = effectivePrice;
            
            // Track amount for sub-balance logic
            assetAmounts[normalized] = (assetAmounts[normalized] || 0) + amountVal;

            // Use fiat value from backend if available, otherwise calculate it
            let effectiveFiatVal = fiatVal;
            if (effectiveFiatVal === 0 && amountVal > 0 && effectivePrice > 0) {
              effectiveFiatVal = amountVal * effectivePrice;
            }

            currentTotal += effectiveFiatVal;

            const multiplier = 1 + (change / 100);
            if (multiplier > 0) {
              prevTotal += effectiveFiatVal / multiplier;
            } else {
              prevTotal += effectiveFiatVal;
            }
          };

          if (curr.fiat_currency) newFiatCurrency = curr.fiat_currency;
          
          // Process native asset
          processEntry(
            parseFloat(curr.fiat_value || '0'),
            parseFloat(curr.balance || curr.total_balance || curr.available_balance || '0'),
            parseFloat(curr.price_change_24h || '0'),
            parseFloat(curr.price || '0'),
            curr.currency
          );

          // Process tokens
          if (curr.tokens) {
            curr.tokens.forEach(t => {
              processEntry(
                parseFloat(t.fiat_value || '0'),
                parseFloat(t.balance || t.total_balance || t.available_balance || '0'),
                parseFloat(t.price_change_24h || '0'),
                parseFloat(t.price || '0'),
                t.currency
              );
            });
          }
        });

        setTotalBalance(currentTotal);
        setFiatCurrency(newFiatCurrency);
        setPrices(newPrices);

        if (prevTotal > 0) {
          const changePercent = ((currentTotal - prevTotal) / prevTotal) * 100;
          setTotalChange24h(changePercent);
        } else {
          setTotalChange24h(0);
        }

        // Sub-balance display: Find the most "significant" crypto asset to show
        // Priority: BTC > ETH > SOL > others by fiat value
        const priority = ['BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'XRP'];
        let bestAsset = 'ETH';
        let bestValue = -1;

        for (const asset of priority) {
          const amount = assetAmounts[asset] || 0;
          const price = newPrices[asset] || 0;
          const val = amount * price;
          if (val > bestValue && amount > 0) {
            bestValue = val;
            bestAsset = asset;
          }
        }

        // If no priority asset has balance, pick the one with highest fiat value
        if (bestValue <= 0) {
          let maxVal = -1;
          for (const [asset, amount] of Object.entries(assetAmounts)) {
            if (ASSETS[asset]?.type === 'fiat') continue;
            
            const price = newPrices[asset] || 0;
            const val = amount * price;
            if (val > maxVal) {
              maxVal = val;
              bestAsset = asset;
            }
          }
        }

        const finalAmount = assetAmounts[bestAsset] || 0;
        setNativeBalance(`${finalAmount.toFixed(bestAsset === 'BTC' ? 6 : 4)} ${bestAsset}`);
        
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      if (isInitialLoad.current) {
        setError('Failed to load balance');
      }
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Stable handler ref — never triggers useWebSocket to re-subscribe
  const wsHandler = useCallback((notification: any) => {
    if (['balance_update', 'deposit', 'withdrawal'].includes(notification.type)) {
      fetchBalances();
    }
  }, [fetchBalances]);
  useWebSocket(wsHandler);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const formatValue = () => {
    if (hidden) return '••••••';
    if (currentMode.id === 'fiat') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: fiatCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(totalBalance);
    }
    const price = prices[currentMode.id];
    if (!price || price === 0) return `0.000 ${currentMode.id}`;
    const count = totalBalance / price;
    const highPrecision = ['ETH', 'BNB', 'SOL'].includes(currentMode.id);
    return `${count.toLocaleString('en-US', {
      minimumFractionDigits: highPrecision ? 4 : 2,
      maximumFractionDigits: highPrecision ? 4 : 2,
    })} ${currentMode.id}`;
  };

  const handleCycle = () => {
    setDisplayModeIndex((prev: number) => (prev + 1) % DISPLAY_MODES.length);
  };

  if (!mounted) {
    return (
      <div className="surface-locked rounded-2xl bg-card-bg border border-border p-8 mb-6 animate-pulse h-48 flex items-center justify-center">
        <div className="text-text-secondary/30 font-orbitron text-base">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-locked rounded-2xl bg-card-bg border border-border p-8 mb-6">
        <div className="text-danger text-sm">Unable to load balance</div>
      </div>
    );
  }

  const isPositive = totalChange24h >= 0;
  const changeAbs = Math.abs(totalChange24h).toFixed(2);

  return (
    <div className="surface-locked relative rounded-2xl bg-card-bg border border-border p-5 sm:p-8 mb-6 overflow-hidden animate-fade-slide-up group">
      {/* Subtle glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan/[0.06] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Top row: label + actions */}
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={handleCycle}
            className="text-[11px] sm:text-xs uppercase tracking-widest text-text-secondary hover:text-cyan transition-colors flex items-center gap-1.5"
          >
            {currentMode.label}
            <RefreshCw size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>

          <div className="flex items-center gap-3">
            <Link 
              href="/history"
              className="text-[11px] sm:text-xs tracking-widest text-text-secondary hover:text-cyan transition-colors flex items-center gap-1.5"
            >
              <History size={14} />
              <span className="hidden sm:inline uppercase">History</span>
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); setHidden(!hidden); }}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-secondary hover:text-text-primary transition-all"
            >
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Balance */}
        <div
          className="font-dm-sans text-3xl sm:text-4xl md:text-5xl font-bold mb-1 cursor-pointer select-none"
          onClick={handleCycle}
        >
          {isLoading ? (
            <span className="text-text-secondary/40 animate-pulse">---</span>
          ) : (
            <span className="text-text-primary">
              {formatValue()}
            </span>
          )}
        </div>

        {/* Sub-balance + change pill */}
        <div className="flex items-center gap-3 mt-2">
          {!hidden && (
            <span className="text-xs sm:text-sm text-text-secondary">≈ {nativeBalance} ETH</span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
              isPositive
                ? 'bg-success/10 text-success'
                : 'bg-danger/10 text-danger'
            }`}
          >
            <svg
              className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
            {isPositive ? '+' : '-'}{changeAbs}%
          </span>
        </div>
      </div>
    </div>
  );
}
