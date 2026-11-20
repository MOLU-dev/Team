'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, Transaction } from '@/lib/api';
import AppHeader from '@/components/shared/AppHeader';
import Background from '@/components/shared/Background';
import TransactionList from '@/components/history/TransactionList';
import ChainBreakdown from '@/components/dashboard/ChainBreakdown';
import { getAssetColor, getAssetTextColor, getAssetIcon, getAssetName, getChainDetails, getAssetIconWithChain, ASSETS, normalizeSymbol } from '@/lib/chains';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useCallback } from 'react';
import { formatCryptoAmount, formatNumberWithCommas } from '@/lib/utils';
import { useWebSocket } from '@/lib/websocket';

interface ChainData {
  type: string;
  network: string;
  amount: string;
  usdValue: string;
  symbol: string;
  chainId: string;
  rawAmount: number;
  rawFiat: number;
}

interface AssetData {
  name: string;
  symbol: string;
  amount: string;
  value: string;
  totalFiat: number;
  chains: ChainData[];
  primaryChainId?: string;
}

import ProtectedRoute from '@/components/auth/ProtectedRoute';

const MOCK_PRICES: Record<string, number> = {
  'BTC': 65432.10,
  'ETH': 3456.78,
  'BNB': 589.45,
  'SOL': 145.32,
  'TRX': 0.1234,
  'XRP': 0.6123,
  'LTC': 84.56,
  'DOGE': 0.1456,
  'DASH': 34.12,
  'BCH': 445.67,
  'USDT': 1.00,
  'USDC': 1.00,
  'BUSD': 1.00,
  'EURC': 1.08,
};

export default function AssetPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedChain = searchParams.get('chain');

  const [isLoading, setIsLoading] = useState(true);
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { config: appConfig } = useAppConfig();
  
  // Normalize symbol and handle aliases
  const symbol = normalizeSymbol(params.symbol as string);
  
  const assetInfo = ASSETS[symbol];
  const isFiat = assetInfo?.type === 'fiat';

  const colorClass = getAssetColor(symbol);

  const fetchData = useCallback(async () => {
    try {
      if (!isInitialLoad) setIsLoading(true);
      
      // 1. Fetch balance using the simple asset-balance endpoint
      // This reads finalized balances directly from user_balances (no wei conversions)
      const chainsForAsset = assetInfo?.chains || [];
      const isFiatAsset = assetInfo?.type === 'fiat';
      
      // Determine all chains to query:
      // For fiat, query 'internal'.
      // For crypto/tokens, query all chains supported by this asset (plus selectedChain if specified).
      let chainList: string[] = [];
      if (isFiatAsset) {
        chainList = ['internal'];
      } else {
        const supported = [...chainsForAsset];
        if (selectedChain && !supported.includes(selectedChain)) {
          supported.push(selectedChain);
        }
        chainList = supported.length > 0 ? supported : (selectedChain ? [selectedChain] : []);
      }
      
      let effectivePrice = 0;
      const chains: ChainData[] = [];

      // 1. Fetch balance from asset-balance endpoint for each chain
      const balancePromises = chainList.map(chainId => 
        api.getAssetBalance(symbol, chainId).catch(() => null)
      );

      // 2. In parallel, fetch all-balances to ensure 100% parity with dashboard
      const [balanceResults, allBalancesRes] = await Promise.all([
        Promise.all(balancePromises),
        api.getAllBalances().catch(() => null),
      ]);

      // Build fallback lookup from all-balances
      const TESTNET_TO_MAINNET: Record<string, string> = {
        sepolia: 'ethereum',
        bsctestnet: 'bsc',
        trontestnet: 'tron',
        solanadevnet: 'solana',
      };
      const fallbackMap: Record<string, { amount: number; fiat: number; price: number }> = {};
      if (allBalancesRes?.success && Array.isArray(allBalancesRes.balances)) {
        allBalancesRes.balances.forEach((b: any) => {
          const cId = TESTNET_TO_MAINNET[b.chain] || b.chain;
          if (normalizeSymbol(b.currency) === symbol) {
            const amt = parseFloat(b.balance || b.total_balance || b.available_balance || '0');
            const fiat = parseFloat(b.fiat_value || '0');
            const pr = parseFloat(b.price || '0');
            fallbackMap[cId] = { amount: amt, fiat, price: pr };
          }
          if (b.tokens && Array.isArray(b.tokens)) {
            b.tokens.forEach((t: any) => {
              if (normalizeSymbol(t.currency) === symbol) {
                const amt = parseFloat(t.balance || t.total_balance || t.available_balance || '0');
                const fiat = parseFloat(t.fiat_value || '0');
                const pr = parseFloat(t.price || '0');
                if (!fallbackMap[cId] || amt > 0) {
                  fallbackMap[cId] = { amount: amt, fiat, price: pr };
                }
              }
            });
          }
        });
      }

      let totalAllChainsAmount = 0;
      let totalAllChainsFiat = 0;

      chainList.forEach((chainId, idx) => {
        const res = balanceResults[idx];
        let amountVal = 0;
        let fiatVal = 0;
        let priceVal = 0;

        if (res?.success && res.balance) {
          amountVal = parseFloat(res.balance.balance || '0');
          fiatVal = parseFloat(res.balance.fiat_value || '0');
          priceVal = parseFloat(res.balance.price || '0');
        }

        // Overlay with allBalances data if getAssetBalance was zero or unavailable
        const fb = fallbackMap[chainId];
        if (fb && (amountVal === 0 || isNaN(amountVal))) {
          if (fb.amount > 0) {
            amountVal = fb.amount;
            fiatVal = fb.fiat;
            if (fb.price > 0) priceVal = fb.price;
          }
        }

        if (priceVal > 0) effectivePrice = priceVal;
        
        totalAllChainsAmount += amountVal;
        totalAllChainsFiat += fiatVal;
        
        // For multi-chain tokens (USDT, USDC, EURC …), always include every supported
        // network in the breakdown so users can see the real per-chain balance and use
        // "Receive on this network". For single-chain assets, skip zero-balance chains
        // to avoid cluttering the UI.
        const isMultiChain = (assetInfo?.chains?.length ?? 0) > 1;
        if (amountVal > 0 || isMultiChain) {
          const details = getChainDetails(chainId);
          let networkName = details.network || chainId || 'Unknown Network';
          
          if (appConfig?.is_testnet && !networkName.toLowerCase().includes('testnet') && !networkName.toLowerCase().includes('devnet') && !networkName.toLowerCase().includes('sepolia')) {
            networkName = `${networkName} Testnet`;
          }

          chains.push({
            type: details.type || 'Unknown',
            network: networkName,
            amount: amountVal > 0
              ? `${formatCryptoAmount(amountVal)} ${symbol}`
              : `0.0000 ${symbol}`,
            usdValue: `$${formatNumberWithCommas(fiatVal, 2)}`,
            symbol: symbol,
            chainId: chainId,
            rawAmount: amountVal,
            rawFiat: fiatVal
          });
        }
      });

      // If price was 0 from backend, use mock price as fallback
      if (effectivePrice === 0 && MOCK_PRICES[symbol]) {
        effectivePrice = MOCK_PRICES[symbol];
        if (totalAllChainsAmount > 0 && totalAllChainsFiat === 0) {
          totalAllChainsFiat = totalAllChainsAmount * effectivePrice;
        }
      }

      // Determine hero card amount & fiat:
      // If a chain was explicitly selected (e.g. ?chain=bsc), display that chain's balance.
      // If no chain selected or single chain asset, display total across chains.
      let displayAmount = totalAllChainsAmount;
      let displayFiat = totalAllChainsFiat;
      if (selectedChain) {
        const selectedChainEntry = chains.find(c => c.chainId === selectedChain);
        if (selectedChainEntry) {
          displayAmount = selectedChainEntry.rawAmount ?? (parseFloat(selectedChainEntry.amount.replace(/,/g, '')) || 0);
          displayFiat = selectedChainEntry.rawFiat ?? (parseFloat(selectedChainEntry.usdValue.replace(/[$,]/g, '')) || 0);
        } else if (chains.length === 0) {
          displayAmount = 0;
          displayFiat = 0;
        }
      }

      if (displayAmount > 0 || totalAllChainsAmount > 0 || chains.length > 0) {
        setAssetData({
          name: getAssetName(symbol),
          symbol: symbol,
          amount: `${formatCryptoAmount(displayAmount)} ${symbol}`,
          value: `$${formatNumberWithCommas(displayFiat, 2)}`,
          totalFiat: displayFiat,
          chains,
          primaryChainId: selectedChain || (chainList.length === 1 ? chainList[0] : (chains[0]?.chainId || undefined))
        });
      } else {
        setAssetData({
          name: getAssetName(symbol),
          symbol: symbol,
          amount: `0.0000 ${symbol}`,
          value: '$0.00',
          totalFiat: 0,
          chains: [],
          primaryChainId: selectedChain || (chainList.length === 1 ? chainList[0] : undefined)
        });
      }

    } catch (error) {
      console.error("Failed to load asset details", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [symbol, appConfig, selectedChain, assetInfo]);

  const [cancelledAlert, setCancelledAlert] = useState<{ type: 'cancelled' | 'failed'; message: string } | null>(null);

  useEffect(() => {
    const isCancelled = searchParams.get('cancelled') === 'true' || 
                        searchParams.get('status') === 'cancelled' ||
                        searchParams.get('deposit_status') === 'cancelled';
    const isFailed = searchParams.get('failed') === 'true' || 
                     searchParams.get('status') === 'failed' ||
                     searchParams.get('deposit_status') === 'failed';
    const ref = searchParams.get('reference') || searchParams.get('ref') || searchParams.get('trxref');

    if (ref && (isCancelled || isFailed)) {
      api.cancelFiatDeposit(ref, isCancelled ? 'cancelled by user' : 'payment failed').catch(() => {});
    }

    if (isCancelled) {
      setCancelledAlert({
        type: 'cancelled',
        message: 'Your deposit was cancelled and marked as cancelled in the database. No funds were deducted.',
      });
    } else if (isFailed) {
      setCancelledAlert({
        type: 'failed',
        message: 'Your deposit failed or could not be completed. The transaction has been updated.',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (symbol) {
      fetchData();
    }
  }, [symbol, fetchData]);

  // Realtime updates via WebSocket
  useWebSocket(useCallback((notification: any) => {
    if (['balance_update', 'deposit', 'withdrawal', 'transaction_update'].includes(notification.type)) {
      console.log(`Realtime update for ${symbol}:`, notification.type);
      fetchData();
    }
  }, [symbol, fetchData]));

  const handleSend = () => {
    const chainParam = selectedChain || assetData?.primaryChainId;
    const chainQuery = chainParam ? `&chain=${chainParam}` : '';
    router.push(`/send?asset=${symbol.toLowerCase()}${chainQuery}`);
  };

  const handleInstantSend = () => {
    router.push(`/send?asset=${symbol.toLowerCase()}&instantsend=true`);
  };

  const handleReceive = () => {
    const chainParam = selectedChain || assetData?.primaryChainId;
    const chainQuery = chainParam ? `&chain=${chainParam}` : '';
    router.push(`/receive?asset=${symbol.toLowerCase()}${chainQuery}`); 
  };

  const handleDepositFiat = () => {
    router.push(`/fiat/deposit?currency=${symbol}`);
  };

  const handleWithdrawFiat = () => {
    router.push(`/fiat/withdraw?currency=${symbol}`);
  };

  const handleSwap = () => {
    router.push(`/swap?from=${symbol.toLowerCase()}`);
  };

  if (isLoading) {
     return (
        <div className="min-h-screen bg-midnight flex items-center justify-center">
             <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
     );
  }

  return (
    <ProtectedRoute>
      <Background type="dashboard" />
      
      <div className="relative z-10 min-h-screen pb-32">
        <AppHeader showBackButton={true} backHref="/dashboard" />
        
        <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl pt-28">
          
          {/* Cancelled / Failed Banner */}
          {cancelledAlert && (
            <div className={`p-4 rounded-2xl mb-6 flex items-start justify-between border ${
              cancelledAlert.type === 'cancelled' 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                : 'bg-danger/10 border-danger/30 text-danger'
            } animate-fade-slide-up`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{cancelledAlert.type === 'cancelled' ? '⚠️' : '❌'}</span>
                <div>
                  <h4 className="font-bold text-sm">
                    {cancelledAlert.type === 'cancelled' ? 'Deposit Cancelled' : 'Deposit Failed'}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">{cancelledAlert.message}</p>
                </div>
              </div>
              <button 
                onClick={() => setCancelledAlert(null)}
                className="text-xs opacity-70 hover:opacity-100 px-2 py-1 rounded bg-black/20"
              >
                ✕
              </button>
            </div>
          )}

          {/* Hero Card */}
          <div className={`bg-gradient-to-br ${colorClass} rounded-3xl p-8 mb-8 shadow-2xl animate-fade-slide-up border border-border`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-card-bg/50 dark:bg-black/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-border">
                 <div className={`w-10 h-10 ${getAssetTextColor(symbol)}`}>
                    {assetData?.primaryChainId ? getAssetIconWithChain(symbol, assetData.primaryChainId) : getAssetIcon(symbol)}
                 </div>
              </div>
              
              <h1 className="text-3xl font-bold text-text-primary mb-1 tracking-tight">{assetData?.name}</h1>
              <p className="text-text-secondary font-medium mb-6">{symbol}</p>
              
              <div className="w-full px-2">
                 <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-2 break-all">{assetData?.amount}</div>
                 <div className="text-lg sm:text-xl text-text-secondary">{assetData?.value}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-2 sm:gap-4 w-full justify-center mb-8 px-2 sm:px-0 max-w-3xl mx-auto">
            {isFiat ? (
              <>
                <button 
                  onClick={handleDepositFiat}
                  className="flex-1 py-2 sm:py-4 bg-deep-navy/40 dark:bg-white/5 hover:bg-cyan/10 text-text-primary hover:text-cyan font-bold rounded-xl backdrop-blur-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border border-border hover:border-cyan text-[10px] sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M7 7l5 5 5-5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 12v9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Deposit
                </button>
                <button 
                  onClick={handleWithdrawFiat}
                  className="flex-1 py-2 sm:py-4 bg-deep-navy/40 dark:bg-white/5 hover:bg-cyan/10 text-text-primary hover:text-cyan font-bold rounded-xl backdrop-blur-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border border-border hover:border-cyan text-[10px] sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 17l-5-5-5 5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 12V3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Withdraw
                </button>
                <button 
                  onClick={handleSwap}
                  className="flex-1 py-2 sm:py-4 bg-deep-navy/40 dark:bg-white/5 hover:bg-cyan/10 text-text-primary hover:text-cyan font-bold rounded-xl backdrop-blur-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border border-border hover:border-cyan text-[10px] sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Swap
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleSend}
                  className="flex-1 py-2 sm:py-4 bg-deep-navy/40 dark:bg-white/5 hover:bg-cyan/10 text-text-primary hover:text-cyan font-bold rounded-xl backdrop-blur-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border border-border hover:border-cyan text-[10px] sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <line x1="12" y1="19" x2="12" y2="5"></line>
                     <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                  Send
                </button>
                {symbol === 'DASH' && (
                  <button 
                    onClick={handleInstantSend}
                    className="flex-1 py-2 sm:py-4 bg-gradient-to-br from-sky-500/10 to-blue-600/10 hover:from-sky-500/20 hover:to-blue-600/20 text-sky-400 font-bold rounded-xl backdrop-blur-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border border-sky-500/20 hover:border-sky-400 shadow-lg shadow-sky-500/5 hover:shadow-sky-500/10 text-[10px] sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Instant
                  </button>
                )}
                <button 
                  onClick={handleReceive}
                  className="flex-1 py-2 sm:py-4 bg-deep-navy/40 dark:bg-white/5 hover:bg-cyan/10 text-text-primary hover:text-cyan font-bold rounded-xl backdrop-blur-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border border-border hover:border-cyan text-[10px] sm:text-base"
                >
                   <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <line x1="12" y1="5" x2="12" y2="19"></line>
                     <polyline points="19 12 12 19 5 12"></polyline>
                   </svg>
                  Receive
                </button>
                <button 
                  onClick={handleSwap}
                  className="flex-1 py-2 sm:py-4 bg-deep-navy/40 dark:bg-white/5 hover:bg-cyan/10 text-text-primary hover:text-cyan font-bold rounded-xl backdrop-blur-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border border-border hover:border-cyan text-[10px] sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Swap
                </button>
              </>
            )}
          </div>

          {/* Chain Breakdown */}
          {assetData && assetData.chains.length > 1 && (
             <div className="mb-8 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-2 mb-4 ml-1">
                  <h3 className="text-lg font-bold text-text-primary">Network Distribution</h3>
                  {assetData.chains.length > 1 && (
                    <span className="px-2 py-0.5 bg-cyan/10 text-cyan text-[10px] font-bold rounded-full border border-cyan/20">MULTI-CHAIN</span>
                  )}
                </div>
                <div className="main-card">
                    <ChainBreakdown chains={assetData.chains as any} />
                </div>
             </div>
          )}

          {/* Transactions */}
          <div className="animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
             <h3 className="text-lg font-bold text-text-primary mb-4 ml-1">Transaction History</h3>
             <TransactionList assetFilter={symbol} chainFilter={selectedChain || undefined} /> 
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
