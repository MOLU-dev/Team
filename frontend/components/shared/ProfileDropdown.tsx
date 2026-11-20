'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { User, Settings, Gift, MessageCircle, Info, LogOut, Wallet, TrendingUp } from 'lucide-react';

interface ProfileDropdownProps {
  userName?: string;
  userInitials?: string;
  userEmail?: string;
  avatarUrl?: string;
  totalBalance?: string;
  onLogout?: () => void;
}

export default function ProfileDropdown({
  userName = 'John Doe',
  userInitials = 'JD',
  userEmail = 'john.doe@example.com',
  avatarUrl,
  onLogout,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout: authLogout } = useAuth();

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'wallet';

  const switchTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    closeDropdown();
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
      authLogout();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const menuItems = [
    { href: '/profile', label: 'Profile', icon: <User size={16} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={16} /> },
    { href: '/referrals', label: 'Referrals', icon: <Gift size={16} /> },
  ];

  const secondaryItems = [
    { href: '/support', label: 'Support', icon: <MessageCircle size={16} /> },
    { href: '/about', label: 'About', icon: <Info size={16} /> },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={toggleDropdown}
        className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full transition-all ${
          isOpen
            ? 'bg-cyan/10 border border-cyan/30'
            : 'bg-surface-subtle border border-surface-border hover:border-cyan/20 hover:bg-surface-hover'
        }`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover border border-cyan/20" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-electric-blue flex items-center justify-center font-bold text-midnight text-xs">
            {userInitials}
          </div>
        )}
        <svg
          className={`w-3 h-3 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 top-full mt-2 w-64 bg-card-bg backdrop-blur-2xl border border-border rounded-2xl overflow-hidden shadow-2xl shadow-midnight/30 transition-all z-50 ${
          isOpen
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible -translate-y-2'
        }`}
      >
        {/* User info */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-10 h-10 rounded-full object-cover border border-border shadow-lg" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-electric-blue flex items-center justify-center font-bold text-midnight text-sm shadow-lg shadow-cyan/20">
                {userInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-text-primary truncate">{userName}</div>
              <div className="text-[11px] text-text-secondary truncate">{userEmail}</div>
            </div>
          </div>
        </div>

        {/* App Mode Switcher */}
        <div className="p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/60 mb-2 px-1">App Mode</p>
          <div className="flex bg-surface-muted p-1 rounded-xl border border-border">
            <button
              onClick={() => switchTab('wallet')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'wallet' ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Wallet size={14} /> Wallet
            </button>
            <button
              onClick={() => switchTab('trading')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'trading' ? 'bg-lime/10 text-lime border border-lime/20' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <TrendingUp size={14} /> Trading
            </button>
          </div>
        </div>

        {/* Trading Settings (only shows on trading tab) */}
        {activeTab === 'trading' && (
          <>
            <div className="p-1.5 pt-0">
              <Link
                href="/trade/settings"
                onClick={closeDropdown}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-lime hover:bg-lime/[0.08] rounded-xl transition-all"
              >
                <TrendingUp size={16} /> Trading Account Settings
              </Link>
            </div>
            <div className="mx-3 border-t border-border" />
          </>
        )}

        {/* Primary menu */}
        <div className="p-1.5">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeDropdown}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-primary hover:text-cyan hover:bg-surface-hover rounded-xl transition-all"
            >
              <span className="text-text-secondary">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mx-3 border-t border-border" />

        {/* Secondary menu */}
        <div className="p-1.5">
          {secondaryItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeDropdown}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-primary hover:text-cyan hover:bg-surface-hover rounded-xl transition-all"
            >
              <span className="text-text-secondary">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mx-3 border-t border-border" />

        {/* Logout */}
        <div className="p-1.5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-sm text-text-primary hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
          >
            <span className="text-text-secondary"><LogOut size={16} /></span>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
