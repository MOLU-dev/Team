'use client';

export interface AssetEntry {
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

// ─── Fan physics constants ─────────────────────────────────────────────────────

export const CARD_HEIGHT = 140;          // px – height of each card
export const OVERLAP = 56;               // px of the card above that peeks out
export const K = CARD_HEIGHT - 2 * OVERLAP; // extra space added per card when fully fanned

export const LONG_PRESS_DELAY = 280;     // ms – time to hold before restacking gesture activates
export const MOVE_THRESHOLD = 6;         // px – tiny movement allowed during long-press wait
