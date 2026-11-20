'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, Bookmark, X, Loader2, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface SendSuccessCardProps {
  amount?: string;
  asset?: string;
  recipientAddress?: string;
  selectedNetwork: string;
  chainName?: string;
  isInternal?: boolean;
  onViewHistory: () => void;
  onBackToWallet?: () => void;
}

export default function SendSuccessCard({
  amount,
  asset,
  recipientAddress,
  selectedNetwork,
  chainName,
  isInternal = false,
  onViewHistory,
  onBackToWallet,
}: SendSuccessCardProps) {
  const router = useRouter();
  const displayNetwork = chainName || (selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1));

  // Save recipient states
  const [isSaved, setIsSaved] = useState<boolean | null>(null);
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [saveNote, setSaveNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Check if address is already saved
  useEffect(() => {
    if (!recipientAddress) return;
    const checkNetwork = isInternal ? 'internal' : selectedNetwork;
    api.checkSavedAddress(recipientAddress, checkNetwork)
      .then(res => {
        if (res && res.is_saved) {
          setIsSaved(true);
        } else {
          setIsSaved(false);
        }
      })
      .catch(() => {
        setIsSaved(false);
      });
  }, [recipientAddress, selectedNetwork, isInternal]);

  const handleSaveRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveLabel.trim() || !recipientAddress) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const net = isInternal ? 'internal' : selectedNetwork;
      await api.createSavedAddress({
        label: saveLabel.trim(),
        network: net,
        address: recipientAddress,
        asset: asset,
        note: saveNote.trim() ? saveNote.trim() : undefined,
        is_favorite: false,
      });
      setSaveSuccess(true);
      setIsSaved(true);
      setIsFormOpen(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save recipient');
    } finally {
      setIsSaving(false);
    }
  };

  const formatRecipient = (addr?: string) => {
    if (!addr) return '';
    if (addr.startsWith('@')) return addr;
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const handleBackToWallet = () => {
    if (onBackToWallet) {
      onBackToWallet();
    } else {
      router.push('/wallet');
    }
  };

  // Render Save Recipient section
  const renderSaveRecipientWidget = () => {
    if (isSaved === null) return null; // loading check
    if (isSaved && !saveSuccess) {
      return (
        <div className="mb-6 p-3 bg-cyan/10 border border-cyan/20 rounded-xl flex items-center justify-center gap-2 text-xs text-cyan animate-fade-in">
          <Bookmark className="w-3.5 h-3.5 fill-cyan" />
          <span>This recipient is saved in your address book.</span>
        </div>
      );
    }

    if (saveSuccess) {
      return (
        <div className="mb-6 p-3 bg-success/15 border border-success/30 rounded-xl flex items-center justify-center gap-2 text-xs text-success animate-fade-in font-medium">
          <Check className="w-4 h-4" />
          <span>Recipient saved to your address book successfully!</span>
        </div>
      );
    }

    if (isPromptDismissed) return null;

    if (!isFormOpen) {
      return (
        <div className="mb-6 p-4 bg-gradient-to-r from-deep-navy/80 to-midnight/90 border border-cyan/25 rounded-2xl text-left animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-cyan/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan/15 text-cyan shrink-0 mt-0.5">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span>Save recipient for next time?</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-cyan/20 text-cyan">New</span>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Save this address to your address book for faster one-tap transfers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setIsPromptDismissed(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => {
                // Auto-suggest label
                if (isInternal && recipientAddress?.startsWith('@')) {
                  setSaveLabel(recipientAddress);
                } else {
                  setSaveLabel('');
                }
                setIsFormOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan text-midnight font-bold text-xs hover:bg-cyan/90 transition-all shadow-sm"
            >
              Save address
            </button>
          </div>
        </div>
      );
    }

    // Inline Save Form
    return (
      <form
        onSubmit={handleSaveRecipient}
        className="mb-6 p-5 bg-midnight/95 border border-cyan/35 rounded-2xl text-left animate-fade-in space-y-4 shadow-xl"
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-cyan" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Save Recipient Details</span>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="p-1 rounded text-text-secondary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {saveError && (
          <div className="p-2.5 rounded-lg bg-danger/10 border border-danger/25 text-danger text-xs">
            {saveError}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-tight mb-1">
              Recipient Name / Label *
            </label>
            <input
              type="text"
              autoFocus
              value={saveLabel}
              onChange={e => setSaveLabel(e.target.value)}
              placeholder="e.g. My Binance wallet, Alice Personal"
              required
              className="w-full px-3 py-2 bg-deep-navy/80 border border-border focus:border-cyan rounded-xl text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-tight mb-1">
                Network
              </label>
              <div className="px-3 py-2 bg-deep-navy/40 border border-border/50 rounded-xl text-xs text-text-secondary">
                {displayNetwork}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-tight mb-1">
                Asset (Optional)
              </label>
              <div className="px-3 py-2 bg-deep-navy/40 border border-border/50 rounded-xl text-xs text-cyan font-semibold">
                {asset || 'Any'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-tight mb-1">
              Recipient Address
            </label>
            <div className="px-3 py-2 bg-deep-navy/40 border border-border/50 rounded-xl text-xs font-mono text-cyan truncate">
              {recipientAddress}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-tight mb-1">
              Optional Note
            </label>
            <input
              type="text"
              value={saveNote}
              onChange={e => setSaveNote(e.target.value)}
              placeholder="e.g. Personal trading account"
              className="w-full px-3 py-2 bg-deep-navy/80 border border-border focus:border-cyan rounded-xl text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !saveLabel.trim()}
            className="px-4 py-2 rounded-xl bg-cyan text-midnight font-bold text-xs hover:bg-cyan/90 transition-all flex items-center gap-1.5 shadow-md shadow-cyan/20 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save recipient</span>
          </button>
        </div>
      </form>
    );
  };

  // Internal Transfer Success View
  if (isInternal) {
    return (
      <div className="main-card animate-fade-in text-center p-8 sm:p-12">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Transfer Completed!
        </h2>
        <p className="text-text-secondary mb-8 max-w-md mx-auto text-sm sm:text-base">
          Your internal transfer has been processed instantly with zero network fees.
        </p>

        <div className="p-5 bg-deep-navy/40 border border-border rounded-xl mb-6 text-left space-y-4">
          {amount && asset && (
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <span className="text-xs text-text-secondary uppercase tracking-wider">Amount</span>
              <span className="text-base font-bold text-text-primary">
                {amount} <span className="text-cyan">{asset}</span>
              </span>
            </div>
          )}

          {recipientAddress && (
            <div className="pb-3 border-b border-border/50">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Recipient</div>
              <div className="text-sm font-mono text-cyan break-all bg-card-bg/60 p-2 rounded-lg border border-border/40">
                {recipientAddress}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <span className="text-xs text-text-secondary uppercase tracking-wider">Network</span>
            <span className="text-sm font-semibold text-text-primary">
              Internal (Off-chain Instant)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wider">Status</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-success/10 text-success border border-success/20">
              Completed
            </span>
          </div>
        </div>

        {/* Save recipient prompt */}
        {renderSaveRecipientWidget()}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onViewHistory}
            className="cta-button w-full flex items-center justify-center gap-2"
          >
            <span>View History</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleBackToWallet}
            className="secondary-button w-full flex items-center justify-center gap-2"
          >
            <span>Back to Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  // On-Chain Crypto Transfer Success View
  return (
    <div className="main-card animate-fade-in text-center p-8 sm:p-12">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
        Transaction Submitted
      </h1>

      <p className="text-text-secondary mb-8 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
        Your transaction has been created successfully. Your funds have been reserved while we prepare and process your transaction on the blockchain.
      </p>

      <div className="p-5 bg-deep-navy/40 border border-border rounded-xl mb-6 text-left space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <span className="text-sm font-semibold text-text-primary">Amount Sent:</span>
          <span className="text-sm sm:text-base font-bold text-text-primary">
            {amount} <span className="text-cyan">{asset}</span>
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <span className="text-sm font-semibold text-text-primary">Network:</span>
          <span className="text-sm font-semibold text-text-primary">
            {displayNetwork}
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <span className="text-sm font-semibold text-text-primary">Recipient:</span>
          <span className="text-sm font-mono text-cyan" title={recipientAddress}>
            {formatRecipient(recipientAddress)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">Status:</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full lowercase bg-warning/10 text-warning border border-warning/20">
            processing
          </span>
        </div>
      </div>

      {/* Save recipient prompt */}
      {renderSaveRecipientWidget()}

      <p className="text-xs sm:text-sm text-text-secondary mb-8 max-w-md mx-auto leading-relaxed">
        Your transaction details will be available in a few minutes. You can check your{' '}
        <Link href="/history" className="text-cyan hover:underline font-medium">
          transaction history
        </Link>{' '}
        to track its progress.
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleBackToWallet}
          className="cta-button w-full flex items-center justify-center gap-2"
        >
          <span>Back to Wallet</span>
        </button>
      </div>
    </div>
  );
}
