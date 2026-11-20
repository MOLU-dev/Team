const features = [
  { text: 'Multi-chain support (ETH, BSC, Tron)' },
  { text: 'Bank-grade security with 2FA' },
  { text: 'Low fees & fast transactions' },
  { text: 'Earn 10% referral commission' }
];

export default function FeaturesList() {
  return (
    <div className="space-y-3 p-4 bg-cyan/5 border border-cyan/10 rounded-xl">
      {features.map((feature, index) => (
        <div key={index} className="flex items-center gap-3">
          <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-text-secondary">{feature.text}</span>
        </div>
      ))}
    </div>
  );
}
