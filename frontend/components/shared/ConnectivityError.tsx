'use client';

import React from 'react';
import { WifiOff, ServerCrash, RefreshCcw } from 'lucide-react';

interface ConnectivityErrorProps {
  type: 'internet' | 'backend';
  onRetry?: () => void;
}

export default function ConnectivityError({ type, onRetry }: ConnectivityErrorProps) {
  const isInternet = type === 'internet';

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-940 backdrop-blur-md overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-800 blur-[150px]" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center">
          <div className="relative group mb-8">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-500" />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-800/80 border border-white/10 shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent" />
              {isInternet ? (
                <WifiOff className="w-10 h-10 text-blue-400 animate-pulse" />
              ) : (
                <ServerCrash className="w-10 h-10 text-rose-400 animate-pulse" />
              )}
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
            {isInternet ? 'No Internet Connection' : 'Backend is Unreachable'}
          </h2>
          
          <p className="text-slate-400 mb-8 leading-relaxed max-w-sm">
            {isInternet 
              ? "It looks like you're offline. Check your connection to continue securely using BitSilo."
              : "Our servers are temporarily unavailable. We're working to restore access as quickly as possible."}
          </p>

          <button
            onClick={handleRetry}
            className="group relative flex items-center justify-center gap-2 w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-blue-900/40"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ease-out" />
            Try Reconnecting
          </button>

          <div className="mt-8 pt-8 border-t border-white/5 w-full">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Status: {isInternet ? 'Offline' : 'Server down'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
