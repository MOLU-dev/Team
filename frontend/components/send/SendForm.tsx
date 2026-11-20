'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import AssetSelector from './AssetSelector';
import NetworkSelector from './NetworkSelector';
import AmountInput from './AmountInput';
import TransactionSummary from './TransactionSummary';
import AssetSelectionDrawer from './AssetSelectionDrawer';
import RecipientSection from './RecipientSection';
import InstantSendToggle from './InstantSendToggle';
import MemoInput from './MemoInput';
import AuthorizeSendModal from './AuthorizeSendModal';
import SendSuccessCard from './SendSuccessCard';
import RecipientsModal from './RecipientsModal';
import { validateCryptoAddress } from './addressValidation';
import { api } from '@/lib/api';
import { formatCryptoAmount } from '@/lib/utils';
import {
  NATIVE_ASSETS, TOKEN_ASSETS, ASSETS, CHAIN_LIST,
  getChainsForAsset, getNativeSymbol, getNativeDecimals, getAssetDecimals, normalizeSymbol
} from '@/lib/chains';
import { useWebSocket } from '@/lib/websocket';

// Re-export address validation for backwards compatibility
export { validateCryptoAddress };

const assetOptions = [...NATIVE_ASSETS, ...TOKEN_ASSETS].map(a => ({
  value: a.symbol.toLowerCase(),
  label: `${a.name} (${a.symbol})`,
  decimals: a.decimals,
}));

export default function SendForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState(false);
  const [isRecipientsModalOpen, setIsRecipientsModalOpen] = useState(false);
  const [savedRecipientLabel, setSavedRecipientLabel] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [balances, setBalances] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [memo, setMemo] = useState('');
  const [destinationTag, setDestinationTag] = useState('');
  const latestRequestIdRef = useRef(0);
  const [previewData, setPreviewData] = useState<{
    id: string;
    amount?: string;
    fee: string;
    total: string;
    currency: string;
    previewType?: string;
    memo?: string;
    destinationTag?: number | string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLimits, setUserLimits] = useState<{ tier: number; global_usd: number; crypto_limits: Record<string, number> } | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [instantSend, setInstantSend] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [transferMethod, setTransferMethod] = useState<'internal' | 'blockchain'>('internal');
  const [isInternalRecipient, setIsInternalRecipient] = useState(false);
  const [isCheckingAddress, setIsCheckingAddress] = useState(false);
  const [serverIsSelf, setServerIsSelf] = useState(false);

  // Fetch addresses, balances, limits, and PIN status
  const fetchData = useCallback(async () => {
    try {
      const chainFetches = CHAIN_LIST.map(c => 
        api.getAddress(c.id, c.nativeSymbol)
          .then(r => ({ success: r.success, address: r.address, chain: c.id }))
          .catch(() => ({ chain: c.id, success: false, address: '' }))
      );
      const [balRes, ...chainResults] = await Promise.all([api.getAllBalances(), ...chainFetches]);

      const addrMap: Record<string, string> = {};
      chainResults.forEach(r => {
        if (r.success && r.address) addrMap[r.chain] = r.address;
      });
      setAddresses(addrMap);

      if (balRes.success && balRes.balances) {
        const balMap: Record<string, any> = {};
        balRes.balances.forEach(b => {
          const bCurrency = normalizeSymbol(b.currency).toLowerCase();
          const key = `${bCurrency}_${b.chain}`;
          balMap[key] = b;

          if (b.tokens) {
            b.tokens.forEach(t => {
              const tCurrency = normalizeSymbol(t.currency).toLowerCase();
              const tKey = `${tCurrency}_${b.chain}`;
              balMap[tKey] = {
                ...t,
                chain: b.chain
              };
            });
          }
        });
        setBalances(balMap);
      }

      // Fetch User Limits
      const limitRes = await api.getUserLimits();
      if (limitRes.success) {
        setUserLimits({
          tier: limitRes.tier,
          global_usd: limitRes.global_usd,
          crypto_limits: limitRes.crypto_limits
        });
      }

      // Fetch PIN Status
      api.getPinStatus().then((res: any) => {
        if (res && res.success) {
          setHasPin(Boolean(res.has_pin));
        }
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime updates via WebSocket
  useWebSocket(useCallback((notification: any) => {
    if (['balance_update', 'deposit', 'withdrawal'].includes(notification.type)) {
      console.log('Balance update received in SendForm, refreshing...');
      fetchData();
    }
  }, [fetchData]));

  // Auto-select from URL params
  useEffect(() => {
    const assetParam = searchParams.get('asset');
    const drawerParam = searchParams.get('drawer');
    const instantSendParam = searchParams.get('instantsend');

    if (assetParam) {
      const val = normalizeSymbol(assetParam).toLowerCase();
      if (assetOptions.some(a => a.value === val)) {
        setSelectedAsset(val);
        const info = ASSETS[val.toUpperCase()];
        if (info && info.chains.length === 1) {
          setSelectedNetwork(info.chains[0]);
        }
        if (val === 'dash' && instantSendParam === 'true') {
          setInstantSend(true);
        }
      }
    } else if (drawerParam === 'true' && !selectedAsset) {
      setIsAssetDrawerOpen(true);
    }
  }, [searchParams]);

  // Auto-select network when asset changes
  useEffect(() => {
    const info = ASSETS[selectedAsset.toUpperCase()];
    if (info) {
      const validChains = getChainsForAsset(info.symbol);
      if (validChains.length === 1) {
        setSelectedNetwork(validChains[0].id);
      } else if (!validChains.some(c => c.id === selectedNetwork)) {
        setSelectedNetwork(validChains[0]?.id || 'ethereum');
      }
    }
  }, [selectedAsset]);

  const fromAddress = addresses[selectedNetwork] || '';
  const currentAssetInfo = ASSETS[selectedAsset.toUpperCase()];
  const currentChain = CHAIN_LIST.find(c => c.id === selectedNetwork);
  const showNetworkSelector = currentAssetInfo && currentAssetInfo.chains.length > 1;

  const networkOptions = showNetworkSelector
    ? getChainsForAsset(currentAssetInfo.symbol).map(c => ({
        id: c.id,
        name: c.name,
        badge: c.badge,
        icon: <div className="w-6 h-6">{c.icon}</div>,
      }))
    : [];

  // Tier Limit Validation
  useEffect(() => {
    if (!userLimits || !selectedAsset || !amount || parseFloat(amount) <= 0) {
      setLimitWarning(null);
      return;
    }

    const currentAsset = selectedAsset.toUpperCase();
    const enteredAmount = parseFloat(amount);
    
    // 1. Check Crypto-Specific Limit
    const cryptoLimit = userLimits.crypto_limits[currentAsset];
    if (cryptoLimit !== undefined && enteredAmount > cryptoLimit) {
      setLimitWarning(`Limit Exceeded: Your current tier (${userLimits.tier}) allows maximum ${cryptoLimit} ${currentAsset} per transaction.`);
      return;
    }

    // 2. Check Global USD Limit
    const checkGlobalLimit = async () => {
      try {
        const priceRes = await api.getPrices();
        const priceData = priceRes.prices?.find((p: any) => p.symbol === currentAsset);
        if (priceData && priceData.price) {
          const amountUSD = enteredAmount * priceData.price;
          if (amountUSD > userLimits.global_usd) {
            setLimitWarning(`Limit Exceeded: Your current tier (${userLimits.tier}) has a daily withdrawal limit of $${userLimits.global_usd.toLocaleString()}. This transaction is ~$${amountUSD.toLocaleString()}.`);
          } else {
            setLimitWarning(null);
          }
        }
      } catch (err) {
        console.error('Failed to check global limit:', err);
      }
    };

    checkGlobalLimit();
  }, [amount, selectedAsset, userLimits]);

  // Address validation and self-address check
  const isLocalSelfAddress = (addr: string): boolean => {
    if (!addr) return false;
    const clean = addr.trim().toLowerCase();
    if (fromAddress && fromAddress.trim().toLowerCase() === clean) return true;
    for (const ch in addresses) {
      if (addresses[ch] && addresses[ch].trim().toLowerCase() === clean) {
        return true;
      }
    }
    return false;
  };

  const addressBelongsToUser = isLocalSelfAddress(recipientAddress) || serverIsSelf;
  const addressValidation = recipientAddress.trim() ? validateCryptoAddress(recipientAddress, selectedNetwork) : null;
  const isAddressInvalid = Boolean(recipientAddress.trim() && addressValidation && !addressValidation.valid);

  // Check address with backend to identify internal recipients and own addresses
  useEffect(() => {
    const trimmed = recipientAddress.trim();
    if (!trimmed || isAddressInvalid || isLocalSelfAddress(trimmed)) {
      setIsInternalRecipient(false);
      setServerIsSelf(false);
      setIsCheckingAddress(false);
      return;
    }

    let active = true;
    setIsCheckingAddress(true);

    const checkTimer = setTimeout(async () => {
      try {
        const res = await api.checkAddress(trimmed, selectedNetwork);
        if (!active) return;
        if (res.is_self) {
          setServerIsSelf(true);
          setIsInternalRecipient(false);
        } else if (res.is_internal) {
          setServerIsSelf(false);
          setIsInternalRecipient(true);
        } else {
          setServerIsSelf(false);
          setIsInternalRecipient(false);
          setTransferMethod('blockchain');
        }
      } catch (err) {
        console.error('Failed to check address:', err);
        if (active) {
          setIsInternalRecipient(false);
          setServerIsSelf(false);
        }
      } finally {
        if (active) setIsCheckingAddress(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(checkTimer);
    };
  }, [recipientAddress, selectedNetwork, isAddressInvalid, addresses, fromAddress]);

  // Check if current recipient address matches a saved contact
  useEffect(() => {
    const trimmed = recipientAddress.trim();
    if (!trimmed) {
      setSavedRecipientLabel(null);
      return;
    }
    const net = isInternalRecipient || transferMethod === 'internal' ? 'internal' : selectedNetwork;
    api.checkSavedAddress(trimmed, net)
      .then(res => {
        if (res && res.is_saved && res.saved_address) {
          setSavedRecipientLabel(res.saved_address.label);
        } else {
          setSavedRecipientLabel(null);
        }
      })
      .catch(() => {
        setSavedRecipientLabel(null);
      });
  }, [recipientAddress, selectedNetwork, isInternalRecipient, transferMethod]);

  const handleSelectRecipient = (recipient: {
    address: string;
    network: string;
    asset?: string;
    isInternal: boolean;
    label?: string;
  }) => {
    setRecipientAddress(recipient.address);
    setSavedRecipientLabel(recipient.label || null);
    if (recipient.isInternal || recipient.network === 'internal') {
      setIsInternalRecipient(true);
      setTransferMethod('internal');
    } else if (recipient.network) {
      setSelectedNetwork(recipient.network);
      setTransferMethod('blockchain');
    }
    if (recipient.asset) {
      setSelectedAsset(recipient.asset.toLowerCase());
    }
  };

  // Debounced Preview Fetching
  useEffect(() => {
    const reqId = ++latestRequestIdRef.current;
    let active = true;

    if (!selectedAsset || !recipientAddress || !amount || !fromAddress || isConfirmModalOpen || txHash) {
      if (!isConfirmModalOpen && !txHash) setPreviewData(null);
      return;
    }

    if (addressBelongsToUser || (addressValidation && !addressValidation.valid)) {
      setPreviewData(null);
      return;
    }

    // Clear stale preview data whenever inputs change to prevent showing mismatched totals while calculating
    setPreviewData(null);

    const timer = setTimeout(async () => {
      setIsLoadingPreview(true);
      setError(null);
      try {
        const assetInfo = assetOptions.find(a => a.value === selectedAsset);
        if (!assetInfo || !active || reqId !== latestRequestIdRef.current) return;

        // BigInt-safe scaling
        const decimals = getAssetDecimals(selectedAsset, selectedNetwork);
        const [intPart, fracPart = ''] = amount.split('.');
        const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
        const scaledAmount = BigInt(intPart) * (BigInt(10) ** BigInt(decimals)) + BigInt(paddedFrac || '0');
        
        const effectiveMethod = isInternalRecipient ? transferMethod : undefined;
        const dtVal = (selectedNetwork === 'ripple' || selectedAsset.toLowerCase() === 'xrp') && destinationTag.trim()
          ? parseInt(destinationTag.trim(), 10)
          : undefined;
        const response = await api.sendPreview(
          fromAddress,
          recipientAddress,
          scaledAmount.toString(),
          selectedAsset.toUpperCase(),
          selectedNetwork,
          instantSend,
          memo.trim() ? memo.trim() : undefined,
          effectiveMethod,
          dtVal
        );

        if (!active || reqId !== latestRequestIdRef.current) {
          return; // Discard stale/superseded response
        }

        // Validate that response amount matches current input amount
        if (response.amount) {
          const retAmt = parseFloat(response.amount);
          const curAmt = parseFloat(amount);
          if (!isNaN(retAmt) && !isNaN(curAmt) && Math.abs(retAmt - curAmt) > 0.000000001) {
            return; // Superseded amount
          }
        }

        if (response.preview_id) {
          const nativeFeeSymbol = getNativeSymbol(selectedNetwork);
          const nativeDecimals = getNativeDecimals(selectedNetwork);
          const totalDisplayDecimals = Math.min(decimals, 8);

          const feeCurrency = response.fee_currency || nativeFeeSymbol;
          const feePayerAsset = response.fee_payer_asset || 'native';
          const isInternalTransfer = (response as any).preview_type === 'internal';

          let feeDisplay = '';
          if (isInternalTransfer) {
            feeDisplay = `0.00 ${feeCurrency} (Free)`;
          } else if (feePayerAsset === 'token') {
            // Deducted directly from token balance (Approach A)
            let tokenFeeFormatted = formatCryptoAmount(response.estimated_gas as any, Math.min(decimals, 8), 4);
            if (parseFloat(tokenFeeFormatted) === 0 && response.estimated_gas && parseFloat(response.estimated_gas) > 0) {
              tokenFeeFormatted = formatCryptoAmount(response.estimated_gas as any, Math.min(decimals, 8), 8);
            }
            const nativeEq = response.fee_native_equivalent;
            const nativeEqFormatted = nativeEq && parseFloat(nativeEq) > 0
              ? formatCryptoAmount(nativeEq, Math.min(nativeDecimals, 8), 4)
              : '';
            feeDisplay = nativeEqFormatted
              ? `${tokenFeeFormatted} ${feeCurrency} (~${nativeEqFormatted} ${nativeFeeSymbol})`
              : `${tokenFeeFormatted} ${feeCurrency}`;
          } else {
            // Paid in native cryptocurrency
            const feeDecimals = Math.min(nativeDecimals, 8);
            let feeFormatted = formatCryptoAmount(response.estimated_gas as any, feeDecimals, 4);
            if (parseFloat(feeFormatted) === 0 && response.estimated_gas && parseFloat(response.estimated_gas) > 0) {
              feeFormatted = formatCryptoAmount(response.estimated_gas as any, feeDecimals, 8);
            }
            const tokenEq = response.fee_token_equivalent;
            const tokenEqFormatted = tokenEq && parseFloat(tokenEq) > 0 && selectedAsset.toUpperCase() !== nativeFeeSymbol
              ? formatCryptoAmount(tokenEq, Math.min(decimals, 8), 4)
              : '';
            feeDisplay = tokenEqFormatted
              ? `${feeFormatted} ${feeCurrency} (~${tokenEqFormatted} ${selectedAsset.toUpperCase()})`
              : `${feeFormatted} ${feeCurrency}`;
          }

          const isMainCoin = selectedAsset.toUpperCase() === nativeFeeSymbol;
          const totalFormatted = formatCryptoAmount(response.total as any, totalDisplayDecimals, 4);

          let totalDisplay = '';
          if (isInternalTransfer) {
            totalDisplay = `${totalFormatted} ${selectedAsset.toUpperCase()}`;
          } else if (isMainCoin) {
            // Main native coin (e.g. ETH, SOL, BTC, BNB, TRX, XRP): response.total is amount + fee
            totalDisplay = `${totalFormatted} ${selectedAsset.toUpperCase()}`;
          } else if (feePayerAsset === 'token') {
            // Token transfer where fee is deducted directly from token
            totalDisplay = `${totalFormatted} ${selectedAsset.toUpperCase()}`;
          } else {
            // Token transfer paying fee in native coin (e.g. USDC on Solana with SOL gas):
            // Show both token transfer amount and native gas fee
            const feeDecimals = Math.min(nativeDecimals, 8);
            let feeFormatted = formatCryptoAmount(response.estimated_gas as any, feeDecimals, 4);
            if (parseFloat(feeFormatted) === 0 && response.estimated_gas && parseFloat(response.estimated_gas) > 0) {
              feeFormatted = formatCryptoAmount(response.estimated_gas as any, feeDecimals, 8);
            }
            const tokenEq = response.fee_token_equivalent;
            const tokenEqVal = tokenEq ? parseFloat(tokenEq) : 0;
            const tokenTotalVal = (parseFloat((response as any).amount || amount || '0') + tokenEqVal);
            const tokenTotalFormatted = tokenTotalVal > 0
              ? formatCryptoAmount(tokenTotalVal.toString(), totalDisplayDecimals, 4)
              : '';

            if (tokenTotalFormatted && tokenEqVal > 0) {
              totalDisplay = `${totalFormatted} ${selectedAsset.toUpperCase()} + ${feeFormatted} ${feeCurrency} (~${tokenTotalFormatted} ${selectedAsset.toUpperCase()})`;
            } else {
              totalDisplay = `${totalFormatted} ${selectedAsset.toUpperCase()} + ${feeFormatted} ${feeCurrency}`;
            }
          }

          if (response.masked_email) setMaskedEmail(response.masked_email);

          setPreviewData({
            id: response.preview_id,
            amount: amount.trim(),
            fee: feeDisplay,
            total: totalDisplay,
            currency: selectedAsset.toUpperCase(),
            previewType: (response as any).preview_type || 'external',
            memo: response.memo || (memo.trim() ? memo.trim() : undefined),
            destinationTag: (response as any).destination_tag ?? (destinationTag.trim() ? destinationTag.trim() : undefined),
          });
        }
      } catch (err: any) {
        if (!active || reqId !== latestRequestIdRef.current) return;
        console.error('Preview failed:', err);
        setError(err.message || 'Failed to calculate transaction preview');
        setPreviewData(null);
      } finally {
        if (active && reqId === latestRequestIdRef.current) {
          setIsLoadingPreview(false);
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedAsset, recipientAddress, amount, fromAddress, selectedNetwork, isConfirmModalOpen, txHash, instantSend, memo, destinationTag, addressBelongsToUser, addressValidation?.valid, transferMethod, isInternalRecipient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewData || previewData.amount !== amount.trim()) return;
    setIsConfirmModalOpen(true);
  };

  const currentBalanceObj = balances[`${selectedAsset}_${selectedNetwork}`];
  const currentBalance = currentBalanceObj ? currentBalanceObj.available_balance : '0.00';
  if (isConfirmed && txHash) {
    const isInternal = previewData?.previewType
      ? previewData.previewType === 'internal'
      : (transferMethod === 'internal');
    return (
      <SendSuccessCard
        amount={amount}
        asset={selectedAsset.toUpperCase()}
        recipientAddress={recipientAddress}
        selectedNetwork={selectedNetwork}
        chainName={isInternal ? 'Internal Transfer' : currentChain?.name}
        isInternal={isInternal}
        onViewHistory={() => router.push('/history')}
        onBackToWallet={() => router.push('/wallet')}
      />
    );
  }

  return (
    <>
      <form 
        onSubmit={handleSubmit}
        className="main-card animate-fade-slide-up"
        style={{ animationDelay: '0.3s' }}
      >
        {/* Asset Selection */}
        <div className="mb-8 pb-6 border-b border-border">
          <div className="text-sm shadow-text uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" /> Select Asset
          </div>
          <AssetSelector
            assets={assetOptions}
            selectedAsset={selectedAsset}
            onSelect={(asset) => setSelectedAsset(asset)}
            balance={currentBalance ? `${formatCryptoAmount(currentBalance, 8, 4)} ${selectedAsset.toUpperCase()}` : '0.00'}
            onClick={() => setIsAssetDrawerOpen(true)}
          />
        </div>

        <AssetSelectionDrawer 
          isOpen={isAssetDrawerOpen}
          onClose={() => setIsAssetDrawerOpen(false)}
          onSelect={(symbol, chainId) => {
            setSelectedAsset(symbol);
            if (chainId && chainId !== 'internal') {
              setSelectedNetwork(chainId);
            }
          }}
        />

        {/* Network Selection */}
        {showNetworkSelector && (
          <div className="mb-8 pb-6 border-b border-border">
            <div className="text-sm shadow-text uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> Select Network
            </div>
            <NetworkSelector
              networks={networkOptions}
              selectedNetwork={selectedNetwork}
              onSelect={setSelectedNetwork}
            />
          </div>
        )}

        {/* Recipient Section */}
        <RecipientSection
          recipientAddress={recipientAddress}
          onAddressChange={(val) => {
            setRecipientAddress(val);
            setSavedRecipientLabel(null);
          }}
          currentChain={currentChain}
          selectedNetwork={selectedNetwork}
          isCheckingAddress={isCheckingAddress}
          addressBelongsToUser={addressBelongsToUser}
          addressValidation={addressValidation}
          isInternalRecipient={isInternalRecipient}
          transferMethod={transferMethod}
          onTransferMethodChange={setTransferMethod}
          onOpenAddressBook={() => setIsRecipientsModalOpen(true)}
          savedRecipientLabel={savedRecipientLabel}
          onSaveCurrentAddress={() => setIsRecipientsModalOpen(true)}
        />

        {/* Amount */}
        <div className="mb-8 pb-6 border-b border-border">
          <div className="text-sm shadow-text uppercase tracking-widest text-text-secondary mb-4">
            Amount
          </div>
          <AmountInput
            amount={amount}
            onAmountChange={setAmount}
            maxAmount={currentBalance}
            label="Available Balance"
            usdValue={`${formatCryptoAmount(currentBalance, 8, 4)} ${selectedAsset.toUpperCase()}`}
          />
          {limitWarning && (
            <div className="mt-3 p-3 bg-orange/10 border border-orange/30 rounded-xl flex gap-3 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
              <div className="text-xs text-orange font-medium leading-relaxed">
                {limitWarning}
                <div className="mt-1 text-[10px] opacity-70 underline cursor-pointer" onClick={() => router.push('/settings?tab=verification')}>
                  Upgrade your Tier to increase limits
                </div>
              </div>
            </div>
          )}
        </div>

        {/* InstantSend Toggle (DASH ONLY) */}
        {selectedAsset === 'dash' && (
          <InstantSendToggle
            instantSend={instantSend}
            onToggle={setInstantSend}
          />
        )}

        {/* Memo / Note (Optional) */}
        <MemoInput
          memo={memo}
          onMemoChange={setMemo}
          selectedNetwork={selectedNetwork}
        />

        {/* Destination Tag for Ripple (XRP) */}
        {(selectedNetwork === 'ripple' || selectedAsset.toLowerCase() === 'xrp') && transferMethod !== 'internal' && (
          <div className="mb-6 p-4 bg-midnight-card/40 border border-border/80 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <span>Destination Tag (Optional)</span>
              </label>
              <span className="text-[10px] text-text-secondary">Numeric 0 - 4294967295</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={destinationTag}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setDestinationTag(val);
              }}
              placeholder="e.g. 1002345"
              className="w-full bg-midnight/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-cyan transition-colors"
            />
            <p className="text-[11px] text-text-secondary mt-1.5">
              Required by most centralized exchanges (Binance, Coinbase, etc.) to credit your XRP deposit.
            </p>
          </div>
        )}

        {/* Transaction Summary */}
        <div className="mb-8">
          <div className="text-sm shadow-text uppercase tracking-widest text-text-secondary mb-4 flex justify-between items-center">
            <span>Transaction Summary</span>
            {isLoadingPreview && <Loader2 className="w-4 h-4 animate-spin text-cyan" />}
          </div>
          
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm mb-4 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {(() => {
            const isPreviewMatching = Boolean(previewData && previewData.amount === amount.trim());
            return (
              <>
                <TransactionSummary
                  sendAmount={amount ? `${amount} ${selectedAsset.toUpperCase()}` : '--'}
                  networkFee={isPreviewMatching ? previewData!.fee : '--'}
                  total={isPreviewMatching ? previewData!.total : '--'}
                  memo={isPreviewMatching ? (previewData?.memo || (memo.trim() ? memo.trim() : undefined)) : (memo.trim() ? memo.trim() : undefined)}
                  destinationTag={isPreviewMatching ? (previewData?.destinationTag ?? (destinationTag.trim() ? destinationTag.trim() : undefined)) : (destinationTag.trim() ? destinationTag.trim() : undefined)}
                  isInstantSend={instantSend}
                  instantSendPremium={instantSend ? "Included" : undefined}
                  transferMethod={transferMethod}
                  isInternalRecipient={isInternalRecipient}
                />
              </>
            );
          })()}
        </div>

        {/* Submit Button */}
        {(() => {
          const isPreviewMatching = Boolean(previewData && previewData.amount === amount.trim());
          return (
            <button
              type="submit"
              disabled={!isPreviewMatching || isSubmitting || isLoadingPreview || addressBelongsToUser || isAddressInvalid}
              className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : !selectedAsset ? (
                'Select an Asset'
              ) : addressBelongsToUser ? (
                'Cannot Send to Own Address'
              ) : isAddressInvalid ? (
                'Invalid Recipient Address'
              ) : isLoadingPreview ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calculating Fee...
                </>
              ) : !isPreviewMatching ? (
                'Enter Amount & Address'
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Review & Continue
                </>
              )}
            </button>
          );
        })()}

        {/* Gas Fee Warning */}
        <div className="mt-8 p-4 bg-cyan/5 border border-cyan/20 rounded-xl flex gap-3">
          <Info className="w-5 h-5 text-cyan flex-shrink-0" />
          <div className="text-xs text-text-secondary leading-relaxed">
            <strong className="text-text-primary">Note:</strong> Real gas fees are subject to network congestion. This preview uses current market rates for estimating required fuel.
          </div>
        </div>
      </form>

      {/* Authorize Send Modal */}
      <AuthorizeSendModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        previewData={previewData}
        amount={amount}
        selectedAsset={selectedAsset}
        recipientAddress={recipientAddress}
        selectedNetwork={selectedNetwork}
        currentChain={currentChain}
        isInternalRecipient={isInternalRecipient}
        transferMethod={transferMethod}
        instantSend={instantSend}
        hasPin={hasPin}
        maskedEmail={maskedEmail}
        onPinConfigured={() => setHasPin(true)}
        onSuccess={(hash) => {
          setTxHash(hash);
          setIsConfirmed(true);
          setIsConfirmModalOpen(false);
        }}
      />

      {/* Dedicated Recipients / Address Book Modal */}
      <RecipientsModal
        isOpen={isRecipientsModalOpen}
        onClose={() => setIsRecipientsModalOpen(false)}
        onSelectRecipient={handleSelectRecipient}
        currentNetwork={selectedNetwork}
      />
    </>
  );
}
