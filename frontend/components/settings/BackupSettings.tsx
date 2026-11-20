'use client';

import { useState } from 'react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

export default function BackupSettings() {
  const [autoBackup, setAutoBackup] = useState(true);

  const exportCSV = () => {
    alert('Exporting transaction history as CSV...');
  };

  const createBackup = () => {
    alert('Creating encrypted wallet backup...');
  };

  return (
    <div className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-2">Backup & Export</h2>
      <p className="text-text-secondary mb-6">Download your wallet data and transaction history</p>

      <div className="space-y-6">
        {/* Export CSV */}
        <div className="flex justify-between items-center py-4 border-b border-cyan/10">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Export Transaction History</h3>
            <p className="text-sm text-text-secondary">Download your complete transaction history as CSV</p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2 border-2 border-cyan/30 text-cyan font-semibold rounded-lg hover:bg-cyan/10 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export CSV
          </button>
        </div>

        {/* Backup Wallet */}
        <div className="flex justify-between items-center py-4 border-b border-cyan/10">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Backup Wallet</h3>
            <p className="text-sm text-text-secondary">Create an encrypted backup of your wallet</p>
          </div>
          <button
            onClick={createBackup}
            className="px-4 py-2 border-2 border-cyan/30 text-cyan font-semibold rounded-lg hover:bg-cyan/10 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Create Backup
          </button>
        </div>

        {/* Auto Backup */}
        <div className="flex justify-between items-center py-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Auto Backup</h3>
            <p className="text-sm text-text-secondary">Automatically backup your wallet weekly</p>
          </div>
          <ToggleSwitch enabled={autoBackup} onChange={setAutoBackup} />
        </div>
      </div>
    </div>
  );
}
