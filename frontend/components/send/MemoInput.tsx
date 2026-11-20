'use client';

import { FileText } from 'lucide-react';
import { getMaxMemoLength } from './addressValidation';

interface MemoInputProps {
  memo: string;
  onMemoChange: (memo: string) => void;
  selectedNetwork: string;
}

export default function MemoInput({ memo, onMemoChange, selectedNetwork }: MemoInputProps) {
  const maxMemoLength = getMaxMemoLength(selectedNetwork);

  return (
    <div className="mb-8 pb-6 border-b border-border">
      <div className="text-sm shadow-text uppercase tracking-widest text-text-secondary mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4" /> Memo / Note{' '}
          <span className="text-xs text-text-secondary/60 lowercase font-normal">(optional)</span>
        </span>
        <span className={`text-xs font-mono ${memo.length >= maxMemoLength ? 'text-warning font-semibold' : 'text-text-secondary/60'}`}>
          {memo.length}/{maxMemoLength}
        </span>
      </div>
      <div className="space-y-2">
        <input
          type="text"
          value={memo}
          maxLength={maxMemoLength}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder={`Add an optional memo or reference (max ${maxMemoLength} chars)`}
          className="w-full px-4 py-4 bg-deep-navy/40 border border-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-all text-sm"
        />
        <p className="text-[11px] text-text-secondary/60">
          {['bitcoin', 'litecoin', 'dogecoin', 'dash', 'bitcoincash'].includes(selectedNetwork.toLowerCase())
            ? 'Stored on-chain via OP_RETURN output. Note: Publicly visible on blockchain.'
            : 'Attached to transaction data on-chain. Note: Publicly visible on blockchain.'}
        </p>
      </div>
    </div>
  );
}
