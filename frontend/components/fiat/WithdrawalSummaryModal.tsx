'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/chains';
import { BankLogo } from './BankLogo';

interface FeeDetails {
  fee: number;
  totalDebit: number;
  recipientReceives: number;
  deductionMode: string;
}

interface WithdrawalSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  isLoading: boolean;
  amount: string;
  currency: string;
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumberLast4: string;
  feeDetails: FeeDetails | null;
  error: string | null;
}

export function WithdrawalSummaryModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  amount,
  currency,
  bankName,
  bankCode,
  accountName,
  accountNumberLast4,
  feeDetails,
  error,
}: WithdrawalSummaryModalProps) {
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!pin || pin.length !== 6) {
      setLocalError('Please enter your 6-digit transaction PIN');
      return;
    }
    setLocalError(null);
    onConfirm(pin);
  };

  const displayError = error || localError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md animate-fade-in">
      <div className="main-card max-w-lg w-full p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-cyan/30 animate-fade-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-black font-orbitron text-text-primary flex items-center gap-2">
              <ShieldCheck className="text-cyan" size={22} />
              Withdrawal Summary
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Please review the transaction details carefully before confirming
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-text-tertiary hover:text-text-primary p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Destination Recipient Details with Logo */}
        <div className="bg-deep-navy/70 border border-border rounded-xl p-4 mb-4">
          <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
            Recipient Details
          </div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-text-secondary">Destination Bank</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">{bankName}</span>
              <BankLogo bank={{ name: bankName, code: bankCode }} className="w-6 h-6" />
            </div>
          </div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-text-secondary">Account Name</span>
            <span className="text-sm font-semibold text-text-primary">{accountName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">Account Number</span>
            <span className="text-sm font-mono text-cyan">••••{accountNumberLast4}</span>
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-deep-navy/50 border border-border rounded-xl p-4 mb-4 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Requested Amount</span>
            <span className="font-mono font-bold text-text-primary text-sm">
              {getCurrencySymbol(currency)}{Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-text-secondary">Withdrawal Fee</span>
              {feeDetails && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  feeDetails.deductionMode === 'added_to_amount'
                    ? 'bg-cyan/10 text-cyan'
                    : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {feeDetails.deductionMode === 'added_to_amount' ? '+ Added' : '- From balance'}
                </span>
              )}
            </div>
            <span className="font-mono font-bold text-text-primary">
              {getCurrencySymbol(currency)}{feeDetails ? feeDetails.fee.toFixed(2) : '0.00'}
            </span>
          </div>

          <div className="pt-2 border-t border-white/5 flex justify-between items-center text-sm font-black">
            <span className="text-text-primary">Total Wallet Deduction</span>
            <span className="text-danger font-mono">
              {getCurrencySymbol(currency)}{feeDetails ? feeDetails.totalDebit.toFixed(2) : '0.00'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary">Recipient Receives</span>
            <span className="text-success font-bold font-mono text-sm">
              {getCurrencySymbol(currency)}{feeDetails ? feeDetails.recipientReceives.toFixed(2) : '0.00'}
            </span>
          </div>
        </div>

        {/* Transaction PIN Input */}
        <div className="bg-deep-navy/70 border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Lock size={14} className="text-cyan" />
              Transaction PIN
            </label>
            <span className="text-[10px] text-text-tertiary">6-digit security code</span>
          </div>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPin(val);
              if (localError) setLocalError(null);
            }}
            placeholder="••••••"
            className="w-full text-center tracking-[0.5em] text-xl font-bold font-mono py-2.5 bg-deep-navy/90 border border-border focus:border-cyan rounded-xl text-text-primary outline-none transition-all placeholder:text-text-tertiary placeholder:tracking-[0.3em]"
            autoFocus
          />
          <p className="text-[10px] text-text-tertiary mt-2 text-center">
            Enter your 6-digit transaction PIN to authorize this withdrawal.
          </p>
        </div>

        {displayError && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs flex items-center gap-2 mb-4 animate-shake">
            <AlertTriangle size={16} className="flex-shrink-0" /> {displayError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3.5 border-2 border-border text-text-secondary font-bold rounded-xl hover:bg-white/5 transition-all text-sm"
          >
            Back / Edit
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || pin.length !== 6}
            className="flex-2 py-3.5 bg-gradient-to-br from-danger/90 to-rose-700 text-white font-black rounded-xl shadow-lg shadow-danger/20 hover:shadow-danger/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                Confirm & Send Funds <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WithdrawalSummaryModal;
