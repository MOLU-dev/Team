'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, Zap, Globe, Bookmark, Star, Plus } from 'lucide-react';

interface RecipientSectionProps {
  recipientAddress: string;
  onAddressChange: (val: string) => void;
  currentChain?: { name: string; badge?: string; addressPrefix?: string };
  selectedNetwork: string;
  isCheckingAddress: boolean;
  addressBelongsToUser: boolean;
  addressValidation: { valid: boolean; error?: string } | null;
  isInternalRecipient: boolean;
  transferMethod: 'internal' | 'blockchain';
  onTransferMethodChange: (method: 'internal' | 'blockchain') => void;
  onOpenAddressBook?: () => void;
  savedRecipientLabel?: string | null;
  onSaveCurrentAddress?: () => void;
}

export default function RecipientSection({
  recipientAddress,
  onAddressChange,
  currentChain,
  selectedNetwork,
  isCheckingAddress,
  addressBelongsToUser,
  addressValidation,
  isInternalRecipient,
  transferMethod,
  onTransferMethodChange,
  onOpenAddressBook,
  savedRecipientLabel,
  onSaveCurrentAddress,
}: RecipientSectionProps) {
  const isAddressInvalid = Boolean(recipientAddress.trim() && addressValidation && !addressValidation.valid);
  const isValidAddress = recipientAddress.trim() && addressValidation?.valid && !addressBelongsToUser;

  return (
    <div className="mb-8 pb-6 border-b border-border">
      {/* Header with Address Book Quick Action */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm shadow-text uppercase tracking-widest text-text-secondary">
          Recipient
        </div>

        {onOpenAddressBook && (
          <button
            type="button"
            onClick={onOpenAddressBook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan/10 hover:bg-cyan/20 text-cyan text-xs font-semibold border border-cyan/25 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Address Book</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-tighter">
            {currentChain?.name || 'Network'} ({currentChain?.badge || ''}) Wallet Address or BitSilo Handle
          </label>

          {/* Matched Saved Contact Badge */}
          {savedRecipientLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning border border-warning/30 animate-fade-in">
              <Star className="w-3 h-3 fill-warning" />
              <span>{savedRecipientLabel}</span>
            </span>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder={currentChain?.addressPrefix ? `${currentChain.addressPrefix}... or BitSilo username` : '0x... or BitSilo username'}
            className={`w-full px-4 py-4 ${isCheckingAddress ? 'pr-11' : ''} bg-deep-navy/40 border ${
              addressBelongsToUser || isAddressInvalid
                ? 'border-danger focus:border-danger focus:ring-danger/30'
                : recipientAddress.trim() && addressValidation?.valid
                ? 'border-success/60 focus:border-success focus:ring-success/30'
                : 'border-border focus:border-cyan focus:ring-cyan/30'
            } rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 transition-all font-mono text-sm`}
          />
          {isCheckingAddress && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Loader2 className="w-4 h-4 animate-spin text-cyan" />
            </div>
          )}
        </div>

        {addressBelongsToUser && (
          <div className="mt-2 p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-danger" />
            <span>This address belongs to your account. You cannot send funds to yourself.</span>
          </div>
        )}

        {!addressBelongsToUser && isAddressInvalid && (
          <div className="mt-2 p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-danger" />
            <span>{addressValidation?.error}</span>
          </div>
        )}

        {!addressBelongsToUser && !isAddressInvalid && recipientAddress.trim() && (
          <div className="space-y-3">
            {/* Quick action to save address upfront if not already saved */}
            {isValidAddress && !savedRecipientLabel && onSaveCurrentAddress && (
              <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-border/40 rounded-xl text-xs">
                <span className="text-text-secondary text-[11px]">
                  Unsaved recipient address
                </span>
                <button
                  type="button"
                  onClick={onSaveCurrentAddress}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save to address book</span>
                </button>
              </div>
            )}

            {isInternalRecipient ? (
              <div className="mt-3 p-4 bg-midnight/90 border border-cyan/25 rounded-2xl animate-fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-bold text-success uppercase tracking-wider">BitSilo User Recognized</span>
                  </div>
                  <span className="text-[11px] text-text-secondary">Choose Transfer Method</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Free Internal Transfer */}
                  <button
                    type="button"
                    onClick={() => onTransferMethodChange('internal')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      transferMethod === 'internal'
                        ? 'bg-gradient-to-br from-success/15 to-cyan/10 border-success shadow-lg shadow-success/10 ring-1 ring-success/30'
                        : 'bg-deep-navy/40 border-border hover:border-border/80 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${transferMethod === 'internal' ? 'bg-success text-midnight' : 'bg-white/5 text-text-secondary'}`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-text-primary">BitSilo Internal</span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-success/20 text-success border border-success/30 uppercase tracking-tight">
                        Zero Fee
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-tight">
                      Instant off-chain transfer between BitSilo accounts. 100% Free.
                    </p>
                  </button>

                  {/* Option 2: On-Chain Blockchain Transfer */}
                  <button
                    type="button"
                    onClick={() => onTransferMethodChange('blockchain')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      transferMethod === 'blockchain'
                        ? 'bg-gradient-to-br from-electric-blue/15 to-cyan/10 border-cyan shadow-lg shadow-cyan/10 ring-1 ring-cyan/30'
                        : 'bg-deep-navy/40 border-border hover:border-border/80 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${transferMethod === 'blockchain' ? 'bg-cyan text-midnight' : 'bg-white/5 text-text-secondary'}`}>
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-text-primary">On-Chain Blockchain</span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan/20 text-cyan border border-cyan/30 uppercase tracking-tight">
                        Standard Fee
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-tight">
                      Broadcast directly to {currentChain?.name || 'blockchain'} network.
                    </p>
                  </button>
                </div>
              </div>
            ) : addressValidation?.valid ? (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-cyan/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan" />
                <span>Valid {currentChain?.name || selectedNetwork} address format</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
