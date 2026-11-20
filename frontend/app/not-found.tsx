'use client';

import React from 'react';
import { Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-midnight relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-cyan/5 blur-[100px] animate-drift" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-electric-blue/5 blur-[120px] animate-drift [animation-delay:2s]" />
      </div>

      <div className="relative w-full max-w-xl bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-12 rounded-[3rem] shadow-2xl text-center">
        <div className="mb-12 relative inline-block">
          <div className="text-[12rem] font-black text-white/5 select-none leading-none tracking-tighter">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan to-electric-blue flex items-center justify-center rotate-12 shadow-2xl shadow-cyan/20">
              <Search className="w-12 h-12 text-midnight -rotate-12" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-black text-white mb-4 tracking-tighter font-orbitron">
          PAGE NOT FOUND
        </h1>
        
        <p className="text-slate-400 mb-12 text-lg leading-relaxed max-w-md mx-auto">
          The module you're looking for doesn't exist or has been relocated to another sector of the vault.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.back()}
            className="secondary-button flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <Link 
            href="/dashboard"
            className="cta-button flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Vault Home
          </Link>
        </div>
      </div>
    </div>
  );
}
