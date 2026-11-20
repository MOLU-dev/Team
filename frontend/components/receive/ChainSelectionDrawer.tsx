'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CHAIN_LIST, getChainIcon, ASSET_LIST, getAssetIconWithChain, getAssetName, CHAINS } from '@/lib/chains';
import { X } from 'lucide-react';

interface ChainSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChainSelectionDrawer({ isOpen, onClose }: ChainSelectionDrawerProps) {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
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

  if (!mounted || (!isOpen && !isAnimating)) return null;

  const handleAssetSelect = (symbol: string, chainId: string) => {
    router.push(`/receive?asset=${symbol.toLowerCase()}&chain=${chainId}`);
    onClose();
  };

  // Build a list of all receiveable asset-chain pairs
  const receiveOptions: Array<{ symbol: string; chainId: string; name: string; chainName: string }> = [];
  
  ASSET_LIST.filter(a => a.type !== 'fiat').forEach(asset => {
    if (asset.type === 'native') {
      // For native assets, typically there is only 1 chain
      asset.chains.forEach(chainId => {
        receiveOptions.push({
          symbol: asset.symbol,
          chainId: chainId,
          name: asset.name,
          chainName: CHAINS[chainId]?.name || chainId
        });
      });
    } else {
      // For tokens, show each chain as a separate option
      asset.chains.forEach(chainId => {
        receiveOptions.push({
          symbol: asset.symbol,
          chainId: chainId,
          name: `${asset.symbol}`,
          chainName: CHAINS[chainId]?.name || chainId
        });
      });
    }
  });

  const drawer = (
    <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-deep-navy border-t border-white/10 rounded-t-[32px] p-6 transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '75vh' }}
      >
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-text-primary">Select Asset to Receive</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={24} className="text-text-secondary" />
          </button>
        </div>
        
        <div className="flex flex-col gap-2 overflow-y-auto pb-8 pr-2 custom-scrollbar flex-1">
          {receiveOptions.map((option, idx) => (
            <button
              key={`${option.symbol}-${option.chainId}-${idx}`}
              onClick={() => handleAssetSelect(option.symbol, option.chainId)}
              className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 hover:border-cyan/30 hover:bg-cyan/5 rounded-2xl transition-all group w-full text-left"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0">
                {getAssetIconWithChain(option.symbol, option.chainId)}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm sm:text-base font-bold text-text-primary truncate">{option.name}</div>
                <div className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wider truncate">{option.chainName} network</div>
              </div>
              <div className="text-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-4 text-center text-xs text-text-secondary opacity-50 flex-shrink-0">
          Select the asset and corresponding network you wish to receive.
        </div>
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}
