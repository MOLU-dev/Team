'use client';

import Link from 'next/link';
import { useAuth } from './providers/AuthProvider';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-midnight/80 backdrop-blur-md border-b border-cyan/10 py-4 sm:py-6 animate-fade-slide-down">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan to-electric-blue clip-hexagon animate-rotate group-hover:scale-110 transition-transform"></div>
            <div className="font-orbitron text-xl sm:text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-br from-cyan to-electric-blue bg-clip-text text-transparent">
              BitSilo
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 lg:gap-10">
            <Link href="#features" className="text-text-secondary font-medium transition-colors duration-300 hover:text-cyan relative after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyan after:transition-all after:duration-300 hover:after:w-full">
              Features
            </Link>
            <Link href="#security" className="text-text-secondary font-medium transition-colors duration-300 hover:text-cyan relative after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyan after:transition-all after:duration-300 hover:after:w-full">
              Security
            </Link>
            <Link href="#supported" className="text-text-secondary font-medium transition-colors duration-300 hover:text-cyan relative after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyan after:transition-all after:duration-300 hover:after:w-full">
              Chains
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard" className="cta-button py-2 px-6">
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="secondary-button py-2 px-6">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="cta-button py-2 px-6">
                  Get Started
                </Link>
              </div>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-cyan hover:bg-cyan/5 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 top-[72px] sm:top-[88px] bg-midnight/95 backdrop-blur-lg z-40 transition-all duration-300 md:hidden ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
        <nav className="flex flex-col items-center gap-8 pt-20 px-6">
          <Link href="#features" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-text-primary">Features</Link>
          <Link href="#security" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-text-primary">Security</Link>
          <Link href="#supported" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-text-primary">Supported Chains</Link>
          
          <div className="flex flex-col w-full gap-4 mt-10">
            {isAuthenticated ? (
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="cta-button py-4 text-center text-xl">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)} className="cta-button py-4 text-center text-xl">
                  Get Started Free
                </Link>
                <Link href="/auth/login" onClick={() => setIsMenuOpen(false)} className="secondary-button py-4 text-center text-xl">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
