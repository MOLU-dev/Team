'use client';

import Background from '@/components/shared/Background';
import AppHeader from '@/components/shared/AppHeader';
import PageHeader from '@/components/shared/PageHeader';
import FloatingNavbar from '@/components/shared/FloatingNavbar';
import TransactionList from '@/components/history/TransactionList';
import HistoryFilters from '@/components/history/HistoryFilters';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function HistoryPage() {
  const historyIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );

  return (
    <ProtectedRoute>
      <Background type="dashboard" />
      
      <div className="relative z-10 min-h-screen pb-32">
        <AppHeader showBackButton={true} backHref="/dashboard" />
        
        <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-[1400px] pt-32">
          <div className="max-w-4xl mx-auto">
            <PageHeader
              title="Transaction History"
              description="Track and monitor your multi-chain activities"
              icon={historyIcon}
            />
            
            <HistoryFilters />
            
            <div className="bg-gradient-to-br from-deep-navy/40 to-slate/20 border border-cyan/10 rounded-3xl p-6 md:p-8 animate-fade-slide-up">
              <TransactionList />
            </div>
          </div>
        </main>
        <FloatingNavbar />
      </div>
    </ProtectedRoute>
  );
}
