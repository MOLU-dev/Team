'use client';

import { useState, useMemo } from 'react';
import { Search, Building2, X, Sparkles, Check, Loader2 } from 'lucide-react';
import { Bank, POPULAR_BANK_CODES } from './bankData';
import { BankLogo } from './BankLogo';

interface BankPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: Bank[];
  selectedBank: Bank | null;
  onSelectBank: (bank: Bank) => void;
  isLoading?: boolean;
}

export function BankPickerModal({
  isOpen,
  onClose,
  banks,
  selectedBank,
  onSelectBank,
  isLoading,
}: BankPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const popularBanks = useMemo(() => {
    return POPULAR_BANK_CODES
      .map(code => banks.find(b => b.code === code))
      .filter((b): b is Bank => Boolean(b));
  }, [banks]);

  const filteredBanks = useMemo(() => {
    if (!searchQuery.trim()) return banks;
    const q = searchQuery.toLowerCase().trim();
    return banks.filter(b => b.name.toLowerCase().includes(q));
  }, [banks, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md animate-fade-in">
      <div className="main-card max-w-lg w-full max-h-[85vh] flex flex-col p-6 relative overflow-hidden shadow-2xl border border-cyan/30 animate-fade-slide-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan shadow-inner">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black font-orbitron text-text-primary">Select Bank</h3>
              <p className="text-xs text-text-secondary">Choose the destination bank for your withdrawal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Search Input */}
        <div className="pt-4 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search banks (e.g. GTBank, Access, Zenith, Kuda)..."
              autoFocus
              className="w-full pl-10 pr-10 py-3 bg-deep-navy/40 border border-border rounded-xl text-text-primary focus:border-cyan outline-none transition-all placeholder:text-text-tertiary text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary text-xs bg-white/5 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Popular Banks Chips with Mini Logos */}
        {!searchQuery && popularBanks.length > 0 && (
          <div className="pb-3 flex-shrink-0">
            <div className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles size={11} className="text-cyan" /> Popular Banks
            </div>
            <div className="flex flex-wrap gap-2">
              {popularBanks.map((bank) => {
                const isSelected = selectedBank?.code === bank.code;
                return (
                  <button
                    key={bank.code}
                    type="button"
                    onClick={() => {
                      onSelectBank(bank);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-cyan text-midnight shadow-md shadow-cyan/20'
                        : 'bg-deep-navy/70 hover:bg-white/10 text-text-primary border border-border/60 hover:border-cyan/40'
                    }`}
                  >
                    <span>{bank.name.replace(/ Bank| Nigeria/g, '')}</span>
                    <BankLogo bank={bank} className="w-5 h-5 rounded-md" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* All Banks Alphabetical List */}
        <div className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mb-2 flex-shrink-0">
          All Banks ({filteredBanks.length})
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar min-h-0">
          {isLoading && filteredBanks.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 size={24} className="animate-spin mx-auto text-cyan" />
              <p className="text-xs text-text-tertiary mt-2">Loading supported banks...</p>
            </div>
          ) : filteredBanks.length > 0 ? (
            filteredBanks.map((bank) => {
              const isSelected = selectedBank?.code === bank.code;
              return (
                <div
                  key={bank.code}
                  onClick={() => {
                    onSelectBank(bank);
                    onClose();
                  }}
                  className={`px-4 py-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan/10 border border-cyan/40 text-cyan'
                      : 'hover:bg-white/5 border border-transparent text-text-primary'
                  }`}
                >
                  {/* Left: Bank Name */}
                  <div className="flex items-center gap-2 min-w-0 pr-3">
                    <span className="font-semibold text-sm truncate">{bank.name}</span>
                  </div>

                  {/* Right: Bank Logo & Selected Indicator */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <BankLogo bank={bank} className="w-8 h-8" />
                    {isSelected && <Check size={16} className="text-cyan ml-1" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-text-tertiary text-xs">
              No banks found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BankPickerModal;
