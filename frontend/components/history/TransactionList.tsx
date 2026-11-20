import { useEffect, useState, useCallback } from 'react';
import TransactionItem from './TransactionItem';
import type { TransactionType, TransactionStatus } from './TransactionItem';
import { Transaction, api } from '@/lib/api';
import TransactionDetail from '@/components/shared/TransactionDetail';
import { X } from 'lucide-react';
import { normalizeSymbol } from '@/lib/chains';
import { formatCryptoAmount } from '@/lib/utils';
import { useWebSocket } from '@/lib/websocket';

interface TransactionListProps {
  initialTransactions?: Transaction[];
  assetFilter?: string;
  chainFilter?: string;
}

export default function TransactionList({ initialTransactions, assetFilter, chainFilter }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  const [isLoading, setIsLoading] = useState(!initialTransactions);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.getHistory(50, 0, assetFilter, chainFilter);
      if (response.success && response.transactions) {
        setTransactions(response.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [assetFilter, chainFilter]);

  // If initialTransactions are not provided, or we need to keep them updated via WS, fetch on mount
  useEffect(() => {
    if (!initialTransactions) {
      fetchTransactions();
    }
  }, [fetchTransactions, initialTransactions]);

  // Sync initialTransactions to local state if provided by parent
  useEffect(() => {
    if (initialTransactions) {
      setTransactions(initialTransactions);
      setIsLoading(false);
    }
  }, [initialTransactions]);

  // Realtime updates
  useWebSocket(useCallback((notification: any) => {
    if (['transaction_update', 'deposit', 'withdrawal'].includes(notification.type)) {
      fetchTransactions();
    }
  }, [fetchTransactions]));

  // Map API transactions to UI format
  const mappedTransactions = transactions
    .filter(tx => !['sweep', 'gas_refill', 'rent'].includes((tx.type || (tx as any).tx_type || '').toLowerCase()))
    .map(tx => {
    const amountVal = Math.abs(parseFloat(tx.amount || '0'));
    const safeAmount = isNaN(amountVal) 
      ? '0.0000' 
      : formatCryptoAmount(amountVal, 8, 4);
    
    let formattedDate = 'Unknown Date';
    try {
      if (tx.created_at) {
        formattedDate = new Date(tx.created_at).toLocaleString();
      }
    } catch (e) {
      console.error("Invalid date:", tx.created_at);
    }

    const rawType = (tx.type || (tx as any).tx_type || 'send').toLowerCase();
    const mappedType: TransactionType = 
      rawType === 'internal_receive' ? 'internal_receive' :
      rawType === 'internal_send' ? 'internal_send' :
      rawType === 'receive' || rawType === 'incoming' || rawType === 'deposit' ? 'receive' :
      rawType === 'send' || rawType === 'outgoing' || rawType === 'withdrawal' ? 'send' :
      rawType === 'swap' ? 'swap' :
      rawType === 'stake' ? 'stake' :
      rawType === 'card_payment' || rawType === 'card_spend' ? 'card_payment' :
      rawType === 'card_spending' || rawType === 'card_conversion_out' ? 'card_spending' :
      rawType === 'card_conversion_in' || rawType === 'conversion_in' ? 'card_conversion_in' :
      rawType === 'card_settlement_out' || rawType === 'card_settlement' ? 'card_settlement_out' :
      (rawType as TransactionType);

    const rawStatus = (tx.status || 'pending').toLowerCase();
    const mappedStatus: TransactionStatus =
      ['confirmed', 'finalized', 'completed', 'received', 'sent', 'settled'].includes(rawStatus) ? 'completed' :
      ['approved', 'pending', 'processing'].includes(rawStatus) ? 'pending' :
      rawStatus === 'failed' || rawStatus === 'declined' ? 'failed' : 'pending';

    let usdDisplay = tx.usdAmount || '$0.00';
    if (usdDisplay === '$0.00' && (tx as any).to_display && (tx as any).to_display.startsWith('$')) {
      usdDisplay = (tx as any).to_display.split(' ')[0];
    } else if (usdDisplay === '$0.00' && (tx as any).merchant_amount) {
      usdDisplay = `$${parseFloat((tx as any).merchant_amount).toFixed(2)}`;
    }

    return {
      id: tx.id,
      type: mappedType,
      status: mappedStatus,
      asset: tx.currency || '?',
      amount: safeAmount,
      usdAmount: usdDisplay, 
      date: formattedDate,
      hash: tx.tx_hash || '',
      network: tx.chain || 'erc20',
      label: (tx as any).from_display || undefined,
      merchant: (tx as any).merchant || undefined,
      source: (tx as any).source || undefined,
      raw: tx, 
    };
  });

  const handleTxClick = async (txId: string) => {
    try {
      // First try to show the raw tx we already have to make UI responsive
      const existingTx = transactions.find(t => t.id === txId);
      if (existingTx) setSelectedTx(existingTx);

      // Then fetch the full one
      const response = await api.getTransaction(txId);
      if (response.success && response.transaction) {
        setSelectedTx(response.transaction);
      }
    } catch (err) {
      console.error('Failed to fetch full transaction details:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mappedTransactions.map((tx) => (
        <TransactionItem 
          key={tx.id} 
          {...tx} 
          onClick={() => handleTxClick(tx.id)} 
        />
      ))}
      
      {mappedTransactions.length === 0 && (
        <div className="text-center py-20 bg-card-bg/20 dark:bg-midnight/40 border border-border rounded-3xl">
          <div className="w-16 h-16 bg-deep-navy/10 dark:bg-deep-navy/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
            <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-text-secondary">No recent transactions</p>
        </div>
      )}

      {mappedTransactions.length > 0 && (
          <div className="pt-6 flex justify-center">
            <button className="px-6 py-2.5 bg-card-bg/50 dark:bg-deep-navy/50 border border-border rounded-xl text-sm font-semibold text-text-secondary hover:text-cyan hover:border-cyan transition-all">
            Load More Transactions
            </button>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedTx(null)}>
          <div 
            className="bg-card-bg border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-white/5 shrink-0">
              <h2 className="text-lg font-bold ml-2 text-text-primary">Transaction Details</h2>
              <button 
                onClick={() => setSelectedTx(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-secondary hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <TransactionDetail tx={selectedTx} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
