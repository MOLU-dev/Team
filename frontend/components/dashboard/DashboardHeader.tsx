'use client';

import Link from 'next/link';
import ProfileDropdown from '@/components/shared/ProfileDropdown';
import { useNotifications } from '@/hooks/useNotifications';
import { HelpCircle, Bell } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface DashboardHeaderProps {
  user?: {
    name: string;
    initials: string;
    email?: string;
  };
}

export default function DashboardHeader() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const name = user?.username || 'User';
  const email = user?.email || '';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-100 bg-midnight/80 backdrop-blur-xl border-b border-border py-3 animate-fade-slide-down">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan to-electric-blue clip-hexagon animate-rotate group-hover:scale-110 transition-transform" />
            <span className="font-orbitron text-lg sm:text-xl font-black tracking-tight bg-gradient-to-br from-cyan to-electric-blue bg-clip-text text-transparent">
              BitSilo
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tier badge — desktop only */}
            <Link href="/settings?tab=verification" className="hidden md:block">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                (user?.tier ?? 0) >= 3 
                  ? 'bg-success/10 border border-success/20 hover:bg-success/20' 
                  : 'bg-cyan/[0.08] border border-cyan/15 hover:bg-cyan/15'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  (user?.tier ?? 0) >= 3 ? 'bg-success' : 'bg-cyan'
                }`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  (user?.tier ?? 0) >= 3 ? 'text-success' : 'text-cyan'
                }`}>
                  Tier {user?.tier ?? 0}
                </span>
              </div>
            </Link>

            {/* Support */}
            <Link
              href="/support"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-surface-subtle border border-surface-border hover:border-cyan/30 hover:bg-surface-hover transition-all text-text-secondary hover:text-cyan"
            >
              <HelpCircle size={18} />
            </Link>

            {/* Notifications */}
            <Link href="/notifications">
              <button className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-surface-subtle border border-surface-border hover:border-cyan/30 hover:bg-surface-hover transition-all text-text-secondary hover:text-cyan">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-danger rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-midnight px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </Link>

            {/* Profile */}
            <ProfileDropdown
              userName={name}
              userInitials={initials}
              userEmail={email}
              avatarUrl={user?.avatar_url}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
