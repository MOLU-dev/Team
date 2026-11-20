'use client';

import AppHeader from '@/components/shared/AppHeader';
import Background from '@/components/shared/Background';
import WithdrawFiat from '@/components/fiat/WithdrawFiat';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function FiatWithdrawPage() {
  return (
    <ProtectedRoute>
      <Background type="dashboard" />
      <div className="relative z-10 min-h-screen pb-32">
        <AppHeader showBackButton={true} backHref="/dashboard" />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl pt-28">
           <div className="mb-12 text-center animate-fade-slide-up">
              <h1 className="font-orbitron text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                 Withdraw <span className="text-danger">Funds</span>
              </h1>
              <p className="text-text-secondary text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                 Seamless withdrawals directly to your bank account. Secure and reliable transfers.
              </p>
           </div>
           
           <div className="animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
              <WithdrawFiat />
           </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
