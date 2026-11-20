'use client';

import AssetCard from './ui/AssetCard';
import Link from 'next/link';
import { useAuth } from './providers/AuthProvider';
import { ASSETS, CHAIN_LIST } from '@/lib/chains';

const highlightAssets = [
  {
    name: 'USDT',
    fullName: 'Tether USD',
    icon: ASSETS['USDT'].icon
  },
  {
    name: 'BTC',
    fullName: 'Bitcoin',
    icon: ASSETS['BTC'].icon
  },
  {
    name: 'ETH',
    fullName: 'Ethereum',
    icon: ASSETS['ETH'].icon
  },
  {
    name: 'NGN',
    fullName: 'Nigerian Naira',
    icon: ASSETS['NGN'].icon
  }
];

export default function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="pt-32 pb-16 md:pt-48 md:pb-32 text-center animate-fade-slide-up overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <h1 className="font-orbitron text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight tracking-tight mb-4 sm:mb-6">
          Your <span className="gradient-text">Multi-Chain</span><br className="hidden xs:block" />
          Fiat-Integrated Wallet
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-text-secondary max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
          Securely manage assets across {CHAIN_LIST.length} blockchains and seamless fiat deposits/withdrawals. 
          One wallet, infinite possibilities.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-16 sm:mb-24 px-4 sm:px-0">
          {isAuthenticated ? (
            <Link href="/dashboard" className="cta-button w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 text-base md:text-lg rounded-xl">
              Continue to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/signup" className="cta-button w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 text-base md:text-lg rounded-xl">
                Get Started Free
              </Link>
              <Link href="/auth/login" className="secondary-button w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 text-base md:text-lg rounded-xl">
                Sign In
              </Link>
            </>
          )}
        </div>
        
        <div className="mt-12 sm:mt-24 p-6 sm:p-8 md:p-12 bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/10 rounded-2xl backdrop-blur-sm animate-fade-slide-up">
          <h3 className="text-[10px] sm:text-xs uppercase tracking-widest text-text-secondary mb-6 sm:mb-10">
            Featured Assets & Support
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {highlightAssets.map((asset, index) => (
              <AssetCard key={index} {...asset} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
