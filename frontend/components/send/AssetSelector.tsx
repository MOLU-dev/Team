import React from 'react';
import { getAssetIcon, getAssetTextColor, ASSETS } from '@/lib/chains';
import { ChevronRight } from 'lucide-react';

interface Asset {
  value: string;
  label: string;
}

interface AssetSelectorProps {
  assets: Asset[];
  selectedAsset: string;
  onSelect: (asset: string) => void;
  balance: string;
  onClick: () => void;
}

export default function AssetSelector({ assets, selectedAsset, onSelect, balance, onClick }: AssetSelectorProps) {
  const assetInfo = ASSETS[selectedAsset.toUpperCase()];
  
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onClick}
        className="w-full px-5 py-4 bg-deep-navy/60 border border-cyan/20 hover:border-cyan/40 rounded-2xl text-text-primary flex items-center justify-between transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-card-bg/50 rounded-xl flex items-center justify-center border border-border overflow-hidden">
            {selectedAsset ? getAssetIcon(selectedAsset.toUpperCase()) : <div className="w-6 h-6 bg-white/10 rounded-full animate-pulse" />}
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-text-primary">{assetInfo?.name || 'Select Asset'}</div>
            <div className="text-xs text-text-secondary uppercase">{selectedAsset || '---'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-text-secondary uppercase tracking-tighter">Current Balance</div>
            <div className="text-sm font-bold text-cyan">{balance.split(' ')[0]}</div>
          </div>
          <ChevronRight size={20} className="text-text-secondary group-hover:text-cyan transition-colors" />
        </div>
      </button>

      <div className="p-4 bg-cyan/5 border border-cyan/20 rounded-xl flex justify-between items-center sm:hidden">
        <span className="text-xs text-text-secondary">Available Balance</span>
        <span className="text-sm font-semibold text-cyan">{balance}</span>
      </div>
    </div>
  );
}
