'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard, 
  Info, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { getAssetIcon } from '@/lib/chains';
import { useAuth } from '@/components/providers/AuthProvider';

interface PendingPayment {
  reference: string;
  amount: string;
  currency: string;
  authorizationUrl: string;
  expiresAt: number; // epoch ms
}

export default function DepositFiat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCurrency = searchParams.get('currency')?.toUpperCase();
  const { user } = useAuth();
  const isKycRequired = !user || (user.tier ?? 0) < 2;
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.currency || queryCurrency || 'NGN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingFiat, setExistingFiat] = useState<string | null>(null);
  const [fiatOptions, setFiatOptions] = useState<string[]>(['NGN', 'USD', 'EUR', 'GBP']);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [userLimits, setUserLimits] = useState<{ tier: number; global_usd: number; crypto_limits: Record<string, number>; max_deposit: number } | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Pending payment & status check state
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(30 * 60);
  const [depositSuccess, setDepositSuccess] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, balResponse] = await Promise.all([
          api.getSettings(),
          api.getAllBalances()
        ]);

        const availableFiat = new Set<string>(['NGN', 'USD', 'EUR', 'GBP']);
        let discoveredFiat: string | null = null;

        if (balResponse.success && balResponse.balances) {
          const internalFiat = balResponse.balances.find(b => b.chain === 'internal');
          if (internalFiat) {
            discoveredFiat = internalFiat.currency;
            availableFiat.add(internalFiat.currency);
            setExistingFiat(internalFiat.currency);
          }
        }

        if (settingsRes.success && settingsRes.settings?.preferred_currency) {
          availableFiat.add(settingsRes.settings.preferred_currency.toUpperCase());
        }

        if (user?.currency) {
          const uCur = user.currency.toUpperCase();
          availableFiat.add(uCur);
          setCurrency(uCur);
        } else if (queryCurrency) {
          availableFiat.add(queryCurrency);
          setCurrency(queryCurrency);
        } else if (discoveredFiat) {
          setCurrency(discoveredFiat);
        } else if (settingsRes.success && settingsRes.settings?.preferred_currency) {
          setCurrency(settingsRes.settings.preferred_currency.toUpperCase());
        }

        setFiatOptions(Array.from(availableFiat));
      } catch (err) {
        console.error('Failed to resolve dynamic fiat settings', err);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();

    // Fetch User Limits
    const fetchLimits = async () => {
      try {
        const limitRes = await api.getUserLimits();
        if (limitRes.success) {
          setUserLimits({
            tier: limitRes.tier,
            global_usd: limitRes.global_usd,
            crypto_limits: limitRes.crypto_limits,
            max_deposit: (limitRes as any).max_deposit || 100
          });
        }
      } catch (err) {
        console.error('Failed to fetch user limits for fiat deposit:', err);
      }
    };
    fetchLimits();
  }, []);

  // Tier Limit Validation
  useEffect(() => {
    if (!userLimits || !amount || parseFloat(amount) <= 0) {
      setLimitWarning(null);
      return;
    }

    const enteredAmount = parseFloat(amount);
    
    const checkGlobalLimit = async () => {
      try {
        let amountUSD = enteredAmount;
        if (currency !== 'USD') {
          const priceRes = await api.getPrices();
          const priceData = priceRes.prices?.find((p: any) => p.symbol === currency);
          if (priceData && priceData.price) {
            amountUSD = enteredAmount * priceData.price;
          } else if (currency === 'NGN') {
            amountUSD = enteredAmount / 1600; 
          }
        }

        if (amountUSD > userLimits.max_deposit) {
          setLimitWarning(`Deposit Limit Exceeded: Your current tier (${userLimits.tier}) has a deposit limit of $${userLimits.max_deposit.toLocaleString()}. This request is ~$${amountUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}.`);
        } else {
          setLimitWarning(null);
        }
      } catch (err) {
        console.error('Failed to check deposit limit for fiat:', err);
      }
    };

    checkGlobalLimit();
  }, [amount, currency, userLimits]);

  // Countdown timer for 30 minutes expiration
  useEffect(() => {
    if (!pendingPayment || depositSuccess) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((pendingPayment.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingPayment, depositSuccess]);

  // Check deposit verification helper
  const checkStatus = useCallback(async (isManual = false) => {
    if (!pendingPayment || depositSuccess) return;
    if (isManual) {
      setIsCheckingStatus(true);
      setStatusFeedback(null);
    }

    try {
      // 1. Direct verify with backend/Paystack
      const verifyRes: any = await api.verifyFiatDeposit(pendingPayment.reference).catch(() => null);
      if (verifyRes && verifyRes.status === 'completed') {
        setDepositSuccess(true);
        return;
      }
      
      // 2. Query status endpoint
      const statusRes: any = await api.getFiatTransactionStatus(pendingPayment.reference).catch(() => null);
      if (statusRes && statusRes.status === 'completed') {
        setDepositSuccess(true);
        return;
      }

      if (isManual) {
        const curStatus = statusRes?.status || verifyRes?.status || 'pending';
        if (curStatus === 'failed') {
          setStatusFeedback('Payment failed or was declined by Paystack.');
        } else if (curStatus === 'expired') {
          setStatusFeedback('The 30-minute deposit window has expired.');
        } else {
          setStatusFeedback('Payment is still awaiting confirmation from Paystack. Please complete payment on Paystack or wait a few moments.');
        }
      }
    } catch (err: any) {
      if (isManual) {
        setStatusFeedback('Unable to reach server to verify payment. Please try again.');
      }
    } finally {
      if (isManual) setIsCheckingStatus(false);
    }
  }, [pendingPayment, depositSuccess]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isKycRequired) {
      router.push('/kyc');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.initiateFiatDeposit(amount, currency, user?.email);
      const authUrl = response.authorization_url;

      if (authUrl || (response.success && authUrl)) {
        const expiresEpoch = response.expires_at 
          ? new Date(response.expires_at).getTime() 
          : Date.now() + 30 * 60 * 1000;

        // Open Paystack in a blank page / new tab
        const openedWin = window.open(authUrl, '_blank', 'noopener,noreferrer');
        if (!openedWin) {
          console.warn('Popup blocked, will display button to open manually');
        }

        setPendingPayment({
          reference: response.reference,
          amount: amount,
          currency: currency,
          authorizationUrl: authUrl,
          expiresAt: expiresEpoch,
        });
        setSecondsLeft(Math.max(0, Math.floor((expiresEpoch - Date.now()) / 1000)));
      } else {
        setError(response.message || 'Failed to initiate deposit');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReference = () => {
    if (!pendingPayment) return;
    navigator.clipboard.writeText(pendingPayment.reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SUCCESS STATE
  if (depositSuccess && pendingPayment) {
    return (
      <div className="main-card animate-fade-slide-up max-w-lg mx-auto text-center p-8">
        <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-success/20">
          <CheckCircle2 size={36} className="animate-scale-in" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Deposit Successful!</h2>
        <p className="text-text-secondary text-sm mb-6">
          Your payment was confirmed. Funds have been credited to your wallet balance.
        </p>

        <div className="p-4 bg-white/5 border border-border rounded-2xl mb-8 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Amount Credited:</span>
            <span className="font-mono font-bold text-cyan text-lg">
              {pendingPayment.currency === 'NGN' ? '₦' : ''}{parseFloat(pendingPayment.amount).toLocaleString()} {pendingPayment.currency}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-text-tertiary">
            <span>Reference:</span>
            <span className="font-mono">{pendingPayment.reference}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/fiat')}
            className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 transition-all"
          >
            View Wallet Balance
          </button>
          <button
            onClick={() => {
              setPendingPayment(null);
              setDepositSuccess(false);
              setAmount('');
            }}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary text-sm font-semibold rounded-xl border border-border transition-all"
          >
            Make Another Deposit
          </button>
        </div>
      </div>
    );
  }

  // PENDING / AWAITING PAYMENT STATE
  if (pendingPayment) {
    const isExpired = secondsLeft <= 0;

    return (
      <div className="main-card animate-fade-slide-up max-w-lg mx-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired ? 'bg-danger/10 text-danger' : 'bg-cyan/10 text-cyan'}`}>
              {isExpired ? <AlertCircle size={22} /> : <CreditCard size={22} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                {isExpired ? 'Deposit Window Expired' : 'Complete Payment on Paystack'}
              </h2>
              <p className="text-xs text-text-secondary">
                {isExpired ? 'This 30-minute window has closed' : 'Payment page opened in a new tab'}
              </p>
            </div>
          </div>
          {!isExpired && (
            <div className="flex items-center gap-2 bg-cyan/10 border border-cyan/30 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-cyan animate-pulse">
              <Clock size={14} />
              {formatTime(secondsLeft)}
            </div>
          )}
        </div>

        {isExpired ? (
          <div className="text-center py-6 space-y-4">
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
              <p className="font-semibold mb-1">30-Minute Window Expired</p>
              <p className="text-xs text-danger/80">
                If you did not complete this transaction, you can safely start a new one. If you were charged, our automated background reconciler will detect and credit your wallet.
              </p>
            </div>
            <button
              onClick={() => {
                setPendingPayment(null);
                setAmount('');
              }}
              className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl"
            >
              Start New Deposit
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-white/5 border border-border rounded-xl space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Deposit Amount:</span>
                <span className="font-mono font-bold text-text-primary text-base">
                  {pendingPayment.currency === 'NGN' ? '₦' : ''}{parseFloat(pendingPayment.amount).toLocaleString()} {pendingPayment.currency}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Reference Code:</span>
                <button
                  type="button"
                  onClick={copyReference}
                  className="flex items-center gap-1.5 font-mono text-cyan hover:underline bg-cyan/10 px-2 py-1 rounded"
                >
                  {pendingPayment.reference}
                  {copiedRef ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-cyan/5 border border-cyan/20 rounded-xl text-xs text-text-secondary space-y-2">
              <div className="flex items-center gap-2 text-cyan font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                Backend Webhook Processing
              </div>
              <p className="leading-relaxed">
                Complete your transaction in the newly opened Paystack tab. Our backend automatically receives Paystack's payment webhook and credits your balance — even if you close this page or app.
              </p>
            </div>

            {statusFeedback && (
              <div className="p-3 bg-cyan/10 border border-cyan/30 rounded-xl text-xs text-cyan text-center animate-fade-in font-medium">
                {statusFeedback}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => checkStatus(true)}
                disabled={isCheckingStatus}
                className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Checking Payment Status...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} /> I Have Completed Payment (Check Now)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.open(pendingPayment.authorizationUrl, '_blank', 'noopener,noreferrer')}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-cyan text-sm font-semibold rounded-xl border border-cyan/30 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} /> Re-open Payment Page (Blank Tab)
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (pendingPayment?.reference) {
                    try {
                      await api.cancelFiatDeposit(pendingPayment.reference, 'cancelled by user');
                    } catch (e) {
                      console.warn('Failed to notify backend of deposit cancellation:', e);
                    }
                  }
                  setPendingPayment(null);
                }}
                className="w-full py-2 text-text-tertiary hover:text-text-secondary text-xs transition-colors"
              >
                Cancel and return to deposit form
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT FORM STATE
  return (
    <div className="main-card animate-fade-slide-up max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
          <CreditCard className="text-success" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Deposit Fiat</h2>
          <p className="text-sm text-text-secondary">Add funds to your wallet securely</p>
        </div>
      </div>

      <form onSubmit={handleDeposit} className="space-y-6">
        {isKycRequired && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center justify-between gap-3 mb-2 animate-fade-slide-up">
            <div className="text-xs">
              <span className="font-bold">Tier 2 KYC Required:</span> Complete identity verification to unlock your country fiat currency and make deposits.
            </div>
            <button
              type="button"
              onClick={() => router.push('/kyc')}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg shrink-0 whitespace-nowrap"
            >
              Verify
            </button>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Amount
            </label>
            {existingFiat && (
              <span className="text-xs text-text-tertiary">
                Available: <span className="text-cyan font-bold font-mono">{currency === 'NGN' ? '₦' : ''}{amount ? '' : '0.00'} {currency}</span>
              </span>
            )}
          </div>
          <div className="relative group mb-3">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none opacity-80 group-focus-within:opacity-100 transition-opacity">
              {getAssetIcon(currency)}
            </div>
            <input
              type="number"
              min={currency === 'NGN' ? "100" : "1"}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full pl-16 pr-24 py-4 bg-deep-navy/40 border border-border rounded-xl text-text-primary text-2xl font-black focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-all font-mono"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
               <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={!!existingFiat || !!user?.currency || isLoadingSettings || fiatOptions.length <= 1}
                  className="bg-transparent text-cyan font-bold focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
               >
                  {fiatOptions.map(f => (
                    <option key={f} value={f} className="bg-midnight">{f}</option>
                  ))}
               </select>
            </div>
          </div>

          {/* Quick Amount Selectors */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {(currency === 'NGN' ? [1000, 5000, 10000, 20000] : [10, 50, 100, 250]).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(String(val))}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                  amount === String(val)
                    ? 'bg-cyan/20 border-cyan text-cyan'
                    : 'bg-white/5 border-border/60 text-text-secondary hover:border-cyan/50 hover:text-text-primary'
                }`}
              >
                {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₦'}{val.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Converted NGN preview when depositing in user currency */}
          {currency !== 'NGN' && parseFloat(amount || '0') > 0 && (
            <div className="p-3 bg-cyan/10 border border-cyan/20 rounded-xl mb-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Converted for deposit (NGN):</span>
                <span className="font-bold text-cyan font-mono">
                  ₦{(parseFloat(amount) * (currency === 'EUR' ? 1750 : currency === 'GBP' ? 2050 : 1600)).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN
                </span>
              </div>
              <div className="text-[11px] text-text-tertiary text-right">
                Mock Rate: 1 {currency} ≈ ₦{(currency === 'EUR' ? 1750 : currency === 'GBP' ? 2050 : 1600).toLocaleString('en-NG')} NGN
              </div>
            </div>
          )}

          {limitWarning && (
            <div className="mt-3 p-3 bg-orange/10 border border-orange/20 rounded-xl flex gap-3 animate-pulse">
              <Info className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
              <div className="text-xs text-orange font-medium leading-relaxed">
                {limitWarning}
              </div>
            </div>
          )}
        </div>

        {existingFiat && (
          <div className="p-4 bg-cyan/5 border border-cyan/20 rounded-xl text-xs text-text-secondary flex items-start gap-3">
            <Info className="text-cyan mt-0.5" size={16} />
            <p>Your account is configured for <strong>{existingFiat}</strong>. You can only own one fiat currency at a time as per your account settings.</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isKycRequired || !amount || parseFloat(amount) <= 0 || !!limitWarning}
          className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isKycRequired ? (
            <>
              Complete Tier 2 KYC to Deposit <ArrowRight size={20} />
            </>
          ) : (
            <>
              Continue to Payment <ArrowRight size={20} />
            </>
          )}
        </button>

        <div className="p-4 bg-white/5 border border-border rounded-xl flex items-start gap-3">
          <ShieldCheck className="text-cyan mt-1 flex-shrink-0" size={18} />
          <p className="text-xs text-text-secondary leading-relaxed">
            Payment opens securely in a new window via Paystack. Your deposit will be credited instantly once completed, with a 30-minute validity window.
          </p>
        </div>
      </form>
    </div>
  );
}
