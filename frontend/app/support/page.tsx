'use client';

import Background from '@/components/shared/Background';
import AppHeader from '@/components/shared/AppHeader';
import PageHeader from '@/components/shared/PageHeader';
import ContactForm from '../../components/support/ContactForm';
import FAQSection from '../../components/support/FAQSection';
import FloatingNavbar from '@/components/shared/FloatingNavbar';

// Correcting imports to use absolute path alias for consistency if preferred, 
// but sticking to what I wrote before is fine. 
// Actually I'll update it to be cleaner.

// Wait, I can't overwrite it with same content and expect it to change.
// I'll rewrite with absolute imports.

import { useState } from 'react';

export default function SupportPage() {
  const supportIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  return (
    <>
      <Background type="dashboard" />
      
      <div className="relative z-10 min-h-screen">
        <AppHeader showBackButton={true} backHref="/dashboard" />
        
        <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-[1400px] pt-32 pb-32">
          <PageHeader
            title="Support"
            description="Get help and answers to your questions"
            icon={supportIcon}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-fade-slide-up">
            {/* FAQ Section */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-deep-navy/80 to-slate/60 border border-cyan/20 rounded-2xl p-6 md:p-8">
                <FAQSection />
              </div>

              {/* Quick Links */}
              <div className="bg-gradient-to-br from-deep-navy/80 to-slate/60 border border-cyan/20 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-text-primary mb-4">Quick Links</h2>
                <ul className="space-y-3">
                  <li>
                    <a href="/guides" className="text-cyan hover:underline flex items-center gap-2">
                       Read User Guides
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="text-cyan hover:underline flex items-center gap-2">
                       Terms of Service
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </a>
                  </li>
                  <li>
                    <a href="/privacy" className="text-cyan hover:underline flex items-center gap-2">
                       Privacy Policy
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </main>
        <FloatingNavbar />
      </div>
    </>
  );
}
