'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import AppHeader from '@/components/shared/AppHeader';
import Background from '@/components/shared/Background';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function TransactionStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const asset = searchParams.get('asset') || searchParams.get('currency');
  const reference = searchParams.get('reference') || searchParams.get('ref') || searchParams.get('trxref');
  const rawStatus = (searchParams.get('status') || '').toLowerCase();
  const isDeclinedOrFailedParam = rawStatus === 'declined' || rawStatus === 'failed';
  const isCancelledParam = searchParams.get('cancelled') === 'true' || 
                           rawStatus === 'cancelled' ||
                           searchParams.get('event') === 'cancel';
  
  const [status, setStatus] = useState<'polling' | 'completed' | 'failed' | 'timeout' | 'not_found' | 'cancelled'>(
    isCancelledParam ? 'cancelled' : (isDeclinedOrFailedParam ? 'failed' : 'polling')
  );
  const [attempts, setAttempts] = useState(0);
  const [txnData, setTxnData] = useState<any>(null);

  useEffect(() => {
    if (!reference) {
      setStatus('not_found');
      return;
    }

    if (isCancelledParam) {
      api.cancelFiatDeposit(reference, 'cancelled by user').catch(() => {});
      setStatus('cancelled');
      return;
    }

    if (isDeclinedOrFailedParam) {
      api.cancelFiatDeposit(reference, 'payment declined or failed').catch(() => {});
      setStatus('failed');
      return;
    }

    let interval: NodeJS.Timeout | null = null;

    const verifyAndPoll = async () => {
      // 1. Immediately verify directly with backend -> Paystack
      try {
        const verifyRes: any = await api.verifyFiatDeposit(reference);
        if (verifyRes.status === 'completed') {
          setTxnData(verifyRes);
          setStatus('completed');
          return;
        } else if (verifyRes.status === 'failed' || verifyRes.status === 'cancelled' || verifyRes.status === 'declined') {
          setStatus(verifyRes.status === 'cancelled' ? 'cancelled' : 'failed');
          return;
        }
      } catch (err: any) {
        console.warn('Initial direct verification returned:', err);
        const errStr = (err?.message || '').toLowerCase();
        if (errStr.includes('declined') || errStr.includes('failed') || errStr.includes('cancelled') || errStr.includes('abandoned')) {
          setStatus(errStr.includes('cancelled') ? 'cancelled' : 'failed');
          return;
        }
      }

      // 2. Fall back to polling status in case of asynchronous webhook settlement
      const poll = async () => {
        try {
          const response: any = await api.getFiatTransactionStatus(reference);
          if (response.status === 'completed') {
            setTxnData(response);
            setStatus('completed');
            return true;
          } else if (response.status === 'failed' || response.status === 'cancelled' || response.status === 'declined') {
            setStatus(response.status === 'cancelled' ? 'cancelled' : 'failed');
            return true;
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
        return false;
      };

      interval = setInterval(async () => {
        setAttempts(prev => {
          if (prev >= 20) { // Timeout after ~1 minute
            setStatus('timeout');
            if (interval) clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });

        const done = await poll();
        if (done && interval) clearInterval(interval);
      }, 3000);

      const done = await poll();
      if (done && interval) clearInterval(interval);
    };

    verifyAndPoll();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [reference, isCancelledParam]);

  if (status === 'not_found' || !reference) {
    return (
      <div className="main-card max-w-md mx-auto text-center p-12">
        <XCircle className="text-danger mx-auto mb-6" size={64} />
        <h2 className="text-2xl font-bold mb-4">Reference Missing</h2>
        <p className="text-text-secondary mb-8">No transaction reference found in the URL. Please check your transaction history.</p>
        <button onClick={() => router.push(asset ? `/asset/${asset}` : '/dashboard')} className="btn-primary w-full py-4">
          Back to {asset ? `${asset} Page` : 'Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {status === 'polling' && (
        <div className="main-card text-center p-12 animate-fade-slide-up">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-cyan/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-cyan border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="text-cyan animate-pulse" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4 font-orbitron">Verifying Payment</h2>
          <p className="text-text-secondary mb-2">We're confirming your transaction with Paystack.</p>
          <p className="text-xs text-text-secondary opacity-50">This may take a few moments...</p>
        </div>
      )}

      {status === 'completed' && (
        <div className="main-card text-center p-12 animate-fade-slide-up">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-subtle">
            <CheckCircle2 className="text-success" size={64} />
          </div>
          <h2 className="text-3xl font-bold mb-2 font-orbitron">Success!</h2>
          <p className="text-text-secondary mb-8">Your deposit has been confirmed and your balance has been updated.</p>
          
          <div className="bg-white/5 border border-border rounded-xl p-6 mb-8 text-left space-y-3">
             <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Amount:</span>
                <span className="font-bold text-success">+{txnData?.amount} {txnData?.currency}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Reference:</span>
                <span className="font-mono text-xs">{reference.substring(0, 16)}...</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Method:</span>
                <span className="capitalize">{txnData?.processor}</span>
             </div>
          </div>

          <button 
            onClick={() => router.push(asset ? `/asset/${asset}` : '/dashboard')} 
            className="w-full py-4 bg-gradient-to-r from-success to-emerald-500 text-midnight font-bold rounded-xl shadow-lg shadow-success/20 hover:shadow-success/40 transition-all flex items-center justify-center gap-2 group"
          >
            {asset ? `Go to ${asset} Asset` : 'Go to Wallet'} <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </button>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="main-card text-center p-12 animate-fade-slide-up">
          <div className="w-24 h-24 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle className="text-warning" size={64} />
          </div>
          <h2 className="text-2xl font-bold mb-4 font-orbitron text-text-primary">
             Deposit Cancelled
          </h2>
          <p className="text-text-secondary mb-8 leading-relaxed">
            Your deposit was cancelled and marked as cancelled. No funds were deducted from your payment account.
          </p>
          
          <button 
            onClick={() => router.push(asset ? `/asset/${asset}` : '/fiat')} 
            className="btn-primary w-full py-4 mb-4"
          >
            {asset ? `Return to ${asset} Page` : 'Return to Fiat Wallet'}
          </button>
          <button 
            onClick={() => router.push(`/fiat/deposit${asset ? `?currency=${asset}` : ''}`)} 
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-cyan text-sm font-semibold rounded-xl border border-cyan/30 transition-all"
          >
            Try Deposit Again
          </button>
        </div>
      )}

      {(status === 'failed' || status === 'timeout') && (
        <div className="main-card text-center p-12 animate-fade-slide-up">
          <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle className="text-danger" size={64} />
          </div>
          <h2 className="text-2xl font-bold mb-4 font-orbitron">
             {status === 'timeout' ? 'Pending Review' : 'Payment Failed'}
          </h2>
          <p className="text-text-secondary mb-8 leading-relaxed">
            {status === 'timeout' 
              ? "We couldn't confirm your payment instantly. Don't worry, if the funds were deducted, your balance will be updated automatically within minutes."
              : "Your payment was declined or could not be completed. The transaction has been updated to failed."}
          </p>
          
          <button 
            onClick={() => router.push(asset ? `/asset/${asset}` : '/fiat/deposit')} 
            className="btn-primary w-full py-4 mb-4"
          >
            {asset ? `Return to ${asset} Page` : 'Try Again'}
          </button>
          <button 
            onClick={() => router.push('/support')} 
            className="w-full py-4 text-text-secondary hover:text-text-primary transition-colors text-sm font-semibold"
          >
            Contact Support
          </button>
        </div>
      )}

      <div className="mt-8 p-4 bg-white/5 border border-border rounded-2xl flex items-start gap-3 animate-fade-in">
        <ShieldCheck className="text-cyan mt-1 flex-shrink-0" size={18} />
        <p className="text-xs text-text-secondary leading-relaxed">
          Your transactions are protected by end-to-end encryption. For security, never share your transaction reference with anyone outside our official support channels.
        </p>
      </div>
    </div>
  );
}

export default function FiatCallbackPage() {
  return (
    <ProtectedRoute>
      <Background type="dashboard" />
      <div className="relative z-10 min-h-screen pb-32">
        <AppHeader showBackButton={false} />
        <main className="container mx-auto px-4 max-w-4xl pt-28">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center pt-20">
              <Loader2 className="w-12 h-12 text-cyan animate-spin mb-4" />
              <p className="text-text-secondary font-orbitron animate-pulse">Initializing Status Hub...</p>
            </div>
          }>
            <TransactionStatus />
          </Suspense>
        </main>
      </div>
    </ProtectedRoute>
  );
}
