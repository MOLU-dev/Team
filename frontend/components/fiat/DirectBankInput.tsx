'use client';

import { Building2, ChevronDown, Loader2, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Bank } from './bankData';
import { BankLogo } from './BankLogo';

interface DirectBankInputProps {
  selectedBank: Bank | null;
  onOpenBankPicker: () => void;
  accountNumber: string;
  onAccountNumberChange: (val: string) => void;
  accountName: string;
  isResolving: boolean;
  compact?: boolean;
}

export function DirectBankInput({
  selectedBank,
  onOpenBankPicker,
  accountNumber,
  onAccountNumberChange,
  accountName,
  isResolving,
  compact = false,
}: DirectBankInputProps) {
  return (
    <div className={`space-y-${compact ? '3.5' : '4'}`}>
      {/* 1. Select Bank Trigger */}
      <div>
        <label className={`block text-${compact ? '[11px]' : 'xs'} font-bold text-text-secondary uppercase mb-1.5 ml-1`}>
          {compact ? 'Bank' : '1. Select Bank'}
        </label>
        <div
          onClick={onOpenBankPicker}
          className={`w-full px-4 ${compact ? 'py-3 bg-deep-navy/60' : 'py-3.5 bg-deep-navy/50'} border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
            selectedBank ? 'border-cyan/50 hover:bg-deep-navy/80' : 'border-border hover:border-cyan/40'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Building2 size={18} className={selectedBank ? 'text-cyan' : 'text-text-tertiary'} />
            {selectedBank ? (
              <span className="font-bold text-sm text-text-primary block truncate">{selectedBank.name}</span>
            ) : (
              <span className="text-sm text-text-tertiary">
                {compact ? 'Select destination bank...' : 'Click to choose bank...'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {selectedBank && <BankLogo bank={selectedBank} className={compact ? 'w-7 h-7' : 'w-7 h-7'} />}
            <span className="text-xs text-cyan font-bold flex items-center gap-1">
              {selectedBank ? 'Change' : 'Choose'} <ChevronDown size={14} />
            </span>
          </div>
        </div>
      </div>

      {/* 2. 10-Digit Account Number */}
      <div>
        <label className={`block text-${compact ? '[11px]' : 'xs'} font-bold text-text-secondary uppercase mb-1.5 ml-1`}>
          {compact ? '10-Digit Account Number' : '2. 10-Digit Account Number'}
        </label>
        <div className="relative">
          <input
            type="text"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => onAccountNumberChange(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 0123456789"
            disabled={!selectedBank}
            className={`w-full px-4 ${compact ? 'py-2.5 text-base bg-deep-navy/60' : 'py-3 text-lg bg-deep-navy/40'} border border-border rounded-xl text-text-primary font-mono focus:border-cyan outline-none transition-all disabled:opacity-30 disabled:cursor-not-allowed`}
          />
          {isResolving && (
            <div className={`absolute ${compact ? 'right-3.5' : 'right-4'} top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-cyan`}>
              <Loader2 className="animate-spin" size={compact ? 14 : 16} /> Resolving...
            </div>
          )}
        </div>
      </div>

      {/* 3. Non-Editable Auto-Resolved Account Name */}
      <div className={`space-y-${compact ? '1' : '1.5'}`}>
        <div className="flex items-center justify-between ml-1">
          <label className={`text-${compact ? '[11px]' : 'xs'} font-bold text-text-secondary uppercase flex items-center gap-1`}>
            <Lock size={compact ? 11 : 12} className="text-text-tertiary" /> {compact ? 'Account Name' : '3. Account Name'}
          </label>
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
            <ShieldCheck size={compact ? 9 : 10} className="text-success" /> Auto-Resolved • Locked
          </span>
        </div>

        <div
          className={`w-full px-4 ${compact ? 'py-2.5' : 'py-3'} rounded-xl font-bold flex items-center justify-between border select-none pointer-events-none transition-all ${
            accountName
              ? 'bg-success/5 border-success/40 text-success'
              : 'bg-deep-navy/20 border-border text-text-tertiary cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isResolving ? (
              <span className="flex items-center gap-2 text-xs text-cyan font-normal">
                <Loader2 size={compact ? 13 : 14} className="animate-spin" /> Verifying account with Paystack...
              </span>
            ) : accountName ? (
              <span className="font-mono text-sm tracking-wide truncate">{accountName}</span>
            ) : (
              <span className="text-xs text-text-tertiary font-normal">
                {compact ? 'Account name will resolve automatically' : 'Account name will appear automatically'}
              </span>
            )}
          </div>
          {accountName && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-success flex-shrink-0">
              <CheckCircle2 size={compact ? 13 : 14} /> Verified
            </span>
          )}
        </div>
        <p className="text-[10px] text-text-tertiary ml-1">
          Account name is verified directly from NIBSS/Paystack and cannot be manually modified.
        </p>
      </div>
    </div>
  );
}

export default DirectBankInput;
