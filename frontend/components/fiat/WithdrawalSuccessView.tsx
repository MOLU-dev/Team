'use client';

import { CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/chains';
import { BankLogo } from './BankLogo';

interface WithdrawalSuccessViewProps {
  withdrawalResult: {
    amount: string | number;
    currency: string;
    beneficiary?: {
      bank_name: string;
      bank_code?: string;
      account_name: string;
      account_number_last4: string;
    };
    [key: string]: any;
  };
  onReset: () => void;
}

export function WithdrawalSuccessView({
  withdrawalResult,
  onReset,
}: WithdrawalSuccessViewProps) {
  return (
    <div className="main-card animate-fade-slide-up max-w-lg mx-auto text-center p-8 sm:p-12 relative overflow-hidden">
      <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="text-success" size={48} />
      </div>
      <h2 className="text-2xl sm:text-3xl font-black font-orbitron mb-2 text-text-primary">
        Withdrawal Processing
      </h2>
      <p className="text-sm text-text-secondary mb-8">
        Your withdrawal request has been received and is being processed via Paystack.
      </p>

      <div className="bg-deep-navy/60 border border-border rounded-2xl p-6 text-left space-y-3.5 mb-8">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">Amount Sent:</span>
          <span className="font-bold text-success text-base font-mono">
            {getCurrencySymbol(withdrawalResult.currency)}
            {Number(withdrawalResult.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {withdrawalResult.beneficiary && (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Destination Bank:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">
                  {withdrawalResult.beneficiary.bank_name}
                </span>
                <BankLogo
                  bank={{
                    name: withdrawalResult.beneficiary.bank_name,
                    code: withdrawalResult.beneficiary.bank_code,
                  }}
                  className="w-6 h-6"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Account:</span>
              <span className="font-mono text-text-primary">
                {withdrawalResult.beneficiary.account_name} (••••{withdrawalResult.beneficiary.account_number_last4})
              </span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5">
          <span className="text-text-secondary">Status:</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan bg-cyan/10 px-2.5 py-1 rounded-full">
            <RefreshCw size={12} className="animate-spin" /> Processing
          </span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 bg-gradient-to-r from-cyan to-blue-500 text-midnight font-bold rounded-xl shadow-lg shadow-cyan/20 hover:shadow-cyan/40 transition-all flex items-center justify-center gap-2 group"
      >
        Make Another Withdrawal <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

export default WithdrawalSuccessView;
