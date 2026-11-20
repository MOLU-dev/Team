'use client';

import Link from 'next/link';
import { useState } from 'react';
import ProfileDropdown from './ProfileDropdown';
import { useNotifications } from '@/hooks/useNotifications';

interface AppHeaderProps {
  user?: {
    name: string;
    initials: string;
    email?: string;
    balance?: string;
  };
  showBackButton?: boolean;
  backHref?: string;
}

export default function AppHeader({
  user = { name: 'John Doe', initials: 'JD', email: 'john.doe@example.com', balance: '$5,248.50' },
  showBackButton = false,
  backHref = '/dashboard',
}: AppHeaderProps) {
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-100 bg-midnight/80 backdrop-blur-md border-b border-border py-5 animate-fade-slide-down">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-[1400px]">
        <div className="flex justify-between items-center">
          {/* Logo and Back Button */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link
                href={backHref}
                className="w-10 h-10 flex items-center justify-center bg-surface-subtle border border-border rounded-xl hover:border-cyan hover:bg-surface-hover transition-all"
              >
                <svg className="w-5 h-5 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}

            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan to-electric-blue clip-hexagon animate-rotate"></div>
              <div className="font-orbitron text-xl md:text-2xl font-black tracking-tight bg-gradient-to-br from-cyan to-electric-blue bg-clip-text text-transparent">
                BitSilo
              </div>
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Link href="/notifications">
              <button className="relative w-11 h-11 flex items-center justify-center bg-surface-subtle border border-border rounded-xl hover:border-cyan hover:bg-surface-hover transition-all">
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-danger rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-midnight">
                    {unreadCount}
                  </div>
                )}
              </button>
            </Link>

            {/* Profile Dropdown */}
            <ProfileDropdown
              userName={user.name}
              userInitials={user.initials}
              userEmail={user.email}
              totalBalance={user.balance}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
