'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import SocialButtons from '@/components/auth/SocialButtons';
import AuthForm from '@/components/auth/AuthForm';
import Link from 'next/link';
import { toast } from 'sonner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      if (error === 'account_not_found') {
        toast.error('Account not found. Please register first.');
      } else {
        toast.error(`Authentication error: ${error}`);
      }
      // Clean up URL
      router.replace('/auth/login');
    }
  }, [searchParams, router]);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?state=login`;
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your BitSilo account"
    >
      <SocialButtons
        onGoogleClick={handleGoogleSignIn}
      />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-cyan/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-deep-navy/80 text-text-secondary">Or sign in with email</span>
        </div>
      </div>

      <AuthForm type="login" />

      <div className="mt-4 text-right">
        <Link 
          href="/auth/forgot-password"
          className="text-sm text-cyan hover:text-electric-blue transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-cyan/10 text-center">
        <p className="text-text-secondary">
          Don't have an account?{' '}
          <Link 
            href="/auth/signup" 
            className="text-cyan font-semibold hover:text-electric-blue transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
