'use client';

import { useState, useEffect } from 'react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { QRCodeSVG } from 'qrcode.react';
import { copyToClipboard } from '@/lib/clipboard';
import { api } from '@/lib/api';

export default function SecuritySettings() {
  const [biometricAuth, setBiometricAuth] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [email2FA, setEmail2FA] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorHeader, setErrorHeader] = useState('');

  // Transaction PIN State
  const [hasPin, setHasPin] = useState(false);
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinMode, setPinMode] = useState<'setup' | 'change'>('setup');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinPassword, setPinPassword] = useState('');
  const [pinStatus, setPinStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pinError, setPinError] = useState('');

  // 2FA Setup State
  const [mfaStep, setMfaStep] = useState(1);
  const [mfaData, setMfaData] = useState<{ secret: string; qrCode: string; backupCodes: string[] } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [token, pinRes] = await Promise.all([
        localStorage.getItem('authToken'),
        api.getPinStatus().catch(() => null),
      ]);

      if (pinRes?.success) {
        setHasPin(Boolean(pinRes.has_pin));
        setIsPinLocked(Boolean(pinRes.is_locked));
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIs2FAEnabled(data.totp);
          setEmail2FA(data.settings.otp_enabled);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const startMfaSetup = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/settings/totp/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(10_000),
      });
      const data = await response.json();
      if (data.success) {
        setMfaData({
          secret: data.secret,
          qrCode: data.qrCode,
          backupCodes: data.backupCodes
        });
        setMfaStep(1);
        setIs2FAModalOpen(true);
      }
    } catch (err) {
      alert('Failed to initialize 2FA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnableMfa = async () => {
    if (!mfaData) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/settings/totp/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          secret: mfaData.secret,
          code: verificationCode
        })
      });
      const data = await response.json();
      if (data.success) {
        setMfaStep(3);
        setIs2FAEnabled(true);
      } else {
        alert(data.error || 'Invalid verification code');
      }
    } catch (err) {
      alert('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const disableMfa = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/settings/totp/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setIs2FAEnabled(false);
        alert('2FA has been disabled');
      }
    } catch (err) {
      alert('Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEmail2FA = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp_enabled: enabled })
      });
      const data = await response.json();
      if (data.success) {
        setEmail2FA(enabled);
      } else {
        alert(data.error || 'Failed to update email 2FA setting');
      }
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };



  const handleSetPassword = async () => {
    if (password !== confirmPassword) return;
    setIsLoading(true);
    setStatus('idle');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update password');
      }

      setStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setPassword('');
        setConfirmPassword('');
        setStatus('idle');
      }, 2000);
    } catch (err: any) {
      setErrorHeader(err.message);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setPinError('PIN must be exactly 6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PIN confirmation does not match');
      return;
    }
    if (pinMode === 'change' && (!oldPin || oldPin.length !== 6)) {
      setPinError('Current 6-digit PIN is required');
      return;
    }

    setIsLoading(true);
    setPinStatus('idle');
    try {
      if (pinMode === 'setup') {
        const res: any = await api.setupPin(newPin, pinPassword);
        if (res?.success) {
          setPinStatus('success');
          setHasPin(true);
          setTimeout(() => {
            setIsPinModalOpen(false);
            setNewPin('');
            setConfirmPin('');
            setPinPassword('');
            setPinStatus('idle');
          }, 1500);
        } else {
          setPinError(res?.error || res?.message || 'Failed to setup PIN');
          setPinStatus('error');
        }
      } else {
        const res: any = await api.changePin(oldPin, newPin, pinPassword);
        if (res?.success) {
          setPinStatus('success');
          setTimeout(() => {
            setIsPinModalOpen(false);
            setOldPin('');
            setNewPin('');
            setConfirmPin('');
            setPinPassword('');
            setPinStatus('idle');
          }, 1500);
        } else {
          setPinError(res?.error || res?.message || 'Failed to change PIN');
          setPinStatus('error');
        }
      }
    } catch (err: any) {
      setPinError(err.message || 'Operation failed');
      setPinStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-2">Security</h2>
      <p className="text-text-secondary mb-6">Manage your password and two-factor authentication</p>

      <div className="space-y-6">
        {/* Password */}
        <div className="flex justify-between items-center py-4 border-b border-cyan/10">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Password</h3>
            <p className="text-sm text-text-secondary">Security for your account</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 border-2 border-cyan/30 text-cyan font-semibold rounded-lg hover:bg-cyan/10 transition-colors"
          >
            Update Password
          </button>
        </div>

        {/* Password Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-gradient-to-br from-deep-navy to-midnight border border-cyan/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,255,255,0.2)] animate-scale-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-cyan">Update Password</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-midnight/60 border border-cyan/20 rounded-xl outline-none focus:border-cyan text-text-primary transition-all"
                    placeholder="Min. 8 characters"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-midnight/60 border border-cyan/20 rounded-xl outline-none focus:border-cyan text-text-primary transition-all"
                    placeholder="Repeat password"
                  />
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 italic">Passwords do not match</p>
                )}

                {status === 'success' && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center font-semibold">
                       ✓ Password updated successfully!
                    </div>
                )}

                {status === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                       {errorHeader}
                    </div>
                )}

                <button
                  disabled={!password || password !== confirmPassword || isLoading || status === 'success'}
                  onClick={handleSetPassword}
                  className="w-full py-4 mt-4 bg-cyan text-deep-navy font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all disabled:opacity-40"
                >
                  {isLoading ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction PIN */}
        <div className="flex justify-between items-center py-4 border-b border-cyan/10">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-text-primary">Transaction PIN</h3>
              {isPinLocked ? (
                <span className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-full">
                  Locked
                </span>
              ) : hasPin ? (
                <span className="px-2.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold rounded-full">
                  Configured
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full">
                  Not Set
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-1">6-digit PIN required to authorize cryptocurrency swaps and withdrawals</p>
          </div>
          <button
            onClick={() => {
              setPinMode(hasPin ? 'change' : 'setup');
              setOldPin('');
              setNewPin('');
              setConfirmPin('');
              setPinPassword('');
              setPinError('');
              setPinStatus('idle');
              setIsPinModalOpen(true);
            }}
            className="px-4 py-2 border-2 border-cyan/30 text-cyan font-semibold rounded-lg hover:bg-cyan/10 transition-colors"
          >
            {hasPin ? 'Change PIN' : 'Set Up PIN'}
          </button>
        </div>

        {/* Transaction PIN Modal */}
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-gradient-to-br from-deep-navy to-midnight border border-cyan/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,255,255,0.2)] animate-scale-up">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-cyan">
                  {pinMode === 'setup' ? 'Set Transaction PIN' : 'Change Transaction PIN'}
                </h3>
                <button
                  onClick={() => setIsPinModalOpen(false)}
                  className="text-text-secondary hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-text-secondary mb-6">
                {pinMode === 'setup'
                  ? 'Create a 6-digit PIN to securely authorize swaps and withdrawals.'
                  : 'Enter your current PIN and choose a new 6-digit PIN.'}
              </p>

              <div className="space-y-4">
                {pinMode === 'change' && (
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Current PIN (6 digits)</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-midnight/60 border border-cyan/20 rounded-xl outline-none focus:border-cyan text-text-primary text-center tracking-[0.5em] text-lg font-mono transition-all"
                      placeholder="••••••"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">
                    {pinMode === 'setup' ? '6-Digit PIN' : 'New 6-Digit PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-midnight/60 border border-cyan/20 rounded-xl outline-none focus:border-cyan text-text-primary text-center tracking-[0.5em] text-lg font-mono transition-all"
                    placeholder="••••••"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Confirm PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-midnight/60 border border-cyan/20 rounded-xl outline-none focus:border-cyan text-text-primary text-center tracking-[0.5em] text-lg font-mono transition-all"
                    placeholder="••••••"
                  />
                </div>

                {newPin && confirmPin && newPin !== confirmPin && (
                  <p className="text-xs text-red-500 italic">PINs do not match</p>
                )}

                {newPin && newPin.length !== 6 && (
                  <p className="text-xs text-amber-400 italic">PIN must be exactly 6 digits</p>
                )}

                {pinStatus === 'success' && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center font-semibold">
                    ✓ PIN {pinMode === 'setup' ? 'set up' : 'changed'} successfully!
                  </div>
                )}

                {pinStatus === 'error' && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                    {pinError}
                  </div>
                )}

                <button
                  disabled={
                    isLoading ||
                    pinStatus === 'success' ||
                    newPin.length !== 6 ||
                    newPin !== confirmPin ||
                    (pinMode === 'change' && oldPin.length !== 6)
                  }
                  onClick={handlePinSubmit}
                  className="w-full py-4 mt-2 bg-cyan text-deep-navy font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isLoading
                    ? 'Processing...'
                    : pinMode === 'setup'
                    ? 'Set Transaction PIN'
                    : 'Update Transaction PIN'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2FA */}
        <div className="flex justify-between items-center py-4 border-b border-cyan/10">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Two-Factor Authentication</h3>
            <p className="text-sm text-text-secondary">Add an extra layer of security to your account</p>
          </div>
          <div className="flex items-center gap-4">
            {is2FAEnabled ? (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold rounded-full">
                  Enabled
                </span>
                <button 
                  onClick={disableMfa}
                  className="text-xs text-red-400 hover:text-red-300 underline font-medium transition-colors"
                >
                  Disable
                </button>
              </div>
            ) : (
              <button 
                onClick={startMfaSetup}
                className="px-4 py-2 bg-cyan text-deep-navy font-bold rounded-lg hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all"
              >
                Enable 2FA
              </button>
            )}
          </div>
        </div>

        {/* 2FA Modal */}
        {is2FAModalOpen && mfaData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/90 backdrop-blur-xl">
            <div className="w-full max-w-lg bg-gradient-to-br from-deep-navy to-midnight border border-cyan/30 rounded-3xl p-8 shadow-[0_0_60px_rgba(0,255,255,0.25)] animate-scale-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-cyan">Setup 2FA</h3>
                {mfaStep !== 2 && (
                  <button onClick={() => setIs2FAModalOpen(false)} className="text-text-secondary hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {mfaStep === 1 && (
                <div className="space-y-6 text-center">
                  <p className="text-text-secondary text-sm">
                    Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  
                  <div className="bg-white p-4 rounded-2xl inline-block shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <QRCodeSVG value={mfaData.qrCode} size={200} />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-text-secondary uppercase font-bold tracking-widest">Manual Entry Secret</p>
                    <div className="p-3 bg-midnight/60 border border-cyan/20 rounded-xl font-mono text-cyan break-all">
                      {mfaData.secret}
                    </div>
                  </div>

                  <button
                    onClick={() => setMfaStep(2)}
                    className="w-full py-4 bg-cyan text-deep-navy font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all"
                  >
                    I&apos;ve Scanned It
                  </button>
                </div>
              )}

              {mfaStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-text-secondary text-sm mb-4">
                      Enter the 6-digit code from your app to verify the setup
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-4xl tracking-[1em] font-bold py-4 bg-midnight/60 border border-cyan/20 rounded-xl outline-none focus:border-cyan text-cyan"
                      placeholder="000000"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setMfaStep(1)}
                      className="flex-1 py-4 border-2 border-cyan/30 text-cyan font-bold rounded-xl hover:bg-cyan/10 transition-all"
                    >
                      Back
                    </button>
                    <button
                      disabled={verificationCode.length !== 6 || isLoading}
                      onClick={verifyAndEnableMfa}
                      className="flex-2 py-4 bg-cyan text-deep-navy font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all disabled:opacity-40"
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </div>
              )}

              {mfaStep === 3 && (
                <div className="space-y-6 text-center">
                   <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/40 animate-pulse">
                      <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                   </div>
                   <h4 className="text-xl font-bold text-text-primary">2FA Enabled Successfully!</h4>
                   <p className="text-sm text-text-secondary">
                      Save these backup codes in a secure place. They can be used to access your account if you lose your device.
                   </p>
                   
                   <div className="grid grid-cols-2 gap-3 p-4 bg-midnight/60 border border-cyan/10 rounded-2xl font-mono text-cyan">
                      {mfaData.backupCodes.map(code => (
                        <div key={code} className="py-2 border border-cyan/5 rounded-lg bg-deep-navy/40">
                          {code}
                        </div>
                      ))}
                   </div>

                   <button
                    onClick={() => setIs2FAModalOpen(false)}
                    className="w-full py-4 bg-cyan text-deep-navy font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all"
                  >
                    Finish
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email 2FA */}
        <div className="flex justify-between items-center py-4 border-b border-cyan/10">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Email 2FA</h3>
            <p className="text-sm text-text-secondary">Receive a verification code via email during login</p>
          </div>
          <ToggleSwitch enabled={email2FA} onChange={handleToggleEmail2FA} />
        </div>

      </div>
    </div>
  );
}
