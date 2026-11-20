'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className={cn(
          "relative w-full max-w-lg bg-card-bg backdrop-blur-2xl border border-border rounded-[2rem] shadow-2xl shadow-midnight/30 overflow-hidden animate-fade-slide-up",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-surface-subtle">
          {title && (
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              {title}
            </h2>
          )}
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Body */}
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}
