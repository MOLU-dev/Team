'use client';

import { Suspense } from 'react';
import Background from '@/components/shared/Background';
import AppHeader from '@/components/shared/AppHeader';
import PageHeader from '@/components/shared/PageHeader';
import ExchangeForm from '@/components/exchange/ExchangeForm';
import FloatingNavbar from '@/components/shared/FloatingNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function SwapPage() {
  return (
    <ProtectedRoute>
      <Background type="dashboard" />
      
      <div className="relative z-10 min-h-screen pb-32">
        <AppHeader showBackButton={true} backHref="/dashboard" />
        
        <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl pt-32">
          <PageHeader
            title="Swap Assets"
            description="Swap your cryptocurrencies instantly with low spreads and direct execution"
            icon={<RefreshCw className="w-8 h-8 text-cyan" />}
          />
          
          <Suspense fallback={
            <div className="main-card flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-cyan mb-4" />
              <p className="text-text-secondary">Initializing swap...</p>
            </div>
          }>
            <ExchangeForm />
          </Suspense>
        </main>
        <FloatingNavbar />
      </div>
    </ProtectedRoute>
  );
}
