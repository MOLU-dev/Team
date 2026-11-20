'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordInput from './PasswordInput';
import FeaturesList from './FeaturesList';
import TermsCheckbox from './TermsCheckbox';
import { useAuth } from '@/components/providers/AuthProvider';
import Cookies from 'js-cookie';
import { useEffect } from 'react';

interface AuthFormProps {
  type: 'signup' | 'login';
}

type SignupStep = 'email' | 'otp' | 'account_details' | 'success';

export default function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const isSignUp = type === 'signup';

  const [step, setStep] = useState<SignupStep>(isSignUp ? 'email' : 'email'); // 'email' is the starting point for both, but login is single-step logic
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    agreeToTerms: false,
    currency: '',
    otp: '',
    verificationToken: ''
  });
  const [maskedEmail, setMaskedEmail] = useState('');

  useEffect(() => {
    if (isSignUp) {
      // Clear any stale session so a previous login doesn't interfere with registration
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      const savedCode = Cookies.get('referral_code');
      if (savedCode) {
        setFormData(prev => ({ ...prev, referralCode: savedCode }));
      }
    }
  }, [isSignUp]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear both field-specific error and general server error (submit) when user types
    if (errors[field] || errors.submit) {
      setErrors(prev => ({ ...prev, [field]: '', submit: '' }));
    }
  };

  const validateEmail = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    return newErrors;
  };

  const validateAccountDetails = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }

    return newErrors;
  };

  const handleRequestOTP = async (e?: React.FormEvent): Promise<boolean> => {
    if (e) e.preventDefault();
    const newErrors = validateEmail();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setIsLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const res = await api.requestOTP(formData.email);
      if (res.masked_email) setMaskedEmail(res.masked_email);
      setStep('otp');
      return true;
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to send OTP' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length < 6) {
      setErrors({ otp: 'Valid 6-digit OTP is required' });
      return;
    }

    setIsLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const verifyRes = await api.verifyOTP(formData.email, formData.otp);
      
      if (verifyRes.verification_token) {
        setFormData(prev => ({ ...prev, verificationToken: verifyRes.verification_token }));
        setStep('account_details');
      } else {
        throw new Error('Verification failed: No token received');
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Verification failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateAccountDetails();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const regRes = await api.register(
        formData.username,
        formData.password,
        formData.currency,
        formData.verificationToken,
        formData.referralCode
      );
      
      if (regRes.success) {
        setStep('success');
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Registration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMessage, setMfaMessage] = useState('');
  const [mfaMaskedEmail, setMfaMaskedEmail] = useState('');
  const [loginResendTimer, setLoginResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loginResendTimer > 0) {
      interval = setInterval(() => {
        setLoginResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loginResendTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setErrors({ submit: 'Email/Username and password are required' });
      return;
    }

    setIsLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const response = await api.login(formData.email, formData.password, mfaCode);
      
      if (response.status === 'mfa_required') {
        setMfaRequired(true);
        setMfaMessage(response.message || 'Please enter your authentication code');
        if (response.masked_email) setMfaMaskedEmail(response.masked_email);
        setIsLoading(false);
        return;
      }

      if (response.success && response.token && response.user) {
        authLogin(response.token, response.user);
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLoginOTP = async () => {
    if (loginResendTimer > 0) return;
    setIsLoading(true);
    try {
      const { api } = await import('@/lib/api');
      await api.login(formData.email, formData.password);
      setLoginResendTimer(60);
      setErrors({ submit: '' });
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to resend code' });
    } finally {
      setIsLoading(false);
    }
  };

  // Rendering Success State
  if (step === 'success') {
    return (
      <div className="text-center space-y-6 animate-fade-slide-up">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Registration Successful!</h2>
        <p className="text-text-secondary">
          Your account has been created and verified. You can now sign in to your dashboard.
        </p>
        <div className="pt-6">
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 transition-all"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Rendering OTP Step
  if (isSignUp && step === 'otp') {
    return (
      <OTPStep
        email={maskedEmail || formData.email}
        otp={formData.otp}
        onOTPChange={(val) => handleChange('otp', val)}
        onVerify={handleVerifyOTP}
        onResend={handleRequestOTP}
        onBack={() => setStep('email')}
        isLoading={isLoading}
        errors={errors}
      />
    );
  }

  // Rendering Account Details Step
  if (isSignUp && step === 'account_details') {
    return (
      <form onSubmit={handleFinalRegister} className="space-y-6 animate-fade-in" autoComplete="off">
        <div className="text-center space-y-2 mb-6">
          <h3 className="text-xl font-bold text-text-primary">Complete Your Profile</h3>
          <p className="text-text-secondary">Choose a username and a strong password</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-text-primary">
            Username <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="johndoe"
            className={`w-full px-4 py-3 bg-midnight/80 border rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-cyan/50 transition-all ${
              errors.username ? 'border-danger' : 'border-cyan/20 focus:border-cyan'
            }`}
          />
          {errors.username && <div className="text-xs text-danger animate-fade-in">{errors.username}</div>}
        </div>

        <PasswordInput
          value={formData.password}
          onChange={(value) => handleChange('password', value)}
          placeholder="Create a strong password"
          label="Password"
          error={errors.password}
          autoComplete="new-password"
        />

        <PasswordInput
          value={formData.confirmPassword}
          onChange={(value) => handleChange('confirmPassword', value)}
          placeholder="Re-enter your password"
          label="Confirm Password"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-text-primary">
            Referral Code (Optional)
          </label>
          <input
            type="text"
            value={formData.referralCode}
            onChange={(e) => handleChange('referralCode', e.target.value)}
            placeholder="Enter referral code"
            className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50 transition-all"
          />
        </div>

        <FeaturesList />

        <TermsCheckbox
          checked={formData.agreeToTerms}
          onChange={(checked) => handleChange('agreeToTerms', checked)}
          error={errors.agreeToTerms}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Creating Account...' : 'Complete Registration'}
        </button>

        {errors.submit && (
          <div className="text-center text-danger text-sm animate-fade-in">
            {errors.submit}
          </div>
        )}
      </form>
    );
  }

  // Rendering Initial Email / Login State
  return (
    <form onSubmit={isSignUp ? handleRequestOTP : handleLogin} className="space-y-6" autoComplete="off">
      {!mfaRequired ? (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">
              {isSignUp ? 'Email Address' : 'Username or Email'} <span className="text-danger">*</span>
            </label>
            <input
              type={isSignUp ? "email" : "text"}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={isSignUp ? "john@example.com" : "Username or email"}
              className={`w-full px-4 py-3 bg-midnight/80 border rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-cyan/50 transition-all ${
                errors.email ? 'border-danger' : 'border-cyan/20 focus:border-cyan'
              }`}
            />
            {errors.email && <div className="text-xs text-danger animate-fade-in">{errors.email}</div>}
          </div>

          {!isSignUp && (
            <PasswordInput
              value={formData.password}
              onChange={(value) => handleChange('password', value)}
              placeholder="Enter your password"
              label="Password"
              error={errors.password}
              autoComplete="current-password"
            />
          )}
        </>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-2 mb-6">
            <h3 className="text-xl font-bold text-cyan">Two-Factor Authentication</h3>
            <p className="text-text-secondary text-sm">
              {mfaMessage || 'Please enter the 6-digit code from your authenticator app'}
            </p>
            {mfaMaskedEmail && (
              <p className="text-xs text-text-secondary">
                Code sent to <span className="text-cyan font-semibold">{mfaMaskedEmail}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={mfaCode}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setMfaCode(digits.slice(0, 6));
                if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
                if (mfaMessage !== 'Please enter your authentication code') {
                  setMfaMessage('Please enter your authentication code');
                }
              }}
              placeholder="000000"
              className="w-full px-4 py-4 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50 transition-all"
              autoFocus
            />
          </div>
          
          {mfaMessage.includes('email') && (
            <div className="flex justify-end px-1 mt-2">
              <button
                type="button"
                onClick={handleResendLoginOTP}
                disabled={loginResendTimer > 0 || isLoading}
                className={`text-xs font-bold transition-all ${
                  loginResendTimer > 0 
                    ? 'text-text-secondary cursor-not-allowed' 
                    : 'text-cyan hover:text-electric-blue'
                }`}
              >
                {loginResendTimer > 0 ? `Resend in ${loginResendTimer}s` : 'Resend Code'}
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 disabled:opacity-50 transition-all"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </div>
        ) : (
          isSignUp ? 'Send Verification Code' : (mfaRequired ? 'Verify & Sign In' : 'Sign In')
        )}
      </button>

      {mfaRequired && (
        <button
          type="button"
          onClick={() => {
            setMfaRequired(false);
            setMfaCode('');
          }}
          className="w-full py-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          Back to Login
        </button>
      )}

      {errors.submit && (
        <div className="text-center text-danger text-sm animate-fade-in">
          {errors.submit}
        </div>
      )}
    </form>
  );
}

interface OTPStepProps {
  email: string;
  otp: string;
  onOTPChange: (val: string) => void;
  onVerify: (e: React.FormEvent) => void;
  onResend: () => Promise<boolean>;
  onBack: () => void;
  isLoading: boolean;
  errors: Record<string, string>;
}

function OTPStep({ email, otp, onOTPChange, onVerify, onResend, onBack, isLoading, errors }: OTPStepProps) {
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResend = async () => {
    if (resendTimer > 0) return;
    const success = await onResend();
    if (success) {
      setResendTimer(60);
    }
  };

  return (
    <form onSubmit={onVerify} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2 mb-6">
        <h3 className="text-xl font-bold text-text-primary">Verify Email</h3>
        <p className="text-text-secondary">
          We&apos;ve sent a 6-digit code to <span className="text-cyan">{email}</span>
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary text-center">
          Enter Verification Code
        </label>
        <input
          type="text"
          value={otp}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            onOTPChange(digits.slice(0, 6));
            if (errors.submit) {
              // Note: onOTPChange goes to handleChange which now clears submit, 
              // but we need to ensure that it propagates correctly.
              // We'll let handleChange handle it since we updated it above.
            }
          }}
          placeholder="000000"
          className={`w-full px-4 py-4 bg-midnight/80 border rounded-xl text-text-primary text-center text-2xl tracking-[0.5em] font-mono placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-cyan/50 transition-all ${
            errors.otp ? 'border-danger' : 'border-cyan/20 focus:border-cyan'
          }`}
        />
        {errors.otp && (
          <div className="text-xs text-danger text-center animate-fade-in">
            {errors.otp}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={isLoading || otp.length !== 6}
          className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={onBack}
            className="text-text-secondary hover:text-text-primary transition-colors text-xs font-medium"
          >
            ← Change Email
          </button>
          
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0 || isLoading}
            className={`text-xs font-bold transition-all ${
              resendTimer > 0 
                ? 'text-text-secondary cursor-not-allowed' 
                : 'text-cyan hover:text-electric-blue'
            }`}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="text-center text-danger text-sm animate-fade-in bg-danger/10 py-3 rounded-lg border border-danger/20">
          {errors.submit}
        </div>
      )}
    </form>
  );
}

