'use client';

import { Loader2, CheckCircle2, Trash2, Sparkles } from 'lucide-react';
import { Beneficiary } from '@/lib/api';
import { BankLogo } from './BankLogo';

interface SavedBeneficiariesListProps {
  isFetching: boolean;
  beneficiaries: Beneficiary[];
  selectedAccountId: string;
  onSelectAccountId: (id: string) => void;
  onRemoveBeneficiary: (id: string, e: React.MouseEvent) => void;
  onSwitchToNew: () => void;
  onSelectTestAccount: () => void;
}

export function SavedBeneficiariesList({
  isFetching,
  beneficiaries,
  selectedAccountId,
  onSelectAccountId,
  onRemoveBeneficiary,
  onSwitchToNew,
  onSelectTestAccount,
}: SavedBeneficiariesListProps) {
  if (isFetching) {
    return (
      <div className="w-full py-10 flex items-center justify-center border border-dashed border-border rounded-2xl bg-deep-navy/10">
        <Loader2 className="w-8 h-8 animate-spin text-cyan/40" />
      </div>
    );
  }

  if (beneficiaries.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl bg-deep-navy/10 flex flex-col items-center">
        <p className="text-sm text-text-tertiary font-medium mb-3">No saved accounts yet.</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onSwitchToNew}
            className="px-5 py-2.5 bg-cyan text-midnight text-xs font-black rounded-xl transition-all shadow-lg shadow-cyan/20"
          >
            Enter Bank Account Directly
          </button>
          <button
            type="button"
            onClick={onSelectTestAccount}
            className="px-4 py-2.5 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Sparkles size={13} /> Use Demo Test Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
      {beneficiaries.map((b) => (
        <div
          key={b.id}
          onClick={() => onSelectAccountId(b.id)}
          className={`group p-3.5 border-2 rounded-xl cursor-pointer transition-all relative overflow-hidden ${
            selectedAccountId === b.id
              ? 'border-cyan bg-cyan/5 shadow-md shadow-cyan/10'
              : 'border-border/50 hover:border-border bg-deep-navy/30'
          }`}
        >
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary text-sm">{b.bank_name}</span>
              </div>
              <div className="text-xs text-text-tertiary font-mono flex items-center gap-1.5 mt-1">
                <span className="text-text-primary font-semibold">{b.account_name}</span>
                <span className="text-border">•</span>
                <span>••••{b.account_number_last4}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BankLogo bank={{ name: b.bank_name, code: b.bank_code }} className="w-8 h-8" />
              <button
                type="button"
                onClick={(e) => onRemoveBeneficiary(b.id, e)}
                title="Remove Beneficiary"
                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger rounded-lg transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {selectedAccountId === b.id && (
            <div className="absolute top-0 right-0 p-1 text-cyan">
              <CheckCircle2 size={14} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default SavedBeneficiariesList;
