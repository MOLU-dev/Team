'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import PasswordInput from '@/components/auth/PasswordInput';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = searchParams.get('token');
    if (!t) {
      toast.error('Invalid or missing reset token');
      router.push('/auth/login');
      return;
    }
    setToken(t);
  }, [searchParams, router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!password) newErrors.password = 'New password is required';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword({
        token,
        new_password: password
      });
      setIsSuccess(true);
      toast.success('Password reset successful');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Password Reset" subtitle="Your password has been successfully updated">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-text-secondary">
            You can now use your new password to sign in to your account.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 transition-all"
          >
            Go to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create New Password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleResetPassword} className="space-y-6">
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="New password"
          label="New Password"
          error={errors.password}
          autoComplete="new-password"
        />

        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm new password"
          label="Confirm Password"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl shadow-lg shadow-cyan/30 hover:shadow-cyan/50 hover:-translate-y-1 disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>

        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Cancel and return to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
