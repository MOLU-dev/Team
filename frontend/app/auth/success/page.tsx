'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { auth, api } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { login: authLogin } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // First set the token so upcoming API calls use it
      auth.setToken(token);
      
      const initializeUser = async () => {
        try {
          const response = await api.validateSession();
          if (response.success && response.user) {
            authLogin(token, response.user);
          } else {
            router.push('/auth/login');
          }
        } catch (err) {
          console.error('Failed to validate session after Google auth:', err);
          router.push('/auth/login');
        }
      };
      
      initializeUser();
    } else {
      router.push('/auth/login');
    }
  }, [searchParams, router, authLogin]);

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-cyan/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-cyan animate-[bounce_1s_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-cyan border-t-transparent animate-spin"></div>
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-text-primary">Authenticated</h2>
        <p className="text-text-secondary text-sm italic">Synchronizing your encrypted vault sessions...</p>
      </div>
    </div>
  );
}

export default function AuthSuccess() {
  return (
    <AuthLayout
      title="Access Granted"
      subtitle="Welcome back to BitSilo"
    >
      <Suspense fallback={<div className="text-cyan animate-pulse">Initializing...</div>}>
        <SuccessContent />
      </Suspense>
    </AuthLayout>
  );
}
