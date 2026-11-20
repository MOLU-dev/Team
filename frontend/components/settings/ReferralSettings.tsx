'use client';

import { copyToClipboard } from '@/lib/clipboard';

export default function ReferralSettings() {
  const copyReferralCode = async () => {
    await copyToClipboard('CHAIN-JD2024');
    alert('Referral code copied!');
  };

  const copyReferralLink = async () => {
    await copyToClipboard('https://bitsilo.io/ref/CHAIN-JD2024');
    alert('Referral link copied!');
  };

  const withdrawEarnings = () => {
    alert('Withdrawing $186.50...');
  };

  return (
    <div className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-cyan">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <h2 className="text-2xl font-bold text-text-primary">Referral Program</h2>
      </div>
      <p className="text-text-secondary mb-6">Invite friends and earn 10% commission on their transaction fees</p>

      <div className="space-y-6">
        {/* Referral Code */}
        <div className="p-5 bg-cyan/5 border border-cyan/20 rounded-xl">
          <h3 className="text-base font-semibold text-text-primary mb-2">Your Referral Code</h3>
          <div className="font-orbitron text-3xl font-black text-cyan mb-3">CHAIN-JD2024</div>
          <p className="text-sm text-text-secondary mb-4">Share this code with friends to earn rewards</p>
          <button
            onClick={copyReferralCode}
            className="px-4 py-2 bg-gradient-to-br from-cyan to-electric-blue text-midnight font-bold rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy Code
          </button>
        </div>

        {/* Referral Link */}
        <div className="flex justify-between items-center p-4 bg-midnight/80 border border-cyan/20 rounded-xl">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Referral Link</h3>
            <p className="text-sm text-text-secondary mt-1">https://bitsilo.io/ref/CHAIN-JD2024</p>
          </div>
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 border-2 border-cyan/30 text-cyan font-semibold rounded-lg hover:bg-cyan/10 transition-colors"
          >
            Copy Link
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-midnight/80 border border-cyan/20 rounded-xl">
            <h3 className="text-sm text-text-secondary mb-1">Total Referrals</h3>
            <div className="text-2xl font-bold text-cyan">24 Users</div>
          </div>
          <div className="p-4 bg-midnight/80 border border-cyan/20 rounded-xl">
            <h3 className="text-sm text-text-secondary mb-1">Total Earnings</h3>
            <div className="text-2xl font-bold text-success">$186.50</div>
          </div>
        </div>

        {/* Withdraw */}
        <div className="flex justify-between items-center p-4 bg-success/5 border border-success/20 rounded-xl">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Pending Commission</h3>
            <p className="text-sm text-text-secondary mt-1">Available for withdrawal (minimum $50)</p>
          </div>
          <button
            onClick={withdrawEarnings}
            className="px-4 py-2 bg-gradient-to-br from-success to-emerald-500 text-midnight font-bold rounded-lg hover:scale-[1.02] transition-transform"
          >
            Withdraw $186.50
          </button>
        </div>

        {/* How it Works */}
        <div className="p-4 bg-cyan/5 border border-cyan/20 rounded-xl">
          <h3 className="flex items-center gap-2 text-base font-semibold text-text-primary mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            How it Works
          </h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>1. Share your referral code or link with friends</p>
            <p>2. They sign up and start using BitSilo</p>
            <p>3. You earn 10% of their transaction fees</p>
            <p>4. Withdraw your earnings once you reach $50</p>
          </div>
        </div>
      </div>
    </div>
  );
}
