'use client';

import { CHAIN_LIST, FIAT_ASSETS } from '@/lib/chains';

export default function ChainSupport() {
  return (
    <section id="supported" className="py-12 md:py-20 mb-16 md:mb-32 animate-fade-slide-up overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="p-6 sm:p-12 lg:p-16 bg-gradient-to-br from-cyan/5 to-lime/5 border border-cyan/10 sm:border-cyan/20 rounded-2xl sm:rounded-3xl text-center">
          <h2 className="font-orbitron text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 px-2">
            Supported Blockchain Networks
          </h2>
          <p className="text-text-secondary mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Send, receive, and manage assets across {CHAIN_LIST.length} blockchains — all from one unified wallet.
          </p>
          
          {/* Chains Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-12">
            {CHAIN_LIST.map((chain) => (
              <div
                key={chain.id}
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 bg-card-bg/50 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl hover:border-cyan hover:shadow-lg hover:shadow-cyan/5 transition-all hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110 transition-transform">
                  {chain.icon}
                </div>
                <div>
                  <div className="font-bold text-text-primary text-sm sm:text-base">{chain.name}</div>
                  <div className="text-[10px] sm:text-xs text-text-secondary font-semibold tracking-wider">
                    {chain.badge}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fiat section */}
          <div className="pt-8 border-t border-border/50">
            <h3 className="font-orbitron text-base sm:text-lg md:text-xl font-black mb-6 text-text-primary">
              Fiat On / Off Ramp
            </h3>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {FIAT_ASSETS.map((fiat) => (
                <div
                  key={fiat.symbol}
                  className="flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-2.5 sm:py-3.5 bg-card-bg/50 backdrop-blur-sm border border-border rounded-full hover:border-cyan transition-all group"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                    {fiat.icon}
                  </div>
                  <span className="text-sm sm:text-base font-bold text-text-primary">
                    {fiat.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">
                    {fiat.symbol}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
