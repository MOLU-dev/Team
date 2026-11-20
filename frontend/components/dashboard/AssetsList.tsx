'use client';

import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import Link from 'next/link';
import { api, Balance } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';
import {
  getAssetIconWithChain,
  getAssetName,
  getChainDetails,
  ASSETS,
  CHAINS,
  normalizeSymbol,
} from '@/lib/chains';
import { useAppConfig } from '@/hooks/useAppConfig';
import { formatCryptoAmount, formatNumberWithCommas } from '@/lib/utils';

interface AssetEntry {
  name: string;
  symbol: string;
  chainId: string;
  chainBadge: string;
  chainName: string;
  amount: string;
  value: string;
  priceChange24h: number;
  icon: React.ReactNode;
  totalFiat: number;
  isFiat: boolean;
}

function AssetRow({ asset }: { asset: AssetEntry }) {
  const isPositive = asset.priceChange24h >= 0;
  const href = asset.isFiat
    ? '/fiat'
    : `/asset/${asset.symbol}${asset.chainId ? `?chain=${asset.chainId}` : ''}`;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-card-bg border border-border hover:border-cyan/30 hover:bg-surface-hover active:bg-surface-active transition-all group shadow-sm"
    >
      {/* Icon - clean without square border box */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
        {asset.icon}
      </div>

      {/* Name + symbol + chain badge */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary truncate">{asset.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-text-secondary uppercase tracking-wide">{asset.symbol}</span>
          {asset.chainBadge && asset.chainBadge !== 'ERC20' && asset.chainBadge !== 'BEP20' && (
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
              asset.isFiat
                ? 'bg-electric-blue/10 text-electric-blue'
                : 'bg-surface-muted text-text-secondary'
            }`}>
              {asset.chainBadge}
            </span>
          )}
        </div>
      </div>

      {/* Balance + change */}
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-semibold text-text-primary tabular-nums">{asset.amount}</div>
        <div className="flex items-center justify-end gap-1.5 mt-0.5">
          {!asset.isFiat && (
            <span className={`text-[10px] font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
            </span>
          )}
          <span className="text-[11px] text-text-secondary">{asset.value}</span>
        </div>
      </div>
    </Link>
  );
}

export default function AssetsList() {
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { config: appConfig } = useAppConfig();
  const appConfigRef = useRef(appConfig);
  appConfigRef.current = appConfig;

  const fetchAssets = useCallback(async () => {
    try {
      const response = await api.getAllBalances();
      if (response.success && response.balances) {
        const entryMap: Record<string, AssetEntry> = {};

        // Step 1: pre-populate from ASSETS registry
        Object.values(ASSETS).forEach(asset => {
          if (asset.type === 'fiat') return;
          asset.chains.forEach(chainId => {
            const chain = CHAINS[chainId];
            const key = `${asset.symbol}_${chainId}`;
            entryMap[key] = {
              name: asset.name,
              symbol: asset.symbol,
              chainId,
              chainBadge: chain?.badge || chainId,
              chainName: chain?.name || chainId,
              amount: '',
              value: '',
              priceChange24h: 0,
              icon: getAssetIconWithChain(asset.symbol, chainId),
              totalFiat: 0,
              isFiat: false,
            };
          });
        });

        // Testnet chain IDs → mainnet equivalents so they don't appear as
        // separate unknown assets in the list.
        const TESTNET_TO_MAINNET: Record<string, string> = {
          sepolia: 'ethereum',
          bsctestnet: 'bsc',
          trontestnet: 'tron',
          solanadevnet: 'solana',
        };

        // Step 2: overlay backend balances
        const processBalance = (b: Balance, rawChainId: string) => {
          // Normalise testnet chain IDs to their mainnet counterpart
          const chainId = TESTNET_TO_MAINNET[rawChainId] || rawChainId;
          const currency = normalizeSymbol(b.currency);
          const key = `${currency}_${chainId}`;
          const chainInfo = CHAINS[chainId];
          let networkName = chainInfo?.name || chainId;
          if (appConfigRef.current?.is_testnet && !networkName.toLowerCase().includes('testnet')) {
            networkName = `${networkName} Testnet`;
          }
          const isFiat = chainId === 'internal';

          if (!entryMap[key]) {
            entryMap[key] = {
              name: getAssetName(currency),
              symbol: currency,
              chainId,
              chainBadge: isFiat ? 'FIAT' : (chainInfo?.badge || chainId),
              chainName: isFiat ? 'Fiat Balance' : networkName,
              icon: getAssetIconWithChain(currency, chainId),
              amount: '',
              value: '',
              priceChange24h: 0,
              totalFiat: 0,
              isFiat,
            };
          }

          const entry = entryMap[key];
          const fiatVal = parseFloat(b.fiat_value || '0');
          const amountVal = parseFloat(b.balance || b.total_balance || b.available_balance || '0');
          const change = parseFloat(b.price_change_24h || '0');
          const decimals = ASSETS[currency]?.decimals;
          const fmt = decimals !== undefined && decimals <= 2 ? 2 : 4;

          entry.amount = isFiat ? `${formatNumberWithCommas(amountVal, 2)} ${currency}` : `${formatCryptoAmount(amountVal, 8, fmt)} ${currency}`;
          entry.value = `$${formatNumberWithCommas(fiatVal, 2)}`;
          entry.priceChange24h = change;
          entry.totalFiat = fiatVal;
          if (isFiat) {
            entry.isFiat = true;
            entry.chainBadge = 'FIAT';
            entry.chainName = 'Fiat Balance';
          }
        };

        response.balances.forEach(b => {
          processBalance(b, b.chain);
          if (b.tokens && b.tokens.length > 0) {
            b.tokens.forEach(t => processBalance({ ...t, chain: b.chain } as Balance, b.chain));
          }
        });

        // Step 3: build sorted list
        const assetList = Object.values(entryMap).map(entry => {
          if (!entry.amount) {
            const decimals = ASSETS[entry.symbol]?.decimals;
            const fmt = decimals !== undefined && decimals <= 2 ? 2 : 4;
            entry.amount = `${formatCryptoAmount(0, 8, fmt)} ${entry.symbol}`;
            entry.value = '$0.00';
          }
          return entry;
        });

        assetList.sort((a, b) => {
          if (a.isFiat && !b.isFiat) return -1;
          if (!a.isFiat && b.isFiat) return 1;
          if (b.totalFiat !== a.totalFiat) return b.totalFiat - a.totalFiat;
          const symCmp = a.symbol.localeCompare(b.symbol);
          if (symCmp !== 0) return symCmp;
          return a.chainName.localeCompare(b.chainName);
        });

        setAssets(assetList);
      }
    } catch (err) {
      console.error('Failed to load assets', err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const wsHandler = useCallback((notification: any) => {
    if (['balance_update', 'deposit', 'withdrawal'].includes(notification.type)) {
      fetchAssets();
    }
  }, [fetchAssets]);
  useWebSocket(wsHandler);

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Assets</h2>
        <div className="flex flex-col gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-card-bg border border-border shadow-sm animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-muted flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-24 rounded-full bg-surface-muted" />
                <div className="h-2.5 w-16 rounded-full bg-surface-hover" />
              </div>
              <div className="text-right space-y-1.5">
                <div className="h-3.5 w-20 rounded-full bg-surface-muted" />
                <div className="h-2.5 w-12 rounded-full bg-surface-hover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Assets</h2>
        <div className="text-center py-10 rounded-2xl bg-card-bg border border-border shadow-sm">
          <p className="text-text-secondary text-sm">No assets found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Assets</h2>

      <div className="flex flex-col gap-2.5">
        {assets.map((asset, idx) => (
          <AssetRow key={`${asset.symbol}-${asset.chainId}-${idx}`} asset={asset} />
        ))}
      </div>
    </div>
  );
}
