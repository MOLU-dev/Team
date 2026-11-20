'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { api } from '@/lib/api';
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function SetupPinPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();

  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (step === 'enter') {
      inputRefs.current[0]?.focus();
    } else {
      confirmRefs.current[0]?.focus();
    }
  }, [step]);

  // If already authenticated and already has PIN, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.has_pin) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleDigitChange = (
    index: number,
    value: string,
    isConfirm: boolean
  ) => {
    // Only accept numeric digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const activePin = isConfirm ? [...confirmPin] : [...pin];
    activePin[index] = digit;

    if (isConfirm) {
      setConfirmPin(activePin);
    } else {
      setPin(activePin);
    }
    setError(null);

    // Auto-advance to next input
    if (digit && index < 5) {
      const nextRefs = isConfirm ? confirmRefs : inputRefs;
      nextRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    isConfirm: boolean
  ) => {
    const activePin = isConfirm ? confirmPin : pin;
    const activeRefs = isConfirm ? confirmRefs : inputRefs;

    if (e.key === 'Backspace' && !activePin[index] && index > 0) {
      activeRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent, isConfirm: boolean) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = pasted.split('');
    while (newDigits.length < 6) newDigits.push('');

    if (isConfirm) {
      setConfirmPin(newDigits);
      confirmRefs.current[Math.min(pasted.length, 5)]?.focus();
    } else {
      setPin(newDigits);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
    setError(null);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredPin = pin.join('');
    if (enteredPin.length !== 6) {
      setError('Please enter a 6-digit PIN');
      return;
    }
    setStep('confirm');
    setError(null);
  };

  const handleBackToEnter = () => {
    setStep('enter');
    setConfirmPin(['', '', '', '', '', '']);
    setError(null);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredPin = pin.join('');
    const confirmedPin = confirmPin.join('');

    if (confirmedPin.length !== 6) {
      setError('Please enter the 6-digit confirmation PIN');
      return;
    }

    if (enteredPin !== confirmedPin) {
      setError('PINs do not match. Please try again.');
      setConfirmPin(['', '', '', '', '', '']);
      confirmRefs.current[0]?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.setupPin(enteredPin);
      if (res && res.success === false) {
        throw new Error(res.error || res.message || 'Failed to setup PIN');
      }

      toast.success('Security PIN configured successfully!');
      // Update Auth context user so has_pin = true
      updateUser({ has_pin: true });

      // Redirect immediately to dashboard
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save PIN');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={step === 'enter' ? 'Setup Security PIN' : 'Confirm Security PIN'}
      subtitle={
        step === 'enter'
          ? 'Create a 6-digit PIN to secure your withdrawals and transfers'
          : 'Re-enter your 6-digit PIN to verify'
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-2 p-3 bg-cyan/10 border border-cyan/20 rounded-xl text-cyan text-xs">
          <ShieldCheck size={16} className="shrink-0" />
          <span>Required before accessing your dashboard and for fiat withdrawals.</span>
        </div>

        {error && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm flex items-center gap-2 animate-fade-in">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'enter' ? (
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={(e) => handlePaste(e, false)}>
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value, false)}
                  onKeyDown={(e) => handleKeyDown(idx, e, false)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-midnight/80 border border-cyan/30 rounded-xl text-cyan focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all shadow-inner"
                />
              ))}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-xs text-text-secondary hover:text-cyan flex items-center gap-1 transition-colors"
              >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={pin.join('').length !== 6}
              className="w-full py-4 bg-gradient-to-r from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Continue to Confirm
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={(e) => handlePaste(e, true)}>
              {confirmPin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    confirmRefs.current[idx] = el;
                  }}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value, true)}
                  onKeyDown={(e) => handleKeyDown(idx, e, true)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-midnight/80 border border-cyan/30 rounded-xl text-cyan focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all shadow-inner"
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToEnter}
                className="text-xs text-text-secondary hover:text-cyan transition-colors"
              >
                ← Change PIN
              </button>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-xs text-text-secondary hover:text-cyan flex items-center gap-1 transition-colors"
              >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={confirmPin.join('').length !== 6 || isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                  <span>Securing Vault...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Set PIN & Go to Dashboard</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
