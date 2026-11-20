'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/shared/AppHeader';
import Background from '@/components/shared/Background';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FiatTransactionHistory from '@/components/fiat/FiatTransactionHistory';
import { api, Balance } from '@/lib/api';
import { ASSETS, getAssetColor, getAssetTextColor, getAssetIcon, getAssetName } from '@/lib/chains';
import { formatNumberWithCommas } from '@/lib/utils';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/components/providers/AuthProvider';
import { ShieldAlert, Lock } from 'lucide-react';

export default function FiatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCurrency = searchParams.get('currency')?.toUpperCase();
  const { user } = useAuth();
  const isKycRequired = !user || (user.tier ?? 0) < 2;

  const [balances, setBalances] = useState<Record<string, number>>({});
  const [fiatValues, setFiatValues] = useState<Record<string, number>>({});
  const [selectedCurrency, setSelectedCurrency] = useState<string>(queryCurrency || 'USD');
  const [fiatOptions, setFiatOptions] = useState<string[]>(['USD', 'NGN', 'EUR', 'GBP']);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFiatData = useCallback(async () => {
    try {
      // Reconcile any pending deposits with payment processor so balance is always fresh
      await api.reconcileFiat().catch(() => {});

      const [balRes, setRes] = await Promise.all([
        api.getAllBalances(),
        api.getSettings()
      ]);

      let preferred = 'USD';
      if (setRes.success && setRes.settings?.preferred_currency) {
        preferred = setRes.settings.preferred_currency.toUpperCase();
      }

      const balMap: Record<string, number> = {};
      const fiatMap: Record<string, number> = {};
      const presentFiat = new Set<string>();

      if (balRes.success && balRes.balances) {
        balRes.balances.forEach((b: Balance) => {
          const sym = b.currency.toUpperCase();
          if (['USD', 'NGN', 'EUR', 'GBP'].includes(sym) || ASSETS[sym]?.type === 'fiat') {
            const amt = parseFloat(b.available_balance || '0');
            const fVal = parseFloat(b.fiat_value || '0');
            balMap[sym] = (balMap[sym] || 0) + amt;
            fiatMap[sym] = (fiatMap[sym] || 0) + fVal;
            if (amt > 0) {
              presentFiat.add(sym);
            }
          }
        });
      }

      // Always include preferred currency
      presentFiat.add(preferred);
      if (queryCurrency) {
        presentFiat.add(queryCurrency);
      }

      // Keep standard fiat list if only 1 is present, or list discovered options
      const options = Array.from(presentFiat);
      if (options.length > 0) {
        setFiatOptions(options);
      }

      // Set initial currency if not already chosen via query
      if (!queryCurrency) {
        const withBalance = options.find(c => (balMap[c] || 0) > 0);
        setSelectedCurrency(withBalance || preferred || 'USD');
      }

      setBalances(balMap);
      setFiatValues(fiatMap);
    } catch (err) {
      console.error('Failed to fetch fiat data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [queryCurrency]);

  useEffect(() => {
    fetchFiatData();
  }, [fetchFiatData]);

  // Realtime updates via WebSocket
  useWebSocket(useCallback((notification: any) => {
    if (['balance_update', 'deposit', 'withdrawal', 'transaction_update'].includes(notification.type)) {
      fetchFiatData();
    }
  }, [fetchFiatData]));

  const currentBalance = balances[selectedCurrency] || 0;
  const currentFiat = fiatValues[selectedCurrency] ?? (
    selectedCurrency === 'USD' ? currentBalance :
    selectedCurrency === 'NGN' ? currentBalance / 1600 :
    selectedCurrency === 'EUR' ? currentBalance * 1.08 :
    selectedCurrency === 'GBP' ? currentBalance * 1.28 : currentBalance
  );

  const getCurrencyPrefix = (curr: string) => {
    switch (curr) {
      case 'USD': return '$';
      case 'NGN': return '₦';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '';
    }
  };

  const prefix = getCurrencyPrefix(selectedCurrency);
  const colorClass = getAssetColor(selectedCurrency);
  const assetName = getAssetName(selectedCurrency) || `${selectedCurrency} Fiat`;

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

  const handleDepositFiat = () => {
    if (isKycRequired) {
      router.push('/kyc');
      return;
    }
    router.push(`/fiat/deposit?currency=${selectedCurrency}`);
  };

  const handleWithdrawFiat = () => {
    if (isKycRequired) {
      router.push('/kyc');
      return;
    }
    router.push(`/fiat/withdraw?currency=${selectedCurrency}`);
  };

  const handleSwap = () => {
    router.push(`/swap?from=${selectedCurrency.toLowerCase()}`);
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
          {/* KYC Tier 2 Alert Banner for unverified users */}
          {isKycRequired && (
            <div className="p-5 rounded-2xl mb-6 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-300">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary">Identity Verification (KYC Tier 2) Required</h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Your fiat currency and internal wallet are assigned upon verifying your country of residence. Complete verification to unlock deposits and withdrawals.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/kyc')}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl transition-all whitespace-nowrap shadow-md self-stretch sm:self-auto text-center"
              >
                Complete KYC
              </button>
            </div>
          )}

          {/* Currency Switcher if multiple fiat options exist */}
          {fiatOptions.length > 1 && (
            <div className="flex items-center justify-center gap-2 mb-6 overflow-x-auto pb-1">
              {fiatOptions.map((curr) => (
                <button
                  key={curr}
                  onClick={() => setSelectedCurrency(curr)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    selectedCurrency === curr
                      ? 'bg-cyan/20 border-cyan text-cyan shadow-sm shadow-cyan/20'
                      : 'bg-white/5 border-border/60 text-text-secondary hover:border-cyan/40 hover:text-text-primary'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          )}

          {/* Hero Card matching Assets Page */}
          <div className={`bg-gradient-to-br ${colorClass} rounded-3xl p-8 mb-8 shadow-2xl animate-fade-slide-up border border-border`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-card-bg/50 dark:bg-black/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-border">
                 <div className={`w-10 h-10 ${getAssetTextColor(selectedCurrency)}`}>
                    {getAssetIcon(selectedCurrency)}
                 </div>
              </div>
              
              <h1 className="text-3xl font-bold text-text-primary mb-1 tracking-tight">{assetName}</h1>
              <p className="text-text-secondary font-medium mb-6">{selectedCurrency}</p>
              
              <div className="w-full px-2">
                 <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-2 break-all font-mono">
                   {prefix}{formatNumberWithCommas(currentBalance, 2)} {selectedCurrency}
                 </div>
                 <div className="text-lg sm:text-xl text-text-secondary font-mono">
                   ≈ ${formatNumberWithCommas(currentFiat, 2)} USD
                 </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Deposit, Withdraw, Exchange */}
          <div className="flex flex-row gap-2 sm:gap-4 w-full justify-center mb-8 px-2 sm:px-0 max-w-3xl mx-auto">
            <button 
              onClick={handleDepositFiat}
              className={`flex-1 py-3 sm:py-4 font-bold rounded-xl backdrop-blur-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border text-xs sm:text-base shadow-sm ${
                isKycRequired 
                  ? 'bg-deep-navy/20 dark:bg-white/5 border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                  : 'bg-deep-navy/40 dark:bg-white/5 hover:bg-cyan/10 text-text-primary hover:text-cyan border-border hover:border-cyan'
              }`}
            >
              {isKycRequired ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M7 7l5 5 5-5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 12v9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {isKycRequired ? 'Deposit (Verify)' : 'Deposit'}
            </button>
            <button 
              onClick={handleWithdrawFiat}
              className={`flex-1 py-3 sm:py-4 font-bold rounded-xl backdrop-blur-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border text-xs sm:text-base shadow-sm ${
                isKycRequired 
                  ? 'bg-deep-navy/20 dark:bg-white/5 border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                  : 'bg-deep-navy/40 dark:bg-white/5 hover:bg-cyan/10 text-text-primary hover:text-cyan border-border hover:border-cyan'
              }`}
            >
              {isKycRequired ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 17l-5-5-5 5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 12V3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {isKycRequired ? 'Withdraw (Verify)' : 'Withdraw'}
            </button>
            <button 
              onClick={handleSwap}
              className="flex-1 py-3 sm:py-4 bg-deep-navy/40 dark:bg-white/5 hover:bg-cyan/10 text-text-primary hover:text-cyan font-bold rounded-xl backdrop-blur-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border border-border hover:border-cyan text-xs sm:text-base shadow-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Swap
            </button>
          </div>

          {/* Fiat Transaction History */}
          <div className="animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
             <h3 className="text-lg font-bold text-text-primary mb-4 ml-1">Transaction History</h3>
             <FiatTransactionHistory currency={selectedCurrency} onRefreshNeeded={fetchFiatData} /> 
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
