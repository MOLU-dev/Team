'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-6 h-64 animate-pulse" />
    );
  }

  return (
    <div className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-2">Appearance</h2>
      <p className="text-text-secondary mb-6">Customize how BitSilo looks</p>

      <div className="space-y-6">
        {/* Theme */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary focus:outline-none focus:border-cyan transition-all"
          >
            <option value="system">System (Automatic)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </div>
  );
}
