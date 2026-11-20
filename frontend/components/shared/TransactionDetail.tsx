'use client';

import React, { useState, useEffect } from 'react';
import { 
  X,
  Copy, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft, 
  HelpCircle, 
  ShieldCheck,
  Globe,
  Hash,
  Calendar,
  Wallet,
  Coins,
  ShieldAlert,
  Check,
  Zap,
  Repeat,
  FileText,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { getAssetIconWithChain, getExplorerTxUrl, CHAINS } from '@/lib/chains';
import { format, formatDistanceToNow } from 'date-fns';
import { useAppConfig } from '@/hooks/useAppConfig';
import { shortenAddress, formatCryptoAmount } from '@/lib/utils';
import { copyToClipboard } from '@/lib/clipboard';
import { Transaction } from '@/lib/api';

// ── Block Explorer name mapping ──────────────────────────────────────
const EXPLORER_NAMES: Record<string, { mainnet: string; testnet: string }> = {
  ethereum:    { mainnet: 'Etherscan',     testnet: 'Sepolia Etherscan' },
  bsc:         { mainnet: 'BscScan',       testnet: 'BscScan Testnet' },
  tron:        { mainnet: 'TronScan',      testnet: 'Shasta TronScan' },
  solana:      { mainnet: 'Solscan',       testnet: 'Solscan Devnet' },
  bitcoin:     { mainnet: 'Mempool',       testnet: 'Mempool Testnet' },
  litecoin:    { mainnet: 'Blockchair',    testnet: 'Blockchair Testnet' },
  dogecoin:    { mainnet: 'DogeChain',     testnet: 'DogeChain Testnet' },
  dash:        { mainnet: 'Dash Explorer', testnet: 'Dash Testnet Explorer' },
  bitcoincash: { mainnet: 'Blockchair',    testnet: 'Blockchair Testnet' },
  ripple:      { mainnet: 'XRPScan',       testnet: 'XRPL Testnet' },
};

function getExplorerName(chainId?: string, isTestnet: boolean = false): string {
  if (!chainId) return 'Block Explorer';
  const names = EXPLORER_NAMES[chainId];
  if (!names) return 'Block Explorer';
  return isTestnet ? names.testnet : names.mainnet;
}

// ── Address Explorer URLs ────────────────────────────────────────────
function getExplorerAddressUrl(chainId: string, address: string, isTestnet: boolean = false): string | null {
  const chain = CHAINS[chainId];
  if (!chain || !address) return null;
  
  const addressExplorers: Record<string, { mainnet: string; testnet: string }> = {
    ethereum:    { mainnet: `https://etherscan.io/address/${address}`,                    testnet: `https://sepolia.etherscan.io/address/${address}` },
    bsc:         { mainnet: `https://bscscan.com/address/${address}`,                     testnet: `https://testnet.bscscan.com/address/${address}` },
    tron:        { mainnet: `https://tronscan.org/#/address/${address}`,                  testnet: `https://shasta.tronscan.org/#/address/${address}` },
    solana:      { mainnet: `https://solscan.io/account/${address}`,                      testnet: `https://solscan.io/account/${address}?cluster=devnet` },
    bitcoin:     { mainnet: `https://mempool.space/address/${address}`,                   testnet: `https://mempool.space/testnet/address/${address}` },
    litecoin:    { mainnet: `https://blockchair.com/litecoin/address/${address}`,          testnet: `https://blockchair.com/litecoin/testnet/address/${address}` },
    dogecoin:    { mainnet: `https://dogechain.info/address/${address}`,                  testnet: `https://blockexplorer.one/dogecoin/testnet/address/${address}` },
    dash:        { mainnet: `https://explorer.dash.org/insight/address/${address}`,       testnet: `https://testnet-explorer.dash.org/insight/address/${address}` },
    bitcoincash: { mainnet: `https://blockchair.com/bitcoin-cash/address/${address}`,     testnet: `https://blockchair.com/bitcoin-cash/testnet/address/${address}` },
    ripple:      { mainnet: `https://xrpscan.com/account/${address}`,                     testnet: `https://testnet.xrpl.org/accounts/${address}` },
  };

  const urls = addressExplorers[chainId];
  if (!urls) return null;
  return isTestnet ? urls.testnet : urls.mainnet;
}

interface TransactionDetailProps {
  tx: Transaction;
}

export default function TransactionDetail({ tx }: TransactionDetailProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { config: appConfig } = useAppConfig();

  const isTestnet = appConfig?.is_testnet ?? false;
  
  const txType = (tx.tx_type || tx.type || 'unknown').toLowerCase();
  const isIncoming = ['receive', 'deposit', 'incoming', 'internal_receive', 'card_conversion_in', 'conversion_in'].includes(txType);
  const isOutgoing = ['send', 'withdrawal', 'internal_send', 'outgoing', 'card_payment', 'card_spend', 'card_spending', 'card_settlement_out', 'card_conversion_out'].includes(txType);
  const isSwap = ['swap'].includes(txType);
  const isStake = ['stake'].includes(txType);
  const isCard = txType.startsWith('card') || (tx as any).source === 'card';
  
  const handleCopy = async (text: string, field: string) => {
    await copyToClipboard(text);
    toast.success('Copied to clipboard');
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Dynamic block explorer URL
  const explorerUrl = tx.action_url || (tx.tx_hash && tx.chain ? getExplorerTxUrl(tx.chain, tx.tx_hash, isTestnet) : null);
  const explorerName = getExplorerName(tx.chain, isTestnet);

  // Fee calculation
  const networkFee = tx.gas_fee_charged ? parseFloat(tx.gas_fee_charged) : (tx.network_fee ? parseFloat(tx.network_fee) : 0);
  const platformFee = tx.platform_fee ? parseFloat(tx.platform_fee) : 0;
  const amount = parseFloat(tx.amount || '0');
  const totalCost = isOutgoing ? (amount + networkFee + platformFee).toFixed(8) : amount.toFixed(8);

  // Chain info
  const chainInfo = tx.chain ? CHAINS[tx.chain] : null;

  // Generate human-readable description
  const getActionDescription = (): string => {
    if (tx.method_description) return tx.method_description;
    if ((tx as any).from_display) return (tx as any).from_display;
    if (txType === 'card_payment') return 'Card Payment';
    if (txType === 'card_spending') return 'Card Spending / Conversion Out';
    if (txType === 'card_conversion_in') return 'Conversion In';
    if (txType === 'card_settlement_out') return 'Card Settlement Out';
    if (isIncoming) return `Received`;
    if (isOutgoing) return `Sent`;
    if (isSwap) return `Swapped`;
    if (isStake) return `Staked`;
    if (txType === 'internal_send') return `Internal Transfer`;
    return tx.type || 'Transaction';
  };

  const getActionIcon = () => {
    if (isCard) {
      if (txType === 'card_conversion_in' || txType === 'card_conversion_out') return <Repeat className="w-4 h-4 text-cyan" />;
      return <CreditCard className="w-4 h-4 text-cyan" />;
    }
    if (isIncoming) return <ArrowDownLeft className="w-4 h-4" />;
    if (isOutgoing) return <ArrowUpRight className="w-4 h-4" />;
    if (isSwap) return <Repeat className="w-4 h-4" />;
    if (isStake) return <Zap className="w-4 h-4" />;
    return <HelpCircle className="w-4 h-4" />;
  };

  const getStatusColor = () => {
    const status = tx.status.toLowerCase();
    if (['confirmed', 'completed', 'received', 'finalized'].includes(status)) return 'text-success bg-success/10 border-success/20';
    if (['failed', 'dropped', 'cancelled', 'rejected'].includes(status)) return 'text-danger bg-danger/10 border-danger/20';
    return 'text-warning bg-warning/10 border-warning/20';
  };

  const getStatusDotColor = () => {
    const status = tx.status.toLowerCase();
    if (['confirmed', 'completed', 'received', 'finalized'].includes(status)) return 'bg-success';
    if (['failed', 'dropped', 'cancelled', 'rejected'].includes(status)) return 'bg-danger';
    return 'bg-warning animate-pulse';
  };

  const shareTransaction = async () => {
    const text = `Transaction on BitSilo:
Type: ${getActionDescription()}
Amount: ${amount} ${tx.currency}
Status: ${tx.status}
${tx.tx_hash ? `Hash: ${tx.tx_hash}` : ''}
    `;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Transaction Details',
          text: text,
          url: explorerUrl || window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy(text, 'share');
    }
  };

  const displayTime = tx.confirmed_at || tx.created_at;

  return (
    <div className="flex flex-col h-full bg-midnight/95 backdrop-blur-xl text-text-primary">
      {/* Header Section */}
      <div className="relative p-8 border-b border-white/5 overflow-hidden">
        {/* Animated background glow */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-20 ${isIncoming ? 'bg-success' : 'bg-cyan'}`} />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-150 opacity-50" />
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center bg-card-bg border border-white/10 shadow-2xl relative z-10`}>
              {getAssetIconWithChain(tx.currency, tx.chain)}
            </div>
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-midnight z-20 ${
              isIncoming ? 'bg-success/20 text-success' : 
              isOutgoing ? 'bg-cyan/20 text-cyan' :
              isSwap ? 'bg-electric-blue/20 text-electric-blue' :
              'bg-warning/20 text-warning'
            }`}>
              {getActionIcon()}
            </div>
          </div>
          
          <h2 className="text-4xl font-bold tracking-tight mb-1 font-orbitron">
            {isIncoming ? '+' : (isOutgoing ? '-' : '')}{amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {tx.currency}
          </h2>
          {tx.usdAmount && (
            <p className="text-text-secondary font-medium mb-6 text-lg">{tx.usdAmount}</p>
          )}
          
          <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full border text-xs font-bold uppercase tracking-[0.2em] ${getStatusColor()}`}>
            <div className={`w-2 h-2 rounded-full ${getStatusDotColor()}`} />
            {tx.status}
          </div>
        </div>
      </div>

      {/* Decorative Receipt Cutout */}
      <div className="relative h-4 flex items-center justify-center">
        <div className="absolute inset-x-0 h-[1px] border-t border-dashed border-white/20" />
        <div className="absolute left-0 -ml-2 w-4 h-4 rounded-full bg-midnight" />
        <div className="absolute right-0 -mr-2 w-4 h-4 rounded-full bg-midnight" />
      </div>

      {/* Details Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Main Info Box */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          
          {/* Action Row */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-secondary">
              {getActionIcon()}
              <span className="text-sm font-medium">Action</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">{getActionDescription()}</span>
          </div>

          {/* Status Row */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-secondary">
              <div className={`w-2 h-2 rounded-full ${getStatusDotColor()}`} />
              <span className="text-sm font-medium">Status</span>
            </div>
            <span className={`text-sm font-bold uppercase tracking-wider ${getStatusColor().split(' ')[0]}`}>
              {tx.status}
            </span>
          </div>

          {/* Date Row */}
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
            <div className="flex items-center gap-2 text-text-secondary">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Time</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-medium text-text-primary">
                {displayTime ? format(new Date(displayTime), 'MMM d, yyyy HH:mm:ss') : 'Unknown'}
              </span>
              {displayTime && (
                <span className="text-xs text-text-secondary bg-white/5 px-2 py-0.5 rounded">
                  {formatDistanceToNow(new Date(displayTime), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          {/* Network Row */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-secondary">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">Network</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary capitalize">
                {chainInfo?.name || tx.chain || 'Unknown'}
              </span>
              {isTestnet && <span className="text-[10px] uppercase font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded">Testnet</span>}
            </div>
          </div>

          {/* Block Number Row */}
          {tx.block_number && (
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary">
                <Hash className="w-4 h-4" />
                <span className="text-sm font-medium">Block</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-text-primary">#{tx.block_number.toLocaleString()}</span>
                {tx.confirmations !== undefined && tx.required_confirmations !== undefined && (
                  <span className="text-xs text-text-secondary bg-white/5 px-2 py-0.5 rounded">
                    {tx.confirmations} / {tx.required_confirmations} confs
                  </span>
                )}
              </div>
            </div>
          )}

          {/* From Row */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-secondary">
              {isIncoming ? <ArrowDownLeft className="w-4 h-4 text-success" /> : <Wallet className="w-4 h-4" />}
              <span className="text-sm font-medium">{isIncoming ? 'Sender' : 'From'}</span>
            </div>
            <div className="flex items-center gap-2">
              {tx.from_address ? (
                <a
                  href={tx.chain ? getExplorerAddressUrl(tx.chain, tx.from_address, isTestnet) || '#' : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-mono text-sm ${tx.chain ? 'text-cyan hover:underline transition-all' : 'text-text-primary'}`}
                  title={tx.from_address}
                >
                  {shortenAddress(tx.from_address, 8)}
                </a>
              ) : (
                <span className="font-mono text-sm text-text-secondary">
                  {tx.from_display ? shortenAddress(tx.from_display, 8) : 'My Wallet'}
                </span>
              )}
              {(tx.from_address || tx.from_display) && (
                 <button onClick={() => handleCopy((tx.from_address || tx.from_display)!, 'from')} className="text-text-secondary hover:text-white transition-colors bg-white/5 p-1 rounded">
                   {copiedField === 'from' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                 </button>
              )}
            </div>
          </div>

          {/* To Row */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-secondary">
              {isOutgoing ? <ArrowUpRight className="w-4 h-4 text-cyan" /> : <Wallet className="w-4 h-4" />}
              <span className="text-sm font-medium">{isOutgoing ? 'Recipient' : 'To'}</span>
            </div>
            <div className="flex items-center gap-2">
              {tx.to_address ? (
                <a
                  href={tx.chain ? getExplorerAddressUrl(tx.chain, tx.to_address, isTestnet) || '#' : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-mono text-sm ${tx.chain ? 'text-cyan hover:underline transition-all' : 'text-text-primary'}`}
                  title={tx.to_address}
                >
                  {shortenAddress(tx.to_address, 8)}
                </a>
              ) : (
                <span className="font-mono text-sm text-text-secondary">
                  {tx.to_display ? shortenAddress(tx.to_display, 8) : 'My Wallet'}
                </span>
              )}
              {(tx.to_address || tx.to_display) && (
                 <button onClick={() => handleCopy((tx.to_address || tx.to_display)!, 'to')} className="text-text-secondary hover:text-white transition-colors bg-white/5 p-1 rounded">
                   {copiedField === 'to' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                 </button>
              )}
            </div>
          </div>

          {/* Card Transaction ID Row */}
          {(tx as any).card_transaction_id && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary">
                <CreditCard className="w-4 h-4 text-cyan" />
                <span className="text-sm font-medium">Card Transaction ID</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-cyan">
                  {(tx as any).card_transaction_id.slice(0, 8)}...{(tx as any).card_transaction_id.slice(-6)}
                </span>
                <button 
                  onClick={() => handleCopy((tx as any).card_transaction_id, 'card_tx_id')} 
                  className="text-text-secondary hover:text-white transition-colors bg-white/5 p-1 rounded"
                >
                  {copiedField === 'card_tx_id' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Spent From Asset Row */}
          {(tx as any).spent_from_asset && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary">
                <Coins className="w-4 h-4 text-cyan" />
                <span className="text-sm font-medium">Spent From</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {(tx as any).spent_from_asset}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Memo / Note Box */}
        {tx.memo && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-inner">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan" /> Memo / Reference
              </span>
              <button 
                onClick={() => handleCopy(tx.memo!, 'memo')}
                className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
                title="Copy Memo"
              >
                {copiedField === 'memo' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'memo' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="text-sm font-mono break-all text-text-primary bg-black/20 p-3 rounded-xl border border-white/5">
              {tx.memo}
            </div>
          </div>
        )}

        {/* Transaction Hash Box */}
        {tx.tx_hash && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Hash className="w-4 h-4" /> Transaction Hash (TxID)
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleCopy(tx.tx_hash!, 'txHash')}
                  className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
                  title="Copy TxID"
                >
                  {copiedField === 'txHash' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'txHash' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            {explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-mono break-all text-cyan hover:underline transition-all cursor-pointer bg-black/20 p-3 rounded-xl border border-cyan/10"
              >
                {tx.tx_hash}
              </a>
            ) : (
              <div className="text-sm font-mono break-all text-text-primary bg-black/20 p-3 rounded-xl border border-white/5">
                {tx.tx_hash}
              </div>
            )}
          </div>
        )}

        {/* Financial Breakdown Box */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <span className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Coins className="w-4 h-4" /> Financial Details
            </span>
          </div>
          
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <span className="text-sm text-text-secondary">{isIncoming ? 'Amount Received' : 'Amount Sent'}</span>
            <span className="font-medium text-text-primary">
              {isOutgoing && (networkFee + platformFee > 0) && (amount > networkFee + platformFee)
                ? formatCryptoAmount(amount - (networkFee + platformFee), 8, 4)
                : formatCryptoAmount(amount, 8, 4)} {tx.currency}
            </span>
          </div>
          
          {isOutgoing && (networkFee > 0 || platformFee > 0) && (
            <>
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <span className="text-sm text-text-secondary">Tx Fee</span>
                <span className="font-medium text-text-primary">{formatCryptoAmount(networkFee + platformFee, 8, 4)} {tx.currency}</span>
              </div>
              <div className="p-4 flex justify-between items-center bg-white/[0.04]">
                <span className="text-sm text-text-secondary font-semibold">Total Deducted</span>
                <span className="font-bold text-cyan font-mono">{formatCryptoAmount(amount, 8, 4)} {tx.currency}</span>
              </div>
            </>
          )}
        </div>

        {/* Compliance Info (If available) */}
        {(tx.risk_score !== undefined || tx.compliance_data) && (
           <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
             (tx.risk_score || 0) > 70 ? 'bg-danger/10 border-danger/20' : 'bg-success/5 border-success/10'
           }`}>
              {(tx.risk_score || 0) > 70 ? (
                <ShieldAlert className="w-5 h-5 text-danger shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-success shrink-0" />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1 text-text-primary flex justify-between items-center">
                  Compliance Status
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(tx.risk_score || 0) > 70 ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
                    Score: {tx.risk_score || 0}/100
                  </span>
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {isIncoming ? (
                    `This incoming transaction has been screened by our compliance engine.`
                  ) : (
                    `Travel Rule information ${tx.compliance_data ? 'has been attached' : 'not required'} for this beneficiary.`
                  )}
                </p>
              </div>
           </div>
        )}

        {/* Speed up / Cancel (Pending Outgoing only) */}
        {isOutgoing && tx.status.toLowerCase() === 'pending' && (
          <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <Zap className="w-5 h-5 text-warning shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-text-primary">Transaction is Pending</h4>
                <p className="text-xs text-text-secondary">You can speed up this transaction by paying a higher network fee, or attempt to cancel it.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button className="py-2 px-4 bg-warning/10 hover:bg-warning/20 text-warning rounded-xl font-bold transition-all text-xs border border-warning/20">
                Speed Up
              </button>
              <button className="py-2 px-4 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl font-bold transition-all text-xs border border-danger/20">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {explorerUrl && (
            <a 
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-gradient-to-r from-cyan to-electric-blue text-midnight rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-cyan/20 text-sm w-full"
            >
              View on Explorer <ExternalLink className="w-4 h-4" />
            </a>
          )}
          
          <button 
            onClick={shareTransaction}
            className={`py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${!explorerUrl ? 'col-span-2' : ''}`}
          >
            Share Receipt
          </button>
        </div>


      </div>
    </div>
  );
}
