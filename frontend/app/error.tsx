'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-midnight relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center">
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-slate-800 border border-rose-500/30 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-rose-500" />
          </div>
        </div>

        <h1 className="text-4xl font-black text-white mb-4 tracking-tighter font-orbitron">
          SYSTEM ERROR
        </h1>
        
        <p className="text-slate-400 mb-10 text-lg leading-relaxed">
          Something went wrong in the matrix. We've been notified and are looking into it.
        </p>

        {error.digest && (
          <div className="mb-10 px-4 py-2 bg-slate-800/50 rounded-xl border border-white/5 inline-block">
            <code className="text-xs text-slate-500 font-mono">
              Error ID: {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={reset}
            className="flex-1 cta-button flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link 
            href="/dashboard"
            className="flex-1 secondary-button flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
