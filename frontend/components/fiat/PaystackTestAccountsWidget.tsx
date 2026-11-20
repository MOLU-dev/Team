'use client';

import { Sparkles } from 'lucide-react';

export interface PaystackTestAccount {
  number: string;
  name: string;
  bankName: string;
  bankCode: string;
  outcome: string;
  badgeColor: string;
}

export const PAYSTACK_TEST_ACCOUNTS: PaystackTestAccount[] = [
  {
    number: '0001234567',
    name: 'Approved Test Account',
    bankName: 'Guaranty Trust Bank (GTBank)',
    bankCode: '058',
    outcome: 'Approved (Success)',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  {
    number: '0001234568',
    name: 'Declined Test Account',
    bankName: 'Guaranty Trust Bank (GTBank)',
    bankCode: '058',
    outcome: 'Declined (Failed)',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  {
    number: '0001234569',
    name: 'Reversed Test Account',
    bankName: 'Guaranty Trust Bank (GTBank)',
    bankCode: '058',
    outcome: 'Reversed',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
];

interface PaystackTestAccountsWidgetProps {
  onSelect: (acc: PaystackTestAccount) => void;
  activeNumber?: string;
}

export function PaystackTestAccountsWidget({
  onSelect,
  activeNumber,
}: PaystackTestAccountsWidgetProps) {
  return (
    <div className="p-3.5 bg-gradient-to-br from-cyan/10 via-deep-navy/40 to-cyan/5 border border-cyan/20 rounded-2xl mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan">
          <Sparkles size={14} className="text-cyan animate-pulse" />
          <span>Paystack Test Mode Demo Accounts</span>
        </div>
        <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30">
          Sandbox
        </span>
      </div>
      <p className="text-[11px] text-text-tertiary mb-2.5 leading-relaxed">
        Click an approved Paystack test account to simulate instant withdrawal results:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PAYSTACK_TEST_ACCOUNTS.map((acc) => {
          const isSelected = activeNumber === acc.number;
          return (
            <button
              key={acc.number}
              type="button"
              onClick={() => onSelect(acc)}
              className={`p-2.5 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-cyan/15 border-cyan shadow-sm shadow-cyan/20 ring-1 ring-cyan/40'
                  : 'bg-deep-navy/70 hover:bg-white/5 border-border/80 hover:border-cyan/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-text-primary">
                  {acc.number}
                </span>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${acc.badgeColor}`}>
                  {acc.outcome}
                </span>
              </div>
              <div className="text-[10px] text-text-secondary truncate font-medium">
                GTBank • {acc.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PaystackTestAccountsWidget;
