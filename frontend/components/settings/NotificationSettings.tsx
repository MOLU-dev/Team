'use client';

import { useEffect, useState } from 'react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { api } from '@/lib/api';

export default function NotificationSettings() {
  const [notifyDeposits, setNotifyDeposits] = useState(true);
  const [notifyWithdrawals, setNotifyWithdrawals] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.getSettings();
        if (response.success && response.settings) {
          setNotifyDeposits(response.settings.notify_deposits);
          setNotifyWithdrawals(response.settings.notify_withdrawals);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleDeposits = async (enabled: boolean) => {
    setNotifyDeposits(enabled);
    try {
      await api.updateSettings({ notify_deposits: enabled });
    } catch (err) {
      console.error('Failed to update settings:', err);
      setNotifyDeposits(!enabled); // Rollback
    }
  };

  const handleToggleWithdrawals = async (enabled: boolean) => {
    setNotifyWithdrawals(enabled);
    try {
      await api.updateSettings({ notify_withdrawals: enabled });
    } catch (err) {
      console.error('Failed to update settings:', err);
      setNotifyWithdrawals(!enabled); // Rollback
    }
  };

  if (isLoading) {
    return <div className="text-center p-6 text-text-secondary">Loading settings...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-2">Notifications</h2>
      <p className="text-text-secondary mb-6">Manage your notification preferences</p>

      <div className="space-y-6">
        {/* Deposit Alerts */}
        <div className="flex justify-between items-center py-4 border-b border-cyan/10">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Deposit Alerts</h3>
            <p className="text-sm text-text-secondary">Get notified when you receive crypto</p>
          </div>
          <ToggleSwitch enabled={notifyDeposits} onChange={handleToggleDeposits} />
        </div>

        {/* Withdrawal Alerts */}
        <div className="flex justify-between items-center py-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Withdrawal Alerts</h3>
            <p className="text-sm text-text-secondary">Get notified when you send crypto</p>
          </div>
          <ToggleSwitch enabled={notifyWithdrawals} onChange={handleToggleWithdrawals} />
        </div>
      </div>
    </div>
  );
}
