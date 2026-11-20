'use client';

import { useState } from 'react';
import { Bank, BANK_BRAND_COLORS, getBankLogoUrl } from './bankData';

interface BankLogoProps {
  bank: { name: string; code?: string; slug?: string; logo?: string };
  className?: string;
}

export function BankLogo({ bank, className = 'w-8 h-8' }: BankLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoUrl = getBankLogoUrl(bank);
  const brand = (bank.code && BANK_BRAND_COLORS[bank.code]) || null;
  const initials = brand?.initials || bank.name.slice(0, 2).toUpperCase();

  if (logoUrl && !imgFailed) {
    return (
      <div className={`${className} rounded-lg bg-white p-1 border border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm`}>
        <img
          src={logoUrl}
          alt={bank.name}
          className="w-full h-full object-contain"
          onError={() => setImgFailed(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-lg ${
        brand ? brand.bg : 'bg-white/10'
      } ${
        brand ? brand.text : 'text-text-primary'
      } border border-white/10 flex items-center justify-center font-black text-[11px] tracking-tight flex-shrink-0 shadow-sm`}
    >
      {initials}
    </div>
  );
}

export default BankLogo;
