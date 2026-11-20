'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/shared/AppHeader';
import Background from '@/components/shared/Background';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FloatingNavbar from '@/components/shared/FloatingNavbar';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Zap,
  ChevronRight,
  Loader2,
  X,
  Check,
  DollarSign,
  Wallet,
  ArrowUpRight
} from 'lucide-react';
import { cardApi } from '@/lib/api/cards';
import { UserCard } from '@/lib/api/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';

export default function CardsPage() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingSensitive, setLoadingSensitive] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [primaryAsset, setPrimaryAsset] = useState('USD');
  const [spendAlgorithm, setSpendAlgorithm] = useState<'priority' | 'highest_balance' | 'lowest_balance' | 'stablecoins_first'>('priority');
  const [userBalances, setUserBalances] = useState<any[]>([]);
  const [loadingPriority, setLoadingPriority] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState('5000');
  const [refundMode, setRefundMode] = useState<'current_rate' | 'stablecoin'>('current_rate');
  const { user } = useAuth();

  const canIssueCard = Boolean(user && user.tier >= 2);

  const selectedCard = cards && cards.length > 0 ? cards[activeCardIndex] : null;

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    if (selectedCard?.id) {
      loadCardSpendPriority(selectedCard.id);
    }
  }, [selectedCard?.id]);

  const loadCards = async () => {
    try {
      setLoading(true);
      console.log('Loading user cards...');
      const response = await cardApi.listCards();
      console.log('Cards loaded:', response?.cards);
      setCards(Array.isArray(response?.cards) ? response.cards : []);
    } catch (err) {
      console.error('Failed to load cards:', err);
      setCards([]);
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const toggleFreeze = async () => {
    if (!selectedCard) return;

    try {
      const isFrozen = selectedCard.status === 'frozen';
      if (isFrozen) {
        await cardApi.activateCard(selectedCard.id);
        toast.success('Card unfrozen');
      } else {
        await cardApi.freezeCard(selectedCard.id);
        toast.success('Card frozen');
      }
      loadCards();
    } catch (err) {
      console.error('Failed to update card status:', err);
      toast.error('Failed to update card status');
    }
  };

  const createCard = async () => {
    if (!canIssueCard) {
      toast.error('Tier 2 verification (KYC) required to issue cards');
      return;
    }

    try {
      await cardApi.createCard('virtual');
      toast.success('Virtual card created');
      loadCards();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create card');
    }
  };

  const toggleDetails = async () => {
    if (!selectedCard) return;

    if (showDetails) {
      setShowDetails(false);
      return;
    }

    try {
      setLoadingSensitive(true);
      console.log('Fetching sensitive details for card:', selectedCard.id);
      const response = await cardApi.getSensitiveDetails(selectedCard.id);
      console.log('Card sensitive details response:', response);

      const sensitiveCard = response.card as any;
      const updatedCards = [...cards];
      updatedCards[activeCardIndex] = {
        ...selectedCard,
        ...response.card,
        pan: sensitiveCard?.pan || sensitiveCard?.PAN || selectedCard.pan,
        cvv: sensitiveCard?.cvv || sensitiveCard?.CVV || selectedCard.cvv,
      };
      setCards(updatedCards);
      setShowDetails(true);
    } catch (err: any) {
      console.error('Failed to fetch card details:', err);
      toast.error(err?.message || 'Failed to fetch sensitive details');
    } finally {
      setLoadingSensitive(false);
    }
  };

  const loadCardSpendPriority = async (cardId: string) => {
    try {
      const res = await cardApi.getSpendPriority(cardId);
      if (res.success) {
        if (res.primary_asset) setPrimaryAsset(res.primary_asset);
        if (res.algorithm) setSpendAlgorithm(res.algorithm as any);
      }
      if (res.monthly_limit) setMonthlyLimit(String(res.monthly_limit));
      if (res.balances) setUserBalances(res.balances);
    } catch {
      // Use defaults if not set
    }
  };

  const openPriorityModal = async () => {
    if (!selectedCard) return;
    setIsPriorityModalOpen(true);
    setLoadingPriority(true);
    try {
      const res = await cardApi.getSpendPriority(selectedCard.id);
      if (res.success) {
        if (res.primary_asset) setPrimaryAsset(res.primary_asset);
        if (res.algorithm) setSpendAlgorithm(res.algorithm as any);
        if (res.monthly_limit) setMonthlyLimit(String(res.monthly_limit));
        if (res.balances) setUserBalances(res.balances);
      }
    } catch (err) {
      console.error('Failed to load spend priority:', err);
    } finally {
      setLoadingPriority(false);
    }
  };

  const saveSpendPriority = async (newPrimary: string) => {
    if (!selectedCard) return;
    setSavingPriority(true);
    try {
      const mLimit = parseFloat(monthlyLimit) || 0;
      const allAssets = ['USD', 'USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'XRP'];
      const order = [newPrimary, ...allAssets.filter(a => a !== newPrimary)];
      await cardApi.setSpendPriority(selectedCard.id, newPrimary, order, 0, mLimit, spendAlgorithm);
      setPrimaryAsset(newPrimary);
      toast.success(`Spend algorithm & limits updated`);
      setIsPriorityModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update spend settings');
    } finally {
      setSavingPriority(false);
    }
  };

  const formatPAN = (pan: string) => {
    if (!pan) return '•••• •••• •••• ' + (selectedCard?.last_four || '••••');
    return pan.replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <ProtectedRoute>
      <Background type="dashboard" />

      <div className="relative z-10 min-h-screen pb-32 overflow-x-hidden">
        <AppHeader showBackButton={true} backHref="/dashboard" />

        <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-2xl pt-28">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-1">Your Cards</h1>
              <p className="text-text-secondary">Manage your virtual and physical spending</p>
            </div>
            <div className="relative group">
              <button
                onClick={createCard}
                disabled={!canIssueCard}
                className={`p-3 rounded-2xl border transition-all ${canIssueCard
                    ? "bg-cyan/10 hover:bg-cyan/20 text-cyan border-cyan/20"
                    : "bg-white/5 text-text-secondary border-white/10 cursor-not-allowed"
                  }`}
              >
                <Plus size={24} />
              </button>
              {!canIssueCard && (
                <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-midnight border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-xs flex items-center gap-1 text-cyan">
                      <Lock size={12} /> Tier 2 Required
                    </p>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Complete KYC verification to unlock card issuance.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="text-cyan animate-spin" size={40} />
              <p className="text-text-secondary font-medium">Loading your cards...</p>
            </div>
          ) : cards && cards.length > 0 && selectedCard ? (
            <>
              {/* Card Visual */}
              <div className="relative mb-10 perspective-1000 group">
                <div className={`relative w-full aspect-[1.58/1] rounded-[24px] overflow-hidden shadow-2xl transition-all duration-700 transform-gpu ${selectedCard.status === 'frozen' ? 'grayscale opacity-70' : 'hover:scale-[1.02]'}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-midnight via-deep-navy to-electric-blue/40"></div>
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.2),transparent_70%)]"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/10 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse"></div>

                  <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-1">Molu Platinum</span>
                        <Zap className="text-cyan fill-cyan" size={24} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-4">
                          <span className="text-xl sm:text-2xl lg:text-3xl font-mono text-white tracking-[0.1em] font-medium drop-shadow-lg">
                            {showDetails ? formatPAN(selectedCard.pan || '') : '•••• •••• •••• ' + (selectedCard.last_four || '••••')}
                          </span>
                          <button
                            onClick={toggleDetails}
                            disabled={loadingSensitive}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            {loadingSensitive ? <Loader2 size={18} className="animate-spin" /> : showDetails ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex gap-8">
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-1">Expiry</p>
                            <p className="text-sm text-white font-medium">{selectedCard.exp_month || '01'}/{selectedCard.exp_year ? String(selectedCard.exp_year).slice(-2) : '28'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-1">CVV</p>
                            <p className="text-sm text-white font-medium">{showDetails ? (selectedCard.cvv || '•••') : '•••'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white tracking-widest italic uppercase">{selectedCard.card_brand || 'PLATINUM'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedCard.status === 'frozen' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <div className="bg-white/10 border border-white/20 px-6 py-2 rounded-full backdrop-blur-md shadow-xl">
                        <p className="text-white font-bold tracking-widest uppercase text-xs flex items-center gap-2">
                          <Lock size={14} /> Frozen
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none opacity-50"></div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="main-card p-5 !bg-white/5 border border-white/10">
                  <p className="text-xs text-text-secondary uppercase font-bold tracking-tighter mb-2">Monthly Spend</p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-bold text-text-primary">$0.00</h3>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan to-electric-blue rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-text-secondary">Used: 0%</span>
                    <span className="text-[10px] text-text-secondary">Limit: $5,000</span>
                  </div>
                </div>
                <div className="main-card p-5 !bg-white/5 border border-white/10">
                  <p className="text-xs text-text-secondary uppercase font-bold tracking-tighter mb-2">Primary Currency</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success border border-success/20">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{primaryAsset}</h3>
                      <p className="text-[10px] text-text-secondary font-medium lowercase">@main_wallet</p>
                    </div>
                  </div>
                  <button
                    onClick={openPriorityModal}
                    className="w-full mt-4 text-[10px] text-cyan font-bold uppercase tracking-widest hover:text-electric-blue transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Change <ChevronRight size={10} />
                  </button>
                </div>
              </div>

              {/* Card Control */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest ml-1">Card Control</h2>
                <div className="main-card overflow-hidden">
                  <button
                    onClick={toggleFreeze}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all group border-b border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${selectedCard.status === 'frozen' ? 'bg-cyan/20 text-cyan' : 'bg-white/5 text-text-secondary group-hover:text-cyan'}`}>
                        {selectedCard.status === 'frozen' ? <ShieldCheck size={20} /> : <Lock size={20} />}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-text-primary">{selectedCard.status === 'frozen' ? 'Unfreeze Card' : 'Freeze Card'}</p>
                        <p className="text-xs text-text-secondary">Instantly block new transactions</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${selectedCard.status === 'frozen' ? 'bg-cyan' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${selectedCard.status === 'frozen' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </button>

                  <button
                    onClick={openPriorityModal}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all group border-b border-white/5 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-2xl text-text-secondary group-hover:text-cyan transition-colors">
                        <Settings size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-text-primary">Spending Priority & Monthly Limit</p>
                        <p className="text-xs text-text-secondary">Primary: {primaryAsset} • Monthly Limit: ${monthlyLimit}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-text-secondary" size={18} />
                  </button>

                  <div className="p-4 flex items-start gap-4 bg-white/[0.02]">
                    <div className="p-3 bg-cyan/10 rounded-2xl text-cyan shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-text-primary">Card Refund Policy</p>
                        <span className="text-[10px] bg-cyan/10 text-cyan px-2 py-0.5 rounded-full border border-cyan/20 font-semibold uppercase">Loss-Protected</span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Merchant refunds are credited either in stablecoins (USDC) or in the spent currency calculated at the live rate at the time of refund so the platform will not lose on market volatility.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="main-card p-10 flex flex-col items-center justify-center text-center gap-6 mb-10">
              <div className="w-20 h-20 bg-cyan/10 rounded-full flex items-center justify-center text-cyan border border-cyan/20">
                <CreditCard size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No Active Cards</h3>
                <p className="text-text-secondary text-sm max-w-xs">Issue your first virtual card to start spending your crypto anywhere.</p>
              </div>
              {!canIssueCard && (
                <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 p-4 rounded-2xl mb-6 text-left flex items-start gap-3">
                  <div className="bg-orange-500/20 p-2 rounded-xl shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-0.5">Verification Required</h4>
                    <p className="text-xs opacity-80">
                      You are currently at <strong>Tier {user?.tier || 1}</strong>. Card issuance is restricted to Verified (Tier 2) users and above.
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={createCard}
                disabled={!canIssueCard}
                className={`w-full font-bold px-8 py-3 rounded-2xl transition-all shadow-lg ${canIssueCard
                    ? "bg-cyan hover:bg-electric-blue text-midnight shadow-cyan/20"
                    : "bg-white/10 text-text-secondary cursor-not-allowed grayscale"
                  }`}
              >
                {canIssueCard ? 'Issue Card' : 'Upgrade to Issue Card'}
              </button>
              {!canIssueCard && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                  <Link href="/kyc" className="text-xs text-cyan font-bold uppercase tracking-widest hover:underline">
                    Complete Identity Verification →
                  </Link>
                  <span className="text-text-secondary hidden sm:inline">•</span>
                  <Link href="/settings?tab=verification" className="text-xs text-text-secondary hover:text-cyan uppercase tracking-widest hover:underline">
                    Verification Settings →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Asset-Centric Transaction History Notice */}
          <div className="main-card p-5 mt-6 bg-cyan/5 border border-cyan/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan shrink-0 border border-cyan/20">
                <Wallet size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Per-Asset Transaction Ledger</h3>
                <p className="text-text-secondary text-xs mt-0.5">
                  Card spending, conversions, and settlements are also tracked in real-time under each asset's ledger page.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-cyan/10 hover:bg-cyan/20 text-cyan font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 border border-cyan/20"
            >
              Go to Assets →
            </Link>
          </div>
        </main>
        <FloatingNavbar />

        {/* Spend Priority & Limits Modal */}
        {isPriorityModalOpen && (
          <div
            onClick={() => setIsPriorityModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="main-card max-w-md w-full p-6 border border-white/10 shadow-2xl relative max-h-[88vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan/10 text-cyan rounded-xl">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Spend Priority & Limits</h3>
                    <p className="text-xs text-text-secondary">Choose which asset this card drains first</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPriorityModalOpen(false)}
                  className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingPriority ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-text-secondary">
                  <Loader2 className="animate-spin text-cyan" size={32} />
                  <p className="text-sm">Loading card spend settings...</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-5 my-1">
                    <div>
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">
                        Primary Spending Asset
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                        {['USD', 'USDT', 'USDC', 'BTC', 'ETH', 'SOL'].map((asset) => {
                          const bal = userBalances.find((b: any) => b.currency?.toUpperCase() === asset);
                          const isSelected = primaryAsset.toUpperCase() === asset;
                          return (
                            <button
                              key={asset}
                              type="button"
                              onClick={() => setPrimaryAsset(asset)}
                              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan/15 border-cyan text-cyan'
                                  : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'
                              }`}
                            >
                              <div>
                                <p className="font-bold text-sm text-text-primary">{asset}</p>
                                <p className="text-[10px] text-text-secondary">
                                  Bal: {bal ? parseFloat(bal.available_balance || '0').toFixed(2) : '0.00'}
                                </p>
                              </div>
                              {isSelected && <Check size={16} className="text-cyan" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">
                        Spending Strategy & Algorithm
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'priority', name: 'Priority Waterfall', desc: 'Drains selected primary asset first' },
                          { id: 'highest_balance', name: 'Highest Balance', desc: 'Drains largest USD balance first' },
                          { id: 'stablecoins_first', name: 'Stablecoins First', desc: 'Prefers USD, USDC, USDT first' },
                          { id: 'lowest_balance', name: 'Lowest Dust First', desc: 'Drains small dust balances first' },
                        ].map((algo) => {
                          const isSelected = spendAlgorithm === algo.id;
                          return (
                            <button
                              key={algo.id}
                              type="button"
                              onClick={() => setSpendAlgorithm(algo.id as any)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan/15 border-cyan text-cyan'
                                  : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'
                              }`}
                            >
                              <p className="font-bold text-xs text-text-primary">{algo.name}</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">{algo.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">
                          Monthly Spending Limit ($)
                        </label>
                        <div className="relative">
                          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                          <input
                            type="number"
                            value={monthlyLimit}
                            onChange={(e) => setMonthlyLimit(e.target.value)}
                            placeholder="5000"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-sm text-text-primary focus:outline-none focus:border-cyan"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">
                          Refund Settlement Policy
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRefundMode('current_rate')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              refundMode === 'current_rate'
                                ? 'bg-cyan/15 border-cyan text-cyan'
                                : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'
                            }`}
                          >
                            <p className="font-bold text-xs text-text-primary">Spent Currency</p>
                            <p className="text-[10px] text-text-secondary mt-0.5">Live rate at refund time</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRefundMode('stablecoin')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              refundMode === 'stablecoin'
                                ? 'bg-cyan/15 border-cyan text-cyan'
                                : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'
                            }`}
                          >
                            <p className="font-bold text-xs text-text-primary">Stablecoin (USDC)</p>
                            <p className="text-[10px] text-text-secondary mt-0.5">Exact USD equivalent</p>
                          </button>
                        </div>
                        <p className="text-[10px] text-text-secondary mt-1.5 leading-relaxed">
                          Protects platform and customer against crypto price swings when card purchases are returned or refunded.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sticky Action Footer */}
                  <div className="pt-4 border-t border-white/10 flex gap-3 shrink-0 mt-auto bg-midnight/95 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setIsPriorityModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-text-secondary font-bold text-sm hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSpendPriority(primaryAsset)}
                      disabled={savingPriority}
                      className="flex-1 py-2.5 rounded-xl bg-cyan hover:bg-electric-blue text-midnight font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan/20 cursor-pointer disabled:opacity-50"
                    >
                      {savingPriority ? <Loader2 size={16} className="animate-spin" /> : 'Save Settings'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
