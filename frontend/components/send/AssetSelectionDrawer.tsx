'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ASSET_LIST, getAssetIcon, CHAINS, getAssetIconWithChain } from '@/lib/chains';
import { api } from '@/lib/api';
import { X, Search } from 'lucide-react';

interface AssetSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string, chainId?: string) => void;
}

export default function AssetSelectionDrawer({ isOpen, onClose, onSelect }: AssetSelectionDrawerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [preferredFiat, setPreferredFiat] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount before using portals
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchFiat = async () => {
      try {
        const response = await api.getAllBalances();
        if (response.success && response.balances) {
          const fiat = response.balances.find(b => b.chain === 'internal');
          if (fiat) setPreferredFiat(fiat.currency);
        }
      } catch (err) {
        console.warn('Failed to fetch fiat for drawer', err);
      }
    };
    fetchFiat();
  }, []);

  if (!mounted || (!isOpen && !isAnimating)) return null;

  // Flatten assets: each chain-token pair is a separate entry
  const flattenedAssets: any[] = [];
  ASSET_LIST.forEach(asset => {
    const isFiat = asset.type === 'fiat';
    const isUserFiat = isFiat && asset.symbol === preferredFiat;
    
    if (isFiat) {
        if (isUserFiat) flattenedAssets.push({ ...asset, chainId: 'internal' });
        return;
    }

    // For native and tokens, create an entry for every supported chain
    asset.chains.forEach(chainId => {
        const chain = CHAINS[chainId];
        flattenedAssets.push({
            ...asset,
            chainId,
            chainBadge: chain?.badge || chainId,
            chainName: chain?.name || chainId,
        });
    });
  });

  const filteredAssets = flattenedAssets.filter(a => {
    const query = searchQuery.toLowerCase();
    const symbolMatch = a.symbol.toLowerCase().includes(query);
    const nameMatch = a.name.toLowerCase().includes(query);
    const chainMatch = a.chainName?.toLowerCase().includes(query) || a.chainBadge?.toLowerCase().includes(query);
    
    return symbolMatch || nameMatch || chainMatch;
  });

  const drawer = (
    <div
      className={`fixed inset-0 z-[200] transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer — slides up from bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-deep-navy border-t border-white/10 rounded-t-[32px] p-6 transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '75vh' }}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-base font-bold text-text-primary">Select Asset</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
          <input
            type="text"
            placeholder="Search assets or networks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-text-primary focus:outline-none focus:border-cyan transition-all shadow-inner"
          />
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto pb-8 pr-2 custom-scrollbar flex-1">
          {filteredAssets.map((asset, idx) => (
            <button
              key={`${asset.symbol}-${asset.chainId}-${idx}`}
              onClick={() => {
                onSelect(asset.symbol.toLowerCase(), asset.chainId);
                onClose();
              }}
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 hover:border-cyan/30 hover:bg-cyan/5 rounded-xl transition-all group w-full text-left"
            >
              <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0">
                {getAssetIconWithChain(asset.symbol, asset.chainId)}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                    <div className="text-xs sm:text-sm font-bold text-text-primary truncate">{asset.name}</div>
                    {asset.chainBadge && asset.chainId !== 'internal' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-text-secondary uppercase">
                            {asset.chainBadge}
                        </span>
                    )}
                </div>
                <div className="text-[9px] text-text-secondary uppercase tracking-wider truncate">
                    {asset.symbol} {asset.chainName && asset.chainId !== 'internal' ? `• ${asset.chainName}` : ''}
                </div>
              </div>
              <div className="text-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
          {filteredAssets.length === 0 && (
            <div className="text-center py-10 opacity-50 text-text-secondary">
              No assets match your search.
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-text-secondary opacity-50 flex-shrink-0">
          Select the asset and network you wish to use.
        </div>
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}

