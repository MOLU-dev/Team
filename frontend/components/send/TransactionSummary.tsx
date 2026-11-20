import { Zap, Globe } from 'lucide-react';

interface TransactionSummaryProps {
  sendAmount: string;
  networkFee: string;
  total: string;
  isInstantSend?: boolean;
  instantSendPremium?: string;
  memo?: string;
  destinationTag?: number | string;
  transferMethod?: 'internal' | 'blockchain';
  isInternalRecipient?: boolean;
}

export default function TransactionSummary({
  sendAmount,
  networkFee,
  total,
  isInstantSend,
  instantSendPremium,
  memo,
  destinationTag,
  transferMethod,
  isInternalRecipient,
}: TransactionSummaryProps) {
  return (
    <div className="p-5 bg-midnight/80 border border-cyan/20 rounded-xl space-y-0">
      <div className="flex justify-between items-center py-3 border-b border-cyan/10">
        <span className="text-text-secondary">Send Amount</span>
        <span className="font-semibold text-text-primary">{sendAmount}</span>
      </div>

      {isInternalRecipient && (
        <div className="flex justify-between items-center py-3 border-b border-cyan/10">
          <span className="text-text-secondary">Transfer Route</span>
          {transferMethod === 'internal' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
              <Zap className="w-3.5 h-3.5" />
              BitSilo Internal (Free & Instant)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan/15 text-cyan border border-cyan/30">
              <Globe className="w-3.5 h-3.5" />
              On-Chain Blockchain Transfer
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between items-center py-3 border-b border-cyan/10">
        <span className="text-text-secondary">Transaction Fee</span>
        <span className={`font-semibold ${transferMethod === 'internal' ? 'text-success' : 'text-text-primary'}`}>
          {networkFee}
        </span>
      </div>

      {destinationTag !== undefined && destinationTag !== '' && (
        <div className="flex justify-between items-center py-3 border-b border-cyan/10">
          <span className="text-text-secondary">Destination Tag</span>
          <span className="font-mono text-sm text-cyan font-bold">{destinationTag}</span>
        </div>
      )}

      {memo && (
        <div className="flex justify-between items-center py-3 border-b border-cyan/10">
          <span className="text-text-secondary">Memo</span>
          <span className="font-mono text-sm text-cyan break-all max-w-[60%] text-right">{memo}</span>
        </div>
      )}

      {isInstantSend && (
        <div className="flex justify-between items-center py-3 border-b border-cyan/10">
          <span className="text-text-secondary flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            InstantSend Premium
          </span>
          <span className="font-semibold text-sky-400">{instantSendPremium || '--'}</span>
        </div>
      )}

      <div className="flex justify-between items-start pt-3">
        <span className="text-text-secondary pt-0.5">Total</span>
        {total.includes(' (~') ? (
          <div className="text-right ml-4">
            <span className="text-base sm:text-lg font-bold text-cyan">{total.split(' (~')[0]}</span>
            <div className="text-xs text-text-secondary font-mono mt-0.5">
              (~{total.split(' (~')[1]}
            </div>
          </div>
        ) : (
          <span className="text-lg font-bold text-cyan text-right ml-4">{total}</span>
        )}
      </div>
    </div>
  );
}

