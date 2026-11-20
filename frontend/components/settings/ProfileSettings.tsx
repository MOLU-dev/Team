'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { verificationApi } from '@/lib/api/verification';
import { Lock, ShieldCheck } from 'lucide-react';

export default function ProfileSettings() {
  const { user, refreshUser, logout: authLogout } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    phone: '',
    country: '',
    bio: '',
    preferredCurrency: 'USD',
    dailyLimit: '1000',
  }); 

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
      }));
    }

    const fetchSettings = async () => {
      try {
        const response = await api.getSettings();
        if (response.success && response.settings) {
          setFormData(prev => ({
            ...prev,
            preferredCurrency: response.settings.preferred_currency || 'USD',
            dailyLimit: response.settings.daily_withdrawal_limit || '1000',
          }));
        }
      } catch (err) {
        console.error('Failed to fetch profile settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    const val = field === 'phone' ? value.replace(/[^0-9+]/g, '') : value;
    setFormData(prev => ({ ...prev, [field]: val }));
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      // Update general settings
      const settingsPayload: any = {
        daily_withdrawal_limit: formData.dailyLimit,
      };
      if (user?.currency) {
        settingsPayload.preferred_currency = user.currency;
      }
      await api.updateSettings(settingsPayload);
      
      // Update phone if changed
      if (formData.phone !== (user?.phone || '')) {
        await verificationApi.updatePhone(formData.phone);
      }

      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Information */}
      <div className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">Profile Information</h2>
            <p className="text-text-secondary text-sm">Update your personal information and contact details</p>
          </div>
          
          <div className="flex items-center gap-3 bg-midnight/60 border border-white/10 px-4 py-2.5 rounded-2xl">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              (user?.tier || 1) >= 2 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary leading-none mb-1">Verification</p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-text-primary">Tier {user?.tier || 1}</span>
                <span className="w-1 h-1 bg-text-secondary rounded-full"></span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  (user?.tier || 1) >= 2 ? 'text-success' : 'text-warning'
                }`}>
                  {(user?.tier || 1) >= 2 ? 'Verified' : 'Basic'}
                </span>
              </div>
            </div>
            
            {(user?.tier || 1) < 2 && (
              <a href="/kyc" className="ml-2 p-1.5 bg-cyan/10 hover:bg-cyan/20 text-cyan rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Username <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50 transition-all"
                placeholder="johndoe"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50 transition-all"
              placeholder="john@example.com"
              required
            />
            <p className="text-xs text-text-secondary mt-2">
              Email changes require verification
            </p>
          </div>

          {/* Contact Information Section */}
          <div className="pt-6 border-t border-cyan/10">
            <h3 className="text-lg font-bold text-text-primary mb-4">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50 transition-all"
                  placeholder="+1 234 567 8900"
                />
                <p className="text-[10px] text-text-secondary mt-2 uppercase font-bold tracking-tight">
                  Changing your phone number resets verification status and account tier.
                </p>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50 transition-all"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="pt-6 border-t border-cyan/10">
            <h3 className="text-lg font-bold text-text-primary mb-4">Account Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Preferred Currency */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    Preferred Currency
                  </label>
                  {(user?.tier || 0) < 2 && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      KYC Required
                    </span>
                  )}
                </div>
                {(user?.tier || 0) < 2 && !user?.currency ? (
                  <div className="p-3 bg-midnight/60 border border-amber-500/20 rounded-xl text-xs text-text-secondary">
                    <p className="text-amber-200/90 font-medium mb-1">Unassigned (Pending Verification)</p>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Your fiat currency is automatically provisioned when you verify your country of residence via Tier 2 KYC.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-midnight/80 border border-cyan/30 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-text-primary tracking-wide">
                          {user?.currency || formData.preferredCurrency}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Permanently Locked
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-1">
                        Permanently tied to your verified country. Cannot be changed.
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Limit */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Daily Withdrawal Limit (USD)
                </label>
                <input
                  type="number"
                  value={formData.dailyLimit}
                  onChange={(e) => handleChange('dailyLimit', e.target.value)}
                  className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50 transition-all"
                  placeholder="1000"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Bio (Optional)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50 transition-all resize-none"
              placeholder="Tell us a bit about yourself..."
            />
            <p className="text-xs text-text-secondary mt-2">
              {formData.bio.length}/500 characters
            </p>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-success/10 border-success/30 text-success' 
              : 'bg-danger/10 border-danger/30 text-danger'
          } animate-fade-in`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-transform"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
          <button
            type="button"
            onClick={() => {
                // Reset (Simplified for now, actually fetch would be better)
                setFormData(prev => ({ ...prev, bio: '' }));
                setMessage(null);
            }}
            disabled={isSaving}
            className="px-6 py-3 border-2 border-cyan/30 text-cyan font-bold rounded-xl hover:bg-cyan/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to logout?')) {
                authLogout();
              }
            }}
            className="px-6 py-3 border-2 border-danger/30 text-danger font-bold rounded-xl hover:bg-danger/10 transition-colors flex items-center gap-2"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </form>
  );
}
