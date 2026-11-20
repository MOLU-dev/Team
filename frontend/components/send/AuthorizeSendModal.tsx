'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, ShieldCheck, X, Zap, Globe, Lock } from 'lucide-react';
import { api } from '@/lib/api';

export interface AuthorizeSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: {
    id: string;
    fee: string;
    total: string;
    currency: string;
    previewType?: string;
    memo?: string;
    destinationTag?: number | string;
  } | null;
  amount: string;
  selectedAsset: string;
  recipientAddress: string;
  selectedNetwork: string;
  currentChain?: { name: string; icon?: React.ReactNode };
  isInternalRecipient: boolean;
  transferMethod: 'internal' | 'blockchain';
  instantSend: boolean;
  hasPin: boolean | null;
  maskedEmail?: string;
  onSuccess: (txHash: string) => void;
  onPinConfigured?: () => void;
}

export default function AuthorizeSendModal({
  isOpen,
  onClose,
  previewData,
  amount,
  selectedAsset,
  recipientAddress,
  selectedNetwork,
  currentChain,
  isInternalRecipient,
  transferMethod,
  instantSend,
  hasPin,
  maskedEmail,
  onSuccess,
  onPinConfigured,
}: AuthorizeSendModalProps) {
  const [pin, setPin] = useState('');
  const [setupNewPin, setSetupNewPin] = useState('');
  const [setupConfirmPin, setSetupConfirmPin] = useState('');
  const [otp, setOtp] = useState('');
  const [useOtpFallback, setUseOtpFallback] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localHasPin, setLocalHasPin] = useState<boolean | null>(hasPin);

  useEffect(() => {
    setLocalHasPin(hasPin);
  }, [hasPin]);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setSetupNewPin('');
      setSetupConfirmPin('');
      setOtp('');
      setUseOtpFallback(false);
      setModalError(null);
      setIsSubmitting(false);

      api.getPinStatus().then((res: any) => {
        if (res && res.success) {
          setLocalHasPin(Boolean(res.has_pin));
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !previewData) return null;

  const handleAuthorizeSend = async (codeToUse?: string) => {
    const authCode = codeToUse || (useOtpFallback ? otp : pin);
    if (!previewData || authCode.length < 6) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      const response = await api.approveSend(previewData.id, authCode);
      if (response.tx_hash) {
        onSuccess(response.tx_hash);
      } else {
        setModalError(response.message || 'Transaction authorization failed');
      }
    } catch (err: any) {
      console.error('Authorization failed:', err);
      setModalError(err.message || 'Failed to authorize transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupPinAndAuthorize = async () => {
    if (setupNewPin.length !== 6) {
      setModalError('PIN must be exactly 6 digits');
      return;
    }
    if (setupNewPin !== setupConfirmPin) {
      setModalError('PINs do not match');
      return;
    }
    if (!previewData) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      const setupRes: any = await api.setupPin(setupNewPin);
      if (!setupRes || !setupRes.success) {
        setModalError(setupRes?.message || 'Failed to set transaction PIN');
        setIsSubmitting(false);
        return;
      }
      setLocalHasPin(true);
      if (onPinConfigured) onPinConfigured();
      await handleAuthorizeSend(setupNewPin);
    } catch (err: any) {
      console.error('Failed to setup PIN & authorize:', err);
      setModalError(err.message || 'Failed to set transaction PIN');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-gradient-to-br from-deep-navy to-midnight border border-cyan/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,255,255,0.2)] animate-scale-up max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan/10 text-cyan border border-cyan/25">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Authorize Transfer</h3>
              <p className="text-xs text-text-secondary">Confirm transfer details and authenticate</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Review Summary Details */}
        <div className="p-4 bg-midnight/70 border border-border/80 rounded-2xl space-y-3 mb-6">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Sending Amount</span>
            <span className="text-text-primary font-bold font-mono text-base">
              {amount} {selectedAsset.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Recipient</span>
            <span className="text-text-primary font-mono text-xs truncate ml-4 max-w-[65%] text-right bg-white/5 px-2 py-1 rounded">
              {recipientAddress}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Network</span>
            <span className="text-text-primary flex items-center gap-2 font-medium">
              {currentChain && <span className="w-4 h-4 inline-block">{currentChain.icon}</span>}
              {currentChain?.name || selectedNetwork}
            </span>
          </div>
          {isInternalRecipient && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Transfer Route</span>
              {transferMethod === 'internal' ? (
                <span className="text-success font-semibold flex items-center gap-1.5 text-xs">
                  <Zap className="w-3.5 h-3.5" /> BitSilo Internal (Free & Instant)
                </span>
              ) : (
                <span className="text-cyan font-semibold flex items-center gap-1.5 text-xs">
                  <Globe className="w-3.5 h-3.5" /> On-Chain Blockchain
                </span>
              )}
            </div>
          )}
          {instantSend && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Priority</span>
              <span className="text-sky-400 font-bold flex items-center gap-1.5 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                InstantSend
              </span>
            </div>
          )}
          {previewData?.destinationTag !== undefined && previewData.destinationTag !== '' && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Destination Tag</span>
              <span className="text-cyan font-mono font-bold">
                {previewData.destinationTag}
              </span>
            </div>
          )}
          {previewData?.memo && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Memo</span>
              <span className="text-cyan font-mono truncate ml-4 max-w-[60%] text-right text-xs">
                {previewData.memo}
              </span>
            </div>
          )}
          {previewData?.fee && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Transaction Fee</span>
              <span className="text-text-primary font-medium">
                {previewData.fee}
              </span>
            </div>
          )}
          <div className="pt-3 border-t border-white/10 flex justify-between items-start text-sm">
            <span className="text-text-secondary font-medium pt-0.5">Total Deducted</span>
            {previewData?.total?.includes(' (~') ? (
              <div className="text-right ml-4">
                <span className="text-cyan font-bold font-mono text-sm sm:text-base">
                  {previewData.total.split(' (~')[0]}
                </span>
                <div className="text-xs text-text-secondary font-mono mt-0.5">
                  (~{previewData.total.split(' (~')[1]}
                </div>
              </div>
            ) : (
              <span className="text-cyan font-bold font-mono text-base text-right ml-4">{previewData?.total}</span>
            )}
          </div>
        </div>

        {/* Error Message inside Modal */}
        {modalError && (
          <div className="p-3.5 mb-5 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-danger" />
            <span>{modalError}</span>
          </div>
        )}

        {/* Authentication Form: Create PIN vs Verify PIN */}
        {localHasPin === false ? (
          /* Create PIN Flow */
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-300 text-xs">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Set Up Transaction PIN
              </p>
              <p className="opacity-80">
                You do not have a transaction PIN configured yet. Set a 6-digit PIN to authorize this transaction and future transfers securely.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Create 6-Digit PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={setupNewPin}
                onChange={(e) => setSetupNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full px-4 py-3.5 bg-midnight/70 border border-cyan/25 rounded-xl text-center text-xl font-mono tracking-[0.6em] text-cyan focus:outline-none focus:border-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Confirm 6-Digit PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={setupConfirmPin}
                onChange={(e) => setSetupConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full px-4 py-3.5 bg-midnight/70 border border-cyan/25 rounded-xl text-center text-xl font-mono tracking-[0.6em] text-cyan focus:outline-none focus:border-cyan"
              />
            </div>

            {setupNewPin && setupConfirmPin && setupNewPin !== setupConfirmPin && (
              <p className="text-xs text-danger">PINs do not match</p>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 border border-border rounded-xl text-sm font-semibold text-text-secondary hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetupPinAndAuthorize}
                disabled={isSubmitting || setupNewPin.length !== 6 || setupNewPin !== setupConfirmPin}
                className="flex-1 py-3.5 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/20 hover:shadow-cyan/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create PIN & Send'}
              </button>
            </div>
          </div>
        ) : !useOtpFallback ? (
          /* Enter Existing PIN Flow */
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Enter 6-Digit Transaction PIN
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUseOtpFallback(true);
                    setModalError(null);
                  }}
                  className="text-[11px] text-cyan hover:underline"
                >
                  Use email OTP instead
                </button>
              </div>
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full px-4 py-4 bg-midnight/70 border border-cyan/30 rounded-xl text-center text-2xl font-mono tracking-[0.6em] text-cyan focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-all"
              />
              <p className="text-[11px] text-text-secondary/70 text-center">
                Enter the 6-digit PIN set for your BitSilo account
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 border border-border rounded-xl text-sm font-semibold text-text-secondary hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAuthorizeSend()}
                disabled={pin.length < 6 || isSubmitting}
                className="flex-1 py-3.5 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/20 hover:shadow-cyan/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize & Send'}
              </button>
            </div>
          </div>
        ) : (
          /* Email OTP Fallback Flow */
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Enter Email Verification Code
                  {maskedEmail && (
                    <span className="ml-1 text-cyan lowercase">({maskedEmail})</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUseOtpFallback(false);
                    setModalError(null);
                  }}
                  className="text-[11px] text-cyan hover:underline"
                >
                  Use Transaction PIN
                </button>
              </div>
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-4 bg-midnight/70 border border-cyan/30 rounded-xl text-center text-2xl font-bold tracking-[0.5em] text-cyan focus:outline-none focus:border-cyan transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 border border-border rounded-xl text-sm font-semibold text-text-secondary hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAuthorizeSend()}
                disabled={otp.length < 6 || isSubmitting}
                className="flex-1 py-3.5 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/20 hover:shadow-cyan/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
