'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import axios from 'axios';
import { api, auth } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';

function UsernameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get('token');

  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tempToken) {
      router.push('/auth/login');
    }
  }, [tempToken, router]);

  useEffect(() => {
    if (username.length < 3) {
      setStatus('idle');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setStatus('invalid');
      return;
    }

    setStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const data = await api.checkUsername(username);
        setStatus(data.available ? 'available' : 'taken');
      } catch (err) {
        console.error('Failed to check username', err);
        setStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const { login: authLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'available') return;

    setIsLoading(true);
    setError('');

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/complete-signup`,
        { temp_token: tempToken, username }
      );
      
      authLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete signup');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary ml-1">
          Pick a username
        </label>
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan font-bold">@</span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-4 bg-midnight/40 border border-cyan/20 rounded-2xl outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 text-text-primary transition-all placeholder:text-text-secondary/30"
            placeholder="cypherpunk_tx"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            maxLength={20}
            required
          />
        </div>

        <div className="flex items-center gap-2 px-2">
          {status === 'checking' && (
            <div className="flex items-center gap-2 text-cyan/70 text-xs italic animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan"></div>
              Checking availability...
            </div>
          )}
          {status === 'available' && (
            <div className="text-green-400 text-xs font-semibold flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Available
            </div>
          )}
          {status === 'taken' && (
            <div className="text-red-400 text-xs font-semibold flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Already taken
            </div>
          )}
          {status === 'invalid' && (
            <div className="text-red-400 text-xs italic">
              Min. 3 chars, lowercase letters, numbers & _ only
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status !== 'available' || isLoading}
        className="w-full py-4 bg-gradient-to-r from-cyan to-electric-blue text-deep-navy font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] disabled:opacity-40 disabled:hover:shadow-none transition-all active:scale-[0.98]"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-deep-navy border-t-transparent rounded-full animate-spin"></div>
            Setting up your vault...
          </div>
        ) : (
          'Confirm & Continue'
        )}
      </button>

      <p className="text-center text-xs text-text-secondary px-4">
        By picking a username, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}

export default function UsernamePage() {
  return (
    <AuthLayout
      title="Finish Setup"
      subtitle="Just one last step! Choose a unique username for your account."
    >
      <Suspense fallback={<div className="text-cyan animate-pulse">Loading setup...</div>}>
        <UsernameContent />
      </Suspense>
    </AuthLayout>
  );
}
