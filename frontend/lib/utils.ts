import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shortens a blockchain address for display.
 * Example: 0x71C...F3E2
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Formats a cryptocurrency amount preserving exact decimals when fees or fractions
 * exceed standard display precision, while formatting the integer part with commas.
 * Example: 1000.9099 -> "1,000.9099"
 */
export function formatCryptoAmount(val?: number | string | null, maxDecimals: number = 8, minDecimals: number = 4): string {
  if (val === undefined || val === null || val === '') return (0).toFixed(minDecimals);
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return (0).toFixed(minDecimals);
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const str = absNum.toFixed(maxDecimals);
  const [intPart, fracPart] = str.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!fracPart) return `${isNegative ? '-' : ''}${formattedInt}.${''.padEnd(minDecimals, '0')}`;
  const trimmed = fracPart.replace(/0+$/, '');
  const finalFrac = trimmed.length < minDecimals 
    ? trimmed.padEnd(minDecimals, '0') 
    : trimmed;
  return `${isNegative ? '-' : ''}${formattedInt}.${finalFrac}`;
}

/**
 * Formats a number with comma thousands separators and fixed decimal precision.
 * Example: 1000.5 -> "1,000.50"
 */
export function formatNumberWithCommas(val: number | string, decimals: number = 2): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return (0).toFixed(decimals);
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(decimals).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${isNegative ? '-' : ''}${intPart}${parts.length > 1 ? '.' + parts[1] : ''}`;
}

