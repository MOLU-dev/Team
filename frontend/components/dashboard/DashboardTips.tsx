'use client';

import { Sparkles, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

export default function DashboardTips() {
  const tips = [
    {
      title: 'Virtual Cards',
      description: 'Spend crypto anywhere with a virtual debit card.',
      icon: <Sparkles className="text-yellow-400" size={16} />,
      link: '/cards',
      linkText: 'Get started'
    },
    {
      title: 'Secure Your Account',
      description: 'Enable 2FA for an extra layer of protection.',
      icon: <Shield className="text-cyan" size={16} />,
      link: '/settings',
      linkText: 'Enable 2FA'
    }
  ];

  return (
    <div className="mt-6 animate-fade-slide-up" style={{ animationDelay: '0.4s' }}>
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Tips</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tips.map((tip, i) => (
          <Link
            key={i}
            href={tip.link}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card-bg border border-border hover:border-cyan/20 hover:bg-surface-hover transition-all group shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-surface-muted flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
              {tip.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary">{tip.title}</h3>
              <p className="text-[11px] text-text-secondary leading-snug truncate">{tip.description}</p>
            </div>
            <ArrowRight size={14} className="text-text-secondary/30 group-hover:text-cyan transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
