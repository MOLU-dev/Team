'use client';

import { useState } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    setIsLoading(true);
    try {
      await api.forgotPassword(email);
      setIsSent(true);
      toast.success('Password reset link sent to your email');
      setErrors({});
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <AuthLayout title="Check Your Email" subtitle="We've sent a magic link to your email">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-cyan/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-text-secondary">
            If an account exists for <span className="text-cyan font-semibold">{email}</span>, you will receive a link to reset your password shortly.
          </p>
          <p className="text-sm text-text-secondary bg-deep-navy/40 p-4 rounded-xl border border-cyan/10">
            The link will expire in <span className="text-cyan font-bold">5 minutes</span> for your security.
          </p>
          <div className="pt-4">
            <Link href="/auth/login" className="text-cyan hover:text-electric-blue transition-colors font-semibold">
              Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a secure reset link">
      <form onSubmit={handleRequestReset} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-text-primary">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className={`w-full px-4 py-3 bg-midnight/80 border rounded-xl text-text-primary focus:outline-none transition-all ${
              errors.email ? 'border-danger' : 'border-cyan/20 focus:border-cyan'
            }`}
          />
          {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Sending...' : 'Send Magic Link'}
        </button>

        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-cyan hover:text-electric-blue transition-colors">
            Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
