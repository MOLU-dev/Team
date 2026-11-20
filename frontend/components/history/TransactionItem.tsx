'use client';

import { ReactNode } from 'react';
import { getAssetIconWithChain } from '@/lib/chains';
import { ArrowUpRight, ArrowDownLeft, Repeat, Zap, CreditCard, ShoppingBag } from 'lucide-react';

export type TransactionType = 
  | 'send' 
  | 'receive' 
  | 'swap' 
  | 'stake' 
  | 'deposit' 
  | 'withdrawal' 
  | 'incoming' 
  | 'outgoing' 
  | 'internal_send' 
  | 'internal_receive'
  | 'card_payment'
  | 'card_spend'
  | 'card_spending'
  | 'card_settlement'
  | 'card_settlement_out'
  | 'card_conversion_in'
  | 'card_conversion_out';

export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'approved';

interface TransactionItemProps {
  type: TransactionType;
  status: TransactionStatus;
  asset: string;
  amount: string;
  usdAmount: string;
  date: string;
  hash: string;
  network: string;
  label?: string;
  merchant?: string;
  source?: string;
  onClick?: () => void;
}

const typeIcons: Record<string, ReactNode> = {
  send: <ArrowUpRight className="w-3 h-3 text-danger" />,
  outgoing: <ArrowUpRight className="w-3 h-3 text-danger" />,
  internal_send: <ArrowUpRight className="w-3 h-3 text-danger" />,
  receive: <ArrowDownLeft className="w-3 h-3 text-success" />,
  deposit: <ArrowDownLeft className="w-3 h-3 text-success" />,
  incoming: <ArrowDownLeft className="w-3 h-3 text-success" />,
  internal_receive: <ArrowDownLeft className="w-3 h-3 text-success" />,
  withdrawal: <ArrowUpRight className="w-3 h-3 text-danger" />,
  swap: <Repeat className="w-3 h-3 text-cyan" />,
  stake: <Zap className="w-3 h-3 text-electric-blue" />,
  card_payment: <CreditCard className="w-3 h-3 text-cyan" />,
  card_spend: <CreditCard className="w-3 h-3 text-cyan" />,
  card_spending: <CreditCard className="w-3 h-3 text-cyan" />,
  card_settlement: <CreditCard className="w-3 h-3 text-cyan" />,
  card_settlement_out: <CreditCard className="w-3 h-3 text-cyan" />,
  card_conversion_in: <Repeat className="w-3 h-3 text-success" />,
  card_conversion_out: <Repeat className="w-3 h-3 text-danger" />,
};

const typeColors: Record<string, string> = {
  send: 'bg-danger/20 border-danger/30',
  outgoing: 'bg-danger/20 border-danger/30',
  internal_send: 'bg-danger/20 border-danger/30',
  receive: 'bg-success/20 border-success/30',
  deposit: 'bg-success/20 border-success/30',
  incoming: 'bg-success/20 border-success/30',
  internal_receive: 'bg-success/20 border-success/30',
  withdrawal: 'bg-danger/20 border-danger/30',
  swap: 'bg-cyan/20 border-cyan/30',
  stake: 'bg-electric-blue/20 border-electric-blue/30',
  card_payment: 'bg-cyan/20 border-cyan/30',
  card_spend: 'bg-cyan/20 border-cyan/30',
  card_spending: 'bg-cyan/20 border-cyan/30',
  card_settlement: 'bg-cyan/20 border-cyan/30',
  card_settlement_out: 'bg-cyan/20 border-cyan/30',
  card_conversion_in: 'bg-success/20 border-success/30',
  card_conversion_out: 'bg-danger/20 border-danger/30',
};

export default function TransactionItem({ 
  type, status, asset, amount, usdAmount, date, hash, network, label, merchant, source, onClick 
}: TransactionItemProps) {
  const isIncoming = ['receive', 'deposit', 'incoming', 'internal_receive', 'card_conversion_in', 'conversion_in'].includes(type?.toLowerCase());
  const cleanAmount = (amount || '0').replace(/^-/, '');

  const displayTitle = label || (
    type === 'card_payment' ? `Card payment` :
    type === 'card_spending' ? `Card spending / conversion out` :
    type === 'card_conversion_in' ? `Conversion in` :
    type === 'card_settlement_out' ? `Card settlement out` :
    `${type?.replace(/_/g, ' ')} ${asset}`
  );

  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-card-bg border border-border rounded-2xl hover:border-cyan/30 hover:bg-card-bg/80 dark:hover:bg-midnight/60 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-11 h-11 shrink-0">
          <div className="w-full h-full bg-black/20 rounded-xl p-1.5 flex items-center justify-center border border-border group-hover:scale-105 transition-transform duration-300">
             {getAssetIconWithChain(asset, network)}
          </div>
          <div className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center z-20 shadow-lg ${typeColors[type] || (isIncoming ? typeColors.incoming : typeColors.send)}`}>
            {typeIcons[type] || (isIncoming ? typeIcons.incoming : typeIcons.send)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary capitalize">{displayTitle}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
              status === 'completed' ? 'bg-success/10 text-success border border-success/20' :
              (status === 'pending' || status === 'approved') ? 'bg-warning/10 text-warning border border-warning/20' :
              'bg-danger/10 text-danger border border-danger/20'
            }`}>
              {status}
            </span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {date} • <span className="font-mono">{hash ? `${hash.slice(0, 8)}...${hash.slice(-4)}` : 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={`font-bold ${
          isIncoming ? 'text-success' : 'text-text-primary'
        }`}>
          {isIncoming ? '+' : '-'}{cleanAmount} {asset}
        </div>
        <div className="text-xs text-text-secondary mt-1">
          {usdAmount} • <span className="uppercase text-[10px] bg-deep-navy/10 dark:bg-deep-navy px-1.5 py-0.5 rounded border border-border">{network}</span>
        </div>
      </div>
    </div>
  );
}
