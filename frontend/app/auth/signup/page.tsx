'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import SocialButtons from '@/components/auth/SocialButtons';
import AuthForm from '@/components/auth/AuthForm';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?state=signup`;
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join thousands of traders on BitSilo"
    >
      <SocialButtons
        onGoogleClick={handleGoogleSignIn}
      />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-cyan/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-deep-navy/80 text-text-secondary">Or sign up with email</span>
        </div>
      </div>

      <AuthForm type="signup" />

      <div className="mt-6 pt-6 border-t border-cyan/10 text-center">
        <p className="text-text-secondary">
          Already have an account?{' '}
          <Link 
            href="/auth/login" 
            className="text-cyan font-semibold hover:text-electric-blue transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
