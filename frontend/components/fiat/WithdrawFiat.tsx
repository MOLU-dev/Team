'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  ArrowRight,
  ShieldCheck,
  Banknote,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { api, Beneficiary, WithdrawalQuote } from '@/lib/api';
import { getCurrencySymbol } from '@/lib/chains';
import { Bank, DEFAULT_NIGERIAN_BANKS } from './bankData';
import { BankPickerModal } from './BankPickerModal';
import {
  PAYSTACK_TEST_ACCOUNTS,
  PaystackTestAccountsWidget,
  PaystackTestAccount,
} from './PaystackTestAccountsWidget';
import { DirectBankInput } from './DirectBankInput';
import { SavedBeneficiariesList } from './SavedBeneficiariesList';
import { AddBeneficiaryForm } from './AddBeneficiaryForm';
import { WithdrawalSummaryModal } from './WithdrawalSummaryModal';
import { WithdrawalSuccessView } from './WithdrawalSuccessView';

export default function WithdrawFiat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCurrency = searchParams.get('currency')?.toUpperCase();
  const { user } = useAuth();
  const isKycRequired = !user || (user.tier ?? 0) < 2;
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.currency || queryCurrency || 'NGN');
  const [fiatOptions, setFiatOptions] = useState<string[]>(['NGN', 'USD', 'EUR', 'GBP']);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [destinationType, setDestinationType] = useState<'saved' | 'new'>('saved');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBanks, setIsFetchingBanks] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userLimits, setUserLimits] = useState<{
    tier: number;
    global_usd: number;
    crypto_limits: Record<string, number>;
  } | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Available Balance State
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [, setIsLoadingBalance] = useState(false);

  // Summary Review Modal State
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Bank List Data & Picker Modal State
  const [supportedBanks, setSupportedBanks] = useState<Bank[]>(DEFAULT_NIGERIAN_BANKS);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);

  // Direct Bank Transfer / New Beneficiary State
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Dynamic Fee Quote State
  const [quote, setQuote] = useState<WithdrawalQuote | null>(null);
  const [, setIsQuoting] = useState(false);

  // Success View State
  const [withdrawalResult, setWithdrawalResult] = useState<any>(null);

  const fetchBalance = useCallback(async (curr: string) => {
    setIsLoadingBalance(true);
    try {
      const res = await api.getAllBalances();
      if (res.success && res.balances) {
        const match = res.balances.find((b: any) => b.currency === curr);
        if (match) {
          setAvailableBalance(parseFloat(match.available_balance) || 0);
        } else {
          setAvailableBalance(0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch balance for withdrawal:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  const fetchBeneficiaries = useCallback(async () => {
    setIsFetchingBanks(true);
    try {
      const response: any = await api.listBeneficiaries();
      const list =
        response.beneficiaries ||
        response.accounts ||
        response.data ||
        (Array.isArray(response) ? response : []);
      setBeneficiaries(list);
      if (list.length > 0) {
        setSelectedAccountId(list[0].id);
        setDestinationType('saved');
      } else {
        setDestinationType('new');
      }
    } catch (err) {
      console.error('Failed to fetch beneficiaries:', err);
      setDestinationType('new');
    } finally {
      setIsFetchingBanks(false);
    }
  }, []);

  const fetchSupportedBanks = useCallback(async (curr: string) => {
    setIsLoadingBanks(true);
    try {
      const country = curr === 'NGN' ? 'nigeria' : 'ghana';
      const response: any = await api.listBanks(country, curr);
      const apiBanks: Bank[] =
        response.data || response.banks || (Array.isArray(response) ? response : []);
      if (apiBanks.length > 0) {
        const bankMap = new Map<string, Bank>();
        DEFAULT_NIGERIAN_BANKS.forEach((b) => bankMap.set(b.code, b));
        apiBanks.forEach((b) => {
          if (b.code && b.name) bankMap.set(b.code, b);
        });
        const merged = Array.from(bankMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setSupportedBanks(merged);
      }
    } catch (err) {
      console.warn('Using default banks directory as fallback:', err);
    } finally {
      setIsLoadingBanks(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [settingsRes, balRes] = await Promise.all([
          api.getSettings().catch(() => null),
          api.getAllBalances().catch(() => null),
        ]);

        const discovered = new Set<string>(['NGN', 'USD', 'EUR', 'GBP']);
        let depositCurr = '';
        if (balRes?.success && balRes.balances) {
          balRes.balances.forEach((b: any) => {
            const sym = b.currency?.toUpperCase();
            if (b.chain === 'internal' || ['NGN', 'USD', 'EUR', 'GBP'].includes(sym)) {
              discovered.add(sym);
              const bal = parseFloat(b.available_balance || '0');
              if (bal > 0 && !depositCurr) {
                depositCurr = sym;
              }
            }
          });
        }
        setFiatOptions(Array.from(discovered));

        if (user?.currency) {
          const uCur = user.currency.toUpperCase();
          discovered.add(uCur);
          setCurrency(uCur);
        } else if (queryCurrency) {
          setCurrency(queryCurrency);
        } else if (depositCurr) {
          setCurrency(depositCurr);
        } else if (settingsRes?.success && settingsRes.settings?.preferred_currency) {
          setCurrency(settingsRes.settings.preferred_currency.toUpperCase());
        }
      } catch (err) {
        console.error('Failed to load user settings for withdrawal', err);
      }
    };
    init();
    fetchBeneficiaries();
    fetchSupportedBanks(currency);
    fetchBalance(currency);

    const fetchLimits = async () => {
      try {
        const limitRes = await api.getUserLimits();
        if (limitRes.success) {
          setUserLimits({
            tier: limitRes.tier,
            global_usd: limitRes.global_usd,
            crypto_limits: limitRes.crypto_limits,
          });
        }
      } catch (err) {
        console.error('Failed to fetch user limits for fiat withdrawal:', err);
      }
    };
    fetchLimits();
  }, [fetchBeneficiaries, fetchSupportedBanks, fetchBalance, currency, queryCurrency]);

  // Auto-resolve account name when 10 digits are typed and a bank is selected
  useEffect(() => {
    const resolve = async () => {
      if (newAccountNumber.length === 10 && selectedBank) {
        setIsResolving(true);
        setError(null);
        try {
          const res: any = await api.resolveBankAccount(newAccountNumber, selectedBank.code);
          if (res.account_name) {
            setNewAccountName(res.account_name);
          } else {
            setError(
              res.error ||
                res.message ||
                'Could not resolve account name. Please check account number and bank.'
            );
            setNewAccountName('');
          }
        } catch (err: any) {
          setError(err.message || 'Account resolution failed');
          setNewAccountName('');
        } finally {
          setIsResolving(false);
        }
      } else {
        setNewAccountName('');
      }
    };
    resolve();
  }, [newAccountNumber, selectedBank]);

  // Dynamic fee quote from backend
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsQuoting(true);
      try {
        const benId = destinationType === 'saved' ? selectedAccountId : undefined;
        const q = await api.quoteWithdrawal(benId, amount, currency);
        setQuote(q);
      } catch (err) {
        console.warn('Quote error, fallback to client formula:', err);
      } finally {
        setIsQuoting(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [amount, selectedAccountId, destinationType, currency]);

  // Single Consolidated Fee calculation:
  const feeDetails = useMemo(() => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return null;
    }
    const amt = parseFloat(amount);

    if (quote) {
      const f = Number(quote.fee ?? quote.service_fee ?? 50);
      const total = Number(quote.total_debit ?? amt + f);
      const recv = Number(quote.recipient_receives ?? amt);
      const mode =
        quote.fee_deduction_mode ??
        (availableBalance !== null && availableBalance >= amt + f
          ? 'added_to_amount'
          : 'subtracted_from_balance');
      return {
        fee: f,
        totalDebit: total,
        recipientReceives: recv,
        deductionMode: mode,
      };
    }

    // Client-side fallback formula using mock rate for non-NGN currencies
    const rate =
      currency === 'EUR' ? 1750 : currency === 'GBP' ? 2050 : currency === 'USD' ? 1600 : 1;
    const amtNGN = amt * rate;
    const minFeeNGN = 50;
    const basePctFeeNGN = amtNGN * 0.01;
    const baseFeeNGN = basePctFeeNGN > minFeeNGN ? basePctFeeNGN : minFeeNGN;

    let paystackFeeNGN = 50;
    if (amtNGN <= 5000) {
      paystackFeeNGN = 10;
    } else if (amtNGN <= 50000) {
      paystackFeeNGN = 25;
    }
    const totalFee = Number(((baseFeeNGN + paystackFeeNGN) / rate).toFixed(2));

    let totalDebit: number;
    let recipientReceives: number;
    let mode: 'added_to_amount' | 'subtracted_from_balance' = 'added_to_amount';

    if (availableBalance !== null) {
      if (availableBalance >= amt + totalFee) {
        totalDebit = amt + totalFee;
        recipientReceives = amt;
        mode = 'added_to_amount';
      } else {
        totalDebit = amt >= availableBalance ? availableBalance : amt;
        recipientReceives = Math.max(0, totalDebit - totalFee);
        mode = 'subtracted_from_balance';
      }
    } else {
      totalDebit = amt + totalFee;
      recipientReceives = amt;
    }

    return {
      fee: totalFee,
      totalDebit,
      recipientReceives,
      deductionMode: mode,
    };
  }, [amount, quote, availableBalance, currency]);

  // Active saved beneficiary
  const activeBen = useMemo(() => {
    return beneficiaries.find((b) => b.id === selectedAccountId);
  }, [beneficiaries, selectedAccountId]);

  // Tier Limit Validation
  useEffect(() => {
    if (!userLimits || !amount || parseFloat(amount) <= 0) {
      setLimitWarning(null);
      return;
    }

    const enteredAmount = parseFloat(amount);
    let amountUSD = enteredAmount;
    if (currency === 'NGN') {
      amountUSD = enteredAmount / 1600;
    }

    if (amountUSD > userLimits.global_usd) {
      setLimitWarning(
        `Limit Exceeded: Your current tier (${userLimits.tier}) has a withdrawal limit of $${userLimits.global_usd.toLocaleString()}. This request is ~$${amountUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}.`
      );
    } else {
      setLimitWarning(null);
    }
  }, [amount, currency, userLimits]);

  // Validation before opening Summary Review Modal
  const handleOpenSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (isKycRequired) {
      router.push('/kyc');
      return;
    }
    setError(null);

    if (destinationType === 'saved') {
      if (!selectedAccountId) {
        setError('Please select a destination bank account');
        return;
      }
    } else {
      if (!selectedBank) {
        setError('Please select a destination bank');
        return;
      }
      if (newAccountNumber.length !== 10) {
        setError('Please enter a valid 10-digit account number');
        return;
      }
      if (!newAccountName) {
        setError('Account name could not be verified. Please verify bank and account number.');
        return;
      }
    }

    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid withdrawal amount');
      return;
    }

    const currRate =
      currency === 'EUR' ? 1750 : currency === 'GBP' ? 2050 : currency === 'USD' ? 1600 : 1;
    const minWithdrawal =
      currency === 'NGN' ? 1000 : currency === 'KES' ? 100 : Number((1000 / currRate).toFixed(2));
    if (amt < minWithdrawal) {
      setError(
        `Minimum withdrawal amount is ${getCurrencySymbol(currency)}${minWithdrawal.toLocaleString(
          'en-US',
          { minimumFractionDigits: 2 }
        )}`
      );
      return;
    }

    if (availableBalance !== null && amt > availableBalance) {
      setError(
        `Insufficient balance. Your available balance is ${getCurrencySymbol(currency)}${availableBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
      );
      return;
    }

    if (limitWarning) {
      setError(limitWarning);
      return;
    }

    setShowSummaryModal(true);
  };

  // Execution after Review Modal confirmation with PIN
  const handleConfirmWithdrawal = async (pin: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let response: any;
      let benDetails: any;

      if (destinationType === 'saved') {
        response = await api.initiateFiatWithdrawal(
          amount,
          currency,
          selectedAccountId,
          undefined,
          undefined,
          pin
        );
        benDetails = activeBen;
      } else {
        response = await api.initiateFiatWithdrawal(
          amount,
          currency,
          undefined,
          undefined,
          {
            bank_code: selectedBank!.code,
            bank_name: selectedBank!.name,
            account_number: newAccountNumber,
          },
          pin
        );
        benDetails = {
          bank_name: selectedBank!.name,
          bank_code: selectedBank!.code,
          account_name: newAccountName,
          account_number_last4: newAccountNumber.slice(-4),
        };
        fetchBeneficiaries();
      }

      setWithdrawalResult({
        ...response,
        amount,
        currency,
        beneficiary: benDetails,
        feeDetails,
      });
      setShowSummaryModal(false);
      setSuccess('Withdrawal submitted successfully!');
      fetchBalance(currency);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Failed to initiate withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove saved beneficiary
  const handleRemoveBeneficiary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this bank account from your saved withdrawal accounts?'))
      return;

    try {
      await api.removeBeneficiary(id);
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
      if (selectedAccountId === id) {
        setSelectedAccountId('');
      }
      setSuccess('Beneficiary removed successfully.');
    } catch (err: any) {
      setError(err.message || 'Could not remove beneficiary');
    }
  };

  // Select Paystack Approved Demo Test Account
  const handleSelectTestAccount = (testAcc: PaystackTestAccount) => {
    const bank = supportedBanks.find((b) => b.code === testAcc.bankCode) || {
      name: testAcc.bankName,
      code: testAcc.bankCode,
    };
    setSelectedBank(bank);
    setNewAccountNumber(testAcc.number);
    setNewAccountName(testAcc.name);
    setDestinationType('new');
    setError(null);
  };

  // Success Receipt View
  if (withdrawalResult) {
    return (
      <WithdrawalSuccessView
        withdrawalResult={withdrawalResult}
        onReset={() => {
          setWithdrawalResult(null);
          setAmount('');
          setQuote(null);
          setSuccess(null);
          setNewAccountNumber('');
          setNewAccountName('');
          setSelectedBank(null);
        }}
      />
    );
  }

  return (
    <div className="main-card animate-fade-slide-up max-w-lg mx-auto overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-danger/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center shadow-inner">
            <Banknote className="text-danger" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Withdraw Fiat</h2>
            <p className="text-sm text-text-secondary">Transfer NGN directly to verified Nigerian bank accounts</p>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success text-sm flex items-center gap-2 mb-6 animate-fade-in shadow-sm">
            <CheckCircle2 size={18} className="flex-shrink-0" /> {success}
          </div>
        )}

        {/* MODE 1: Add New Beneficiary View */}
        {showAddForm ? (
          <AddBeneficiaryForm
            currency={currency}
            selectedBank={selectedBank}
            onOpenBankPicker={() => setIsBankPickerOpen(true)}
            accountNumber={newAccountNumber}
            onAccountNumberChange={(val) => setNewAccountNumber(val)}
            accountName={newAccountName}
            isResolving={isResolving}
            onSelectTestAccount={handleSelectTestAccount}
            onSuccess={async () => {
              setShowAddForm(false);
              setNewAccountNumber('');
              setNewAccountName('');
              setSelectedBank(null);
              await fetchBeneficiaries();
              setSuccess('Bank beneficiary verified and securely saved!');
            }}
            onCancel={() => {
              setShowAddForm(false);
              setError(null);
            }}
          />
        ) : (
          /* MODE 2: Standard Withdrawal View */
          <form onSubmit={handleOpenSummary} className="space-y-6">
            {isKycRequired && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center justify-between gap-3 mb-2 animate-fade-slide-up">
                <div className="text-xs">
                  <span className="font-bold">Tier 2 KYC Required:</span> Complete identity verification to unlock your country fiat currency and make withdrawals.
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
              {/* Destination Selector Header & Tabs */}
              <div className="flex justify-between items-center mb-3 ml-1">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest">
                  Withdrawal Destination
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(true);
                    setSuccess(null);
                  }}
                  className="text-xs text-cyan hover:text-cyan-hover font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Manage Beneficiaries
                </button>
              </div>

              {/* Destination Mode Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-deep-navy/60 border border-border rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setDestinationType('saved')}
                  disabled={beneficiaries.length === 0}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    destinationType === 'saved'
                      ? 'bg-cyan text-midnight shadow-md shadow-cyan/20'
                      : 'text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
                >
                  <span>Saved Beneficiaries</span>
                  {beneficiaries.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        destinationType === 'saved'
                          ? 'bg-midnight/30 text-midnight'
                          : 'bg-white/10 text-text-tertiary'
                      }`}
                    >
                      {beneficiaries.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDestinationType('new')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    destinationType === 'new'
                      ? 'bg-cyan text-midnight shadow-md shadow-cyan/20'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Building2 size={13} />
                  <span>New Bank Account</span>
                </button>
              </div>

              {/* Destination Option A: Saved Beneficiaries */}
              {destinationType === 'saved' && (
                <SavedBeneficiariesList
                  isFetching={isFetchingBanks}
                  beneficiaries={beneficiaries}
                  selectedAccountId={selectedAccountId}
                  onSelectAccountId={(id) => setSelectedAccountId(id)}
                  onRemoveBeneficiary={handleRemoveBeneficiary}
                  onSwitchToNew={() => setDestinationType('new')}
                  onSelectTestAccount={() => handleSelectTestAccount(PAYSTACK_TEST_ACCOUNTS[0])}
                />
              )}

              {/* Destination Option B: Direct Bank Details */}
              {destinationType === 'new' && (
                <div className="space-y-3.5 p-4 bg-deep-navy/30 border border-border/80 rounded-2xl animate-fade-in">
                  <PaystackTestAccountsWidget
                    onSelect={handleSelectTestAccount}
                    activeNumber={newAccountNumber}
                  />
                  <DirectBankInput
                    selectedBank={selectedBank}
                    onOpenBankPicker={() => setIsBankPickerOpen(true)}
                    accountNumber={newAccountNumber}
                    onAccountNumberChange={(val) => setNewAccountNumber(val)}
                    accountName={newAccountName}
                    isResolving={isResolving}
                    compact={true}
                  />
                </div>
              )}
            </div>

            {/* Currency Selector / Locked Currency Display */}
            {user?.currency ? (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-text-secondary font-bold">Currency:</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan/20 border border-cyan/40 text-cyan">
                  {user.currency}
                </span>
                <span className="text-[10px] text-text-tertiary">Permanently assigned to your country</span>
              </div>
            ) : fiatOptions.length > 1 && (
              <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                <span className="text-xs text-text-secondary font-bold mr-1">Currency:</span>
                {fiatOptions.map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => {
                      setCurrency(curr);
                      fetchBalance(curr);
                      fetchSupportedBanks(curr);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      currency === curr
                        ? 'bg-cyan/20 border-cyan text-cyan'
                        : 'bg-white/5 border-border/60 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-4">
              <div className="bg-deep-navy/40 border border-border rounded-2xl p-5 mb-2 focus-within:border-cyan transition-all group">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-black text-text-secondary uppercase tracking-widest">
                    Withdrawal Amount ({currency})
                  </label>
                  {availableBalance !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary">
                        Available:{' '}
                        <span className="text-cyan font-bold font-mono">
                          {getCurrencySymbol(currency)}
                          {availableBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAmount(availableBalance.toString())}
                        className="text-[10px] font-black uppercase tracking-wider bg-cyan/10 hover:bg-cyan/20 text-cyan px-2 py-0.5 rounded transition-all"
                      >
                        MAX
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="text-3xl font-black text-white mr-2 opacity-40">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    min={currency === 'NGN' ? '1000' : '10'}
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-transparent text-text-primary text-4xl font-black outline-none placeholder:text-white/10 font-mono"
                  />
                </div>
              </div>

              {/* Tier Limit Warning */}
              {limitWarning && (
                <div className="p-4 bg-orange/10 border border-orange/20 rounded-xl text-orange text-xs flex items-center gap-3 animate-pulse">
                  <AlertTriangle size={18} className="flex-shrink-0" />
                  <div>
                    <span className="font-bold">Withdrawal Limit Warning</span>
                    <p className="mt-0.5 opacity-90">{limitWarning}</p>
                  </div>
                </div>
              )}

              {/* Single Consolidated Fee Display */}
              {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && feeDetails && (
                <div className="px-5 py-4 bg-deep-navy/40 border border-border/60 rounded-2xl space-y-2.5 animate-fade-in text-xs">
                  <div className="flex justify-between items-center font-bold text-text-secondary">
                    <div className="flex items-center gap-2">
                      <span>Withdrawal Fee</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          feeDetails.deductionMode === 'added_to_amount'
                            ? 'bg-cyan/10 text-cyan border border-cyan/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {feeDetails.deductionMode === 'added_to_amount'
                          ? '+ Added to amount'
                          : '- Deducted from balance'}
                      </span>
                    </div>
                    <span className="text-text-primary font-mono text-sm">
                      {getCurrencySymbol(currency)}
                      {feeDetails.fee.toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex justify-between font-black text-sm">
                    <span className="text-text-primary">TOTAL WALLET DEDUCTION</span>
                    <span className="text-cyan font-mono">
                      {getCurrencySymbol(currency)}
                      {feeDetails.totalDebit.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Recipient Receives</span>
                    <span className="text-success font-bold font-mono text-sm">
                      {getCurrencySymbol(currency)}
                      {feeDetails.recipientReceives.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm flex items-center gap-2 animate-shake">
                <AlertTriangle size={18} className="flex-shrink-0" /> {error}
              </div>
            )}

            {/* Review Button */}
            <button
              type="submit"
              disabled={
                isLoading ||
                isKycRequired ||
                !amount ||
                parseFloat(amount) <= 0 ||
                !!limitWarning ||
                (destinationType === 'saved' && !selectedAccountId) ||
                (destinationType === 'new' && (!selectedBank || !newAccountName))
              }
              className="w-full py-5 bg-gradient-to-br from-cyan to-blue-600 text-midnight text-lg font-black rounded-2xl shadow-xl shadow-cyan/20 hover:shadow-cyan/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-30 flex items-center justify-center gap-3 group"
            >
              {isKycRequired ? 'Complete Tier 2 KYC to Withdraw' : 'Review Withdrawal'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="flex items-center gap-2 text-[10px] text-text-tertiary uppercase font-black tracking-widest leading-none">
                <ShieldCheck size={12} className="text-success" />
                <span>Paystack Transfer Network • End-to-End Encrypted</span>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Bank Picker Modal */}
      <BankPickerModal
        isOpen={isBankPickerOpen}
        onClose={() => setIsBankPickerOpen(false)}
        banks={supportedBanks}
        selectedBank={selectedBank}
        onSelectBank={(b) => setSelectedBank(b)}
        isLoading={isLoadingBanks}
      />

      {/* Withdrawal Summary Review Modal */}
      <WithdrawalSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onConfirm={handleConfirmWithdrawal}
        isLoading={isLoading}
        amount={amount}
        currency={currency}
        bankName={destinationType === 'saved' ? activeBen?.bank_name || '' : selectedBank?.name || ''}
        bankCode={destinationType === 'saved' ? activeBen?.bank_code : selectedBank?.code}
        accountName={destinationType === 'saved' ? activeBen?.account_name || '' : newAccountName}
        accountNumberLast4={
          destinationType === 'saved'
            ? activeBen?.account_number_last4 || ''
            : newAccountNumber.slice(-4)
        }
        feeDetails={feeDetails}
        error={error}
      />
    </div>
  );
}
