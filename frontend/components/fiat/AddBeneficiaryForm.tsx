'use client';

import { useState } from 'react';
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Bank } from './bankData';
import { PaystackTestAccountsWidget, PaystackTestAccount } from './PaystackTestAccountsWidget';
import { DirectBankInput } from './DirectBankInput';

interface AddBeneficiaryFormProps {
  currency: string;
  selectedBank: Bank | null;
  onOpenBankPicker: () => void;
  accountNumber: string;
  onAccountNumberChange: (val: string) => void;
  accountName: string;
  isResolving: boolean;
  onSelectTestAccount: (acc: PaystackTestAccount) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddBeneficiaryForm({
  currency,
  selectedBank,
  onOpenBankPicker,
  accountNumber,
  onAccountNumberChange,
  accountName,
  isResolving,
  onSelectTestAccount,
  onSuccess,
  onCancel,
}: AddBeneficiaryFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank || !accountName) return;

    setIsAdding(true);
    setError(null);

    try {
      await api.addBeneficiary({
        bank_name: selectedBank.name,
        bank_code: selectedBank.code,
        account_number: accountNumber,
        currency: currency,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add beneficiary');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-text-primary">Add Withdrawal Bank Account</h3>
        <div className="flex items-center gap-1 text-[10px] text-cyan uppercase font-bold tracking-widest bg-cyan/10 px-2 py-1 rounded">
          <ShieldCheck size={10} /> Auto-Verified
        </div>
      </div>

      {/* Paystack Test Accounts Helper */}
      <PaystackTestAccountsWidget
        onSelect={onSelectTestAccount}
        activeNumber={accountNumber}
      />

      <DirectBankInput
        selectedBank={selectedBank}
        onOpenBankPicker={onOpenBankPicker}
        accountNumber={accountNumber}
        onAccountNumberChange={onAccountNumberChange}
        accountName={accountName}
        isResolving={isResolving}
        compact={false}
      />

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs flex items-center gap-2 animate-shake">
          <AlertTriangle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border-2 border-border text-text-secondary font-bold rounded-xl hover:bg-white/5 transition-all text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isAdding || !accountName || !selectedBank}
          className="flex-2 py-3 bg-gradient-to-r from-cyan to-blue-500 text-midnight font-black rounded-xl shadow-lg shadow-cyan/20 hover:shadow-cyan/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-30 flex items-center justify-center gap-2 text-sm"
        >
          {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Save Beneficiary'}
        </button>
      </div>
    </form>
  );
}

export default AddBeneficiaryForm;
