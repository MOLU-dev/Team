'use client';

import { useState } from 'react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

export default function NetworkSettings() {
  const [defaultNetwork, setDefaultNetwork] = useState('all');
  const [autoSelectNetwork, setAutoSelectNetwork] = useState(true);
  const [showTestNetworks, setShowTestNetworks] = useState(false);

  return (
    <div className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-2">Network Preferences</h2>
      <p className="text-text-secondary mb-6">Configure your default network and RPC endpoints</p>

      <div className="space-y-6">
        {/* Default Network */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Default Network</label>
          <select
            value={defaultNetwork}
            onChange={(e) => setDefaultNetwork(e.target.value)}
            className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary focus:outline-none focus:border-cyan transition-all"
          >
            <option value="all">All Networks</option>
            <option value="erc20">Ethereum (ERC20)</option>
            <option value="bep20">Binance Smart Chain (BEP20)</option>
            <option value="trc20">Tron (TRC20)</option>
          </select>
        </div>

        {/* Auto-Select Network */}
        <div className="flex justify-between items-center py-4 border-b border-cyan/10">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Auto-Select Network</h3>
            <p className="text-sm text-text-secondary">Automatically select the best network for transactions</p>
          </div>
          <ToggleSwitch enabled={autoSelectNetwork} onChange={setAutoSelectNetwork} />
        </div>

        {/* Show Test Networks */}
        <div className="flex justify-between items-center py-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Show Test Networks</h3>
            <p className="text-sm text-text-secondary">Display testnet networks in network selector</p>
          </div>
          <ToggleSwitch enabled={showTestNetworks} onChange={setShowTestNetworks} />
        </div>
      </div>
    </div>
  );
}
