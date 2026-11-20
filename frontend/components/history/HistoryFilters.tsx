'use client';

import { useState } from 'react';

export default function HistoryFilters() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'send', label: 'Sent' },
    { id: 'receive', label: 'Received' },
    { id: 'swap', label: 'Swaps' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      {/* Tabs */}
      <div className="flex bg-midnight/60 border border-cyan/20 p-1 rounded-xl h-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-br from-cyan to-electric-blue text-midnight shadow-lg'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selects */}
      <div className="flex flex-1 gap-3">
        <select className="flex-1 px-4 py-2.5 bg-midnight/60 border border-cyan/20 rounded-xl text-sm text-text-primary focus:outline-none focus:border-cyan transition-all outline-none">
          <option value="all">All Assets</option>
          <option value="eth">Ethereum</option>
          <option value="usdt">Tether USD</option>
          <option value="usdc">USD Coin</option>
          <option value="eurc">Euro Coin</option>
        </select>
        
        <select className="flex-1 px-4 py-2.5 bg-midnight/60 border border-cyan/20 rounded-xl text-sm text-text-primary focus:outline-none focus:border-cyan transition-all outline-none">
          <option value="all">All Time</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>

        <button className="p-2.5 bg-midnight/60 border border-cyan/20 rounded-xl text-text-secondary hover:text-cyan hover:border-cyan transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
