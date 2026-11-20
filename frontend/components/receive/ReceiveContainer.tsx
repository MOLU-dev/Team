'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NetworkTabs from './NetworkTabs';
import QRCodeDisplay from './QRCodeDisplay';
import AddressDisplay from './AddressDisplay';
import InfoCards from './InfoCards';
import AssetSelectionDrawer from '../send/AssetSelectionDrawer';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { CHAIN_LIST, NATIVE_ASSETS, TOKEN_ASSETS, ASSETS, getChainsForAsset } from '@/lib/chains';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useAuth } from '@/components/providers/AuthProvider';
import { copyToClipboard } from '@/lib/clipboard';

export default function ReceiveContainer() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const assetParam = searchParams.get('asset');
  const chainParam = searchParams.get('chain');
  
  const [selectedAsset, setSelectedAsset] = useState(assetParam ? assetParam.toLowerCase() : '');
  const [selectedNetwork, setSelectedNetwork] = useState(chainParam || 'ethereum');
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [destinationTag, setDestinationTag] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config: appConfig } = useAppConfig();

  const isKycRequired = !user || (user.tier ?? 0) < 2;

  // Build the list of assets from the registry
  const assetOptions = [...NATIVE_ASSETS, ...TOKEN_ASSETS].map(a => ({
    value: a.symbol.toLowerCase(),
    label: `${a.name} (${a.symbol})`,
    symbol: a.symbol,
    native: a.type === 'native',
  }));

  const currentAsset = assetOptions.find(a => a.value === selectedAsset);
  const currentAssetInfo = currentAsset ? ASSETS[currentAsset.symbol] : null;
  
  // Build network options from the chains the selected asset supports
  const availableChains = currentAssetInfo ? getChainsForAsset(currentAssetInfo.symbol) : CHAIN_LIST;
  const networkOptions = availableChains.map(c => ({
    id: c.id,
    name: appConfig?.is_testnet && !c.name.toLowerCase().includes('testnet') && !c.name.toLowerCase().includes('devnet') && !c.name.toLowerCase().includes('sepolia')
      ? `${c.name} Testnet` 
      : c.name,
    badge: c.badge,
    icon: <div className="w-full h-full">{c.icon}</div>,
  }));

  const currentNetwork = CHAIN_LIST.find(c => c.id === selectedNetwork);

  // Auto-select first valid chain when asset changes
  useEffect(() => {
    if (currentAssetInfo) {
      const validChains = getChainsForAsset(currentAssetInfo.symbol);
      if (validChains.length > 0 && !validChains.some(c => c.id === selectedNetwork)) {
        setSelectedNetwork(validChains[0].id);
      }
    }
  }, [selectedAsset]);

  // Sync state from URL parameters when they change
  useEffect(() => {
    if (assetParam) {
      setSelectedAsset(assetParam.toLowerCase());
    }
    if (chainParam) {
      setSelectedNetwork(chainParam);
    }
  }, [assetParam, chainParam]);

  // Handle drawer param
  useEffect(() => {
    if (searchParams.get('drawer') === 'true' && !selectedAsset) {
      setIsAssetDrawerOpen(true);
    }
  }, [searchParams, selectedAsset]);

  useEffect(() => {
    const fetchAddress = async () => {
      if (!currentNetwork || !currentAsset || !selectedAsset) return;

      setIsLoading(true);
      setError(null);
      setAddress('');
      setDestinationTag(null);

      try {
        // Just try to get existing address
        const response = await api.getAddress(currentNetwork.id, currentAsset.symbol);
        
        if (response.success && response.address) {
          setAddress(response.address);
          setDestinationTag(response.destination_tag ?? null);
        } else {
          // Explicitly clear address if not found
          setAddress('');
          setDestinationTag(null);
        }
      } catch (err: any) {
        console.error('Failed to fetch address:', err);
        setAddress('');
        setDestinationTag(null);
        // Don't show error for 404/not found, just let the UI show the generate button
        if (err.status !== 404 && !err.message?.includes('not found')) {
          setError(err.message || 'Connection error. Please check your internet.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddress();
  }, [selectedNetwork, selectedAsset]);

  const generateAddress = async () => {
    if (!currentNetwork || !currentAsset || !selectedAsset) return;

    if (isKycRequired) {
      setError('Identity verification (KYC Tier 2) is required before generating deposit addresses. Please complete KYC.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const genResponse = await api.requestAddress(currentNetwork.id, currentAsset.symbol);
      if (genResponse.success && genResponse.address) {
        setAddress(genResponse.address);
        setDestinationTag(genResponse.destination_tag ?? null);
      } else {
        setError('Failed to generate address. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to generate address:', err);
      if (err.message?.includes('already have an address')) {
        // Fetch the existing address as a fallback
        try {
          const retry = await api.getAddress(currentNetwork.id, currentAsset.symbol);
          if (retry.success && retry.address) {
            setAddress(retry.address);
            setDestinationTag(retry.destination_tag ?? null);
            return;
          }
        } catch { /* fall through to error */ }
      }
      setError(err.message || 'Failed to generate address.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    if (address) {
      const ok = await copyToClipboard(address);
      if (ok) {
        alert('Address copied to clipboard!');
      } else {
        alert('Failed to copy. Please select and copy manually.');
      }
    }
  };

  const shareAddress = () => {
    if (address && navigator.share) {
      navigator.share({
        title: 'My BitSilo Wallet Address',
        text: `Send crypto to: ${address}`,
        url: window.location.href,
      });
    } else {
      copyAddress();
    }
  };

  const showNetworkSelector = currentAssetInfo && currentAssetInfo.chains.length > 1;

  return (
    <div className="main-card animate-fade-slide-up">
      {/* Asset Selection */}
      <div className="mb-8 pb-6 border-b border-white/5">
        <div className="text-sm uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Select Asset to Receive
          {appConfig?.is_testnet && (
            <span className="ml-auto px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-[10px] font-bold animate-pulse">
              TESTNET MODE
            </span>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => setIsAssetDrawerOpen(true)}
          className="w-full px-6 py-4 bg-deep-navy/60 border border-cyan/20 hover:border-cyan/40 rounded-2xl text-text-primary flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-card-bg/50 rounded-xl flex items-center justify-center border border-border overflow-hidden">
              {selectedAsset ? ASSETS[selectedAsset.toUpperCase()]?.icon : <div className="w-6 h-6 bg-white/10 rounded-full animate-pulse" />}
            </div>
            <div className="text-left">
              <div className="text-sm sm:text-base font-bold text-text-primary">{selectedAsset ? ASSETS[selectedAsset.toUpperCase()]?.name : 'Choose a cryptocurrency'}</div>
              <div className="text-[10px] sm:text-xs text-text-secondary uppercase">{selectedAsset || '---'}</div>
            </div>
          </div>
          <ChevronRight size={20} className="text-text-secondary group-hover:text-cyan transition-colors" />
        </button>

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

      </div>

      {/* Network Selection — only for multi-chain assets */}
      {showNetworkSelector && (
        <div className="mb-8 pb-6 border-b border-border">
          <div className="text-sm uppercase tracking-widest text-text-secondary mb-4">
            Select Network
          </div>
          <NetworkTabs
            networks={networkOptions}
            selectedNetwork={selectedNetwork}
            onSelect={setSelectedNetwork}
          />
        </div>
      )}

      {/* QR Code / Generate Section */}
      <div className="mb-8 text-center min-h-[200px] flex flex-col items-center justify-center">
        <div className="text-sm uppercase tracking-widest text-text-secondary mb-4">
          {address ? 'Scan QR Code' : 'Wallet Address'}
        </div>
        
        {isLoading ? (
          <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-cyan/20 rounded-xl bg-deep-navy/20">
            <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="w-full max-w-sm flex items-center justify-center border border-danger/20 rounded-xl bg-danger/5 text-danger text-sm p-4 mx-auto">
            {error}
          </div>
        ) : !selectedAsset ? (
           <div className="flex flex-col items-center justify-center p-8 border border-border border-dashed rounded-2xl bg-deep-navy/10 w-full max-w-sm mx-auto shadow-inner">
               <div className="w-16 h-16 bg-cyan/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
               </div>
               <p className="text-text-primary font-bold mb-2">No Asset Selected</p>
               <p className="text-text-secondary text-sm">
                   Please select a cryptocurrency from the dropdown above to continue.
               </p>
           </div>
        ) : !address ? (
          <div className="flex flex-col items-center justify-center p-8 border border-border border-dashed rounded-2xl bg-deep-navy/10 w-full max-w-sm mx-auto shadow-inner">
            {isKycRequired ? (
              <>
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-4 text-amber-400">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  KYC Tier 2 Required
                </div>
                <p className="text-text-primary font-bold text-base mb-2">Identity Verification Required</p>
                <p className="text-text-secondary text-sm mb-6 text-center">
                  To protect your funds and generate crypto deposit addresses, your account must be verified. Complete our quick multi-country identity verification in ~2 minutes.
                </p>
                <Link
                  href="/kyc"
                  className="py-3 px-6 bg-gradient-to-r from-cyan via-electric-blue to-cyan text-midnight font-bold rounded-xl hover:scale-[1.02] transition-transform w-full flex items-center justify-center gap-2 mb-3 shadow-lg shadow-cyan/10"
                >
                  Verify Identity Now <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  disabled
                  className="py-2.5 px-6 bg-white/5 border border-white/10 text-text-secondary/50 font-medium rounded-xl cursor-not-allowed w-full flex items-center justify-center gap-2 text-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Address Generation Locked
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-cyan/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m0-11h2m6 0h2M6 4v1m0 0v1h12V5m-12 0H4a2 2 0 00-2 2v10a2 2 0 002 2h2m0-14v1m12-1v1m0 0v1H6V5m12 0h2a2 2 0 012 2v10a2 2 0 01-2 2h-2m-12 0v1m12-1v1" />
                  </svg>
                </div>
                <p className="text-text-primary font-bold mb-2">No Address Found</p>
                <p className="text-text-secondary text-sm mb-6">
                  You don't have a receiving address for {currentAsset?.symbol} on the {currentNetwork?.name} network yet.
                </p>
                <button
                  onClick={generateAddress}
                  className="py-3 px-6 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl hover:scale-[1.02] transition-transform w-full"
                >
                  Generate Address
                </button>
              </>
            )}
          </div>
        ) : (
          <QRCodeDisplay address={address} />
        )}
      </div>

      {/* Address Display & Actions */}
      {address && (
        <div className="animate-fade-in">
          <div className="mb-6">
            <AddressDisplay address={address} />
          </div>

          {destinationTag !== null && (
            <div className="mb-6 animate-fade-in">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-xl p-4 flex flex-col items-center text-center shadow-lg shadow-yellow-500/10">
                <div className="flex items-center justify-center gap-2 mb-2 text-yellow-500">
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-black tracking-widest uppercase text-lg">Destination Tag Required</span>
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-white text-sm mb-4">
                  You <strong className="text-yellow-400">MUST</strong> include this tag when depositing XRP. If you forget it, your deposit will be lost or delayed. Contact support immediately if this happens.
                </p>
                <div className="bg-black/40 px-6 py-3 rounded-lg border border-yellow-500/30 flex items-center gap-4 w-full">
                  <div className="flex-1 text-left">
                    <div className="text-[10px] uppercase text-yellow-500/70 tracking-widest font-bold mb-1">Destination Tag</div>
                    <div className="font-mono text-2xl font-black text-yellow-400 tracking-wider">{destinationTag}</div>
                  </div>
                  <button
                    onClick={async () => {
                      const ok = await copyToClipboard(destinationTag.toString());
                      if (ok) alert('Tag copied to clipboard!');
                    }}
                    className="p-3 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 rounded-lg transition-colors border border-yellow-500/30 group"
                  >
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <button
              onClick={copyAddress}
              className="py-3 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Address
            </button>
            <button
              onClick={shareAddress}
              className="py-3 border-2 border-cyan/30 text-cyan font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-cyan/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
              Share
            </button>
          </div>

          <div className="p-4 bg-warning/5 border border-warning/30 rounded-xl flex gap-3 mb-8">
            <svg className="w-5 h-5 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div className="text-sm text-text-secondary">
              <strong>Important:</strong> Only send {currentAsset?.symbol} on the {currentNetwork?.name} ({currentNetwork?.badge}) network to this address. Sending other assets or using a different network may result in permanent loss of funds.
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <InfoCards />
    </div>
  );
}
