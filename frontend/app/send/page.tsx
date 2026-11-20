'use client';

import Background from '@/components/shared/Background';
import AppHeader from '@/components/shared/AppHeader';
import PageHeader from '@/components/shared/PageHeader';
import SendForm from '@/components/send/SendForm';
import FloatingNavbar from '@/components/shared/FloatingNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import { MoveUpRight } from 'lucide-react';

import { Suspense } from 'react';

export default function SendPage() {
  const sendIcon = <MoveUpRight size={32} />;

  return (
    <ProtectedRoute>
      <Background type="dashboard" />
      
      <div className="relative z-10 min-h-screen pb-32">
        <AppHeader showBackButton={true} backHref="/dashboard" />
        
        <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl pt-32">
          <PageHeader
            title="Send Crypto"
            description="Transfer your assets securely across blockchain networks"
            icon={sendIcon}
          />
          
          <Suspense fallback={<div className="main-card animate-pulse h-64 bg-white/5 rounded-2xl"></div>}>
            <SendForm />
          </Suspense>
        </main>
        <FloatingNavbar />
      </div>
    </ProtectedRoute>
  );
}
