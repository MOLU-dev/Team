'use client';

import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variants = {
  info: {
    icon: Info,
    styles: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    iconStyles: "text-blue-400",
  },
  success: {
    icon: CheckCircle2,
    styles: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    iconStyles: "text-emerald-400",
  },
  warning: {
    icon: AlertTriangle,
    styles: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    iconStyles: "text-amber-400",
  },
  error: {
    icon: AlertCircle,
    styles: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    iconStyles: "text-rose-400",
  },
};

export default function Alert({ 
  variant = 'info', 
  title, 
  children, 
  onClose, 
  className 
}: AlertProps) {
  const { icon: Icon, styles, iconStyles } = variants[variant];

  return (
    <div className={cn(
      "relative w-full p-4 rounded-2xl border backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300",
      styles,
      className
    )}>
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          <Icon className={cn("w-5 h-5", iconStyles)} />
        </div>
        
        <div className="flex-1">
          {title && (
            <h5 className="font-bold mb-1 tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-sm opacity-90 leading-relaxed">
            {children}
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 opacity-60 hover:opacity-100" />
          </button>
        )}
      </div>
    </div>
  );
}
