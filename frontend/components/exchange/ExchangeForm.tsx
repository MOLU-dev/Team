'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, CheckCircle2, Info, ArrowDown, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCryptoAmount } from '@/lib/utils';
import { TradeResponse, TradeQuoteResponse } from '@/lib/api/types';
import AssetSelector from '../send/AssetSelector';
import AssetSelectionDrawer from '../send/AssetSelectionDrawer';
import AmountInput from '../send/AmountInput';
import { ASSET_LIST } from '@/lib/chains';

const assetOptions = ASSET_LIST.map(a => ({
  value: a.symbol.toLowerCase(),
  label: `${a.name} (${a.symbol})`,
  decimals: a.decimals,
  chain: a.type === 'fiat' ? 'fiat' : (a.chains[0] || 'ethereum'),
}));

export default function ExchangeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFrom = searchParams.get('from')?.toLowerCase();
  
  const [fromAsset, setFromAsset] = useState(initialFrom || 'eth');
  const [toAsset, setToAsset] = useState(initialFrom === 'usdt' ? 'eth' : 'usdt');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [balances, setBalances] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tradeResult, setTradeResult] = useState<TradeResponse | null>(null);
  const [isFromDrawerOpen, setIsFromDrawerOpen] = useState(false);
  const [isToDrawerOpen, setIsToDrawerOpen] = useState(false);
  const [assetPrices, setAssetPrices] = useState<Record<string, number>>({});

  // PIN state for swap authorization
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isEnterPinModalOpen, setIsEnterPinModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [modalNewPin, setModalNewPin] = useState('');
  const [modalConfirmPin, setModalConfirmPin] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const balRes = await api.getAllBalances();
        if (balRes.success && balRes.balances) {
          const balMap: Record<string, any> = {};
          const priceMap: Record<string, number> = {};
          balRes.balances.forEach(b => {
             const sym = b.currency.toLowerCase();
             const key = `${sym}_${b.chain}`;
             balMap[key] = b;

             if (b.chain === 'internal' || b.chain === 'fiat') {
               balMap[`${sym}_fiat`] = b;
               balMap[`${sym}_internal`] = b;
               balMap[sym] = b;
             }
             balMap[sym] = balMap[sym] || b;
             if (b.price) priceMap[sym] = parseFloat(b.price);

             if (b.tokens && Array.isArray(b.tokens)) {
               b.tokens.forEach((t: any) => {
                 const tSym = t.currency.toLowerCase();
                 const tKey = `${tSym}_${b.chain}`;
                 balMap[tKey] = { ...t, chain: b.chain };
                 balMap[tSym] = balMap[tSym] || balMap[tKey];
                 if (t.price) priceMap[tSym] = parseFloat(t.price);
               });
             }
          });
          setBalances(balMap);
          setAssetPrices(priceMap);
        }

        // Check user's transaction PIN status
        api.getPinStatus().then((res: any) => {
          if (res && res.success) {
            setHasPin(Boolean(res.has_pin));
          }
        }).catch(() => {});
      } catch (err) {
        console.error('Failed to fetch balances:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSwapAssets = () => {
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
    setAmount('');
    setActiveQuote(null);
  };

  const handleAmountChange = (val: string) => {
    // Strictly numeric validation: disallow letters or non-numeric characters
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val);
      setError(null);
    }
  };

  const [activeQuote, setActiveQuote] = useState<TradeQuoteResponse | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const selectedFromAsset = assetOptions.find(a => a.value === fromAsset);
  const selectedToAsset = assetOptions.find(a => a.value === toAsset);
  
  const fromBalanceKey = selectedFromAsset ? `${selectedFromAsset.value}_${selectedFromAsset.chain}` : '';
  const currentBalance = balances[fromBalanceKey]?.available_balance 
    || balances[`${selectedFromAsset?.value}_internal`]?.available_balance
    || balances[`${selectedFromAsset?.value}_fiat`]?.available_balance
    || balances[selectedFromAsset?.value || '']?.available_balance
    || '0.00';

  // Realtime quote preview when assets or amount change
  useEffect(() => {
    let isCancelled = false;
    const fetchQuotePreview = async () => {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0 || !selectedFromAsset || !selectedToAsset) {
        setActiveQuote(null);
        setQuoteError(null);
        return;
      }
      setIsQuoting(true);
      setQuoteError(null);
      try {
        const res: any = await api.tradeQuote({
          from_asset: selectedFromAsset.value.toUpperCase(),
          to_asset: selectedToAsset.value.toUpperCase(),
          amount: amount,
          trade_type: 'USER',
        });
        if (isCancelled) return;
        const q = res?.data || res;
        if (q?.rate || q?.quote_id) {
          setActiveQuote(q);
        } else {
          setQuoteError(res?.error?.message || res?.error || res?.message || 'Unable to get quote');
        }
      } catch (err: any) {
        if (!isCancelled) {
          setQuoteError(err.message || 'Failed to fetch quote');
        }
      } finally {
        if (!isCancelled) setIsQuoting(false);
      }
    };

    const timer = setTimeout(fetchQuotePreview, 350);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [fromAsset, toAsset, amount, selectedFromAsset, selectedToAsset]);

  const handleOpenPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate amount
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setError('Please enter a valid numeric amount to swap');
      return;
    }

    // Validate balance before preview
    const available = parseFloat(currentBalance) || 0;
    if (num > available) {
      setError("You don't have enough balance to complete this swap.");
      return;
    }

    if (!selectedFromAsset || !selectedToAsset) {
      setError('Please select both assets');
      return;
    }

    if (!activeQuote || !activeQuote.quote_id) {
      setIsSubmitting(true);
      try {
        const res: any = await api.tradeQuote({
          from_asset: selectedFromAsset.value.toUpperCase(),
          to_asset: selectedToAsset.value.toUpperCase(),
          amount: amount,
          trade_type: 'USER',
        });
        const q = res?.data || res;
        if (q?.quote_id) {
          setActiveQuote(q);
          setIsPreviewModalOpen(true);
        } else {
          setError(res?.error?.message || res?.error || res?.message || 'Unable to generate swap quote');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch swap quote');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsPreviewModalOpen(true);
    }
  };

  const handleInitiateSwapFromPreview = () => {
    setIsPreviewModalOpen(false);
    if (hasPin === false) {
      setModalError(null);
      setModalNewPin('');
      setModalConfirmPin('');
      setIsPinModalOpen(true);
    } else {
      setPin('');
      setModalError(null);
      setIsEnterPinModalOpen(true);
    }
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length !== 6) {
      setModalError('Please enter your 6-digit transaction PIN');
      return;
    }
    if (!activeQuote?.quote_id) {
      setModalError('Swap quote expired. Please refresh the quote.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      const executeResponse: any = await api.executeTrade({
        quote_id: activeQuote.quote_id,
        pin: pin,
      });

      const resData = executeResponse.data || executeResponse;
      if (executeResponse.success && resData) {
        setIsEnterPinModalOpen(false);
        setSuccess(true);
        setTradeResult(resData);
      } else {
        const errMsg = executeResponse.error?.message || executeResponse.error || executeResponse.message || 'Trade execution failed';
        setModalError(errMsg);
      }
    } catch (err: any) {
      setModalError(err.message || 'An unexpected error occurred during trade execution');
    } finally {
      setModalLoading(false);
    }
  };

  const handleQuickSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (modalNewPin.length !== 6 || !/^\d{6}$/.test(modalNewPin)) {
      setModalError('PIN must be exactly 6 numeric digits');
      return;
    }
    if (modalNewPin !== modalConfirmPin) {
      setModalError('PINs do not match');
      return;
    }
    setModalLoading(true);
    try {
      const res: any = await api.setupPin(modalNewPin);
      if (res?.success) {
        setHasPin(true);
        setIsPinModalOpen(false);
        setModalNewPin('');
        setModalConfirmPin('');
        // Immediately open enter PIN modal with the new PIN prefilled or ready
        setPin(modalNewPin);
        setIsEnterPinModalOpen(true);
      } else {
        setModalError(res?.error?.message || res?.error || res?.message || 'Failed to set PIN');
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to set PIN');
    } finally {
      setModalLoading(false);
    }
  };

  if (success && tradeResult) {
    return (
      <div className="main-card animate-fade-in text-center py-12">
        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Trade Successful!</h2>
        <p className="text-text-secondary mb-8">
          You have successfully swapped {amount} {fromAsset.toUpperCase()} for {formatCryptoAmount(tradeResult.to_amount, 8, 4)} {toAsset.toUpperCase()}
        </p>
        <div className="bg-deep-navy/40 border border-border rounded-2xl p-6 mb-8 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-text-secondary">Fee Paid</span>
            <span className="text-text-primary font-mono">{formatCryptoAmount(tradeResult.fee_amount, 8, 6)} {tradeResult.fee_asset}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Swap Rate</span>
            <span className="text-text-primary font-mono">1 {fromAsset.toUpperCase()} ≈ {formatCryptoAmount(tradeResult.rate, 8, 4)} {toAsset.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Trade ID</span>
            <span className="text-text-primary font-mono text-[10px] break-all">{tradeResult.trade_id}</span>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleOpenPreview} className="main-card animate-fade-slide-up">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-cyan mb-4" />
          <p className="text-text-secondary">Loading your balances...</p>
        </div>
      ) : (
        <>
          {/* From Asset */}
          <div className="mb-4">
            <div className="text-sm shadow-text uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
              <ArrowDown className="w-4 h-4" /> From (Send)
            </div>
            <AssetSelector
              assets={assetOptions}
              selectedAsset={fromAsset}
              onSelect={(val) => {
                setFromAsset(val);
                setActiveQuote(null);
              }}
              balance={`${formatCryptoAmount(currentBalance, 8, 4)} ${fromAsset.toUpperCase()}`}
              onClick={() => setIsFromDrawerOpen(true)}
            />
          </div>

          <AssetSelectionDrawer 
            isOpen={isFromDrawerOpen}
            onClose={() => setIsFromDrawerOpen(false)}
            onSelect={(val) => {
              setFromAsset(val);
              setActiveQuote(null);
            }}
          />

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleSwapAssets}
              className="p-3 bg-midnight border border-border rounded-full hover:border-cyan text-text-secondary hover:text-cyan transition-all shadow-xl"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* To Asset */}
          <div className="mb-8 mt-2">
            <div className="text-sm shadow-text uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
              <ArrowDown className="w-4 h-4 rotate-180" /> To (Receive)
            </div>
            <AssetSelector
              assets={assetOptions.filter(a => a.value !== fromAsset)}
              selectedAsset={toAsset}
              onSelect={(val) => {
                setToAsset(val);
                setActiveQuote(null);
              }}
              balance="--"
              onClick={() => setIsToDrawerOpen(true)}
            />
          </div>

          <AssetSelectionDrawer 
            isOpen={isToDrawerOpen}
            onClose={() => setIsToDrawerOpen(false)}
            onSelect={(val) => {
              setToAsset(val);
              setActiveQuote(null);
            }}
          />

          {/* Rates Info Preview */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-text-secondary">Current Swap Rate</span>
              <span className="font-mono text-xs font-bold text-cyan flex items-center gap-1.5">
                {isQuoting && <Loader2 className="w-3 h-3 animate-spin text-cyan" />}
                1 {fromAsset.toUpperCase()} ≈ {
                  activeQuote?.rate 
                    ? formatCryptoAmount(activeQuote.rate, 8, 6) 
                    : (assetPrices[fromAsset] && assetPrices[toAsset]
                        ? formatCryptoAmount(assetPrices[fromAsset] / assetPrices[toAsset] * 0.99, 8, 6)
                        : '--')
                } {toAsset.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-success/5 border border-success/15 rounded-2xl p-3.5 text-center transition-all">
                <p className="text-[10px] uppercase tracking-wider text-success font-bold mb-0.5">
                  Market Price ({fromAsset.toUpperCase()})
                </p>
                <p className="text-base sm:text-lg font-mono font-bold text-text-primary">
                  ${activeQuote?.buy_at 
                    ? parseFloat(activeQuote.buy_at).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                    : (assetPrices[fromAsset] ? assetPrices[fromAsset].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '--')}
                </p>
                <p className="text-[9px] text-text-secondary mt-0.5">Mid-market valuation</p>
              </div>

              <div className="bg-danger/5 border border-danger/15 rounded-2xl p-3.5 text-center transition-all">
                <p className="text-[10px] uppercase tracking-wider text-danger font-bold mb-0.5">
                  Platform Quoted ({toAsset.toUpperCase()})
                </p>
                <p className="text-base sm:text-lg font-mono font-bold text-text-primary">
                  ${activeQuote?.sell_at 
                    ? parseFloat(activeQuote.sell_at).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                    : (assetPrices[toAsset] ? (assetPrices[toAsset] * 1.005).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : (assetPrices[fromAsset] ? (assetPrices[fromAsset] * 1.005).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '--'))}
                </p>
                <p className="text-[9px] text-text-secondary mt-0.5">Market + 0.5% spread</p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-8 pb-6 border-b border-border">
            <div className="text-sm shadow-text uppercase tracking-widest text-text-secondary mb-4">
              Amount to Swap
            </div>
            <AmountInput
              amount={amount}
              onAmountChange={handleAmountChange}
              maxAmount={currentBalance}
              label="Available"
              usdValue={`${formatCryptoAmount(currentBalance, 8, 4)} ${fromAsset.toUpperCase()}`}
            />

            {/* Live Swap Calculation Preview & Fee Rule */}
            {quoteError && (
              <div className="mt-3 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{quoteError}</span>
              </div>
            )}

            {activeQuote && (
              <div className="mt-4 p-4 bg-deep-navy/40 border border-cyan/30 rounded-2xl space-y-3 animate-fade-slide-up">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">Estimated Fee</span>
                  <span className="font-mono font-bold text-text-primary">
                    {formatCryptoAmount(activeQuote.fee_amount, 8, 6)} {activeQuote.fee_asset || fromAsset.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-xs font-bold text-text-secondary">You Receive (Net)</span>
                  <span className="font-mono text-base font-bold text-success">
                    ≈ {formatCryptoAmount(activeQuote.to_amount, 8, 6)} {toAsset.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm mb-6 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || isSubmitting || isQuoting}
            className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting || isQuoting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Preview Swap
              </>
            )}
          </button>

          <div className="mt-6 p-4 bg-cyan/5 border border-cyan/20 rounded-xl flex gap-3">
            <Info className="w-5 h-5 text-cyan flex-shrink-0" />
            <div className="text-xs text-text-secondary leading-relaxed">
              Trades are processed instantly within the Molu ecosystem with low spreads and guaranteed execution rates.
            </div>
          </div>
        </>
      )}

      {/* Swap Preview Modal */}
      {isPreviewModalOpen && activeQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-deep-navy border border-cyan/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,255,255,0.2)] animate-scale-up space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border/60">
              <h3 className="text-xl font-bold text-text-primary">Preview Swap</h3>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* What was swapped to what */}
              <div className="p-4 bg-midnight/60 border border-border rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">You Send</span>
                  <span className="font-mono font-bold text-text-primary text-base">
                    {amount} {fromAsset.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-center my-1 text-cyan">
                  <ArrowDown className="w-5 h-5" />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">You Get</span>
                  <span className="font-mono font-bold text-success text-xl">
                    {formatCryptoAmount(activeQuote.to_amount, 8, 6)} {toAsset.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Fee and Rate Breakdown */}
              <div className="p-4 bg-midnight/40 border border-border/60 rounded-2xl space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Swap Rate</span>
                  <span className="font-mono text-text-primary font-medium">
                    1 {fromAsset.toUpperCase()} ≈ {formatCryptoAmount(activeQuote.rate, 8, 6)} {toAsset.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Swap Fee</span>
                  <span className="font-mono text-text-primary font-medium">
                    {formatCryptoAmount(activeQuote.fee_amount, 8, 6)} {activeQuote.fee_asset || fromAsset.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Settlement</span>
                  <span className="text-cyan font-semibold">Instant Execution</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="flex-1 py-3.5 bg-midnight hover:bg-white/5 border border-border rounded-xl text-text-secondary hover:text-white font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInitiateSwapFromPreview}
                className="flex-1 py-3.5 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Swap Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enter PIN Modal (Pops up only after Preview Swap -> Swap Now) */}
      {isEnterPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-deep-navy border border-cyan/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,255,255,0.2)] animate-scale-up space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-primary">Authorize Swap</h3>
              <button
                type="button"
                onClick={() => setIsEnterPinModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Enter your 6-digit transaction PIN to confirm swapping {amount} {fromAsset.toUpperCase()} for {formatCryptoAmount(activeQuote?.to_amount, 8, 4)} {toAsset.toUpperCase()}.
            </p>

            <form onSubmit={handleExecuteSwap} className="space-y-4">
              <div className="space-y-2">
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setPin(cleaned);
                    setModalError(null);
                  }}
                  placeholder="••••••"
                  className="w-full px-4 py-4 bg-midnight/80 border border-cyan/30 rounded-xl text-text-primary text-center tracking-[0.8em] font-mono text-2xl focus:outline-none focus:border-cyan transition-all"
                />
              </div>

              {modalError && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs text-center flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEnterPinModalOpen(false)}
                  className="flex-1 py-3.5 bg-midnight hover:bg-white/5 border border-border rounded-xl text-text-secondary hover:text-white font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || pin.length !== 6}
                  className="flex-1 py-3.5 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Swap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Setup PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-gradient-to-br from-deep-navy to-midnight border border-cyan/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,255,255,0.2)] animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-cyan">Set Up Transaction PIN</h3>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              Create a 6-digit security PIN to authorize this swap and future transactions securely.
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">6-Digit PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={modalNewPin}
                  onChange={(e) => setModalNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-midnight/60 border border-cyan/20 rounded-xl outline-none focus:border-cyan text-text-primary text-center tracking-[0.5em] text-lg font-mono"
                  placeholder="••••••"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={modalConfirmPin}
                  onChange={(e) => setModalConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-midnight/60 border border-cyan/20 rounded-xl outline-none focus:border-cyan text-text-primary text-center tracking-[0.5em] text-lg font-mono"
                  placeholder="••••••"
                />
              </div>

              {modalNewPin && modalConfirmPin && modalNewPin !== modalConfirmPin && (
                <p className="text-xs text-red-500 italic">PINs do not match</p>
              )}

              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                  {modalError}
                </div>
              )}

              <button
                type="button"
                disabled={modalLoading || modalNewPin.length !== 6 || modalNewPin !== modalConfirmPin}
                onClick={handleQuickSetupPin}
                className="w-full py-3.5 mt-2 bg-cyan text-deep-navy font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all disabled:opacity-40 cursor-pointer"
              >
                {modalLoading ? 'Setting PIN...' : 'Save & Continue Swap'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
