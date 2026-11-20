'use client';

import { Wallet, MoveUpRight, ArrowDownLeft, Repeat, History, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type WalletTab = 'assets' | 'send' | 'receive' | 'swap' | 'p2p' | 'history';

interface WalletFloatingNavProps {
  activeTab: WalletTab;
  onTabChange?: (tab: WalletTab) => void;
}

const TABS: { id: WalletTab; label: string; icon: React.ReactNode; href?: string }[] = [
  { id: 'assets',  label: 'Assets',  icon: <Wallet size={20} />, href: '/dashboard?tab=wallet' },
  { id: 'p2p',     label: 'P2P',     icon: <BarChart3 size={20} />, href: '/p2p' },
  { id: 'send',    label: 'Send',    icon: <MoveUpRight size={20} />, href: '/send?drawer=true' },
  { id: 'receive', label: 'Receive', icon: <ArrowDownLeft size={20} />, href: '/receive?drawer=true' },
  { id: 'swap',    label: 'Swap',    icon: <Repeat size={20} />, href: '/swap' },
  { id: 'history', label: 'History', icon: <History size={20} />, href: '/history' },
];

export default function WalletFloatingNav({ activeTab, onTabChange }: WalletFloatingNavProps) {
  const pathname = usePathname();

  return (
    <nav
      id="wallet-floating-nav"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-fit
                 bg-midnight/80 backdrop-blur-2xl border border-border
                 rounded-full px-1.5 py-1.5 flex items-center
                 shadow-xl shadow-midnight/20 z-30 animate-slide-up"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        
        const content = (
          <div className="flex flex-col items-center gap-1">
            <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
              {tab.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter hidden xs:block">
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan rounded-full shadow-[0_0_8px_#00ffcc]" />
            )}
          </div>
        );

        const className = `flex flex-col items-center gap-1 px-4 sm:px-5 py-2 rounded-full transition-all relative ${
          isActive
            ? 'bg-cyan/10 text-cyan'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
        }`;

        if (onTabChange && !tab.href) {
          return (
            <button key={tab.id} onClick={() => onTabChange(tab.id)} className={className}>
              {content}
            </button>
          );
        }

        return (
          <Link key={tab.id} href={tab.href || '#'} className={className}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
