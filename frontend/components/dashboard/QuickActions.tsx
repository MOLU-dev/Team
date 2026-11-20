import Link from 'next/link';
import { MoveUpRight, ArrowDownLeft, Repeat, CreditCard } from 'lucide-react';

interface Action {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  gradient: string;
}

const actions: Action[] = [
  {
    title: 'Send',
    description: 'Crypto transfer',
    href: '/send',
    icon: <MoveUpRight size={28} />,
    gradient: 'from-cyan to-electric-blue',
  },
  {
    title: 'Receive',
    description: 'Get crypto assets',
    href: '/receive',
    icon: <ArrowDownLeft size={28} />,
    gradient: 'from-lime to-emerald-500',
  },
  {
    title: 'Swap',
    description: 'Instant swap',
    href: '/swap',
    icon: <Repeat size={28} />,
    gradient: 'from-orange-400 to-rose-500',
  },
  {
    title: 'Cards',
    description: 'Manage cards',
    href: '/cards',
    icon: <CreditCard size={28} />,
    gradient: 'from-purple-500 to-indigo-600',
  },
];

interface QuickActionsProps {
  onReceiveClick?: () => void;
}

export default function QuickActions({ onReceiveClick }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-10 md:mb-12 animate-fade-slide-up" style={{ animationDelay: '0.3s' }}>
      {actions.map((action, index) => {
        const isReceive = action.title === 'Receive';
        
        if (isReceive && onReceiveClick) {
          return (
            <button
              key={index}
              onClick={onReceiveClick}
              className="group bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/10 hover:border-cyan/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 sm:gap-4 hover:bg-gradient-to-br hover:from-deep-navy/90 hover:to-slate/70 transition-all hover:-translate-y-1 text-center shadow-lg hover:shadow-cyan/5 w-full"
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${action.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                <div className="w-6 h-6 sm:w-7 sm:h-7 text-midnight">
                  {action.icon}
                </div>
              </div>
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-text-primary mb-0.5 sm:mb-1">{action.title}</h3>
                <p className="text-[10px] sm:text-xs text-text-secondary line-clamp-1">{action.description}</p>
              </div>
            </button>
          );
        }

        return (
          <Link
            key={index}
            href={action.href}
            className="group bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/10 hover:border-cyan/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 sm:gap-4 hover:bg-gradient-to-br hover:from-deep-navy/90 hover:to-slate/70 transition-all hover:-translate-y-1 text-center shadow-lg hover:shadow-cyan/5"
          >
            <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${action.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
              <div className="w-6 h-6 sm:w-7 sm:h-7 text-midnight">
                {action.icon}
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-text-primary mb-0.5 sm:mb-1">{action.title}</h3>
              <p className="text-[10px] sm:text-xs text-text-secondary line-clamp-1">{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
