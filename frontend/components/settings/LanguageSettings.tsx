'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Lock } from 'lucide-react';

export default function LanguageSettings() {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const userCurrency = user?.currency ? user.currency.toLowerCase() : null;
  const [currency, setCurrency] = useState(userCurrency || 'usd');
  const [timezone, setTimezone] = useState('utc');

  const isCurrencyLocked = Boolean(user?.currency);

  return (
    <div className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-2">Language & Currency</h2>
      <p className="text-text-secondary mb-6">Set your preferred language and currency</p>

      <div className="space-y-6">
        {/* Language */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary focus:outline-none focus:border-cyan transition-all"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        {/* Currency */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-text-primary">Display Currency</label>
            {isCurrencyLocked && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Permanently Locked
              </span>
            )}
          </div>
          <select
            value={isCurrencyLocked ? (userCurrency || currency) : currency}
            onChange={(e) => {
              if (!isCurrencyLocked) {
                setCurrency(e.target.value);
              }
            }}
            disabled={isCurrencyLocked}
            className={`w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary focus:outline-none focus:border-cyan transition-all ${
              isCurrencyLocked ? 'opacity-70 cursor-not-allowed bg-white/5' : ''
            }`}
          >
            <option value="usd">USD ($)</option>
            <option value="eur">EUR (€)</option>
            <option value="gbp">GBP (£)</option>
            <option value="ngn">NGN (₦)</option>
            <option value="kes">KES (KSh)</option>
            <option value="ghs">GHS (GH₵)</option>
            <option value="zar">ZAR (R)</option>
            <option value="cad">CAD ($)</option>
            <option value="jpy">JPY (¥)</option>
            <option value="cny">CNY (¥)</option>
          </select>
          {isCurrencyLocked && (
            <p className="text-[11px] text-text-secondary mt-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan" />
              Fiat currency is permanently locked to your verified region ({user?.currency?.toUpperCase()}) and cannot be edited.
            </p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary focus:outline-none focus:border-cyan transition-all"
          >
            <option value="utc">UTC</option>
            <option value="est">Eastern Time (EST)</option>
            <option value="pst">Pacific Time (PST)</option>
            <option value="cet">Central European Time (CET)</option>
            <option value="jst">Japan Standard Time (JST)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
