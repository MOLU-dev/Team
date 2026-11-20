'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, BarChart3, MoveUpRight, ArrowDownLeft, Repeat, CreditCard } from 'lucide-react';

const navItems = [
  { id: 'home',     label: 'Home',    href: '/dashboard',             icon: <Home size={20} /> },
  { id: 'p2p',      label: 'P2P',     href: '/p2p',                   icon: <BarChart3 size={20} /> },
  { id: 'send',     label: 'Send',    href: '/send?drawer=true',      icon: <MoveUpRight size={20} /> },
  { id: 'receive',  label: 'Receive', href: '/receive?drawer=true',   icon: <ArrowDownLeft size={20} /> },
  { id: 'swap',     label: 'Swap',    href: '/swap',                  icon: <Repeat size={20} /> },
  { id: 'card',     label: 'Card',    href: '/cards',                 icon: <CreditCard size={20} /> },
];

export default function FloatingNavbar() {
  const pathname = usePathname();
  
  // Hide on auth / settings / full-page terminal pages
  if (
    pathname === '/settings' || 
    pathname.startsWith('/auth') || 
    pathname === '/login' || 
    pathname === '/signup' ||
    pathname === '/p2p'
  ) {
    return null;
  }
  
  return (
    <nav 
      id="global-floating-nav"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-fit 
                 bg-midnight/80 backdrop-blur-2xl border border-border 
                 rounded-full px-1.5 py-1.5 flex items-center 
                 shadow-xl shadow-midnight/20 z-30 animate-slide-up"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.id === 'home' && pathname === '/dashboard') ||
          (item.id === 'swap' && (pathname === '/swap' || pathname === '/exchange'));
        
        return (
          <Link
            key={item.id}
            id={`global-nav-${item.id}`}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 sm:px-4 py-2 rounded-full transition-all relative ${
              isActive
                ? 'bg-cyan/10 text-cyan'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
              {item.icon}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tighter hidden xs:block">
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan rounded-full shadow-[0_0_8px_#00ffcc]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
