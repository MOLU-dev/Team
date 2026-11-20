'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  Star,
  Clock,
  Bookmark,
  Users,
  Plus,
  Copy,
  Check,
  Zap,
  Globe,
  Loader2,
  Trash2,
  Edit2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { RecipientItem, SavedAddress } from '@/lib/api/types';
import { CHAIN_LIST } from '@/lib/chains';

interface RecipientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipient: (recipient: {
    address: string;
    network: string;
    asset?: string;
    isInternal: boolean;
    label?: string;
  }) => void;
  currentNetwork?: string;
}

export default function RecipientsModal({
  isOpen,
  onClose,
  onSelectRecipient,
  currentNetwork
}: RecipientsModalProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'saved' | 'all'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string>('all');
  const [recipients, setRecipients] = useState<RecipientItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New recipient modal inside address book
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newNetwork, setNewNetwork] = useState(currentNetwork || 'ethereum');
  const [newAddress, setNewAddress] = useState('');
  const [newAsset, setNewAsset] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch recipients
  const loadRecipients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getRecipients({
        view: activeTab,
        network: selectedNetworkFilter !== 'all' ? selectedNetworkFilter : undefined,
        query: searchQuery.trim() || undefined
      });
      if (res && res.recipients) {
        setRecipients(res.recipients);
      }
    } catch (err) {
      console.error('Failed to load recipients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedNetworkFilter, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      loadRecipients();
    }
  }, [isOpen, loadRecipients]);

  // Copy helper
  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle favorite
  const handleToggleFavorite = async (e: React.MouseEvent, item: RecipientItem) => {
    e.stopPropagation();
    if (!item.saved_id) {
      // If it's a recent recipient not yet saved, save it as a favorite!
      try {
        const res = await api.createSavedAddress({
          label: item.label || 'Saved Recipient',
          network: item.network,
          address: item.address,
          asset: item.asset,
          is_favorite: true
        });
        if (res.saved_address) {
          loadRecipients();
        }
      } catch (err) {
        console.error('Failed to save as favorite:', err);
      }
      return;
    }

    try {
      const newFav = !item.is_favorite;
      await api.toggleSavedAddressFavorite(item.saved_id, newFav);
      // Optimistic update
      setRecipients(prev =>
        prev.map(r => (r.saved_id === item.saved_id ? { ...r, is_favorite: newFav } : r))
      );
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Delete saved recipient
  const handleDelete = async (e: React.MouseEvent, savedId?: string) => {
    e.stopPropagation();
    if (!savedId) return;
    if (!confirm('Are you sure you want to remove this recipient from your saved addresses?')) return;
    try {
      await api.deleteSavedAddress(savedId);
      setRecipients(prev => prev.filter(r => r.saved_id !== savedId));
    } catch (err) {
      console.error('Failed to delete saved recipient:', err);
    }
  };

  // Save new recipient
  const handleSaveNewRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newAddress.trim() || !newNetwork) {
      setSaveError('Label, network, and address are required.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await api.createSavedAddress({
        label: newLabel.trim(),
        network: newNetwork,
        address: newAddress.trim(),
        asset: newAsset.trim() ? newAsset.trim().toUpperCase() : undefined,
        note: newNote.trim() ? newNote.trim() : undefined,
        is_favorite: false
      });
      if (res && res.saved_address) {
        setIsAddModalOpen(false);
        setNewLabel('');
        setNewAddress('');
        setNewNote('');
        setNewAsset('');
        loadRecipients();
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save recipient');
    } finally {
      setIsSaving(false);
    }
  };

  const formatShortAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.startsWith('@')) return addr;
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const getNetworkBadge = (net: string, isInternal: boolean) => {
    if (isInternal || net === 'internal') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success border border-success/30">
          <Zap className="w-3 h-3" />
          BitSilo Internal
        </span>
      );
    }
    const chain = CHAIN_LIST.find(c => c.id === net || c.nativeSymbol.toLowerCase() === net);
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan/15 text-cyan border border-cyan/30 uppercase tracking-tight">
        <Globe className="w-3 h-3" />
        {chain?.name || net}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-card-bg/95 to-midnight/95 border border-cyan/25 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan/20 to-primary/20 text-cyan border border-cyan/30">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                Address Book & Recipients
              </h2>
              <p className="text-xs text-text-secondary">
                Select a saved contact or recent transfer destination
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan/15 hover:bg-cyan/25 text-cyan text-xs font-semibold border border-cyan/30 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recipient</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Tabs */}
        <div className="p-6 pt-4 pb-3 space-y-3 bg-deep-navy/30 border-b border-border/40">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by recipient name, wallet address, or handle..."
              className="w-full pl-11 pr-10 py-3 bg-midnight/70 border border-border/80 focus:border-cyan focus:ring-1 focus:ring-cyan/30 rounded-xl text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 bg-midnight/80 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'recent'
                    ? 'bg-gradient-to-r from-cyan/20 to-primary/20 text-cyan shadow-sm border border-cyan/30'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Recent</span>
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'favorites'
                    ? 'bg-gradient-to-r from-cyan/20 to-primary/20 text-cyan shadow-sm border border-cyan/30'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-warning fill-warning/20" />
                <span>Favorites</span>
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'saved'
                    ? 'bg-gradient-to-r from-cyan/20 to-primary/20 text-cyan shadow-sm border border-cyan/30'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved</span>
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-cyan/20 to-primary/20 text-cyan shadow-sm border border-cyan/30'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All</span>
              </button>
            </div>

            {/* Network filter pills */}
            <div className="flex items-center gap-1 text-[11px]">
              {['all', 'internal', 'ethereum', 'tron', 'bsc'].map(net => (
                <button
                  key={net}
                  onClick={() => setSelectedNetworkFilter(net)}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-tight font-medium transition-all ${
                    selectedNetworkFilter === net
                      ? 'bg-cyan/20 text-cyan border border-cyan/40'
                      : 'bg-white/5 text-text-secondary hover:text-text-primary border border-transparent'
                  }`}
                >
                  {net === 'all' ? 'All Nets' : net}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipients List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 divide-y divide-border/20 scrollbar-thin">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan animate-spin mx-auto" />
              <p className="text-xs text-text-secondary">Loading address book...</p>
            </div>
          ) : recipients.length === 0 ? (
            <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-border flex items-center justify-center mx-auto text-text-secondary">
                <Bookmark className="w-6 h-6 opacity-40" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">
                {searchQuery
                  ? 'No recipients match your search'
                  : activeTab === 'favorites'
                  ? 'No favorite recipients yet'
                  : activeTab === 'recent'
                  ? 'No recent transfers found'
                  : 'Your address book is empty'}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {searchQuery
                  ? 'Try searching with another keyword, address, or network name.'
                  : 'Save recipient addresses after completing transfers or add contacts now to speed up sending next time.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan/15 hover:bg-cyan/25 text-cyan text-xs font-semibold border border-cyan/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save First Recipient</span>
                </button>
              )}
            </div>
          ) : (
            recipients.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectRecipient({
                    address: item.address,
                    network: item.network,
                    asset: item.asset,
                    isInternal: item.is_internal || item.network === 'internal',
                    label: item.label
                  });
                  onClose();
                }}
                className="group pt-2.5 first:pt-0 p-3.5 rounded-2xl hover:bg-white/[0.04] border border-transparent hover:border-cyan/20 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      item.is_internal || item.network === 'internal'
                        ? 'bg-success/10 border-success/30 text-success'
                        : 'bg-cyan/10 border-cyan/30 text-cyan'
                    }`}
                  >
                    {item.is_internal || item.network === 'internal' ? (
                      <Zap className="w-5 h-5" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary truncate">
                        {item.label}
                      </span>
                      {getNetworkBadge(item.network, item.is_internal)}
                      {item.asset && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-text-secondary border border-border">
                          {item.asset}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
                      <span>{formatShortAddress(item.address)}</span>
                      <button
                        type="button"
                        onClick={e => handleCopy(e, item.address, item.id)}
                        className="p-1 rounded hover:bg-white/10 text-text-secondary hover:text-cyan transition-colors"
                        title="Copy full address"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {item.note && (
                      <p className="text-[11px] text-text-secondary/70 italic truncate">
                        {item.note}
                      </p>
                    )}

                    {item.last_used_at && (
                      <p className="text-[10px] text-cyan/70 font-sans">
                        Last sent {item.last_amount ? `${item.last_amount} ${item.last_currency || ''}` : ''} •{' '}
                        {new Date(item.last_used_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={e => handleToggleFavorite(e, item)}
                    className={`p-2 rounded-xl transition-all ${
                      item.is_favorite
                        ? 'text-warning bg-warning/10 hover:bg-warning/20'
                        : 'text-text-secondary hover:text-warning hover:bg-white/5'
                    }`}
                    title={item.is_favorite ? 'Remove favorite' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-4 h-4 ${item.is_favorite ? 'fill-warning' : ''}`}
                    />
                  </button>

                  {item.saved_id && (
                    <button
                      type="button"
                      onClick={e => handleDelete(e, item.saved_id)}
                      className="p-2 rounded-xl text-text-secondary hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Remove contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="p-2 rounded-xl text-cyan opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-deep-navy/40 border-t border-border/50 flex items-center justify-between text-xs">
          <span className="text-text-secondary">
            {recipients.length} {recipients.length === 1 ? 'recipient' : 'recipients'} found
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-primary font-semibold transition-all"
          >
            Enter new address manually
          </button>
        </div>
      </div>

      {/* Add Recipient Inline Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-midnight/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-card-bg border border-cyan/30 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-cyan" />
                Save New Recipient
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveError && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveNewRecipient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Recipient Name / Label *
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="e.g. My Binance Wallet, Alice Personal"
                  required
                  className="w-full px-3.5 py-2.5 bg-midnight/80 border border-border focus:border-cyan rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Network *
                </label>
                <select
                  value={newNetwork}
                  onChange={e => setNewNetwork(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-midnight/80 border border-border focus:border-cyan rounded-xl text-sm text-text-primary focus:outline-none transition-all"
                >
                  <option value="internal">BitSilo Internal (Zero fee)</option>
                  <option value="ethereum">Ethereum (ERC20)</option>
                  <option value="tron">TRON (TRC20)</option>
                  <option value="bsc">BNB Smart Chain (BEP20)</option>
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="solana">Solana (SOL / SPL)</option>
                  <option value="polygon">Polygon</option>
                  <option value="arbitrum">Arbitrum</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Address or BitSilo Handle *
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  placeholder={newNetwork === 'internal' ? 'Username or deposit address' : '0x... or wallet address'}
                  required
                  className="w-full px-3.5 py-2.5 bg-midnight/80 border border-border focus:border-cyan rounded-xl text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Asset (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAsset}
                    onChange={e => setNewAsset(e.target.value)}
                    placeholder="e.g. USDT, ETH"
                    className="w-full px-3.5 py-2.5 bg-midnight/80 border border-border focus:border-cyan rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="e.g. Trading funds"
                    className="w-full px-3.5 py-2.5 bg-midnight/80 border border-border focus:border-cyan rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-cyan text-midnight font-bold text-xs hover:bg-cyan/90 transition-all flex items-center gap-1.5 shadow-md shadow-cyan/20 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Recipient</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
