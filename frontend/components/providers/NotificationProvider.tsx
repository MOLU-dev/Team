'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

export function NotificationProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={theme as 'light' | 'dark' | 'system'}
      toastOptions={{
        className: 'border border-white/10 backdrop-blur-xl bg-slate-900/80 text-white rounded-2xl shadow-2xl',
        descriptionClassName: 'text-slate-400',
        style: {
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      }}
      closeButton
      richColors
    />
  );
}
