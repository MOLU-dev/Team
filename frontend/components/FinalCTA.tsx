"use client";

import Link from 'next/link'
import { useAuth } from './providers/AuthProvider'

export default function FinalCTA() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-16 md:py-32 text-center animate-fade-slide-up overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <h2 className="font-orbitron text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-6 sm:mb-8 tracking-tight px-4">
          Ready to Take Control?
        </h2>
        
        <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 md:mb-12 px-6">
          Join thousands of users managing their stablecoins securely 
          across multiple blockchains.
        </p>
        
        <div className="px-6 sm:px-0">
          {isAuthenticated ? (
            <Link href="/dashboard" className="cta-button w-full sm:w-auto px-10 sm:px-12 py-3.5 sm:py-4 text-base md:text-lg rounded-xl inline-block">
              Continue to Dashboard
            </Link>
          ) : (
            <Link href="/auth/signup" className="cta-button w-full sm:w-auto px-10 sm:px-12 py-3.5 sm:py-4 text-base md:text-lg rounded-xl inline-block">
              Get Started Now
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
