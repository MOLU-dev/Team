'use client';

import { motion, type MotionValue } from 'framer-motion';
import Link from 'next/link';
import { AssetEntry, CARD_HEIGHT } from './types';

interface CardRowProps {
  asset: AssetEntry;
  /** framer-motion y value for this card */
  motionY: MotionValue<number>;
  zIndex: number;
  dataIndex: number;
  onPanStart: () => void;
  onPan: (e: PointerEvent, info: { delta: { y: number } }) => void;
  onPanEnd: () => void;
}

export default function CardRow({ 
  asset, 
  motionY, 
  zIndex, 
  dataIndex, 
  onPanStart, 
  onPan, 
  onPanEnd 
}: CardRowProps) {
  const isPositive = asset.priceChange24h >= 0;

  const href = asset.isFiat
    ? '/fiat'
    : `/asset/${asset.symbol}${asset.chainId ? `?chain=${asset.chainId}` : ''}`;

  return (
    <motion.div
      data-index={dataIndex}
      className="absolute left-0 right-0"
      style={{ height: CARD_HEIGHT, y: motionY, zIndex }}
      onPanStart={onPanStart}
      onPan={onPan}
      onPanEnd={onPanEnd}
      whileTap={{ scale: 0.985 }}
    >
      <Link
        href={href}
        className="flex items-center gap-3 sm:gap-4 px-4 py-3 sm:px-5 rounded-2xl h-full
                   bg-gradient-to-b from-[#0f1117] to-[#0f1117]/80 border border-white/[0.07] border-b-black/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                   hover:bg-white/[0.04] hover:border-cyan/20 transition-colors group cursor-grab active:cursor-grabbing"
        draggable={false}
        onClick={(e) => {
          // Suppress navigation while dragging – framer handles this via pointer capture,
          // but a quick tap still navigates.
        }}
      >
        {/* Icon */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.06] border border-white/[0.05] flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
          {asset.icon}
        </div>

        {/* Name / badge */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary truncate">{asset.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-text-secondary uppercase tracking-wide">{asset.symbol}</span>
            {asset.chainBadge && asset.chainBadge !== 'ERC20' && asset.chainBadge !== 'BEP20' && (
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                asset.isFiat
                  ? 'bg-electric-blue/10 text-electric-blue'
                  : 'bg-white/[0.06] text-text-secondary/80'
              }`}>
                {asset.chainBadge}
              </span>
            )}
          </div>
        </div>

        {/* Balance / change */}
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

        {/* Chevron */}
        <div className="hidden sm:flex w-6 h-6 items-center justify-center rounded-lg text-text-secondary/40 group-hover:text-cyan transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}
