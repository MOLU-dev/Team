'use client';

import Link from 'next/link';
import { getAssetColor, getAssetTextColor, getAssetIconWithChain } from '@/lib/chains';

interface AssetItemProps {
  name: string;
  symbol: string;
  amount: string;
  value: string;
  priceChange24h?: number;
  icon: React.ReactNode;
  chainBadge?: string;   // e.g. "ERC20", "BEP20", "FIAT"
  chainName?: string;    // e.g. "Ethereum", "Fiat Balance"
  chainId?: string;
  isFiat?: boolean;
}

export default function AssetItem({ name, symbol, amount, value, priceChange24h = 0, icon, chainBadge, chainName, chainId, isFiat }: AssetItemProps) {
  const isPositive = priceChange24h >= 0;

  const href = isFiat
    ? `/fiat`
    : `/asset/${symbol}${chainId ? `?chain=${chainId}` : ''}`;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-card-bg border border-border hover:border-cyan/30 hover:bg-surface-hover active:bg-surface-active transition-all group shadow-sm"
    >
      {/* Icon */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
        {icon}
      </div>

      {/* Name + symbol + chain badge */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary truncate">{name}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-text-secondary uppercase tracking-wide">{symbol}</span>
          {chainBadge && chainBadge !== 'ERC20' && chainBadge !== 'BEP20' && (
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
              isFiat
                ? 'bg-electric-blue/10 text-electric-blue'
                : 'bg-surface-muted text-text-secondary'
            }`}>
              {chainBadge}
            </span>
          )}
        </div>
      </div>

      {/* Balance + change */}
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-semibold text-text-primary tabular-nums">{amount}</div>
        <div className="flex items-center justify-end gap-1.5">
          {!isFiat && (
            <span className={`text-[10px] font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
            </span>
          )}
          <span className="text-[11px] text-text-secondary">{value}</span>
        </div>
      </div>
    </Link>
  );
}
